import React from "react";
import { Award, TrendingUp, Calendar } from "lucide-react";

interface SummaryGridProps {
  baselineFootprint: number;
  totalTrackedMonth: number;
  activeGoalsCount: number;
  completedGoalsCount: number;
  streakCount: number;
}

export default function SummaryGrid({
  baselineFootprint,
  totalTrackedMonth,
  activeGoalsCount,
  completedGoalsCount,
  streakCount,
}: SummaryGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Baseline Footprint Card */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col space-y-2 border-white/5 relative overflow-hidden text-left">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Baseline Footprint</span>
        <span className="font-display font-extrabold text-2xl sm:text-3xl text-white">
          {Math.round(baselineFootprint)}
          <span className="text-xs font-normal text-gray-500 ml-1">kg CO₂e/mo</span>
        </span>
        <p className="text-[10px] text-gray-400">Calculated from onboarding profile</p>
      </div>

      {/* Tracked This Month Card */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col space-y-2 border-white/5 relative overflow-hidden text-left">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Tracked This Month</span>
        <span 
          aria-live="polite" 
          aria-atomic="true"
          className="font-display font-extrabold text-2xl sm:text-3xl text-white"
        >
          {Math.round(totalTrackedMonth)}
          <span className="text-xs font-normal text-gray-500 ml-1">kg CO₂e</span>
        </span>
        <p className="text-[10px] text-emerald-400 font-semibold flex items-center space-x-1">
          <TrendingUp className="h-3 w-3 mr-0.5" aria-hidden="true" />
          <span>Active tracking is live</span>
        </p>
      </div>

      {/* Goals Progress Card */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col space-y-2 border-white/5 text-left">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Active Goals</span>
        <span 
          aria-live="polite" 
          aria-atomic="true"
          className="font-display font-extrabold text-2xl sm:text-3xl text-white"
        >
          {activeGoalsCount}
          <span className="text-xs font-normal text-gray-500 ml-1">pending</span>
        </span>
        <p className="text-[10px] text-gray-400">
          {completedGoalsCount} goals completed so far
        </p>
      </div>

      {/* Streaks Card */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col space-y-2 border-white/5 relative overflow-hidden text-left">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Logging Streak</span>
        <span 
          aria-live="polite" 
          aria-atomic="true"
          className="font-display font-extrabold text-2xl sm:text-3xl text-white flex items-center space-x-2"
        >
          <Award className="h-6 w-6 text-amber-400 shrink-0" aria-hidden="true" />
          <span>{streakCount} {streakCount === 1 ? 'day' : 'days'}</span>
        </span>
        <p className="text-[10px] text-gray-400">Log presets daily to grow your badge</p>
      </div>
    </div>
  );
}
