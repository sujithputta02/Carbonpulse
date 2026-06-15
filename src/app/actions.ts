"use server";

import crypto from "crypto";
import { db, readDb, writeDb } from "@/utils/db";
import { UserProfile } from "@/types/user";
import { ActivityLog, Goal, EmissionFactor, ImportedLogItem } from "@/types/activity";
import { calculateBaseline, calculateActivityCO2e } from "@/lib/carbon/calculateFootprint";
import { getCurrentUser, hashPassword, setSessionCookie } from "@/utils/auth";
import { onboardingSchema, logActivitySchema, factorUpdateSchema } from "@/lib/validation/onboardingSchema";

export interface SaveProfileInput {
  name: string;
  location: string;
  householdSize: number;
  goals: string[];
  budgetSensitivity: "LOW" | "MEDIUM" | "HIGH";
  commuteType: "CAR_PETROL" | "CAR_DIESEL" | "EV" | "TRANSIT" | "NONE";
  commuteDistanceWeekly: number;
  dietPattern: "HIGH_MEAT" | "LOW_MEAT" | "VEGETARIAN" | "VEGAN";
  electricityMonthlyKwh: number;
  naturalGasMonthlyKwh: number;
  shoppingPattern: "HEAVY" | "MODERATE" | "MINIMALIST";
}

/**
 * Server action to save user profile and compute the initial baseline.
 */
export async function saveProfile(input: SaveProfileInput): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: Please log in first.");
  }

  // Validate onboarding inputs with Zod
  const validatedInput = onboardingSchema.parse(input);
  
  const factors = db.getFactors();
  
  // Calculate baseline monthly footprint using our calculator engine
  const calculation = calculateBaseline({
    commuteType: validatedInput.commuteType,
    commuteDistanceWeekly: validatedInput.commuteDistanceWeekly,
    dietPattern: validatedInput.dietPattern,
    electricityMonthlyKwh: validatedInput.electricityMonthlyKwh,
    naturalGasMonthlyKwh: validatedInput.naturalGasMonthlyKwh,
    householdSize: validatedInput.householdSize,
    shoppingPattern: validatedInput.shoppingPattern,
  }, factors);

  // Save profile to database
  const profile = db.saveProfile(user.id, {
    name: validatedInput.name,
    location: validatedInput.location,
    householdSize: validatedInput.householdSize,
    goals: validatedInput.goals,
    budgetSensitivity: validatedInput.budgetSensitivity,
    commuteType: validatedInput.commuteType,
    dietPattern: validatedInput.dietPattern,
    baselineFootprint: calculation.total,
  });

  // Clear existing activities/goals for a clean start on profile reset
  const rawDb = readDb();
  rawDb.activityLogs = rawDb.activityLogs.filter((l) => l.userId !== user.id);
  rawDb.goals = rawDb.goals.filter((g) => g.userId !== user.id);
  
  // Create first goal based on their settings (target 10% reduction)
  const targetReduction = Math.round(calculation.total * 0.1);
  rawDb.goals.push({
    id: crypto.randomUUID(),
    userId: user.id,
    title: `Reduce monthly footprint by ${targetReduction} kg CO2e`,
    category: "GENERAL",
    targetCO2e: targetReduction,
    isCompleted: false,
    streakCount: 0,
    createdAt: new Date().toISOString(),
  });
  
  writeDb(rawDb);

  return profile;
}

/**
 * Server action to log a tracking activity.
 */
export async function logActivity(input: {
  category: "TRANSPORT" | "FOOD" | "ENERGY" | "SHOPPING";
  actionType: string;
  amount: number;
}): Promise<ActivityLog> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: Please log in first.");
  }

  const profile = db.getProfile(user.id);
  if (!profile) {
    throw new Error("No user profile found. Please complete onboarding first.");
  }

  // Validate activity inputs with Zod
  const validated = logActivitySchema.parse(input);
  
  const factors = db.getFactors();
  
  const estimatedCO2e = calculateActivityCO2e(
    validated.category,
    validated.actionType,
    validated.amount,
    factors
  );

  return db.addActivityLog(user.id, {
    category: validated.category,
    actionType: validated.actionType,
    amount: validated.amount,
    estimatedCO2e,
  });
}

