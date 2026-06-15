import React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Goal } from "@/types/activity";

interface GoalsChecklistProps {
  goals: Goal[];
  handleToggleGoal: (id: string, currentStatus: boolean) => void;
  actionLoading: string | null;
}

export default function GoalsChecklist({
  goals,
  handleToggleGoal,
  actionLoading,
}: GoalsChecklistProps) {
  const completedCount = goals.filter((g) => g.isCompleted).length;

  return (
    <div className="glass-panel rounded-3xl p-6 border-white/5 flex flex-col space-y-4 h-full">
      <div className="flex justify-between items-center text-left">
        <h3 className="font-display font-bold text-lg text-white">Active Goals</h3>
        <span className="text-xs text-gray-400 font-semibold">
          {completedCount}/{goals.length} Done
        </span>
      </div>

      {goals.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500">
          <CheckCircle2 className="h-8 w-8 text-gray-600 mb-2" />
          <p className="text-sm">No active goals pinned. Select suggestions from the insights tab to build habits.</p>
        </div>
      ) : (
        <div className="flex flex-col space-y-3 overflow-y-auto max-h-[320px]">
          {goals.map((goal) => {
            const isToggling = actionLoading === `goal_${goal.id}`;
            return (
              <div
                key={goal.id}
                onClick={() => !isToggling && handleToggleGoal(goal.id, goal.isCompleted)}
                className={`p-4 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition-all hover:bg-white/5 ${
                  goal.isCompleted
                    ? "bg-emerald-500/5 border-emerald-500/30 text-gray-400"
                    : "bg-slate-900 border-white/5 text-white"
                }`}
              >
                <div className="space-y-1 text-left">
                  <span className={`text-sm font-semibold block ${goal.isCompleted ? "line-through text-gray-500" : ""}`}>
                    {goal.title}
                  </span>
                  <span className="text-[10px] text-gray-500 block">
                    Target monthly savings: {goal.targetCO2e} kg CO₂e
                  </span>
                </div>

                <div className="shrink-0">
                  {isToggling ? (
                    <Loader2 className="animate-spin h-5 w-5 text-emerald-400" />
                  ) : goal.isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 fill-emerald-500/10" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border border-white/20 hover:border-emerald-500 transition-colors"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
