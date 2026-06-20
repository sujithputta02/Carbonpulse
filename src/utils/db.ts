import fs from "fs";
import path from "path";
import { UserAccount, UserProfile } from "../types/user";
import { ActivityLog, Goal, EmissionFactor, AuditLog, DatabaseSchema } from "../types/activity";
export type { UserAccount, UserProfile } from "../types/user";
export type { ActivityLog, Goal, EmissionFactor, AuditLog, DatabaseSchema } from "../types/activity";
import { DEFAULT_EMISSION_FACTORS } from "../lib/carbon/emissionFactors";
import { logger, DatabaseError } from "../lib/errors";

/**
 * DATABASE CONFIGURATION
 * ======================
 * This application uses a JSON file as a simple database for storing user data.
 * 
 * **Why JSON database?**
 * - Simple to understand and debug (you can open db.json and see all the data)
 * - No need to set up PostgreSQL, MySQL, or MongoDB
 * - Perfect for learning, prototypes, and small applications
 * 
 * **Production environments (like Vercel):**
 * - The app code folder is read-only, so we use /tmp/data (writable temporary folder)
 * - For real production apps, upgrade to PostgreSQL, MySQL, or cloud databases
 * 
 * **Development environments:**
 * - Stores data in your project's /data folder
 * - Easy to reset by deleting data/db.json
 */

// Determine absolute paths dynamically. In production/serverless environments like Vercel,
// the repository directory is read-only. We fall back to using '/tmp/data' which is writable.
const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
const DB_DIR = isProduction ? "/tmp/data" : path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

/**
 * In-memory cache for database content.
 * 
 * **Why we cache:**
 * - Reading files from disk is slow (milliseconds)
 * - Reading from memory is fast (microseconds = 1000x faster!)
 * - Reduces CPU usage and improves response time
 * 
 * **How it works:**
 * - First read: Load from file, store in cachedDb
 * - Next reads: Return cachedDb immediately (no file read needed)
 * - After write: Update cachedDb so it stays in sync
 */
let cachedDb: DatabaseSchema | null = null;

/**
 * Reads the entire database from the JSON file and returns its contents.
 * 
 * **How it works:**
 * 1. Check if we have a cached copy in memory → return it immediately (fast!)
 * 2. If no cache, read db.json file from disk
 * 3. Parse the JSON text into JavaScript objects
 * 4. Store in cache for next time
 * 5. Return the data
 * 
 * **What happens if the file doesn't exist:**
 * - Creates the /data directory automatically
 * - Creates a new empty database with default emission factors
 * - If there's a workspace db.json (seed data), it copies that first
 * 
 * **Error handling:**
 * - If file read fails, returns empty database structure
 * - Logs error to console for debugging
 * - Application continues working (doesn't crash)
 * 
 * **Example of returned structure:**
 * ```json
 * {
 *   "users": [{ id, email, passwordHash, createdAt }],
 *   "userProfiles": [{ id, name, location, goals, baselineFootprint }],
 *   "activityLogs": [{ id, userId, category, actionType, amount, estimatedCO2e }],
 *   "goals": [{ id, userId, title, category, targetCO2e, isCompleted }],
 *   "emissionFactors": [{ key, value, unit, description }],
 *   "auditLogs": [{ id, action, timestamp }]
 * }
 * ```
 * 
 * @returns The complete database structure with all users, profiles, logs, goals, and factors
 */
export function readDb(): DatabaseSchema {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    
    if (!fs.existsSync(DB_FILE)) {
      // Check if a pre-existing workspace db.json exists, to copy over default/seed data.
      const workspaceDbFile = path.join(process.cwd(), "data", "db.json");
      let initialDb: DatabaseSchema;
      
      if (fs.existsSync(workspaceDbFile)) {
        try {
          const rawData = fs.readFileSync(workspaceDbFile, "utf8");
          initialDb = JSON.parse(rawData) as DatabaseSchema;
        } catch {
          initialDb = {
            users: [],
            userProfiles: [],
            activityLogs: [],
            goals: [],
            emissionFactors: DEFAULT_EMISSION_FACTORS,
            auditLogs: [],
          };
        }
      } else {
        initialDb = {
          users: [],
          userProfiles: [],
          activityLogs: [],
          goals: [],
          emissionFactors: DEFAULT_EMISSION_FACTORS,
          auditLogs: [],
        };
      }
      
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), "utf8");
      cachedDb = initialDb;
      return initialDb;
    }
    
    const rawData = fs.readFileSync(DB_FILE, "utf8");
    const parsed = JSON.parse(rawData) as DatabaseSchema;
    if (!parsed.users) {
      parsed.users = [];
    }
    cachedDb = parsed;
    return parsed;
  } catch (error) {
    logger.error("Failed to read database file", { 
      path: DB_FILE,
      error: error instanceof Error ? error.message : String(error)
    }, error instanceof Error ? error : undefined);
    
    // Return empty database structure so app can continue
    return {
      users: [],
      userProfiles: [],
      activityLogs: [],
      goals: [],
      emissionFactors: DEFAULT_EMISSION_FACTORS,
      auditLogs: [],
    };
  }
}

