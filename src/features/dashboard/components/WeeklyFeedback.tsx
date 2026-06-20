"use client";

import React, { useMemo } from "react";
import { TrendingDown, TrendingUp, Zap, Calendar } from "lucide-react";
import { ActivityLog } from "@/types/activity";

interface WeeklyFeedbackProps {
  logs: ActivityLog[];
  baseline: number;
  topCategory: string;
  weekStartDate?: Date;
}

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    TRANSPORT: "Transportation",
    FOOD: "Food & Diet",
    ENERGY: "Home Energy",
    SHOPPING: "Shopping & Goods",
  };
  return labels[category] || category;
};

export default function WeeklyFeedback({
  logs,
  baseline,
  topCategory,
  weekStartDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
}: WeeklyFeedbackProps) {
  const weekAnalysis = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Current week emissions
    const currentWeekLogs = logs.filter((log) => new Date(log.date) >= weekAgo);
    const currentWeekTotal = currentWeekLogs.reduce((sum, log) => sum + log.amount, 0);

    // Previous week emissions (for comparison)
    const previousWeekLogs = logs.filter(
      (log) => new Date(log.date) >= twoWeeksAgo && new Date(log.date) < weekAgo
    );
    const previousWeekTotal = previousWeekLogs.reduce((sum, log) => sum + log.amount, 0);

    // Calculate change
    const change = previousWeekTotal - currentWeekTotal;
    const changePercent =
      previousWeekTotal > 0 ? Math.round((change / previousWeekTotal) * 100) : 0;
    const direction = change > 0 ? "down" : change < 0 ? "up" : "flat";

    // Top driver in current week
    const categoryBreakdown: Record<string, number> = {};
    currentWeekLogs.forEach((log) => {
      const category = log.category || "SHOPPING";
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + log.amount;
    });

    let topDriver = topCategory;
    let maxValue = 0;
    Object.entries(categoryBreakdown).forEach(([cat, value]) => {
      if (value > maxValue) {
        maxValue = value;
        topDriver = cat;
      }
    });

    // Days active this week
    const uniqueDays = new Set(currentWeekLogs.map((log) => log.date)).size;

    // Estimated savings (if positive change)
    const estimatedSavings = Math.max(0, change);

    return {
      currentWeekTotal,
      previousWeekTotal,
      change,
      changePercent,
      direction,
      topDriver,
      topDriverAmount: categoryBreakdown[topDriver] || 0,
      daysActive: uniqueDays,
      estimatedSavings,
      hasData: currentWeekLogs.length > 0,
    };
  }, [logs, topCategory]);

  if (!weekAnalysis.hasData) {
    return (
      <div className="glass-panel rounded-2xl border border-white/10 p-6 text-center">
        <div className="h-12 w-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
          <Calendar className="h-6 w-6 text-emerald-400" />
        </div>
        <h3 className="font-semibold text-white mb-1">No tracking data yet</h3>
        <p className="text-sm text-gray-400">
          Start logging activities to see your weekly progress and insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main weekly result card */}
      <div className="glass-panel rounded-2xl border border-white/10 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm text-gray-400 mb-1">This Week's Progress</p>
            <h2 className="font-display font-bold text-3xl text-white">
              {weekAnalysis.currentWeekTotal.toFixed(1)} kg
            </h2>
            <p className="text-xs text-gray-500 mt-1">CO₂e emitted</p>
          </div>
          <div className={`p-3 rounded-xl border ${
            weekAnalysis.direction === "down"
              ? "bg-emerald-500/10 border-emerald-500/20"
              : weekAnalysis.direction === "up"
              ? "bg-red-500/10 border-red-500/20"
              : "bg-gray-500/10 border-gray-500/20"
          }`}>
            {weekAnalysis.direction === "down" && (
              <TrendingDown className="h-6 w-6 text-emerald-400" />
            )}
            {weekAnalysis.direction === "up" && (
              <TrendingUp className="h-6 w-6 text-red-400" />
            )}
            {weekAnalysis.direction === "flat" && (
              <Zap className="h-6 w-6 text-gray-400" />
            )}
          </div>
        </div>

        {/* Comparison with last week */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">vs. last week</p>
              <p className="text-sm font-semibold text-white">
                {weekAnalysis.previousWeekTotal.toFixed(1)} kg CO₂e
              </p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-display font-bold ${
                weekAnalysis.direction === "down"
                  ? "text-emerald-400"
                  : weekAnalysis.direction === "up"
                  ? "text-red-400"
                  : "text-gray-400"
              }`}>
                {weekAnalysis.direction === "down" && "−"}
                {weekAnalysis.direction === "up" && "+"}
                {Math.abs(weekAnalysis.change).toFixed(1)} kg
              </p>
              <p className={`text-xs font-semibold ${
                weekAnalysis.direction === "down"
                  ? "text-emerald-400"
                  : weekAnalysis.direction === "up"
                  ? "text-red-400"
                  : "text-gray-400"
              }`}>
                {weekAnalysis.changePercent > 0 ? "↓" : weekAnalysis.changePercent < 0 ? "↑" : "→"}
                {Math.abs(weekAnalysis.changePercent)}%
              </p>
            </div>
          </div>
        </div>

        {/* Motivational message */}
        {weekAnalysis.direction === "down" && (
          <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
            <p className="text-sm text-emerald-300">
              ✓ <span className="font-semibold">Great progress!</span> You reduced your emissions this week. Keep it up!
            </p>
          </div>
        )}
        {weekAnalysis.direction === "up" && (
          <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
            <p className="text-sm text-yellow-300">
              → Your emissions increased this week. Focus on your biggest driver ({getCategoryLabel(weekAnalysis.topDriver)}) to turn it around.
            </p>
          </div>
        )}
        {weekAnalysis.direction === "flat" && (
          <div className="bg-gray-500/10 rounded-lg p-3 border border-gray-500/20">
            <p className="text-sm text-gray-300">
              Your emissions stayed steady. Small changes compound—pick one action this week.
            </p>
          </div>
        )}
      </div>

      {/* Activity insights */}
      <div className="grid grid-cols-2 gap-3">
        {/* Days logged */}
        <div className="glass-panel rounded-2xl border border-white/10 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Days Logged</p>
          <p className="font-display font-bold text-2xl text-white">{weekAnalysis.daysActive}</p>
          <p className="text-[10px] text-gray-500 mt-1">out of 7 days</p>
        </div>

        {/* Top driver */}
        <div className="glass-panel rounded-2xl border border-white/10 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Biggest Driver</p>
          <p className="font-semibold text-white text-sm">{getCategoryLabel(weekAnalysis.topDriver)}</p>
          <p className="text-[10px] text-gray-500 mt-1">{weekAnalysis.topDriverAmount.toFixed(1)} kg this week</p>
        </div>
      </div>

      {/* Call to action */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-2xl p-4 border border-emerald-500/20">
        <p className="text-sm text-gray-300">
          💡 <span className="font-semibold text-emerald-300">Next step:</span> Focus on reducing your biggest driver. Small changes there
          have the biggest impact.
        </p>
      </div>
    </div>
  );
}
