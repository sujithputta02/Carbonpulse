"use client";

import React, { useMemo } from "react";
import { Flame, Bell, Calendar, Check } from "lucide-react";
import { ActivityLog } from "@/types/activity";

interface StreakAndNudgesProps {
  logs: ActivityLog[];
  lastLogDate?: string;
}

export default function StreakAndNudges({ logs, lastLogDate }: StreakAndNudgesProps) {
  const streakInfo = useMemo(() => {
    if (!logs || logs.length === 0) {
      return { streak: 0, nextMilestone: 7, message: "Start your first log today" };
    }

    // Sort logs by date descending
    const sortedLogs = [...logs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Get unique days
    const uniqueDays = new Set<string>();
    sortedLogs.forEach((log) => {
      const date = new Date(log.date).toISOString().split("T")[0];
      uniqueDays.add(date);
    });

    // Calculate streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from today and go back
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];

      if (uniqueDays.has(dateStr)) {
        streak++;
      } else if (i > 0) {
        // Stop counting if there's a gap (but allow today if not logged yet)
        break;
      }
    }

    // Determine next milestone
    let nextMilestone = 7;
    if (streak >= 7) nextMilestone = 14;
    if (streak >= 14) nextMilestone = 30;
    if (streak >= 30) nextMilestone = 100;

    // Motivational message
    let message = "";
    if (streak === 0) {
      message = "Start your first log today";
    } else if (streak === 1) {
      message = "You're on it! Keep it going";
    } else if (streak === 7) {
      message = "🎉 One week in! You're forming a habit";
    } else if (streak === 14) {
      message = "🔥 Two weeks strong! Habits are setting";
    } else if (streak === 30) {
      message = "⭐ One month! You're committed to change";
    } else if (streak === 100) {
      message = "👑 100-day streak! You're a carbon champion";
    } else if (streak % 10 === 0) {
      message = `🎯 ${streak}-day streak! Amazing consistency`;
    } else {
      message = `Keep your ${streak}-day streak alive`;
    }

    return { streak, nextMilestone, message };
  }, [logs]);

  // Calculate nudge urgency
  const lastLoggedDaysAgo = useMemo(() => {
    if (!logs || logs.length === 0) return 0;

    const sortedLogs = [...logs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const lastDate = new Date(sortedLogs[0].date);
    const today = new Date();
    const diffMs = today.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return diffDays;
  }, [logs]);

  const showUrgentNudge = lastLoggedDaysAgo > 1;
  const progressToNextMilestone = Math.round(
    (streakInfo.streak / streakInfo.nextMilestone) * 100
  );

  return (
    <div className="space-y-4">
      {/* Streak card */}
      <div className="glass-panel rounded-2xl border border-white/10 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Current Streak</p>
            <div className="flex items-baseline gap-2">
              <h2 className="font-display font-bold text-4xl text-white">{streakInfo.streak}</h2>
              <span className="text-xl text-gray-400">days</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <Flame className="h-8 w-8 text-orange-400" />
          </div>
        </div>

        {/* Motivational message */}
        <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg p-3 mb-4 border border-orange-500/20">
          <p className="text-sm font-semibold text-orange-300">{streakInfo.message}</p>
        </div>

        {/* Next milestone */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">Goal: {streakInfo.nextMilestone}-day streak</p>
            <p className="text-xs font-semibold text-gray-300">
              {streakInfo.nextMilestone - streakInfo.streak} days to go
            </p>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all"
              style={{ width: `${progressToNextMilestone}%` }}
            />
          </div>
        </div>
      </div>

      {/* Urgent nudge - if streak is at risk */}
      {showUrgentNudge && (
        <div className="glass-panel rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/20 shrink-0">
              <Bell className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-300 text-sm mb-1">Keep your streak alive!</h3>
              <p className="text-xs text-yellow-200/80 mb-3">
                Your {streakInfo.streak}-day streak is at risk. Log something today to keep it going.
              </p>
              <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/30 transition-colors text-xs font-semibold text-yellow-300">
                <Check className="h-3 w-3" />
                Log now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weekly check-in prompt */}
      <div className="glass-panel rounded-2xl border border-white/10 p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 shrink-0">
            <Calendar className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white text-sm mb-1">Weekly Check-in</h3>
            <p className="text-xs text-gray-300 mb-3">
              Take 2 minutes to see your progress this week and get personalized recommendations.
            </p>
            <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/30 transition-colors text-xs font-semibold text-cyan-300">
              <Check className="h-3 w-3" />
              View this week
            </button>
          </div>
        </div>
      </div>

      {/* Habit formation insight */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-2xl p-4 border border-emerald-500/20">
        <p className="text-xs text-gray-300">
          💡 <span className="font-semibold text-emerald-300">Habit formation:</span> Most people need 30-60 days of consistent tracking
          to internalize the habit. You're on your way!
        </p>
      </div>
    </div>
  );
}