/**
 * Saves the entire database to the JSON file on disk.
 * 
 * **How it works:**
 * 1. Convert the database object to formatted JSON text
 * 2. Write it to db.json file on disk
 * 3. Update the in-memory cache so next reads are fast
 * 
 * **Why JSON.stringify with "null, 2":**
 * - null: No custom replacer function
 * - 2: Indent with 2 spaces for human-readable formatting
 * - Makes the file easy to open and read
 * 
 * **Error handling:**
 * - If write fails, logs error but doesn't crash the app
 * - Cache still gets updated (so app keeps working even if disk write failed)
 * 
 * **Example:**
 * ```typescript
 * const db = readDb();
 * db.users.push(newUser);
 * writeDb(db); // Save changes to disk
 * ```
 * 
 * @param data - The complete database structure to save
 */
export function writeDb(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
    cachedDb = data;
  } catch (error) {
    logger.error("Failed to write to database file", {
      path: DB_FILE,
      error: error instanceof Error ? error.message : String(error)
    }, error instanceof Error ? error : undefined);
    
    // Still update cache even if write failed, so app remains functional
    cachedDb = data;
  }
}

/**
 * DATABASE OPERATIONS OBJECT
 * ===========================
 * This object contains all functions for working with the database.
 * Each function is documented with what it does and how to use it.
 * 
 * **Organization:**
 * - User Account Operations: Create users, find by email/ID, update passwords
 * - User Profile Operations: Save/retrieve user profiles and settings
 * - Activity Log Operations: Track daily carbon footprint activities
 * - Goals Operations: Manage user's carbon reduction goals
 * - Emission Factors Operations: Update carbon calculation factors
 * - Audit Log Operations: Track changes to important data
 */
