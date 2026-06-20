"use server";

import crypto from "crypto";
import { db, readDb, writeDb } from "@/utils/db";
import { UserProfile } from "@/types/user";
import { ActivityLog, Goal, EmissionFactor, ImportedLogItem } from "@/types/activity";
import { calculateBaseline, calculateActivityCO2e } from "@/lib/carbon/calculateFootprint";
import { getCurrentUser, hashPassword, setSessionCookie } from "@/utils/auth";
import { onboardingSchema, logActivitySchema, factorUpdateSchema } from "@/lib/validation/onboardingSchema";

/**
 * Input data structure for saving a user profile during onboarding.
 * 
 * **What this includes:**
 * - Personal information (name, location)
 * - Household details (size, shopping habits)
 * - Carbon footprint inputs (commute, diet, energy usage)
 * - User goals and budget sensitivity
 */
export interface SaveProfileInput {
  /** User's full name */
  name: string;
  /** User's city and country (e.g., "Seattle, USA") */
  location: string;
  /** Number of people living in the household */
  householdSize: number;
  /** Array of user's carbon reduction goals (e.g., ["SAVE_MONEY", "REDUCE_EMISSIONS"]) */
  goals: string[];
  /** How sensitive the user is to cost when making changes (LOW = not concerned, HIGH = very concerned) */
  budgetSensitivity: "LOW" | "MEDIUM" | "HIGH";
  /** Primary mode of transportation for commuting */
  commuteType: "CAR_PETROL" | "CAR_DIESEL" | "EV" | "TRANSIT" | "NONE";
  /** Total kilometers commuted per week */
  commuteDistanceWeekly: number;
  /** User's dietary pattern affecting carbon footprint */
  dietPattern: "HIGH_MEAT" | "LOW_MEAT" | "VEGETARIAN" | "VEGAN";
  /** Average monthly electricity consumption in kilowatt-hours (kWh) */
  electricityMonthlyKwh: number;
  /** Average monthly natural gas consumption in kilowatt-hours (kWh) */
  naturalGasMonthlyKwh: number;
  /** Shopping habits affecting material consumption footprint */
  shoppingPattern: "HEAVY" | "MODERATE" | "MINIMALIST";
}

/**
 * Saves a user's profile and calculates their baseline carbon footprint.
 * This is the main onboarding action that sets up a new user in the system.
 * 
 * **What this function does:**
 * 1. Validates the user is logged in
 * 2. Validates all input fields using Zod schema
 * 3. Calculates baseline monthly carbon footprint based on user's lifestyle
 * 4. Saves the profile to the database
 * 5. Clears any existing activity logs and goals (fresh start)
 * 6. Creates a first goal: reduce footprint by 10%
 * 
 * **When to call:**
 * - User completes onboarding form
 * - User updates their profile settings
 * 
 * **Example:**
 * ```typescript
 * const profile = await saveProfile({
 *   name: "Alex Johnson",
 *   location: "Portland, USA",
 *   householdSize: 2,
 *   goals: ["REDUCE_EMISSIONS", "BUILD_HABITS"],
 *   budgetSensitivity: "MEDIUM",
 *   commuteType: "EV",
 *   commuteDistanceWeekly: 100,
 *   dietPattern: "LOW_MEAT",
 *   electricityMonthlyKwh: 500,
 *   naturalGasMonthlyKwh: 150,
 *   shoppingPattern: "MODERATE"
 * });
 * console.log(`Baseline footprint: ${profile.baselineFootprint} kg CO2e/month`);
 * ```
 * 
 * @param input - User's profile data and lifestyle information
 * @returns The saved user profile with calculated baseline footprint
 * @throws Error if user is not authenticated or validation fails
 */
