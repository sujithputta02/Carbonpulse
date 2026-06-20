/**
 * ERROR HANDLING & LOGGING UTILITIES
 * ===================================
 * This file provides structured error handling and logging for the application.
 * 
 * **Why structured logging?**
 * - console.error is hard to search and analyze in production
 * - Structured logs can be sent to monitoring services (Sentry, LogRocket, etc.)
 * - Easy to add context (user ID, request ID, timestamp)
 * - Can filter by severity level (info, warning, error, critical)
 * 
 * **Why custom error classes?**
 * - Clear error types make debugging easier
 * - Each error type can have specific handling logic
 * - Better than generic "Error" with string messages
 */

/**
 * Severity levels for logging.
 * Higher numbers = more serious issues.
 */
export enum LogLevel {
  /** Informational messages (e.g., "User logged in") */
  INFO = "info",
  /** Warning messages (e.g., "API rate limit approaching") */
  WARN = "warn",
  /** Error messages (e.g., "Database write failed") */
  ERROR = "error",
  /** Critical errors that need immediate attention (e.g., "Database connection lost") */
  CRITICAL = "critical",
}

/**
 * Structured log entry format.
 * This can be easily sent to external logging services.
 */
export interface LogEntry {
  /** Timestamp in ISO format */
  timestamp: string;
  /** Severity level of the log */
  level: LogLevel;
  /** Log message describing what happened */
  message: string;
  /** Additional context data (user ID, file path, etc.) */
  context?: Record<string, unknown>;
  /** Error stack trace (if applicable) */
  stack?: string;
}

/**
 * Main logger class that provides structured logging.
 * 
 * **Example usage:**
 * ```typescript
 * logger.info("User profile updated", { userId: "abc-123" });
 * logger.error("Failed to save profile", { userId: "abc-123", error: err.message });
 * ```
 */
class Logger {
  /**
   * Logs an informational message (non-critical, just for tracking).
   * 
   * @param message - Description of what happened
   * @param context - Additional data to include in the log
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Logs a warning (something unusual but not necessarily an error).
   * 
   * @param message - Description of the warning
   * @param context - Additional data to include in the log
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Logs an error (something went wrong and needs attention).
   * 
   * @param message - Description of the error
   * @param context - Additional data to include in the log
   * @param error - Optional Error object to extract stack trace from
   */
  error(message: string, context?: Record<string, unknown>, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      context,
      stack: error?.stack,
    };
    this.output(entry);
  }

  /**
   * Logs a critical error (system is in bad state, needs immediate attention).
   * 
   * @param message - Description of the critical issue
   * @param context - Additional data to include in the log
   * @param error - Optional Error object to extract stack trace from
   */
  critical(message: string, context?: Record<string, unknown>, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.CRITICAL,
      message,
      context,
      stack: error?.stack,
    };
    this.output(entry);
  }

  /**
   * Internal method to create and output log entries.
   */
  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };
    this.output(entry);
  }

  /**
   * Outputs the log entry to appropriate destination.
   * 
   * **Development:** Logs to console with colors
   * **Production:** Could send to external service (Sentry, Datadog, etc.)
   */
  private output(entry: LogEntry): void {
    // In development, use console with structured format
    if (process.env.NODE_ENV === "development") {
      const coloredLevel = this.colorizeLevel(entry.level);
      console.log(`[${entry.timestamp}] ${coloredLevel} ${entry.message}`);
      if (entry.context) {
        console.log("  Context:", entry.context);
      }
      if (entry.stack) {
        console.log("  Stack:", entry.stack);
      }
    } else {
      // In production, use structured JSON for log aggregation tools
      console.log(JSON.stringify(entry));
      
      // TODO: Send to external logging service
      // Example: Sentry, LogRocket, Datadog, CloudWatch, etc.
      // if (entry.level === LogLevel.ERROR || entry.level === LogLevel.CRITICAL) {
      //   sendToSentry(entry);
      // }
    }
  }

  /**
   * Adds color to log levels in development for better readability.
   */
  private colorizeLevel(level: LogLevel): string {
    const colors = {
      [LogLevel.INFO]: "\x1b[36m[INFO]\x1b[0m",      // Cyan
      [LogLevel.WARN]: "\x1b[33m[WARN]\x1b[0m",      // Yellow
      [LogLevel.ERROR]: "\x1b[31m[ERROR]\x1b[0m",    // Red
      [LogLevel.CRITICAL]: "\x1b[35m[CRITICAL]\x1b[0m", // Magenta
    };
    return colors[level] || level;
  }
}

/**
 * Global logger instance.
 * Import this in any file to use structured logging.
 * 
 * **Example:**
 * ```typescript
 * import { logger } from '@/lib/errors';
 * 
 * logger.info("Starting profile save");
 * logger.error("Database write failed", { userId: user.id }, error);
 * ```
 */
export const logger = new Logger();

// ==========================================
// CUSTOM ERROR CLASSES
// ==========================================

/**
 * Base class for all application errors.
 * Extends JavaScript's built-in Error with additional context.
 */
export class AppError extends Error {
  /** HTTP status code to return (if applicable) */
  public statusCode: number;
  /** Whether this error should be logged (some are expected, like validation errors) */
  public isLoggable: boolean;
  /** Additional context data */
  public context?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    isLoggable: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isLoggable = isLoggable;
    this.context = context;
    
    // Maintains proper stack trace in V8 engines (Chrome, Node.js)
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when user authentication fails or is missing.
 * 
 * **Use cases:**
 * - User tries to access protected page without logging in
 * - Session cookie is invalid or expired
 * - User ID in session doesn't exist in database
 * 
 * **Example:**
 * ```typescript
 * const user = await getCurrentUser();
 * if (!user) {
 *   throw new AuthenticationError("Please log in to continue");
 * }
 * ```
 */
export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required", context?: Record<string, unknown>) {
    super(message, 401, false, context);
  }
}

