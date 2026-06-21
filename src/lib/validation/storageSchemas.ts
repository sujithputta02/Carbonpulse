/**
 * Zod schemas for localStorage data validation.
 * Ensures all data stored in localStorage is properly typed and validated.
 */

import { z } from "zod";

/**
 * Schema for onboarding draft stored in localStorage.
 * Uses full validation but allows partial fills during onboarding steps.
 */
export const onboardingDraftSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  householdSize: z.number().min(1).max(10),
  goals: z.array(z.string()),
  budgetSensitivity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  commuteType: z.enum(["CAR_PETROL", "CAR_DIESEL", "EV", "TRANSIT", "NONE"]),
  commuteDistanceWeekly: z.number().nonnegative(),
  dietPattern: z.enum(["HIGH_MEAT", "LOW_MEAT", "VEGETARIAN", "VEGAN"]),
  electricityMonthlyKwh: z.number().nonnegative(),
  naturalGasMonthlyKwh: z.number().nonnegative(),
  shoppingPattern: z.enum(["HEAVY", "MODERATE", "MINIMALIST"]),
});

export type OnboardingDraft = z.infer<typeof onboardingDraftSchema>;

/**
 * Schema for tracking metadata stored in localStorage.
 */
export const trackingMetadataSchema = z.object({
  lastActivityDate: z.string().datetime().optional(),
  totalActivitiesLogged: z.number().nonnegative().optional(),
  currentStreak: z.number().nonnegative().optional(),
});

export type TrackingMetadata = z.infer<typeof trackingMetadataSchema>;

/**
 * Schema for user preferences stored in localStorage.
 */
export const userPreferencesSchema = z.object({
  theme: z.enum(["light", "dark"]).optional(),
  notificationsEnabled: z.boolean().optional(),
  unitPreference: z.enum(["metric", "imperial"]).optional(),
  language: z.string().optional(),
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;
