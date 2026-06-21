/**
 * Server-side authorization utilities for secure action validation.
 * All server actions must use these utilities for consistent security checks.
 */

import { getCurrentUser } from "@/utils/auth";
import { db } from "@/utils/db";
import { logError } from "@/lib/clientErrors";

/**
 * Verifies user is authenticated and returns the user.
 * Throws error if not authenticated.
 *
 * @returns Current user object
 * @throws Error if user is not authenticated
 *
 * @example
 * ```ts
 * export async function protectedAction() {
 *   const user = await requireAuth();
 *   // user is guaranteed to exist
 * }
 * ```
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: Authentication required");
  }
  return user;
}

/**
 * Verifies user is authenticated and owns the specified resource.
 * Throws error if not authenticated or not the owner.
 *
 * @param resourceUserId - The userId that owns the resource
 * @param action - Description of the action being performed (for logging)
 * @returns Current user object
 * @throws Error if not authenticated or not owner
 *
 * @example
 * ```ts
 * export async function deleteActivityAction(id: string) {
 *   const user = await requireOwnership(activity.userId, "delete_activity");
 *   // user is guaranteed to be the owner
 * }
 * ```
 */
export async function requireOwnership(
  resourceUserId: string,
  action: string
) {
  const user = await requireAuth();

  if (user.id !== resourceUserId) {
    logError(`Unauthorized ownership attempt: ${action}`, new Error(), {
      userId: user.id,
      resourceUserId,
      action,
    });
    throw new Error("Forbidden: You do not have permission to access this resource");
  }

  return user;
}

/**
 * Verifies user is authenticated and has admin privileges.
 * Throws error if not authenticated or not admin.
 *
 * @returns Current user object
 * @throws Error if not authenticated or not admin
 *
 * @example
 * ```ts
 * export async function updateFactorsAction(key: string, value: number) {
 *   const user = await requireAdmin();
 *   // user is guaranteed to be admin
 * }
 * ```
 */
export async function requireAdmin() {
  const user = await requireAuth();

  // Check if user has admin flag (you may need to adjust based on your User model)
  const profile = db.getProfile(user.id);
  if (!profile || !("isAdmin" in profile) || !profile.isAdmin) {
    logError("Unauthorized admin attempt", new Error(), {
      userId: user.id,
    });
    throw new Error("Forbidden: Admin privileges required");
  }

  return user;
}

/**
 * Wraps an async action with authentication and error logging.
 * Returns null if not authenticated, throws on validation errors.
 *
 * @param asyncFn - The async function to execute
 * @returns Result of asyncFn or null if not authenticated
 *
 * @example
 * ```ts
 * export async function getDashboardData() {
 *   return withAuth(async (user) => {
 *     return {
 *       profile: db.getProfile(user.id),
 *       logs: db.getActivityLogs(user.id),
 *     };
 *   });
 * }
 * ```
 */
export async function withAuth<T>(
  asyncFn: (user: Awaited<ReturnType<typeof getCurrentUser>>) => Promise<T>
): Promise<T | null> {
  try {
    const user = await requireAuth();
    return await asyncFn(user);
  } catch (error) {
    if ((error as Error).message.includes("Unauthorized")) {
      return null;
    }
    throw error;
  }
}

/**
 * Rate limiting helper to prevent abuse.
 * Stores attempt timestamps in memory (implement Redis for production).
 */
const rateLimitStore = new Map<string, number[]>();

/**
 * Check if action exceeds rate limit for a user.
 *
 * @param userId - User ID to rate limit
 * @param action - Action identifier (e.g., "delete_activity")
 * @param limit - Max attempts allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if within limit, false if exceeded
 *
 * @example
 * ```ts
 * if (!checkRateLimit(userId, "delete_activity", 10, 60000)) {
 *   throw new Error("Too many delete attempts. Please try again later.");
 * }
 * ```
 */
export function checkRateLimit(
  userId: string,
  action: string,
  limit: number = 10,
  windowMs: number = 60000
): boolean {
  const key = `${userId}:${action}`;
  const now = Date.now();
  const attempts = rateLimitStore.get(key) || [];

  // Remove old attempts outside the window
  const recentAttempts = attempts.filter((timestamp) => now - timestamp < windowMs);

  if (recentAttempts.length >= limit) {
    return false;
  }

  // Record new attempt
  recentAttempts.push(now);
  rateLimitStore.set(key, recentAttempts);

  // Cleanup old entries (prevent memory leak)
  if (recentAttempts.length === 0) {
    rateLimitStore.delete(key);
  }

  return true;
}