/**
 * Error thrown when user tries to access something they don't have permission for.
 * 
 * **Use cases:**
 * - Regular user tries to access admin panel
 * - User tries to edit another user's data
 * - User tries to delete a resource they don't own
 * 
 * **Example:**
 * ```typescript
 * if (activityLog.userId !== currentUser.id) {
 *   throw new AuthorizationError("You can only delete your own activity logs");
 * }
 * ```
 */
export class AuthorizationError extends AppError {
  constructor(message: string = "You don't have permission to perform this action", context?: Record<string, unknown>) {
    super(message, 403, false, context);
  }
}

/**
 * Error thrown when user input fails validation.
 * 
 * **Use cases:**
 * - Email format is invalid
 * - Required field is missing
 * - Number is out of allowed range
 * - Zod schema validation fails
 * 
 * **Example:**
 * ```typescript
 * if (!email.includes("@")) {
 *   throw new ValidationError("Please provide a valid email address", { email });
 * }
 * ```
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 400, false, context);
  }
}

/**
 * Error thrown when a requested resource doesn't exist.
 * 
 * **Use cases:**
 * - User tries to edit a goal that doesn't exist
 * - Activity log with given ID is not found
 * - User profile not found
 * 
 * **Example:**
 * ```typescript
 * const goal = db.getGoals(userId).find(g => g.id === goalId);
 * if (!goal) {
 *   throw new NotFoundError("Goal not found", { goalId });
 * }
 * ```
 */
export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found", context?: Record<string, unknown>) {
    super(message, 404, false, context);
  }
}

/**
 * Error thrown when database operations fail.
 * 
 * **Use cases:**
 * - File system can't read/write db.json
 * - Database file is corrupted
 * - Disk is full
 * - Permission denied on database file
 * 
 * **Example:**
 * ```typescript
 * try {
 *   fs.writeFileSync(DB_FILE, jsonData);
 * } catch (err) {
 *   throw new DatabaseError("Failed to save data to database", { path: DB_FILE });
 * }
 * ```
 */
export class DatabaseError extends AppError {
  constructor(message: string = "Database operation failed", context?: Record<string, unknown>) {
    super(message, 500, true, context);
  }
}

/**
 * Error thrown when external service/API calls fail.
 * 
 * **Use cases:**
 * - External API returns error
 * - Network timeout
 * - API rate limit exceeded
 * 
 * **Example:**
 * ```typescript
 * if (!response.ok) {
 *   throw new ExternalServiceError(`API returned ${response.status}`, { 
 *     service: "CarbonAPI",
 *     status: response.status 
 *   });
 * }
 * ```
 */
export class ExternalServiceError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 502, true, context);
  }
}

/**
 * Error thrown for unexpected system errors.
 * 
 * **Use cases:**
 * - Catch-all for unexpected errors
 * - System in invalid state
 * - Logic errors in code
 * 
 * **Example:**
 * ```typescript
 * try {
 *   // some operation
 * } catch (err) {
 *   throw new InternalError("Unexpected error during calculation", { error: err });
 * }
 * ```
 */
export class InternalError extends AppError {
  constructor(message: string = "An internal error occurred", context?: Record<string, unknown>) {
    super(message, 500, true, context);
  }
}

/**
 * Helper function to handle errors consistently across the application.
 * 
 * **How it works:**
 * 1. Checks if error is one of our custom error types
 * 2. Logs it if isLoggable is true
 * 3. Returns a user-friendly error response
 * 
 * **Example usage in Server Actions:**
 * ```typescript
 * export async function saveProfile(input: SaveProfileInput) {
 *   try {
 *     // ... operation
 *     return { success: true, profile };
 *   } catch (err) {
 *     return handleError(err);
 *   }
 * }
 * ```
 * 
 * @param error - The error to handle
 * @returns Formatted error response with message and status code
 */
export function handleError(error: unknown): { error: string; statusCode: number } {
  // Handle our custom error types
  if (error instanceof AppError) {
    if (error.isLoggable) {
      logger.error(error.message, error.context, error);
    }
    return {
      error: error.message,
      statusCode: error.statusCode,
    };
  }

  // Handle Zod validation errors
  if (error && typeof error === "object" && "issues" in error) {
    const zodError = error as { issues: Array<{ message: string }> };
    logger.warn("Validation error", { issues: zodError.issues });
    return {
      error: zodError.issues[0]?.message || "Validation failed",
      statusCode: 400,
    };
  }

  // Handle unknown errors
  logger.error("Unexpected error", {}, error instanceof Error ? error : undefined);
  return {
    error: "An unexpected error occurred. Please try again later.",
    statusCode: 500,
  };
}

/**
 * Wraps an async function with automatic error handling and logging.
 * 
 * **Use this for:**
 * - Server actions
 * - API route handlers
 * - Any async function that might throw errors
 * 
 * **Example:**
 * ```typescript
 * export const saveProfile = withErrorHandling(async (input: SaveProfileInput) => {
 *   const user = await getCurrentUser();
 *   if (!user) throw new AuthenticationError();
 *   
 *   // ... rest of logic
 *   return profile;
 * });
 * ```
 * 
 * @param fn - The async function to wrap
 * @returns Wrapped function that catches and handles errors automatically
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T
): (...args: Parameters<T>) => Promise<ReturnType<T> | { error: string; statusCode: number }> {
  return async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      return handleError(error);
    }
  };
}