export async function saveProfile(input: SaveProfileInput): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: Please log in first.");
  }

  // Validate onboarding inputs with Zod
  const validatedInput = onboardingSchema.parse(input);
  
  // Get current emission factors for calculations
  const factors = db.getFactors();
  
  // Calculate baseline monthly footprint using our calculator engine
  // This considers: transportation, diet, home energy, and shopping habits
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
  
  // Create first goal based on their settings (target 10% reduction from baseline)
  // Example: If baseline is 500 kg CO2e/month, first goal is to reduce by 50 kg
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
 * Logs a daily activity and calculates its carbon footprint impact.
 * 
 * **What this function does:**
 * 1. Validates the user is logged in and has completed onboarding
 * 2. Validates the activity input data
 * 3. Calculates CO2e emissions for the activity using emission factors
 * 4. Saves the activity log to the database with timestamp
 * 
 * **Activity categories:**
 * - TRANSPORT: Driving, public transit, walking, cycling
 * - FOOD: Meals with different meat/vegan content
 * - ENERGY: Electricity and natural gas usage
 * - SHOPPING: Purchases (clothing, electronics, etc.)
 * 
 * **When to call:**
 * - User manually logs an activity from the tracking page
 * - User quick-logs from a recommendation
 * - Importing historical data
 * 
 * **Example:**
 * ```typescript
 * // Log driving 25km in a petrol car
 * const log = await logActivity({
 *   category: "TRANSPORT",
 *   actionType: "PETROL_CAR",
 *   amount: 25  // kilometers
 * });
 * console.log(`Emissions: ${log.estimatedCO2e} kg CO2e`);
 * 
 * // Log eating 3 vegetarian meals
 * const mealLog = await logActivity({
 *   category: "FOOD",
 *   actionType: "VEGGIE_MEAL",
 *   amount: 3  // number of meals
 * });
 * ```
 * 
 * @param input - Activity details: category, type, and amount
 * @returns The created activity log with calculated CO2e emissions
 * @throws Error if user is not authenticated, hasn't completed onboarding, or validation fails
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

  // Validate activity inputs with Zod schema
  const validated = logActivitySchema.parse(input);
  
  // Get current emission factors for CO2e calculation
  const factors = db.getFactors();
  
  // Calculate CO2e emissions for this specific activity
  // Uses emission factors like: 0.27 kg CO2e per km for petrol cars
  const estimatedCO2e = calculateActivityCO2e(
    validated.category,
    validated.actionType,
    validated.amount,
    factors
  );

  // Save to database with automatic timestamp
  return db.addActivityLog(user.id, {
    category: validated.category,
    actionType: validated.actionType,
    amount: validated.amount,
    estimatedCO2e,
  });
}

/**
 * Fetches all dashboard data for the current user in one request.
 * 
 * **What this returns:**
 * - User profile (baseline footprint, goals, diet pattern, etc.)
 * - All activity logs (sorted by date, newest first)
 * - All goals (both completed and in-progress)
 * - Current emission factors (for calculations and display)
 * 
 * **When to call:**
 * - Loading the dashboard page
 * - Refreshing dashboard after changes
 * 
 * **Example:**
 * ```typescript
 * const { profile, logs, goals, factors } = await getDashboardData();
 * if (!profile) {
 *   // User hasn't completed onboarding yet
 *   redirect("/onboarding");
 * }
 * ```
 * 
 * @returns Object containing profile, logs, goals, and emission factors (profile null if not authenticated)
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
 * Updates an emission factor value (admin capability).
 * 
 * **What emission factors are:**
 * Scientific values used to convert activities into carbon emissions.
 * Example: "1 km in a petrol car produces 0.27 kg CO2e"
 * 
 * **Why update them:**
 * - New scientific research provides more accurate values
 * - Government agencies update official emission factors
 * - Regional differences (different electricity grids have different carbon intensity)
 * 
 * **Security note:**
 * In a production app, this should check if user has admin permissions!
 * 
 * **Example:**
 * ```typescript
 * // Update petrol car emission factor based on new research
 * const updated = await updateFactorAction(
 *   "CAR_PETROL_PER_KM",
 *   0.28,
 *   "Updated based on 2026 EPA emissions data"
 * );
 * console.log(`Updated to: ${updated.value} ${updated.unit}`);
 * ```
 * 
 * @param key - The emission factor identifier (e.g., "CAR_PETROL_PER_KM")
 * @param value - The new emission value
 * @param reason - Explanation for the update (saved in audit log)
 * @returns The updated emission factor
 * @throws Error if validation fails or factor key doesn't exist
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
 * Deletes an activity log entry permanently.
 * 
 * **When to call:**
 * - User realizes they logged wrong activity
 * - User wants to remove a duplicate entry
 * - User clicks delete button in activity history
 * 
 * **Security note:**
 * In a production app, verify the activity belongs to the current user!
 * 
 * **Example:**
 * ```typescript
 * const activityId = "abc-123-def";
 * const success = await deleteActivityAction(activityId);
 * if (success) {
 *   console.log("Activity deleted successfully");
 *   // Update UI to remove the activity
 * }
 * ```
 * 
 * @param id - The unique identifier of the activity log to delete
 * @returns true if deleted successfully, false if activity not found
 */
