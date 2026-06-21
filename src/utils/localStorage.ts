/**
 * Centralized localStorage utilities with validation and error handling.
 * All localStorage access must go through these functions to ensure data integrity.
 */

import { z } from "zod";
import { logError } from "@/lib/clientErrors";

/**
 * Safely retrieves and parses data from localStorage with type validation.
 *
 * @template T - The expected type of the stored data
 * @param key - The localStorage key
 * @param schema - Zod schema for validation
 * @param defaultValue - Default value if key doesn't exist or validation fails
 * @returns Parsed and validated data, or defaultValue
 *
 * @example
 * ```ts
 * const draft = getStorageItem(
 *   'onboarding_draft',
 *   onboardingDraftSchema,
 *   DEFAULT_STATE
 * );
 * ```
 */
export function getStorageItem<T>(
  key: string,
  schema: z.ZodSchema<T>,
  defaultValue: T
): T {
  try {
    if (typeof window === "undefined") return defaultValue;

    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;

    const parsed = JSON.parse(stored);
    const validated = schema.parse(parsed);
    return validated;
  } catch (error) {
    logError(`Failed to retrieve/validate localStorage key: ${key}`, error);
    return defaultValue;
  }
}

/**
 * Safely stores data in localStorage with pre-storage validation.
 *
 * @template T - The type of data to store
 * @param key - The localStorage key
 * @param value - The value to store
 * @param schema - Zod schema for pre-storage validation
 * @returns true if successful, false otherwise
 *
 * @example
 * ```ts
 * const success = setStorageItem(
 *   'onboarding_draft',
 *   formData,
 *   onboardingDraftSchema
 * );
 * ```
 */
export function setStorageItem<T>(
  key: string,
  value: T,
  schema: z.ZodSchema<T>
): boolean {
  try {
    if (typeof window === "undefined") return false;

    // Validate before storing
    schema.parse(value);
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    logError(`Failed to store localStorage key: ${key}`, error);
    return false;
  }
}

/**
 * Safely removes an item from localStorage.
 *
 * @param key - The localStorage key to remove
 * @returns true if successful, false otherwise
 */
export function removeStorageItem(key: string): boolean {
  try {
    if (typeof window === "undefined") return false;
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    logError(`Failed to remove localStorage key: ${key}`, error);
    return false;
  }
}

/**
 * Safely clears all localStorage items related to this app.
 * Only clears keys prefixed with 'carbonpulse_'
 */
export function clearAppStorage(): boolean {
  try {
    if (typeof window === "undefined") return false;

    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("carbonpulse_")) {
        keys.push(key);
      }
    }

    keys.forEach((key) => localStorage.removeItem(key));
    return true;
  } catch (error) {
    logError("Failed to clear app storage", error);
    return false;
  }
}
