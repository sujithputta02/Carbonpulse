/**
 * Activity logging service layer.
 * Centralized business logic for activity operations with validation.
 */

import { db } from "@/utils/db";
import { ActivityLog } from "@/types/activity";
import { logActivitySchema } from "@/lib/validation/onboardingSchema";
import { calculateActivityCO2e } from "@/lib/carbon/calculateFootprint";
import { z } from "zod";

/**
 * Logs a new activity for a user.
 *
 * @param userId - The user's ID
 * @param input - Activity data
 * @returns The created activity log
 * @throws Error if validation fails
 *
 * @example
 * ```ts
 * const log = await logUserActivity(userId, {
 *   category: "TRANSPORT",
 *   actionType: "EV",
 *   amount: 25
 * });
 * ```
 */
export async function logUserActivity(
  userId: string,
  input: z.infer<typeof logActivitySchema>
): Promise<ActivityLog> {
  // Validate input
  const validated = logActivitySchema.parse(input);

  // Get emission factors for calculation
  const factors = db.getFactors();

  // Calculate CO2e emissions
  const estimatedCO2e = calculateActivityCO2e(
    validated.category,
    validated.actionType,
    validated.amount,
    factors
  );

  // Create activity log with metadata
  const newLog: ActivityLog = {
    id: crypto.randomUUID(),
    userId,
    category: validated.category,
    actionType: validated.actionType,
    amount: validated.amount,
    estimatedCO2e,
    date: new Date().toISOString(),
  };

  // Save to database
  return db.addActivityLog(userId, newLog);
}

/**
 * Gets all activity logs for a user.
 *
 * @param userId - The user's ID
 * @returns Array of user's activity logs
 *
 * @example
 * ```ts
 * const logs = await getUserActivityLogs(userId);
 * ```
 */
export async function getUserActivityLogs(userId: string): Promise<ActivityLog[]> {
  return db.getActivityLogs(userId);
}

/**
 * Gets a specific activity by ID with ownership validation.
 *
 * @param activityId - The activity's ID
 * @param userId - The requesting user's ID
 * @returns The activity if found and owned by user
 * @throws Error if activity not found or not owned
 *
 * @example
 * ```ts
 * const activity = await getActivityById(activityId, userId);
 * ```
 */
export async function getActivityById(
  activityId: string,
  userId: string
): Promise<ActivityLog> {
  const logs = db.getActivityLogs(userId);
  const activity = logs.find((log) => log.id === activityId);

  if (!activity) {
    throw new Error("Activity not found");
  }

  return activity;
}

/**
 * Deletes an activity log permanently.
 *
 * @param activityId - The activity's ID
 * @param userId - The requesting user's ID
 * @returns true if deleted, false if activity not found
 * @throws Error if not owned
 *
 * @example
 * ```ts
 * const deleted = await deleteUserActivity(activityId, userId);
 * ```
 */
export async function deleteUserActivity(
  activityId: string,
  userId: string
): Promise<boolean> {
  // Verify ownership first
  await getActivityById(activityId, userId);

  // Delete from database
  return db.deleteActivityLog?.(activityId) ?? false;
}

/**
 * Gets activities filtered by date range.
 *
 * @param userId - The user's ID
 * @param startDate - Start of date range (inclusive)
 * @param endDate - End of date range (inclusive)
 * @returns Filtered activities
 *
 * @example
 * ```ts
 * const thisMonth = await getActivitiesByDateRange(
 *   userId,
 *   new Date(2026, 5, 1),
 *   new Date(2026, 5, 30)
 * );
 * ```
 */
export async function getActivitiesByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<ActivityLog[]> {
  const logs = db.getActivityLogs(userId);

  return logs.filter((log) => {
    const logDate = new Date(log.date);
    return logDate >= startDate && logDate <= endDate;
  });
}

/**
 * Gets activities grouped by category.
 *
 * @param userId - The user's ID
 * @returns Map of categories to activities
 *
 * @example
 * ```ts
 * const grouped = await getActivitiesByCategory(userId);
 * const transport = grouped.get("TRANSPORT");
 * ```
 */
export async function getActivitiesByCategory(
  userId: string
): Promise<Map<string, ActivityLog[]>> {
  const logs = db.getActivityLogs(userId);
  const grouped = new Map<string, ActivityLog[]>();

  for (const log of logs) {
    if (!grouped.has(log.category)) {
      grouped.set(log.category, []);
    }
    grouped.get(log.category)!.push(log);
  }

  return grouped;
}

/**
 * Calculates total emissions for user's activities.
 *
 * @param userId - The user's ID
 * @returns Total CO2e emissions in kg
 *
 * @example
 * ```ts
 * const total = await getTotalEmissions(userId);
 * console.log(`Total: ${total} kg CO2e`);
 * ```
 */
export async function getTotalEmissions(userId: string): Promise<number> {
  const logs = db.getActivityLogs(userId);
  return logs.reduce((sum, log) => sum + log.estimatedCO2e, 0);
}

/**
 * Calculates total emissions by category.
 *
 * @param userId - The user's ID
 * @returns Map of categories to total emissions
 *
 * @example
 * ```ts
 * const byCategory = await getTotalEmissionsByCategory(userId);
 * const transport = byCategory.get("TRANSPORT");
 * ```
 */
export async function getTotalEmissionsByCategory(
  userId: string
): Promise<Map<string, number>> {
  const grouped = await getActivitiesByCategory(userId);
  const totals = new Map<string, number>();

  for (const [category, logs] of grouped) {
    const total = logs.reduce((sum, log) => sum + log.estimatedCO2e, 0);
    totals.set(category, total);
  }

  return totals;
}

/**
 * Gets activity statistics for a user.
 *
 * @param userId - The user's ID
 * @returns Activity statistics
 *
 * @example
 * ```ts
 * const stats = await getActivityStats(userId);
 * console.log(`Activities logged: ${stats.totalActivities}`);
 * ```
 */
export async function getActivityStats(userId: string) {
  const logs = db.getActivityLogs(userId);
  const emissions = await getTotalEmissions(userId);
  const byCategory = await getTotalEmissionsByCategory(userId);

  const averageEmissionsPerActivity =
    logs.length > 0 ? emissions / logs.length : 0;

  return {
    totalActivities: logs.length,
    totalEmissionsCO2e: emissions,
    averageEmissionsPerActivity,
    emissionsByCategory: Object.fromEntries(byCategory),
    lastActivityDate: logs[0]?.date ?? null,
    firstActivityDate: logs[logs.length - 1]?.date ?? null,
  };
}
