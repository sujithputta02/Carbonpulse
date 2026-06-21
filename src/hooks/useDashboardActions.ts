/**
 * Custom hook for managing dashboard action handlers with proper error handling and state management.
 * Extracts business logic from DashboardClient component.
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  deleteActivityAction,
  toggleGoalCompletionAction,
  logActivity,
} from "@/app/actions";
import { ActivityLog, Goal } from "@/types/activity";
import { ScoredTip } from "@/types/recommendation";
import { logError, getErrorMessage } from "@/lib/clientErrors";

interface LogActivityInput {
  category: "TRANSPORT" | "FOOD" | "ENERGY" | "SHOPPING";
  actionType: string;
  amount: number;
}

interface DashboardActionsState {
  actionLoading: string | null;
  error: string | null;
}

/**
 * Handles all dashboard action interactions with comprehensive error handling.
 *
 * @example
 * ```ts
 * const {
 *   actionLoading,
 *   deleteActivity,
 *   toggleGoal,
 *   pinRecommendation,
 *   quickLogActivity
 * } = useDashboardActions(userId);
 *
 * await deleteActivity(activityId);
 * ```
 */
export function useDashboardActions(userId: string) {
  const router = useRouter();
  const [state, setState] = useState<DashboardActionsState>({
    actionLoading: null,
    error: null,
  });

  const deleteActivity = useCallback(
    async (
      id: string,
      onSuccess: (id: string) => void,
      onError?: (error: unknown) => void
    ) => {
      if (!confirm("Are you sure you want to delete this activity entry?"))
        return;

      setState((prev) => ({ ...prev, actionLoading: `delete_${id}` }));
      try {
        const ok = await deleteActivityAction(id);
        if (ok) {
          onSuccess(id);
          router.refresh();
        }
      } catch (error) {
        logError("Failed to delete activity log", error, {
          activityId: id,
          userId,
        });
        setState((prev) => ({
          ...prev,
          error: getErrorMessage(error),
        }));
        onError?.(error);
      } finally {
        setState((prev) => ({ ...prev, actionLoading: null }));
      }
    },
    [userId, router]
  );

  const toggleGoal = useCallback(
    async (
      id: string,
      currentStatus: boolean,
      onSuccess: (updated: Goal) => void,
      onError?: (error: unknown) => void
    ) => {
      setState((prev) => ({ ...prev, actionLoading: `goal_${id}` }));
      try {
        const updated = await toggleGoalCompletionAction(id, !currentStatus);
        if (updated) {
          onSuccess(updated);
          router.refresh();
        }
      } catch (error) {
        logError("Failed to toggle goal completion", error, {
          goalId: id,
          currentStatus,
        });
        setState((prev) => ({
          ...prev,
          error: getErrorMessage(error),
        }));
        onError?.(error);
      } finally {
        setState((prev) => ({ ...prev, actionLoading: null }));
      }
    },
    [userId, router]
  );

  const pinRecommendation = useCallback(
    async (
      tip: ScoredTip,
      onSuccess: (goal: Goal) => void,
      onError?: (error: unknown) => void
    ) => {
      setState((prev) => ({ ...prev, actionLoading: `pin_${tip.id}` }));
      try {
        // Note: createGoalAction should be implemented in server actions
        // This is a placeholder for the business logic
        logError("pinRecommendation not yet implemented", new Error(), { tipId: tip.id });
        onError?.(new Error("Goal creation not yet implemented"));
      } catch (error) {
        logError("Failed to pin recommendation as goal", error, {
          tipId: tip.id,
          userId,
        });
        setState((prev) => ({
          ...prev,
          error: getErrorMessage(error),
        }));
        onError?.(error);
      } finally {
        setState((prev) => ({ ...prev, actionLoading: null }));
      }
    },
    [userId, router]
  );

  const quickLogActivity = useCallback(
    async (
      input: LogActivityInput,
      onSuccess: (log: ActivityLog) => void,
      onError?: (error: unknown) => void
    ) => {
      setState((prev) => ({ ...prev, actionLoading: "quicklog" }));
      try {
        const newLog = await logActivity(input);
        onSuccess(newLog);
        router.refresh();
      } catch (error) {
        logError("Failed to quick-log activity", error, { input });
        setState((prev) => ({
          ...prev,
          error: getErrorMessage(error),
        }));
        onError?.(error);
      } finally {
        setState((prev) => ({ ...prev, actionLoading: null }));
      }
    },
    [router]
  );

  return {
    actionLoading: state.actionLoading,
    error: state.error,
    deleteActivity,
    toggleGoal,
    pinRecommendation,
    quickLogActivity,
    clearError: () => setState((prev) => ({ ...prev, error: null })),
  };
}
