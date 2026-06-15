"use server";

import crypto from "crypto";
import { db, readDb, writeDb, UserProfile, ActivityLog, Goal, EmissionFactor } from "@/utils/db";
import { calculateBaseline, calculateActivityCO2e } from "@/utils/calculator";
import { getCurrentUser, hashPassword, setSessionCookie } from "@/utils/auth";

/**
 * Input structure for onboarding or resetting user baseline profile configuration.
 */
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
 * Log structure mapping the CSV/JSON schema during imports.
 */
export interface ImportedLogItem {
  id?: string;
  category: "TRANSPORT" | "FOOD" | "ENERGY" | "SHOPPING";
  actionType: string;
  amount: number;
  date?: string;
  estimatedCO2e: number;
}

/**
 * Server action to save user profile and compute the initial baseline.
 * Wipes old logs/goals belonging to this user for a fresh profile reset, and sets a default reduction goal.
 * 
 * @param input Onboarding questionnaire selections.
 * @returns The generated UserProfile.
 */
export async function saveProfile(input: SaveProfileInput): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: Please log in first.");
  }
  
  const factors = db.getFactors();
  
  // Calculate baseline monthly footprint using our calculator engine
  const calculation = calculateBaseline({
    commuteType: input.commuteType,
    commuteDistanceWeekly: input.commuteDistanceWeekly,
    dietPattern: input.dietPattern,
    electricityMonthlyKwh: input.electricityMonthlyKwh,
    naturalGasMonthlyKwh: input.naturalGasMonthlyKwh,
    householdSize: input.householdSize,
    shoppingPattern: input.shoppingPattern,
  }, factors);

  // Save profile to database
  const profile = db.saveProfile(user.id, {
    name: input.name,
    location: input.location,
    householdSize: input.householdSize,
    goals: input.goals,
    budgetSensitivity: input.budgetSensitivity,
    commuteType: input.commuteType,
    dietPattern: input.dietPattern,
    baselineFootprint: calculation.total,
  });

  // Clear existing activities/goals for a clean start on profile reset (for this user only!)
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
 * Computes emissions on the fly based on the custom input parameters and active factors.
 * 
 * @param input Category details, activity type, and raw quantity.
 * @returns The newly appended ActivityLog.
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
  
  const factors = db.getFactors();
  
  // Calculate specific activity emissions
  const estimatedCO2e = calculateActivityCO2e(
    input.category,
    input.actionType,
    input.amount,
    factors
  );

  return db.addActivityLog(user.id, {
    category: input.category,
    actionType: input.actionType,
    amount: input.amount,
    estimatedCO2e,
  });
}

/**
 * Server action to fetch dashboard details for the active authenticated user.
 * Returns empty structures if the user session does not exist.
 * 
 * @returns Combined user profile, logs list, goals list, and emission factor list.
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
 * Logs an audit entry detailing the modified values.
 * 
 * @param key The factor coefficient configuration key.
 * @param value The numerical multiplier adjustment.
 * @param reason Clarification of changes.
 * @returns Updated factor settings.
 */
export async function updateFactorAction(key: string, value: number, reason: string): Promise<EmissionFactor> {
  const updated = db.updateFactor(key, value, reason);
  if (!updated) {
    throw new Error(`Emission factor with key ${key} not found.`);
  }
  return updated;
}

/**
 * Server action to delete an activity record.
 * 
 * @param id Globally unique identifier of the activity log.
 * @returns Status of deletion check.
 */
export async function deleteActivityAction(id: string): Promise<boolean> {
  return db.deleteActivityLog(id);
}

/**
 * Server action to toggle goal completion status.
 * 
 * @param id Globally unique goal UUID.
 * @param isCompleted Completion status toggle state.
 * @returns Updated Goal object.
 */
export async function toggleGoalCompletionAction(id: string, isCompleted: boolean): Promise<Goal | null> {
  return db.updateGoal(id, { isCompleted });
}

/**
 * Server action to reset database profile data for the active user.
 * Retains administrative records and other accounts' data intact.
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
 * Provisions a guest account "demo@carbonpulse.com" if no session exists, logging them in automatically.
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
    
    // Log demo user in by setting the cookie session securely
    await setSessionCookie(demoUser.id);
    
    user = demoUser;
  }
  
  db.seedDemoData(user.id);
}

/**
 * Server action to generate downloadable JSON and CSV log exports.
 * 
 * @returns Export strings packaged in JSON/CSV formats.
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
  
  // Build CSV
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
 * 
 * @param importedLogs Array of parsed items to merge into the user profile.
 * @returns Success confirmation boolean.
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
      continue; // Skip invalid rows
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
