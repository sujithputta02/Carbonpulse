import { z } from "zod";
import { strongPasswordSchema } from "./passwordSchema";

/**
 * AUTHENTICATION SCHEMAS
 * ======================
 * Zod validation schemas for user authentication with security best practices.
 * 
 * **Security Features:**
 * - Strong password requirements (OWASP compliant)
 * - Email format validation
 * - Input sanitization (trim, lowercase)
 */

/**
 * Signup validation schema with strong password requirements.
 * 
 * **Password Requirements:**
 * - Minimum 8 characters (was 6, now stronger)
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * - Not in common weak password list
 * 
 * **Why Strong Passwords Matter:**
 * - 6-char passwords can be cracked in seconds
 * - 8-char with complexity takes years
 * - Protects users from account takeover
 */
export const signupSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address."),
  password: strongPasswordSchema,
});

/**
 * Login validation schema.
 * Less strict than signup since we're checking against existing hash.
 * 
 * **Security Note:**
 * We don't enforce complexity on login because:
 * - User may have created account with old requirements
 * - Password is checked against stored hash
 * - Failed attempts should be rate-limited (separate layer)
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address."),
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
