import { z } from "zod";

// Authentication Schemas
export const signupSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

export const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  password: z.string().min(1, "Password is required."),
});

// Onboarding Questionnaire Schema
export const onboardingSchema = z.object({
  name: z.string().trim().min(1, "Name or nickname is required."),
  location: z.string().trim().min(1, "Location is required."),
  householdSize: z.number().int().min(1, "Household size must be at least 1 person."),
  goals: z.array(z.string()).min(1, "Please select at least one goal."),
  budgetSensitivity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  commuteType: z.enum(["CAR_PETROL", "CAR_DIESEL", "EV", "TRANSIT", "NONE"]),
  commuteDistanceWeekly: z.number().nonnegative("Weekly commute distance cannot be negative."),
  dietPattern: z.enum(["HIGH_MEAT", "LOW_MEAT", "VEGETARIAN", "VEGAN"]),
  electricityMonthlyKwh: z.number().nonnegative("Electricity consumption cannot be negative."),
  naturalGasMonthlyKwh: z.number().nonnegative("Natural gas consumption cannot be negative."),
  shoppingPattern: z.enum(["HEAVY", "MODERATE", "MINIMALIST"]),
});

// Activity Logging Schema
export const logActivitySchema = z.object({
  category: z.enum(["TRANSPORT", "FOOD", "ENERGY", "SHOPPING"]),
  actionType: z.string().min(1, "Activity action type is required."),
  amount: z.number().positive("Logged quantity must be greater than zero."),
});

// Admin Factor Update Schema
export const factorUpdateSchema = z.object({
  key: z.string().min(1, "Emission factor key is required."),
  value: z.number().nonnegative("Coefficient value cannot be negative."),
  reason: z.string().trim().min(10, "Please provide a detailed reason (at least 10 characters) for auditing changes."),
});
