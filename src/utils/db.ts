import fs from "fs";
import path from "path";

// Define the absolute path to the db.json file
const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

// Define TypeScript interfaces for our data models
export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  location: string;
  householdSize: number;
  goals: string[]; // e.g. ["SAVE_MONEY", "REDUCE_EMISSIONS"]
  budgetSensitivity: "LOW" | "MEDIUM" | "HIGH";
  commuteType: "CAR_PETROL" | "CAR_DIESEL" | "EV" | "TRANSIT" | "NONE";
  dietPattern: "HIGH_MEAT" | "LOW_MEAT" | "VEGETARIAN" | "VEGAN";
  baselineFootprint: number; // in kg CO2e / month
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  category: "TRANSPORT" | "FOOD" | "ENERGY" | "SHOPPING";
  actionType: string; // e.g. "PETROL_CAR_TRIP"
  amount: number; // e.g. km traveled, counts of meals
  date: string; // ISO string
  estimatedCO2e: number; // kg CO2e
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  category: string;
  targetCO2e: number;
  isCompleted: boolean;
  streakCount: number;
  createdAt: string;
}

export interface EmissionFactor {
  id: string;
  category: string;
  key: string;
  value: number;
  unit: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string; // e.g. "UPDATE_FACTOR", "DELETE_ACTIVITY"
  tableName: string;
  recordId: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
}

export interface DatabaseSchema {
  users: UserAccount[];
  userProfiles: UserProfile[];
  activityLogs: ActivityLog[];
  goals: Goal[];
  emissionFactors: EmissionFactor[];
  auditLogs: AuditLog[];
}

// Default emission factors to initialize the database with
const DEFAULT_EMISSION_FACTORS: EmissionFactor[] = [
  // Transport
  { id: "f1", category: "TRANSPORT", key: "CAR_PETROL", value: 0.27, unit: "kg CO2e / km", updatedAt: new Date().toISOString() },
  { id: "f2", category: "TRANSPORT", key: "CAR_DIESEL", value: 0.25, unit: "kg CO2e / km", updatedAt: new Date().toISOString() },
  { id: "f3", category: "TRANSPORT", key: "EV", value: 0.05, unit: "kg CO2e / km", updatedAt: new Date().toISOString() },
  { id: "f4", category: "TRANSPORT", key: "TRANSIT_BUS", value: 0.08, unit: "kg CO2e / passenger-km", updatedAt: new Date().toISOString() },
  { id: "f5", category: "TRANSPORT", key: "TRANSIT_TRAIN", value: 0.04, unit: "kg CO2e / passenger-km", updatedAt: new Date().toISOString() },
  { id: "f6", category: "TRANSPORT", key: "FLIGHT_SHORT", value: 0.15, unit: "kg CO2e / km", updatedAt: new Date().toISOString() },
  { id: "f7", category: "TRANSPORT", key: "FLIGHT_LONG", value: 0.12, unit: "kg CO2e / km", updatedAt: new Date().toISOString() },
  
  // Food
  { id: "f8", category: "FOOD", key: "DIET_HIGH_MEAT", value: 7.26, unit: "kg CO2e / day", updatedAt: new Date().toISOString() },
  { id: "f9", category: "FOOD", key: "DIET_LOW_MEAT", value: 4.67, unit: "kg CO2e / day", updatedAt: new Date().toISOString() },
  { id: "f10", category: "FOOD", key: "DIET_VEGETARIAN", value: 3.81, unit: "kg CO2e / day", updatedAt: new Date().toISOString() },
  { id: "f11", category: "FOOD", key: "DIET_VEGAN", value: 2.89, unit: "kg CO2e / day", updatedAt: new Date().toISOString() },
  
  // Home Energy
  { id: "f12", category: "ENERGY", key: "ELECTRICITY", value: 0.38, unit: "kg CO2e / kWh", updatedAt: new Date().toISOString() },
  { id: "f13", category: "ENERGY", key: "NATURAL_GAS", value: 0.18, unit: "kg CO2e / kWh", updatedAt: new Date().toISOString() },
  
  // Shopping
  { id: "f14", category: "SHOPPING", key: "CONSUMER_HEAVY", value: 350.0, unit: "kg CO2e / month", updatedAt: new Date().toISOString() },
  { id: "f15", category: "SHOPPING", key: "CONSUMER_MODERATE", value: 180.0, unit: "kg CO2e / month", updatedAt: new Date().toISOString() },
  { id: "f16", category: "SHOPPING", key: "CONSUMER_MINIMALIST", value: 50.0, unit: "kg CO2e / month", updatedAt: new Date().toISOString() },
];

// In-memory cache for the parsed database structure to optimize CPU and memory allocation
let cachedDb: DatabaseSchema | null = null;

// Read from JSON Database
export function readDb(): DatabaseSchema {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    
    if (!fs.existsSync(DB_FILE)) {
      const initialDb: DatabaseSchema = {
        users: [],
        userProfiles: [],
        activityLogs: [],
        goals: [],
        emissionFactors: DEFAULT_EMISSION_FACTORS,
        auditLogs: [],
      };
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
    console.error("Failed to read database file:", error);
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

// Write to JSON Database
export function writeDb(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
    cachedDb = data;
  } catch (error) {
    console.error("Failed to write to database file:", error);
  }
}

// Database Operations Helpers
export const db = {
  // User Account Ops
  getUserByEmail: (email: string): UserAccount | null => {
    const data = readDb();
    return data.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  getUserById: (id: string): UserAccount | null => {
    const data = readDb();
    return data.users.find((u) => u.id === id) || null;
  },

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

  updateUserPasswordHash: (id: string, newHash: string): void => {
    const data = readDb();
    const idx = data.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      data.users[idx].passwordHash = newHash;
      writeDb(data);
    }
  },

  // User Profile Ops
  getProfile: (userId: string): UserProfile | null => {
    const data = readDb();
    return data.userProfiles.find((p) => p.id === userId) || null;
  },
  
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

  // Activity Log Ops
  getActivityLogs: (userId: string): ActivityLog[] => {
    const data = readDb();
    return data.activityLogs
      .filter((log) => log.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
  
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
  
  deleteActivityLog: (id: string): boolean => {
    const data = readDb();
    const originalLength = data.activityLogs.length;
    data.activityLogs = data.activityLogs.filter((log) => log.id !== id);
    writeDb(data);
    return data.activityLogs.length < originalLength;
  },

  // Goals Ops
  getGoals: (userId: string): Goal[] => {
    const data = readDb();
    return data.goals.filter((g) => g.userId === userId);
  },
  
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
  
  deleteGoal: (id: string): boolean => {
    const data = readDb();
    const originalLength = data.goals.length;
    data.goals = data.goals.filter((g) => g.id !== id);
    writeDb(data);
    return data.goals.length < originalLength;
  },

  // Emission Factors Ops
  getFactors: (): EmissionFactor[] => {
    const data = readDb();
    return data.emissionFactors;
  },
  
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

  // Audit Logs Ops
  getAuditLogs: (): AuditLog[] => {
    const data = readDb();
    return data.auditLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
  
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