export async function deleteActivityAction(id: string): Promise<boolean> {
  return db.deleteActivityLog(id);
}

/**
 * Toggles a goal between completed and in-progress status.
 * 
 * **How goals work:**
 * - Each goal has a carbon reduction target (e.g., "Save 50 kg CO2e")
 * - User marks them complete when achieved
 * - Streak count tracks consecutive completions
 * 
 * **When to call:**
 * - User checks/unchecks a goal in the goals list
 * - User completes a goal and wants to mark it
 * 
 * **Example:**
 * ```typescript
 * const goalId = "goal-123";
 * const currentStatus = false; // currently not completed
 * 
 * const updated = await toggleGoalCompletionAction(goalId, true);
 * if (updated) {
 *   console.log(`Goal is now ${updated.isCompleted ? 'completed' : 'in progress'}`);
 * }
 * ```
 * 
 * @param id - The unique identifier of the goal
 * @param isCompleted - The new completion status (true = completed, false = in progress)
 * @returns The updated goal object, or null if goal not found
 */
export async function toggleGoalCompletionAction(id: string, isCompleted: boolean): Promise<Goal | null> {
  return db.updateGoal(id, { isCompleted });
}

/**
 * Resets a user's profile by deleting all their data (except account).
 * 
 * **What gets deleted:**
 * - User profile (baseline footprint, preferences)
 * - All activity logs
 * - All goals
 * 
 * **What stays:**
 * - User account (email, password)
 * - They can start onboarding again fresh
 * 
 * **When to call:**
 * - User wants to completely restart
 * - Testing/development to clear data
 * - User made mistakes during onboarding and wants to redo it
 * 
 * **Example:**
 * ```typescript
 * await resetDatabaseAction();
 * // User's profile, logs, and goals are now cleared
 * // Redirect to /onboarding to start fresh
 * ```
 * 
 * @returns Nothing (void)
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
 * Creates a demo account with realistic data for testing and demonstrations.
 * 
 * **What this creates:**
 * - Demo user account (email: demo@carbonpulse.com)
 * - Complete user profile (Alex from New York)
 * - 28 days of realistic activity logs (commutes, meals, energy use)
 * - 3 sample goals with different completion statuses
 * 
 * **When to use:**
 * - "Try Demo" button on landing page
 * - Testing the app with realistic data
 * - Demonstrations to show app capabilities
 * - Development to see populated dashboard
 * 
 * **How it works:**
 * 1. If no user is logged in: Creates demo user and logs them in automatically
 * 2. If user is logged in: Uses their account and seeds their data
 * 3. Generates 4 weeks of varied activity data
 * 
 * **Example:**
 * ```typescript
 * await seedDemoDataAction();
 * // User is now logged in as demo user with 28 days of data
 * // Can explore dashboard, charts, recommendations, etc.
 * ```
 * 
 * @returns Nothing (void) - automatically logs in demo user if needed
 */
export async function seedDemoDataAction(): Promise<void> {
  let user = await getCurrentUser();
  
  // If no user is logged in, create and log in as demo user
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
  
  // Seed realistic demo data (see db.seedDemoData for details)
  db.seedDemoData(user.id);
}

