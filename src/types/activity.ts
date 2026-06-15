export type CategoryType = "TRANSPORT" | "FOOD" | "ENERGY" | "SHOPPING";

export interface ActivityLog {
  id: string;
  userId: string;
  category: CategoryType;
  actionType: string;
  amount: number;
  date: string;
  estimatedCO2e: number;
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
  action: string;
  tableName: string;
  recordId: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
}

export interface ImportedLogItem {
  id?: string;
  category: CategoryType;
  actionType: string;
  amount: number;
  date?: string;
  estimatedCO2e: number;
}

import { UserAccount, UserProfile } from "./user";

export interface DatabaseSchema {
  users: UserAccount[];
  userProfiles: UserProfile[];
  activityLogs: ActivityLog[];
  goals: Goal[];
  emissionFactors: EmissionFactor[];
  auditLogs: AuditLog[];
}
