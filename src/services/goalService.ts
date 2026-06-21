/**
 * Goal management service layer.
 * Centralized business logic for goal operations with validation and error handling.
 */

import { db } from "@/utils/db";
import { Goal } from "@/types/activity";
import { z } from "zod";

/**
 * Schema for creating a new goal
 */
export const createGoalSchema = z.object({
  title: z.string().min(3).max(100),
  category: z.enum(["TRANSPORT", "FOOD", "ENERGY", "SHOPPING"]),
  targetCO2e: z.number().positive("Target must be greater than 0"),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;

/**
 * Creates a new goal for a user.
 *
 * @param userId - The user's ID
 * @param input - Goal creation data
 * @returns The created goal
 * @throws Error if validation fails
 *
 * @example
 * ```ts
 * const goal = await createGoal(userId, {
 *   title: "Reduce meat consumption",
 *   category: "FOOD",
 *   targetCO2e: 5
 * });
 * ```
 */
export async function createGoal(
  userId: string,
  input: CreateGoalInput
): Promise<Goal> {
  // Validate input
  const validated = createGoalSchema.parse(input);

  // Create goal with metadata
  const newGoal: Goal = {
    id: crypto.randomUUID(),
    userId,
    title: validated.title,
    category: validated.category,
    targetCO2e: validated.targetCO2e,
    isCompleted: false,
    streakCount: 0,
    createdAt: new Date().toISOString(),
  };

  // Save to database
  return db.addGoal(newGoal);
}

/**
 * Gets all goals for a user.
 *
 * @param userId - The user's ID
 * @returns Array of user's goals
 *
 * @example
 * ```ts
 * const goals = await getUserGoals(userId);
 * const active = goals.filter(g => !g.isCompleted);
 * ```
 */
export async function getUserGoals(userId: string): Promise<Goal[]> {
  return db.getGoals(userId);
}

/**
 * Gets a specific goal by ID with ownership validation.
 *
 * @param goalId - The goal's ID
 * @param userId - The requesting user's ID
 * @returns The goal if found and owned by user
 * @throws Error if goal not found or not owned
 *
 * @example
 * ```ts
 * const goal = await getGoalById(goalId, userId);
 * ```
 */
export async function getGoalById(
  goalId: string,
  userId: string
): Promise<Goal> {
  const goal = db.getGoalById?.(goalId);

  if (!goal) {
    throw new Error("Goal not found");
  }

  if (goal.userId !== userId) {
    throw new Error("Forbidden: You do not have permission to access this goal");
  }

  return goal;
}

/**
 * Toggles a goal's completion status.
 *
 * @param goalId - The goal's ID
 * @param userId - The requesting user's ID
 * @param isCompleted - New completion status
 * @returns Updated goal
 * @throws Error if goal not found or not owned
 *
 * @example
 * ```ts
 * const updated = await toggleGoalCompletion(goalId, userId, true);
 * ```
 */
export async function toggleGoalCompletion(
  goalId: string,
  userId: string,
  isCompleted: boolean
): Promise<Goal> {
  // Verify ownership
  const goal = await getGoalById(goalId, userId);

  // Update completion status
  const updated = db.updateGoal(goalId, { isCompleted });

  if (!updated) {
    throw new Error("Failed to update goal");
  }

  return updated;
}

/**
 * Deletes a goal permanently.
 *
 * @param goalId - The goal's ID
 * @param userId - The requesting user's ID
 * @returns true if deleted, false if goal not found
 * @throws Error if not owned
 *
 * @example
 * ```ts
 * const deleted = await deleteGoal(goalId, userId);
 * ```
 */
export async function deleteGoal(
  goalId: string,
  userId: string
): Promise<boolean> {
  // Verify ownership first
  await getGoalById(goalId, userId);

  // Delete from database
  return db.deleteGoal?.(goalId) ?? false;
}

/**
 * Gets goals grouped by category.
 *
 * @param userId - The user's ID
 * @returns Map of categories to goals
 *
 * @example
 * ```ts
 * const grouped = await getGoalsByCategory(userId);
 * const transportGoals = grouped.get("TRANSPORT");
 * ```
 */
export async function getGoalsByCategory(
  userId: string
): Promise<Map<string, Goal[]>> {
  const goals = await getUserGoals(userId);
  const grouped = new Map<string, Goal[]>();

  for (const goal of goals) {
    if (!grouped.has(goal.category)) {
      grouped.set(goal.category, []);
    }
    grouped.get(goal.category)!.push(goal);
  }

  return grouped;
}

/**
 * Gets statistics about a user's goals.
 *
 * @param userId - The user's ID
 * @returns Goal statistics
 *
 * @example
 * ```ts
 * const stats = await getGoalStats(userId);
 * console.log(`${stats.completedCount} goals completed`);
 * ```
 */
export async function getGoalStats(userId: string) {
  const goals = await getUserGoals(userId);

  const completed = goals.filter((g) => g.isCompleted);
  const active = goals.filter((g) => !g.isCompleted);
  const totalTargetSavings = goals.reduce((sum, g) => sum + g.targetCO2e, 0);
  const completedSavings = completed.reduce((sum, g) => sum + g.targetCO2e, 0);

  return {
    totalGoals: goals.length,
    completedCount: completed.length,
    activeCount: active.length,
    completionRate:
      goals.length > 0 ? Math.round((completed.length / goals.length) * 100) : 0,
    totalTargetSavingsCO2e: totalTargetSavings,
    completedSavingsCO2e: completedSavings,
    remainingSavingsCO2e: totalTargetSavings - completedSavings,
  };
}
