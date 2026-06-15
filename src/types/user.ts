export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export type BudgetSensitivity = "LOW" | "MEDIUM" | "HIGH";
export type CommuteType = "CAR_PETROL" | "CAR_DIESEL" | "EV" | "TRANSIT" | "NONE";
export type DietPattern = "HIGH_MEAT" | "LOW_MEAT" | "VEGETARIAN" | "VEGAN";

export interface UserProfile {
  id: string;
  name: string;
  location: string;
  householdSize: number;
  goals: string[]; // e.g. ["SAVE_MONEY", "REDUCE_EMISSIONS", "BUILD_HABITS"]
  budgetSensitivity: BudgetSensitivity;
  commuteType: CommuteType;
  dietPattern: DietPattern;
  baselineFootprint: number; // in kg CO2e / month
  createdAt: string;
  updatedAt: string;
}
