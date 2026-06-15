import React from "react";
import { Check, Info } from "lucide-react";

interface GoalsStepProps {
  goals: string[];
  handleGoalToggle: (goal: string) => void;
}

export default function GoalsStep({ goals, handleGoalToggle }: GoalsStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-left">
        <h2 className="font-display font-extrabold text-2xl text-white">Select Your Goals</h2>
        <p className="text-sm text-gray-400">Almost finished! Choose what matters most to adjust recommendation prioritization.</p>
      </div>

      <div className="space-y-4 text-left">
        {[
          { key: "SAVE_MONEY", label: "Save Money", desc: "Prioritize low-cost and utility bill reductions." },
          { key: "REDUCE_EMISSIONS", label: "Maximize Carbon Reductions", desc: "Prioritize high-impact changes regardless of effort." },
          { key: "BUILD_HABITS", label: "Build Sustainable Habits", desc: "Focus on simple, repeatable micro-actions first." },
        ].map((goal) => {
          const checked = goals.includes(goal.key);
          return (
            <button
              key={goal.key}
              type="button"
              onClick={() => handleGoalToggle(goal.key)}
              className={`w-full p-4 rounded-xl border text-left flex items-center justify-between gap-4 transition-all cursor-pointer ${
                checked
                  ? "bg-emerald-500/10 border-emerald-500"
                  : "bg-white/5 border-white/5 hover:bg-white/10"
              }`}
            >
              <div className="space-y-1">
                <span className="font-semibold text-white text-sm block">{goal.label}</span>
                <span className="text-xs text-gray-400 block">{goal.desc}</span>
              </div>
              <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                checked ? "bg-emerald-500 border-emerald-500 text-[#090d16]" : "border-white/20"
              }`}>
                {checked && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-start space-x-3 text-xs text-gray-400 leading-normal text-left">
        <Info className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
        <p>
          By clicking Complete, CarbonPulse will calculate your baseline emissions, establish your tracking logs, and customize your recommendations. You can reset this configuration at any time.
        </p>
      </div>
    </div>
  );
}
