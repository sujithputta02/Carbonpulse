/**
 * CLIENT-SIDE ERROR HANDLING UTILITIES
 * =====================================
 * This file provides error handling specifically for React components (client-side).
 * 
 * **Why separate from server errors?**
 * - Client-side can't use Node.js modules (like fs, crypto)
 * - Different error types (network errors, React errors, etc.)
 * - Different user feedback mechanisms (toast notifications, error messages)
 */

/**
 * User-friendly error messages for common error scenarios.
 * 
 * **Why we need this:**
 * - Technical error messages confuse users
 * - "ENOENT: no such file" → "Unable to save your changes"
 * - Provides actionable guidance for users
 */
export const ERROR_MESSAGES = {
  NETWORK: "Network error. Please check your internet connection and try again.",
  UNAUTHORIZED: "Your session has expired. Please log in again.",
  VALIDATION: "Please check your input and try again.",
  NOT_FOUND: "The requested item could not be found.",
  SERVER_ERROR: "Something went wrong on our end. Please try again later.",
  UNKNOWN: "An unexpected error occurred. Please try again.",
} as const;

/**
 * Extracts a user-friendly error message from any error object.
 * 
 * **How it works:**
 * 1. Checks if error has a message property
 * 2. Checks for common error patterns (network, auth, etc.)
 * 3. Returns generic message if can't determine specific type
 * 
 * **Example:**
 * ```typescript
 * try {
 *   await saveProfile(data);
 * } catch (error) {
 *   const message = getErrorMessage(error);
 *   showToast(message); // Shows user-friendly message
 * }
 * ```
 * 
 * @param error - Any error (Error object, string, unknown type)
 * @returns User-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  // Handle Error objects
  if (error instanceof Error) {
    // Check for authentication errors
    if (error.message.includes("Unauthorized") || error.message.includes("401")) {
      return ERROR_MESSAGES.UNAUTHORIZED;
    }
    
    // Check for validation errors
    if (error.message.includes("validation") || error.message.includes("invalid")) {
      return ERROR_MESSAGES.VALIDATION;
    }
    
    // Check for not found errors
    if (error.message.includes("not found") || error.message.includes("404")) {
      return ERROR_MESSAGES.NOT_FOUND;
    }
    
    // Check for network errors
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return ERROR_MESSAGES.NETWORK;
    }
    
    // Return the error message if it's user-friendly (not technical)
    if (error.message && !error.message.includes("Error:") && error.message.length < 100) {
      return error.message;
    }
    
    return ERROR_MESSAGES.SERVER_ERROR;
  }

  // Handle string errors
  if (typeof error === "string") {
    return error;
  }

  // Handle objects with error property
  if (error && typeof error === "object" && "error" in error) {
    return getErrorMessage(error.error);
  }

  // Unknown error type
  return ERROR_MESSAGES.UNKNOWN;
}

/**
 * Logs errors to console in development with helpful formatting.
 * In production, this could send errors to monitoring services.
 * 
 * **Why log client-side errors?**
 * - Track bugs that only happen in users' browsers
 * - See which errors happen most frequently
 * - Debug production issues
 * 
 * **Example:**
 * ```typescript
 * try {
 *   await deleteActivity(id);
 * } catch (error) {
 *   logError("Failed to delete activity", error, { activityId: id, userId: user.id });
 *   setError("Unable to delete activity. Please try again.");
 * }
 * ```
 * 
 * @param message - Description of what failed
 * @param error - The error object
 * @param context - Additional context (user ID, action attempted, etc.)
 */
export function logError(
  message: string,
  error: unknown,
  context?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === "development") {
    console.error(`❌ ${message}`);
    if (context) {
      console.error("Context:", context);
    }
    console.error("Error:", error);
  } else {
    // In production, send to error tracking service
    // Example: Sentry.captureException(error, { tags: context });
    
    // For now, just log as structured JSON
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      message,
      context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : String(error),
    }));
  }
}

/**
 * React error handler hook for consistent error handling in components.
 * 
 * **What it provides:**
 * - State for storing error messages
 * - Function to handle errors consistently
 * - Function to clear errors
 * 
 * **Example usage:**
 * ```typescript
 * function MyComponent() {
 *   const { error, handleError, clearError } = useErrorHandler();
 *   
 *   const onSave = async () => {
 *     clearError();
 *     try {
 *       await saveData();
 *     } catch (err) {
 *       handleError(err, "Failed to save data", { userId: user.id });
 *     }
 *   };
 *   
 *   return (
 *     <div>
 *       {error && <div className="error">{error}</div>}
 *       <button onClick={onSave}>Save</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useErrorHandler() {
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles an error by logging it and setting user-friendly message.
   */
  const handleError = useCallback((
    err: unknown,
    logMessage?: string,
    context?: Record<string, unknown>
  ) => {
    if (logMessage) {
      logError(logMessage, err, context);
    }
    const userMessage = getErrorMessage(err);
    setError(userMessage);
  }, []);

  /**
   * Clears the current error message.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError, setError };
}

// React imports needed for the hook
import { useState, useCallback } from "react";

/**
 * Async wrapper that handles errors gracefully in React event handlers.
 * 
 * **Why we need this:**
 * - React doesn't catch errors from async event handlers
 * - Prevents unhandled promise rejections
 * - Provides consistent error handling
 * 
 * **Example:**
 * ```typescript
 * const handleDelete = withAsyncErrorHandler(
 *   async (id: string) => {
 *     await deleteActivity(id);
 *     toast.success("Deleted successfully");
 *   },
 *   (error) => {
 *     logError("Delete failed", error, { id });
 *     toast.error("Failed to delete");
 *   }
 * );
 * 
 * // Use in JSX
 * <button onClick={() => handleDelete(activity.id)}>Delete</button>
 * ```
 * 
 * @param asyncFn - The async function to execute
 * @param onError - Error handler callback
 * @returns Wrapped function that catches errors automatically
 */
export function withAsyncErrorHandler<T extends (...args: any[]) => Promise<any>>(
  asyncFn: T,
  onError?: (error: unknown) => void
): (...args: Parameters<T>) => void {
  return (...args: Parameters<T>) => {
    asyncFn(...args).catch((error) => {
      if (onError) {
        onError(error);
      } else {
        logError("Async operation failed", error);
      }
    });
  };
}

/**
 * Type guard to check if an error is a validation error.
 * 
 * **Example:**
 * ```typescript
 * try {
 *   validate(data);
 * } catch (error) {
 *   if (isValidationError(error)) {
 *     // Show field-specific errors
 *     setFieldErrors(error.fields);
 *   } else {
 *     // Show generic error
 *     setError(getErrorMessage(error));
 *   }
 * }
 * ```
 */
export function isValidationError(error: unknown): error is { fields: Record<string, string> } {
  return (
    error !== null &&
    typeof error === "object" &&
    "fields" in error &&
    typeof error.fields === "object"
  );
}

/**
 * Type guard to check if an error is an authentication error.
 * 
 * **Example:**
 * ```typescript
 * try {
 *   await fetchUserData();
 * } catch (error) {
 *   if (isAuthError(error)) {
 *     router.push("/login"); // Redirect to login
 *   }
 * }
 * ```
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes("Unauthorized") || 
           error.message.includes("Authentication") ||
           error.message.includes("401");
  }
  if (error && typeof error === "object" && "statusCode" in error) {
    return error.statusCode === 401;
  }
  return false;
}
