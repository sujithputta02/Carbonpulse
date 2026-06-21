import React, { useMemo } from "react";
import { Award, TrendingUp, Leaf, Zap, Car } from "lucide-react";
import { calculateImpactMetrics, getTopImpactStat } from "@/lib/carbon/impactMetrics";

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
  // Calculate impact metrics once
  const impactMetrics = useMemo(() => {
    return calculateImpactMetrics(Math.max(0, baselineFootprint - totalTrackedMonth));
  }, [baselineFootprint, totalTrackedMonth]);

  const topImpactStatement = useMemo(() => {
    return getTopImpactStat(Math.max(0, baselineFootprint - totalTrackedMonth));
  }, [baselineFootprint, totalTrackedMonth]);

  return (
    <div className="space-y-6">
      {/* Primary Summary Cards */}
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

      {/* Environmental Impact Metrics - Featured Card */}
      <div className="glass-panel rounded-3xl p-8 border-white/5 text-left space-y-6">
        <div>
          <h3 className="font-display font-bold text-xl text-white mb-2">
            🌍 Your Environmental Impact This Month
          </h3>
          <p className="text-emerald-400 font-semibold text-lg">
            {topImpactStatement}
          </p>
        </div>

        {/* Impact Breakdown Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Trees Equivalent */}
          <div className="flex items-start space-x-3 bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/20">
            <Leaf className="h-5 w-5 text-emerald-400 mt-1 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Trees Planted</p>
              <p className="text-2xl font-bold text-white">
                {impactMetrics.trees}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                {impactMetrics.trees === 1 ? 'tree' : 'trees'} sequester CO₂
              </p>
            </div>
          </div>

          {/* Vehicle Emissions Avoided */}
          <div className="flex items-start space-x-3 bg-cyan-500/10 rounded-lg p-4 border border-cyan-500/20">
            <Car className="h-5 w-5 text-cyan-400 mt-1 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Driving Avoided</p>
              <p className="text-2xl font-bold text-white">
                {impactMetrics.carKm}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">km petrol car</p>
            </div>
          </div>

          {/* Energy Savings */}
          <div className="flex items-start space-x-3 bg-amber-500/10 rounded-lg p-4 border border-amber-500/20">
            <Zap className="h-5 w-5 text-amber-400 mt-1 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Energy Saved</p>
              <p className="text-2xl font-bold text-white">
                {impactMetrics.electricity}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">kWh electricity</p>
            </div>
          </div>

          {/* Household Days */}
          <div className="flex items-start space-x-3 bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
            <Award className="h-5 w-5 text-purple-400 mt-1 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Household Days</p>
              <p className="text-2xl font-bold text-white">
                {impactMetrics.householdDays}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">daily emissions</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 pt-4 border-t border-white/5">
          💡 <strong>Did you know?</strong> These conversions help visualize your carbon impact. 
          Each {impactMetrics.trees > 0 ? 'tree planted' : 'kg of CO₂e reduced'} makes a real difference!
        </p>
      </div>
    </div>
  );
}
