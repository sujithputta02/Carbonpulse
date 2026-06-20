/**
 * RATE LIMITING PROTECTION
 * =========================
 * Prevents brute force attacks and abuse by limiting request frequency.
 * 
 * **Security Benefits:**
 * - Prevents brute force password attacks
 * - Mitigates DoS attacks
 * - Protects against credential stuffing
 * - Reduces server load from automated attacks
 * 
 * **OWASP Standards:**
 * - A07:2021 – Identification and Authentication Failures
 * - Rate limiting is a core defense mechanism
 */

/**
 * In-memory rate limit store.
 * 
 * **Structure:**
 * ```
 * {
 *   "user@email.com": {
 *     count: 3,
 *     resetTime: 1640000000000
 *   }
 * }
 * ```
 * 
 * **Production Note:**
 * For production, use Redis or similar distributed cache
 * to share rate limits across multiple server instances.
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limit configuration for different operations.
 * 
 * **Why these limits:**
 * - Login: 5 attempts per 15 mins (prevents brute force)
 * - Signup: 3 attempts per hour (prevents spam accounts)
 * - Password reset: 3 attempts per hour (prevents email spam)
 */
export const RATE_LIMITS = {
  // Authentication endpoints
  LOGIN: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
  SIGNUP: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "Too many signup attempts. Please try again later.",
  },
  PASSWORD_RESET: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "Too many password reset requests. Please try again later.",
  },
  // Data modification endpoints
  ACTIVITY_LOG: {
    maxAttempts: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "Too many activity logs. Please slow down.",
  },
} as const;

/**
 * Rate limit result returned by checkRateLimit.
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  error?: string;
}

/**
 * Checks if a request is within rate limits.
 * 
 * **How it works:**
 * 1. Look up identifier in store (email, IP, etc.)
 * 2. If not exists or expired, create new entry
 * 3. If exists and not expired, increment count
 * 4. Return allowed/denied based on limits
 * 
 * **Example:**
 * ```typescript
 * const result = checkRateLimit(email, RATE_LIMITS.LOGIN);
 * if (!result.allowed) {
 *   return { error: result.error };
 * }
 * // Proceed with login
 * ```
 * 
 * @param identifier - Unique identifier (email, IP, user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status
 */
export function checkRateLimit(
  identifier: string,
  config: { maxAttempts: number; windowMs: number; message: string }
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // No previous entry or expired - allow request
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });

    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Entry exists and not expired - check limit
  if (entry.count >= config.maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      error: config.message,
    };
  }

  // Increment count and allow
  entry.count++;
  rateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    remaining: config.maxAttempts - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Resets rate limit for an identifier (after successful action).
 * 
 * **When to use:**
 * - After successful login (reset failed attempts)
 * - After successful password reset
 * 
 * **Example:**
 * ```typescript
 * const loginResult = await loginUser(email, password);
 * if (loginResult.success) {
 *   resetRateLimit(email); // Clear failed attempts
 * }
 * ```
 * 
 * @param identifier - Unique identifier to reset
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Cleans up expired entries from rate limit store.
 * 
 * **Why we need this:**
 * - Prevents memory leaks
 * - Removes old entries that are no longer relevant
 * 
 * **Usage:**
 * Call periodically (e.g., every hour) or on app initialization.
 * 
 * ```typescript
 * setInterval(cleanupRateLimitStore, 60 * 60 * 1000); // Every hour
 * ```
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  const entriesToDelete: string[] = [];

  rateLimitStore.forEach((entry, key) => {
    if (now > entry.resetTime) {
      entriesToDelete.push(key);
    }
  });

  entriesToDelete.forEach((key) => rateLimitStore.delete(key));
}

/**
 * Gets current rate limit status for an identifier.
 * Useful for showing users how many attempts remain.
 * 
 * **Example:**
 * ```typescript
 * const status = getRateLimitStatus(email, RATE_LIMITS.LOGIN);
 * if (status.remaining < 2) {
 *   console.warn(`Only ${status.remaining} login attempts remaining`);
 * }
 * ```
 * 
 * @param identifier - Unique identifier
 * @param config - Rate limit configuration
 * @returns Current status
 */
export function getRateLimitStatus(
  identifier: string,
  config: { maxAttempts: number; windowMs: number }
): {
  count: number;
  remaining: number;
  resetTime: number | null;
} {
  const entry = rateLimitStore.get(identifier);
  const now = Date.now();

  if (!entry || now > entry.resetTime) {
    return {
      count: 0,
      remaining: config.maxAttempts,
      resetTime: null,
    };
  }

  return {
    count: entry.count,
    remaining: Math.max(0, config.maxAttempts - entry.count),
    resetTime: entry.resetTime,
  };
}

/**
 * Middleware-style rate limiter for server actions.
 * Wraps a server action with rate limiting.
 * 
 * **Example:**
 * ```typescript
 * export const loginAction = withRateLimit(
 *   RATE_LIMITS.LOGIN,
 *   async (email: string, password: string) => {
 *     // Login logic here
 *   }
 * );
 * ```
 * 
 * @param config - Rate limit configuration
 * @param action - Server action to wrap
 * @param getIdentifier - Function to extract identifier from args
 * @returns Wrapped action with rate limiting
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  config: { maxAttempts: number; windowMs: number; message: string },
  action: T,
  getIdentifier: (...args: Parameters<T>) => string
): T {
  return (async (...args: Parameters<T>) => {
    const identifier = getIdentifier(...args);
    const rateLimit = checkRateLimit(identifier, config);

    if (!rateLimit.allowed) {
      return { error: rateLimit.error };
    }

    return action(...args);
  }) as T;
}
