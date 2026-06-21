/**
 * Zod schemas for localStorage data validation.
 * Ensures all data stored in localStorage is properly typed and validated.
 */

import { z } from "zod";
import { onboardingSchema } from "./onboardingSchema";

/**
 * Schema for onboarding draft stored in localStorage.
 * Allows partial validation since user can save at any step.
 */
export const onboardingDraftSchema = onboardingSchema.partial().extend({
  step: z.number().min(1).max(5).optional(),
  lastUpdated: z.string().datetime().optional(),
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