export const db = {
  // ==========================================
  // USER ACCOUNT OPERATIONS
  // ==========================================
  
  /**
   * Finds a user account by their email address (case-insensitive).
   * 
   * **Use cases:**
   * - During login: Check if email exists in the system
   * - During signup: Prevent duplicate accounts with same email
   * 
   * **Example:**
   * ```typescript
   * const user = db.getUserByEmail("john@example.com");
   * if (user) {
   *   console.log(`Found user: ${user.email}`);
   * } else {
   *   console.log("No account with this email");
   * }
   * ```
   * 
   * @param email - The email address to search for (not case-sensitive)
   * @returns The user account if found, or null if no account exists with that email
   */
  getUserByEmail: (email: string): UserAccount | null => {
    const data = readDb();
    return data.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  /**
   * Finds a user account by their unique ID.
   * 
   * **Use cases:**
   * - After reading session cookie: Get full user details
   * - When loading user dashboard or profile
   * 
   * **Example:**
   * ```typescript
   * const userId = "abc-123-def";
   * const user = db.getUserById(userId);
   * if (user) {
   *   console.log(`User email: ${user.email}`);
   * }
   * ```
   * 
   * @param id - The unique user ID (UUID format)
   * @returns The user account if found, or null if user doesn't exist
   */
  getUserById: (id: string): UserAccount | null => {
    const data = readDb();
    return data.users.find((u) => u.id === id) || null;
  },

  /**
   * Creates a new user account in the system.
   * 
   * **How it works:**
   * 1. Generates a unique ID for the user (UUID)
   * 2. Stores email and hashed password (never stores plain password!)
   * 3. Records creation timestamp
   * 4. Saves to database immediately
   * 
   * **Important:** Password should already be hashed before calling this!
   * 
   * **Example:**
   * ```typescript
   * const hashedPassword = hashPassword("userPassword123");
   * const newUser = db.createUser("john@example.com", hashedPassword);
   * console.log(`Created user with ID: ${newUser.id}`);
   * ```
   * 
   * @param email - The user's email address
   * @param passwordHash - The hashed password (NOT plain text!)
   * @returns The newly created user account with generated ID and timestamp
   */
  createUser: (email: string, passwordHash: string): UserAccount => {
    const data = readDb();
    const newUser: UserAccount = {
      id: crypto.randomUUID(),
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    data.users.push(newUser);
    writeDb(data);
    return newUser;
  },

  /**
   * Updates a user's password hash (used for password changes or security upgrades).
   * 
   * **Use cases:**
   * - User changes their password
   * - Upgrading from old hash format to new secure format
   * - Admin password reset
   * 
   * **Example:**
   * ```typescript
   * const newPassword = "newSecurePassword!";
   * const newHash = hashPassword(newPassword);
   * db.updateUserPasswordHash(userId, newHash);
   * ```
   * 
   * @param id - The unique user ID whose password should be updated
   * @param newHash - The new hashed password to store
   */
  updateUserPasswordHash: (id: string, newHash: string): void => {
    const data = readDb();
    const idx = data.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      data.users[idx].passwordHash = newHash;
      writeDb(data);
    }
  },

  // ==========================================
  // USER PROFILE OPERATIONS
  // ==========================================

  /**
   * Gets a user's profile (settings, goals, baseline footprint, etc.).
   * 
   * **What's in a profile:**
   * - Name, location, household size
   * - Goals (save money, reduce emissions, build habits)
   * - Budget sensitivity level
   * - Commute type and distance
   * - Diet pattern
   * - Baseline carbon footprint (calculated during onboarding)
   * 
   * **Example:**
   * ```typescript
   * const profile = db.getProfile(userId);
   * if (profile) {
   *   console.log(`${profile.name} has baseline footprint: ${profile.baselineFootprint} kg CO2e/month`);
   * } else {
   *   console.log("User hasn't completed onboarding yet");
   * }
   * ```
   * 
   * @param userId - The unique user ID to get profile for
   * @returns The user profile if exists, or null if profile not created yet
   */
  getProfile: (userId: string): UserProfile | null => {
    const data = readDb();
    return data.userProfiles.find((p) => p.id === userId) || null;
  },
  
  /**
   * Saves or updates a user's profile with new settings.
   * 
   * **How it works:**
   * - If profile exists: Updates it and keeps original createdAt date
   * - If new profile: Creates it with current timestamp
   * - Always sets updatedAt to current time
   * 
   * **When to use:**
   * - During onboarding: Save user's initial settings
   * - Settings page: Update user preferences
   * - Recalculate baseline: Update baseline footprint value
   * 
   * **Example:**
   * ```typescript
   * const updatedProfile = db.saveProfile(userId, {
   *   name: "Alex Johnson",
   *   location: "Seattle, USA",
   *   householdSize: 2,
   *   goals: ["REDUCE_EMISSIONS", "SAVE_MONEY"],
   *   budgetSensitivity: "MEDIUM",
   *   commuteType: "EV",
   *   dietPattern: "VEGETARIAN",
   *   baselineFootprint: 425.50
   * });
   * ```
   * 
   * @param userId - The unique user ID to save profile for
   * @param profile - The profile data to save (without id, createdAt, updatedAt)
   * @returns The complete saved profile with all fields filled
   */
  saveProfile: (userId: string, profile: Omit<UserProfile, "id" | "createdAt" | "updatedAt">): UserProfile => {
    const data = readDb();
    const idx = data.userProfiles.findIndex((p) => p.id === userId);
    const now = new Date().toISOString();
    
    const updatedProfile: UserProfile = {
      id: userId,
      ...profile,
      createdAt: idx !== -1 ? data.userProfiles[idx].createdAt : now,
      updatedAt: now,
    };
    
    if (idx !== -1) {
      data.userProfiles[idx] = updatedProfile;
    } else {
      data.userProfiles.push(updatedProfile);
    }
    writeDb(data);
    return updatedProfile;
  },

  /**
   * Completely wipes the database and resets it to empty state.
   * 
   * **WARNING: DESTRUCTIVE OPERATION!**
   * - Deletes all users, profiles, activity logs, and goals
   * - Cannot be undone
   * - Only keeps default emission factors
   * 
   * **Use cases:**
   * - Development/testing: Start with clean slate
   * - Demo environments: Reset between demos
   * - DO NOT USE IN PRODUCTION unless you really mean it!
   * 
   * **Example:**
   * ```typescript
   * db.resetDb(); // Everything is gone!
   * ```
   */
  resetDb: (): void => {
    const initialDb: DatabaseSchema = {
      users: [],
      userProfiles: [],
      activityLogs: [],
      goals: [],
      emissionFactors: DEFAULT_EMISSION_FACTORS,
      auditLogs: [],
    };
    writeDb(initialDb);
  },

  // ==========================================
  // ACTIVITY LOG OPERATIONS
  // ==========================================

  /**
   * Gets all activity logs for a user, sorted by date (newest first).
   * 
   * **What are activity logs?**
   * - Daily records of carbon-producing activities
   * - Examples: "Drove 20km in petrol car", "Ate 3 vegetarian meals", "Used 50kWh electricity"
   * - Each log includes estimated CO2e (carbon dioxide equivalent) emissions
   * 
   * **Example:**
   * ```typescript
   * const logs = db.getActivityLogs(userId);
   * logs.forEach(log => {
   *   console.log(`${log.date}: ${log.actionType} - ${log.estimatedCO2e} kg CO2e`);
   * });
   * ```
   * 
   * @param userId - The unique user ID to get activity logs for
   * @returns Array of activity logs sorted by date (newest first)
   */
  getActivityLogs: (userId: string): ActivityLog[] => {
    const data = readDb();
    return data.activityLogs
      .filter((log) => log.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
  
  /**
   * Adds a new activity log entry for a user.
   * 
   * **How it works:**
   * 1. Generates unique ID for the log
   * 2. Sets current date/time automatically
   * 3. Associates with the user
   * 4. Saves to database
   * 
   * **Example:**
   * ```typescript
   * const newLog = db.addActivityLog(userId, {
   *   category: "TRANSPORT",
   *   actionType: "PETROL_CAR",
   *   amount: 25,  // 25 km driven
   *   estimatedCO2e: 6.75  // 25km × 0.27 kg CO2e per km
   * });
   * console.log(`Logged activity with ID: ${newLog.id}`);
   * ```
   * 
   * @param userId - The unique user ID to add activity for
   * @param log - The activity details (category, type, amount, CO2e) without id, userId, or date
   * @returns The newly created activity log with generated ID and timestamp
   */
  addActivityLog: (userId: string, log: Omit<ActivityLog, "id" | "userId" | "date">): ActivityLog => {
    const data = readDb();
    const newLog: ActivityLog = {
      id: crypto.randomUUID(),
      userId,
      date: new Date().toISOString(),
      ...log,
    };
    data.activityLogs.push(newLog);
    writeDb(data);
    return newLog;
  },
  
  /**
   * Updates an existing activity log with new values.
   * 
   * **Use cases:**
   * - User corrects amount: "Actually I drove 30km, not 25km"
   * - Admin updates CO2e calculation after emission factor change
   * 
   * **Example:**
   * ```typescript
   * const updated = db.updateActivityLog(logId, {
   *   amount: 30,
   *   estimatedCO2e: 8.10  // Recalculated for 30km
   * });
   * if (updated) {
   *   console.log("Activity log updated successfully");
   * }
   * ```
   * 
   * @param id - The unique activity log ID to update
   * @param updatedFields - The fields to update (only provide fields that changed)
   * @returns The updated activity log, or null if log with that ID doesn't exist
   */
  updateActivityLog: (id: string, updatedFields: Partial<Omit<ActivityLog, "id">>): ActivityLog | null => {
    const data = readDb();
    const idx = data.activityLogs.findIndex((log) => log.id === id);
    if (idx === -1) return null;
    
    const original = data.activityLogs[idx];
    const updated = { ...original, ...updatedFields };
    data.activityLogs[idx] = updated;
    writeDb(data);
    return updated;
  },
  
  /**
   * Deletes an activity log permanently.
   * 
   * **Use cases:**
   * - User accidentally logged wrong activity
   * - User wants to remove a log entry
   * 
   * **Example:**
   * ```typescript
   * const success = db.deleteActivityLog(logId);
   * if (success) {
   *   console.log("Activity log deleted");
   * } else {
   *   console.log("Activity log not found");
   * }
   * ```
   * 
   * @param id - The unique activity log ID to delete
   * @returns true if log was deleted, false if log with that ID doesn't exist
   */
  deleteActivityLog: (id: string): boolean => {
    const data = readDb();
    const originalLength = data.activityLogs.length;
    data.activityLogs = data.activityLogs.filter((log) => log.id !== id);
    writeDb(data);
    return data.activityLogs.length < originalLength;
  },

  // ==========================================
  // GOALS OPERATIONS
  // ==========================================

  /**
   * Gets all goals for a user.
   * 
   * **What are goals?**
   * - Carbon reduction targets that users want to achieve
   * - Examples: "Reduce commute emissions by 50kg CO2e", "Try one meat-free day per week"
   * - Can be completed or in-progress
   * - Track streak count (how many times achieved in a row)
   * 
   * **Example:**
   * ```typescript
   * const goals = db.getGoals(userId);
   * const activeGoals = goals.filter(g => !g.isCompleted);
   * console.log(`${activeGoals.length} goals in progress`);
   * ```
   * 
   * @param userId - The unique user ID to get goals for
   * @returns Array of all goals for the user (both completed and in-progress)
   */
  getGoals: (userId: string): Goal[] => {
    const data = readDb();
    return data.goals.filter((g) => g.userId === userId);
  },
  
  /**
   * Creates a new goal for a user.
   * 
   * **How it works:**
   * 1. Generates unique ID for the goal
   * 2. Sets default values: isCompleted=false, streakCount=0
   * 3. Records creation timestamp
   * 4. Saves to database
   * 
   * **Example:**
   * ```typescript
   * const newGoal = db.addGoal(userId, {
   *   title: "Switch to cold water laundry",
   *   category: "ENERGY",
   *   targetCO2e: 15.0  // Target: save 15kg CO2e per month
   * });
   * console.log(`Created goal: ${newGoal.title}`);
   * ```
   * 
   * @param userId - The unique user ID to create goal for
   * @param goal - The goal details (title, category, targetCO2e) without id, completion status, or timestamps
   * @returns The newly created goal with generated ID and default values
   */
  addGoal: (userId: string, goal: Omit<Goal, "id" | "userId" | "isCompleted" | "streakCount" | "createdAt">): Goal => {
    const data = readDb();
    const newGoal: Goal = {
      id: crypto.randomUUID(),
      userId,
      isCompleted: false,
      streakCount: 0,
      createdAt: new Date().toISOString(),
      ...goal,
    };
    data.goals.push(newGoal);
    writeDb(data);
    return newGoal;
  },
  
  /**
   * Updates an existing goal with new values.
   * 
   * **Common updates:**
   * - Mark as completed: { isCompleted: true }
   * - Increment streak: { streakCount: 5 }
   * - Change target: { targetCO2e: 20.0 }
   * 
   * **Example:**
   * ```typescript
   * // User completed the goal!
   * const updated = db.updateGoal(goalId, {
   *   isCompleted: true,
   *   streakCount: 4
   * });
   * ```
   * 
   * @param id - The unique goal ID to update
   * @param updatedFields - The fields to update (only provide fields that changed)
   * @returns The updated goal, or null if goal with that ID doesn't exist
   */
  updateGoal: (id: string, updatedFields: Partial<Omit<Goal, "id">>): Goal | null => {
    const data = readDb();
    const idx = data.goals.findIndex((g) => g.id === id);
    if (idx === -1) return null;
    
    const original = data.goals[idx];
    const updated = { ...original, ...updatedFields };
    data.goals[idx] = updated;
    writeDb(data);
    return updated;
  },
  
  /**
   * Deletes a goal permanently.
   * 
   * **Use cases:**
   * - User no longer wants to pursue this goal
   * - Goal is no longer relevant
   * 
   * **Example:**
   * ```typescript
   * const success = db.deleteGoal(goalId);
   * if (success) {
   *   console.log("Goal removed");
   * }
   * ```
   * 
   * @param id - The unique goal ID to delete
   * @returns true if goal was deleted, false if goal with that ID doesn't exist
   */
  deleteGoal: (id: string): boolean => {
    const data = readDb();
    const originalLength = data.goals.length;
    data.goals = data.goals.filter((g) => g.id !== id);
    writeDb(data);
    return data.goals.length < originalLength;
  },

  // ==========================================
  // EMISSION FACTORS OPERATIONS
  // ==========================================

  /**
   * Gets all emission factors used for CO2e calculations.
   * 
   * **What are emission factors?**
   * - Scientific values that convert activities into carbon emissions
   * - Example: "1 km in petrol car = 0.27 kg CO2e"
   * - Example: "1 kWh electricity = 0.38 kg CO2e"
   * - Based on research and official datasets
   * 
   * **Example:**
   * ```typescript
   * const factors = db.getFactors();
   * const carFactor = factors.find(f => f.key === "CAR_PETROL_PER_KM");
   * console.log(`Petrol car: ${carFactor.value} ${carFactor.unit}`);
   * ```
   * 
   * @returns Array of all emission factors with keys, values, units, and descriptions
   */
  getFactors: (): EmissionFactor[] => {
    const data = readDb();
    return data.emissionFactors;
  },
  
  /**
   * Updates an emission factor value (admin function).
   * 
   * **When to update:**
   * - New scientific research provides better values
   * - Government updates official emission factors
   * - Correcting an error in the factor
   * 
   * **Example:**
   * ```typescript
   * const updated = db.updateFactor(
   *   "CAR_PETROL_PER_KM",
   *   0.28,  // New value
   *   "Updated based on 2026 EPA data"
   * );
   * if (updated) {
   *   console.log("Emission factor updated and audit logged");
   * }
   * ```
   * 
   * @param key - The emission factor key (e.g., "CAR_PETROL_PER_KM")
   * @param value - The new emission value
   * @param reason - Explanation of why this update was made (for audit trail)
   * @returns The updated emission factor, or null if factor with that key doesn't exist
   */
  updateFactor: (key: string, value: number, reason: string): EmissionFactor | null => {
    const data = readDb();
    const idx = data.emissionFactors.findIndex((f) => f.key === key);
    if (idx === -1) return null;
    
    const original = data.emissionFactors[idx];
    const updated: EmissionFactor = {
      ...original,
      value,
      updatedAt: new Date().toISOString(),
    };
    data.emissionFactors[idx] = updated;
    
    // Add Audit Log
    const audit: AuditLog = {
      id: crypto.randomUUID(),
      action: `UPDATE_FACTOR: ${reason}`,
      tableName: "EmissionFactor",
      recordId: original.id,
      oldValue: original.value.toString(),
      newValue: value.toString(),
      timestamp: new Date().toISOString(),
    };
    data.auditLogs.push(audit);
    
    writeDb(data);
    return updated;
  },

  // ==========================================
  // AUDIT LOGS OPERATIONS
  // ==========================================

  /**
   * Gets all audit log entries (newest first).
   * 
   * **What are audit logs?**
   * - Permanent records of important changes
   * - Who changed what, when, and why
   * - Cannot be deleted (for accountability)
   * 
   * **Example:**
   * ```typescript
   * const auditLogs = db.getAuditLogs();
   * auditLogs.forEach(log => {
   *   console.log(`${log.timestamp}: ${log.action}`);
   *   console.log(`Changed ${log.oldValue} → ${log.newValue}`);
   * });
   * ```
   * 
   * @returns Array of all audit logs sorted by timestamp (newest first)
   */
  getAuditLogs: (): AuditLog[] => {
    const data = readDb();
    return data.auditLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
  
  /**
   * Creates demo data for a user account (for testing and demos).
   * 
   * **What it creates:**
   * - Complete user profile (Alex from New York)
   * - 28 days of activity logs (commute, meals, energy use)
   * - 3 sample goals (1 completed, 2 in progress)
   * - Realistic carbon footprint data
   * 
   * **Use cases:**
   * - Testing the dashboard with realistic data
   * - Demo environments to show app capabilities
   * - Development to see how the app looks with data
   * 
   * **Example:**
   * ```typescript
   * db.seedDemoData(userId);
   * // Now userId has a month of realistic activity data!
   * ```
   * 
   * @param userId - The unique user ID to create demo data for (replaces any existing data for this user)
   */
  seedDemoData: (userId: string): void => {
    const now = new Date();
    
    const profile: UserProfile = {
      id: userId,
      name: "Alex",
      location: "New York, USA",
      householdSize: 2,
      goals: ["SAVE_MONEY", "REDUCE_EMISSIONS", "BUILD_HABITS"],
      budgetSensitivity: "HIGH",
      commuteType: "CAR_PETROL",
      dietPattern: "LOW_MEAT",
      baselineFootprint: 535.40,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const logs: ActivityLog[] = [];
    const petrolFactor = 0.27;
    const busFactor = 0.08;
    const electricityFactor = 0.38;
    const gasFactor = 0.18;
    
    for (let day = 28; day >= 1; day--) {
      const logDate = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
      const dayOfWeek = logDate.getDay();
      const logDateStr = logDate.toISOString();
      
      // Commuting logs (Mon, Tue, Thu, Fri)
      if (dayOfWeek === 1 || dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 5) {
        logs.push({
          id: crypto.randomUUID(),
          userId,
          category: "TRANSPORT",
          actionType: "PETROL_CAR",
          amount: 20,
          date: logDateStr,
          estimatedCO2e: Math.round(20 * petrolFactor * 100) / 100,
        });
      }
      
      // Transit logs (Wed, Sat)
      if (dayOfWeek === 3 || dayOfWeek === 6) {
        logs.push({
          id: crypto.randomUUID(),
          userId,
          category: "TRANSPORT",
          actionType: "BUS",
          amount: 15,
          date: logDateStr,
          estimatedCO2e: Math.round(15 * busFactor * 100) / 100,
        });
      }
      
      // Meals (Vegan & Veggie focus)
      if (dayOfWeek === 0) {
        logs.push({
          id: crypto.randomUUID(),
          userId,
          category: "FOOD",
          actionType: "VEGGIE_MEAL",
          amount: 3,
          date: logDateStr,
          estimatedCO2e: Math.round((3.81 / 3.0) * 3 * 100) / 100,
        });
      } else {
        logs.push({
          id: crypto.randomUUID(),
          userId,
          category: "FOOD",
          actionType: "LOW_MEAT_MEAL",
          amount: 2,
          date: logDateStr,
          estimatedCO2e: Math.round((4.67 / 3.0) * 2 * 100) / 100,
        });
        logs.push({
          id: crypto.randomUUID(),
          userId,
          category: "FOOD",
          actionType: "VEGAN_MEAL",
          amount: 1,
          date: logDateStr,
          estimatedCO2e: Math.round((2.89 / 3.0) * 1 * 100) / 100,
        });
      }
      
      // Home Energy logs on Sundays
      if (dayOfWeek === 0) {
        logs.push({
          id: crypto.randomUUID(),
          userId,
          category: "ENERGY",
          actionType: "ELECTRICITY",
          amount: 60,
          date: logDateStr,
          estimatedCO2e: Math.round(60 * electricityFactor * 100) / 100,
        });
        logs.push({
          id: crypto.randomUUID(),
          userId,
          category: "ENERGY",
          actionType: "NATURAL_GAS",
          amount: 12,
          date: logDateStr,
          estimatedCO2e: Math.round(12 * gasFactor * 100) / 100,
        });
      }

      // Retail logs once a week
      if (day % 7 === 3) {
        logs.push({
          id: crypto.randomUUID(),
          userId,
          category: "SHOPPING",
          actionType: "CLOTHING",
          amount: 1,
          date: logDateStr,
          estimatedCO2e: 15.0,
        });
      }
    }
    
    const goals: Goal[] = [
      {
        id: crypto.randomUUID(),
        userId,
        title: "Wash laundry in cold water",
        category: "ENERGY",
        targetCO2e: 15.0,
        isCompleted: true,
        streakCount: 4,
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: crypto.randomUUID(),
        userId,
        title: "Try one meat-free day a week",
        category: "FOOD",
        targetCO2e: 28.0,
        isCompleted: false,
        streakCount: 3,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: crypto.randomUUID(),
        userId,
        title: "Carpool to work twice a week",
        category: "TRANSPORT",
        targetCO2e: 75.0,
        isCompleted: false,
        streakCount: 0,
        createdAt: new Date().toISOString(),
      }
    ];
    
    const data = readDb();
    data.userProfiles = data.userProfiles.filter((p) => p.id !== userId);
    data.activityLogs = data.activityLogs.filter((l) => l.userId !== userId);
    data.goals = data.goals.filter((g) => g.userId !== userId);
    
    data.userProfiles.push(profile);
    data.activityLogs.push(...logs);
    data.goals.push(...goals);
    writeDb(data);
  },
};