/**
 * Generates downloadable export files of user's activity logs.
 * 
 * **What this creates:**
 * - JSON file: Complete activity data with all fields
 * - CSV file: Spreadsheet-compatible format for Excel/Google Sheets
 * 
 * **Use cases:**
 * - User wants backup of their data
 * - User wants to analyze data in Excel
 * - User needs data for reports or tax purposes
 * - Data portability (moving to another system)
 * 
 * **JSON format:**
 * ```json
 * [
 *   {
 *     "id": "log-123",
 *     "category": "TRANSPORT",
 *     "actionType": "PETROL_CAR",
 *     "amount": 25,
 *     "date": "2026-06-15T10:00:00Z",
 *     "estimatedCO2e": 6.75
 *   }
 * ]
 * ```
 * 
 * **CSV format:**
 * ```csv
 * "id","category","actionType","amount","date","estimatedCO2e"
 * "log-123","TRANSPORT","PETROL_CAR",25,"2026-06-15T10:00:00Z",6.75
 * ```
 * 
 * **Example:**
 * ```typescript
 * const { jsonString, csvString } = await getExportDataAction();
 * 
 * // Create download for JSON
 * const jsonBlob = new Blob([jsonString], { type: 'application/json' });
 * const jsonUrl = URL.createObjectURL(jsonBlob);
 * 
 * // Create download for CSV
 * const csvBlob = new Blob([csvString], { type: 'text/csv' });
 * const csvUrl = URL.createObjectURL(csvBlob);
 * ```
 * 
 * @returns Object with jsonString and csvString ready for download
 * @throws Error if user is not authenticated
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
  
  // Generate JSON format (pretty-printed with 2-space indentation)
  const jsonString = JSON.stringify(logs, null, 2);
  
  // Generate CSV format with headers
  const headers = ["id", "category", "actionType", "amount", "date", "estimatedCO2e"];
  const csvRows = [headers.join(",")];
  
  // Add each log as a CSV row
  for (const log of logs) {
    const row = [
      log.id,
      log.category,
      log.actionType,
      log.amount,
      log.date,
      log.estimatedCO2e,
    ];
    // Wrap each value in quotes to handle commas in data
    csvRows.push(row.map(val => `"${val}"`).join(","));
  }
  const csvString = csvRows.join("\n");
  
  return { jsonString, csvString };
}

/**
 * Imports activity logs from JSON or CSV file into the database.
 * 
 * **What this does:**
 * 1. Validates user is logged in and has completed onboarding
 * 2. Processes array of activity log items
 * 3. Validates each item has required fields
 * 4. Skips invalid entries (doesn't fail entire import)
 * 5. Adds valid entries to database with preserved dates
 * 
 * **Use cases:**
 * - User has historical data to import
 * - Moving from another carbon tracking app
 * - Restoring from backup
 * - Bulk data entry from spreadsheet
 * 
 * **Required fields per log:**
 * - category: "TRANSPORT", "FOOD", "ENERGY", or "SHOPPING"
 * - actionType: Specific action (e.g., "PETROL_CAR", "VEGGIE_MEAL")
 * - amount: Numeric value (km, meals, kWh, etc.)
 * - estimatedCO2e: Pre-calculated CO2 emissions
 * 
 * **Optional fields:**
 * - id: Will generate new UUID if not provided
 * - date: Will use current timestamp if not provided
 * 
 * **Example:**
 * ```typescript
 * const logsToImport = [
 *   {
 *     category: "TRANSPORT",
 *     actionType: "PETROL_CAR",
 *     amount: 30,
 *     estimatedCO2e: 8.10,
 *     date: "2026-06-01T10:00:00Z"
 *   },
 *   {
 *     category: "FOOD",
 *     actionType: "VEGAN_MEAL",
 *     amount: 3,
 *     estimatedCO2e: 2.89
 *   }
 * ];
 * 
 * const success = await importLogsAction(logsToImport);
 * if (success) {
 *   console.log("Logs imported successfully");
 * }
 * ```
 * 
 * @param importedLogs - Array of activity log items to import
 * @returns true if import completed (even if some entries were skipped)
 * @throws Error if user is not authenticated or hasn't completed onboarding
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
  
  // Process each imported log item
  for (const item of importedLogs) {
    // Skip items missing required fields (validates data quality)
    if (!item.category || !item.actionType || item.amount === undefined || item.estimatedCO2e === undefined) {
      continue;
    }
    
    // Create activity log with preserved or generated data
    const newLog: ActivityLog = {
      id: item.id || crypto.randomUUID(), // Use provided ID or generate new one
      userId: user.id,
      category: item.category,
      actionType: item.actionType,
      amount: Number(item.amount),
      date: item.date || new Date().toISOString(), // Use provided date or current time
      estimatedCO2e: Number(item.estimatedCO2e),
    };
    rawDb.activityLogs.push(newLog);
  }
  
  writeDb(rawDb);
  return true;
}
