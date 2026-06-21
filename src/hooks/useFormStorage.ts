/**
 * Custom hook for managing form state with automatic localStorage persistence.
 * Handles validation and error recovery automatically.
 */

import { useState, useCallback, useEffect } from "react";
import { z } from "zod";
import { getStorageItem, setStorageItem, removeStorageItem } from "@/utils/localStorage";

interface UseFormStorageOptions<T> {
  /** LocalStorage key to persist data */
  storageKey: string;
  /** Default initial state */
  defaultValue: T;
  /** Zod schema for validation */
  schema: z.ZodSchema<T>;
  /** Optional auto-save delay in ms (default: 500ms) */
  autoSaveDelay?: number;
}

/**
 * Hook for managing form state with automatic localStorage persistence.
 *
 * @example
 * ```ts
 * const {
 *   formData,
 *   setFormData,
 *   updateField,
 *   clearStorage,
 *   errors
 * } = useFormStorage({
 *   storageKey: 'onboarding_draft',
 *   defaultValue: DEFAULT_STATE,
 *   schema: onboardingDraftSchema
 * });
 *
 * // Update single field
 * updateField({ name: "John" });
 *
 * // Clear stored data
 * clearStorage();
 * ```
 */
export function useFormStorage<T>({
  storageKey,
  defaultValue,
  schema,
  autoSaveDelay = 500,
}: UseFormStorageOptions<T>) {
  const [formData, setFormDataState] = useState<T>(defaultValue);
  const [errors, setErrors] = useState<z.ZodError | null>(null);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load from storage on mount
  useEffect(() => {
    const stored = getStorageItem(storageKey, schema, defaultValue);
    setFormDataState(stored);
  }, [storageKey, defaultValue, schema]);

  // Validate data
  const validateData = useCallback(
    (data: T): boolean => {
      try {
        schema.parse(data);
        setErrors(null);
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          setErrors(error);
        }
        return false;
      }
    },
    [schema]
  );

  // Set form data with auto-save
  const setFormData = useCallback(
    (newData: T | ((prev: T) => T)) => {
      const updated = typeof newData === "function" ? newData(formData) : newData;

      setFormDataState(updated);

      // Auto-save with debounce
      if (saveTimeout) clearTimeout(saveTimeout);

      const timeout = setTimeout(() => {
        validateData(updated) && setStorageItem(storageKey, updated, schema);
      }, autoSaveDelay);

      setSaveTimeout(timeout);
    },
    [formData, storageKey, schema, autoSaveDelay, saveTimeout, validateData]
  );

  // Update single field
  const updateField = useCallback(
    (fields: Partial<T>) => {
      setFormData((prev) => ({ ...prev, ...fields }));
    },
    [setFormData]
  );

  // Clear stored data
  const clearStorage = useCallback(() => {
    removeStorageItem(storageKey);
    setFormDataState(defaultValue);
    setErrors(null);
  }, [storageKey, defaultValue]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) clearTimeout(saveTimeout);
    };
  }, [saveTimeout]);

  return {
    formData,
    setFormData,
    updateField,
    clearStorage,
    errors,
    isValid: !errors,
    getErrorMessage: (fieldPath: string): string | null => {
      if (!errors) return null;
      return errors.issues.find((issue) => issue.path.join(".") === fieldPath)
        ?.message ?? null;
    },
  };
}