/**
 * Server action to fetch dashboard details.
 */
export async function getDashboardData() {
  const user = await getCurrentUser();
  if (!user) {
    return {
      profile: null,
      logs: [],
      goals: [],
      factors: db.getFactors(),
    };
  }

  const profile = db.getProfile(user.id);
  const logs = db.getActivityLogs(user.id);
  const goals = db.getGoals(user.id);
  const factors = db.getFactors();
  
  return {
    profile,
    logs,
    goals,
    factors,
  };
}

/**
 * Server action to edit emissions factors (admin capability).
 */
export async function updateFactorAction(key: string, value: number, reason: string): Promise<EmissionFactor> {
  // Validate factor update fields with Zod
  const validated = factorUpdateSchema.parse({ key, value, reason });

  const updated = db.updateFactor(validated.key, validated.value, validated.reason);
  if (!updated) {
    throw new Error(`Emission factor with key ${key} not found.`);
  }
  return updated;
}

/**
 * Server action to delete an activity record.
 */
export async function deleteActivityAction(id: string): Promise<boolean> {
  return db.deleteActivityLog(id);
}

/**
 * Server action to toggle goal completion status.
 */
export async function toggleGoalCompletionAction(id: string, isCompleted: boolean): Promise<Goal | null> {
  return db.updateGoal(id, { isCompleted });
}

/**
 * Server action to reset database profile data.
 */
export async function resetDatabaseAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const rawDb = readDb();
  rawDb.userProfiles = rawDb.userProfiles.filter((p) => p.id !== user.id);
  rawDb.activityLogs = rawDb.activityLogs.filter((l) => l.userId !== user.id);
  rawDb.goals = rawDb.goals.filter((g) => g.userId !== user.id);
  writeDb(rawDb);
}

/**
 * Server action to seed realistic demo logs and goals.
 */
export async function seedDemoDataAction(): Promise<void> {
  let user = await getCurrentUser();
  
  if (!user) {
    const demoEmail = "demo@carbonpulse.com";
    let demoUser = db.getUserByEmail(demoEmail);
    if (!demoUser) {
      const defaultHash = hashPassword("password");
      demoUser = db.createUser(demoEmail, defaultHash);
    }
    
    await setSessionCookie(demoUser.id);
    user = demoUser;
  }
  
  db.seedDemoData(user.id);
}

/**
 * Server action to generate downloadable JSON and CSV log exports.
 */
export async function getExportDataAction(): Promise<{
  jsonString: string;
  csvString: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const logs = db.getActivityLogs(user.id);
  const jsonString = JSON.stringify(logs, null, 2);
  
  const headers = ["id", "category", "actionType", "amount", "date", "estimatedCO2e"];
  const csvRows = [headers.join(",")];
  
  for (const log of logs) {
    const row = [
      log.id,
      log.category,
      log.actionType,
      log.amount,
      log.date,
      log.estimatedCO2e,
    ];
    csvRows.push(row.map(val => `"${val}"`).join(","));
  }
  const csvString = csvRows.join("\n");
  
  return { jsonString, csvString };
}

/**
 * Server action to parse and import logged items arrays.
 */
export async function importLogsAction(importedLogs: ImportedLogItem[]): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const profile = db.getProfile(user.id);
  if (!profile) {
    throw new Error("No user profile found. Please complete onboarding first.");
  }
  
  const rawDb = readDb();
  
  for (const item of importedLogs) {
    if (!item.category || !item.actionType || item.amount === undefined || item.estimatedCO2e === undefined) {
      continue;
    }
    const newLog: ActivityLog = {
      id: item.id || crypto.randomUUID(),
      userId: user.id,
      category: item.category,
      actionType: item.actionType,
      amount: Number(item.amount),
      date: item.date || new Date().toISOString(),
      estimatedCO2e: Number(item.estimatedCO2e),
    };
    rawDb.activityLogs.push(newLog);
  }
  
  writeDb(rawDb);
  return true;
}
