"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteActivityAction, toggleGoalCompletionAction, logActivity } from "@/app/actions";
import { UserProfile } from "@/types/user";
import { ActivityLog, Goal, EmissionFactor } from "@/types/activity";
import { calculateBaseline } from "@/lib/carbon/calculateFootprint";
import { getRecommendedTips } from "@/lib/recommendations/rankActions";
import { ScoredTip } from "@/types/recommendation";
import { logError, getErrorMessage } from "@/lib/clientErrors";

import SummaryGrid from "@/features/dashboard/components/SummaryGrid";
import FootprintCharts from "@/features/dashboard/components/FootprintCharts";
import GoalsChecklist from "@/features/dashboard/components/GoalsChecklist";
import CoachAssistant from "@/features/recommendations/components/CoachAssistant";
import WhyThisMattersCard from "@/features/recommendations/components/WhyThisMattersCard";
import LogHistoryTable from "@/features/tracking/components/LogHistoryTable";
import FootprintExplainer from "@/features/dashboard/components/FootprintExplainer";
import WeeklyFeedback from "@/features/dashboard/components/WeeklyFeedback";
import TransparencyCard from "@/features/dashboard/components/TransparencyCard";
import StreakAndNudges from "@/features/dashboard/components/StreakAndNudges";
import MicroDoseRecommendation from "@/features/recommendations/components/MicroDoseRecommendation";
import PresetLogger from "@/features/tracking/components/PresetLogger";

import { Leaf, Calendar, ArrowRight } from "lucide-react";

interface DashboardClientProps {
  initialProfile: UserProfile | null;
  initialLogs: ActivityLog[];
  initialGoals: Goal[];
  initialFactors: EmissionFactor[];
}

export default function DashboardClient({
  initialProfile,
  initialLogs,
  initialGoals,
  initialFactors,
}: DashboardClientProps) {
  const router = useRouter();
  const [profile] = useState<UserProfile | null>(initialProfile);
  const [logs, setLogs] = useState<ActivityLog[]>(initialLogs);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [factors] = useState<EmissionFactor[]>(initialFactors);
  
  const [mounted, setMounted] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!profile) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-6">
        <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
          <Leaf className="h-8 w-8 text-emerald-400" />
        </div>
        <div className="space-y-2 text-left text-center">
          <h2 className="font-display font-extrabold text-2xl text-white">Setup Your Footprint</h2>
          <p className="text-gray-400 text-sm">
            You haven&apos;t calculated your carbon footprint baseline yet. Get started with our quick 1-minute profile builder.
          </p>
        </div>
        <Link
          href="/onboarding"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-[#090d16] font-display font-bold hover:scale-105 transition-transform"
        >
          Begin Onboarding
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    );
  }

  // Calculate user baseline category splits
  const getProfileBreakdown = () => {
    const commuteDistanceWeekly = profile.commuteType === "NONE" ? 0 : 100;
    const electricityMonthlyKwh = 250;
    const naturalGasMonthlyKwh = 50;
    const shoppingPattern = profile.dietPattern === "HIGH_MEAT" ? ("HEAVY" as const) : ("MODERATE" as const);

    return calculateBaseline({
      commuteType: profile.commuteType,
      commuteDistanceWeekly,
      dietPattern: profile.dietPattern,
      electricityMonthlyKwh,
      naturalGasMonthlyKwh,
      householdSize: profile.householdSize,
      shoppingPattern,
    }, factors);
  };

  const breakdown = getProfileBreakdown();

  // Get recommendations
  const recommendations = getRecommendedTips(profile, breakdown);
  const primaryTip = recommendations[0];

  // Identify highest category
  let highestCategory = "TRANSPORT";
  let maxVal = breakdown.transport;
  if (breakdown.food > maxVal) {
    highestCategory = "FOOD";
    maxVal = breakdown.food;
  }
  if (breakdown.energy > maxVal) {
    highestCategory = "ENERGY";
    maxVal = breakdown.energy;
  }
  if (breakdown.shopping > maxVal) {
    highestCategory = "SHOPPING";
  }

  // Sum tracked emissions in the current month
  const currentMonthLogs = logs.filter((log) => {
    const d = new Date(log.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalTrackedMonth = currentMonthLogs.reduce((sum, log) => sum + log.estimatedCO2e, 0);

  // Compute logging streak
  const getStreak = () => {
    if (logs.length === 0) return 0;
    const dates = logs.map((l) => l.date.split("T")[0]);
    const uniqueDates = Array.from(new Set(dates)).sort().reverse();
    
    let streak = 0;
    let checkDate = new Date();
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const logDateStr = uniqueDates[i];
      const diffTime = Math.abs(checkDate.getTime() - new Date(logDateStr).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 2) {
        streak++;
        checkDate = new Date(logDateStr);
      } else {
        break;
      }
    }
    return streak;
  };

  const streakCount = getStreak();

  // Handle deleting an activity
  const handleDeleteActivity = async (id: string) => {
    if (!confirm("Are you sure you want to delete this activity entry?")) return;
    
    setActionLoading(`delete_${id}`);
    try {
      const ok = await deleteActivityAction(id);
      if (ok) {
        setLogs((prev) => prev.filter((log) => log.id !== id));
      }
    } catch (error) {
      logError("Failed to delete activity log", error, { activityId: id, userId: profile.id });
      alert(getErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  // Handle toggling goal completion
  const handleToggleGoal = async (id: string, currentStatus: boolean) => {
    setActionLoading(`goal_${id}`);
    try {
      const updated = await toggleGoalCompletionAction(id, !currentStatus);
      if (updated) {
        setGoals((prev) =>
          prev.map((g) => (g.id === id ? { ...g, isCompleted: updated.isCompleted } : g))
        );
      }
    } catch (error) {
      logError("Failed to toggle goal completion", error, { goalId: id, currentStatus });
      alert(getErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  // Pin recommendation as a goal
  const handlePinRecommendation = async (tip: ScoredTip) => {
    setActionLoading(`pin_${tip.id}`);
    try {
      const newGoal: Goal = {
        id: crypto.randomUUID(),
        userId: profile.id,
        title: tip.title,
        category: tip.category,
        targetCO2e: tip.potentialSavingsCO2e,
        isCompleted: false,
        streakCount: 0,
        createdAt: new Date().toISOString(),
      };
      
      const stored = localStorage.getItem("carbonpulse_db");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.goals.push(newGoal);
        localStorage.setItem("carbonpulse_db", JSON.stringify(parsed));
      }
      
      setGoals((prev) => [...prev, newGoal]);
      router.refresh();
    } catch (error) {
      logError("Failed to pin recommendation as goal", error, { tipId: tip.id, userId: profile.id });
      alert(getErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  // Quick log activity
  const handleQuickLogTip = async (tip: ScoredTip) => {
    setActionLoading(`quicklog_${tip.id}`);
    try {
      let actionType = "VEGAN_MEAL";
      let amount = 1;
      const category = tip.category;

      if (tip.id === "tip_walk_cycle") {
        actionType = "EV";
        amount = 10;
      } else if (tip.id === "tip_meatless_day") {
        actionType = "VEGGIE_MEAL";
        amount = 3;
      } else if (tip.id === "tip_cold_wash") {
        actionType = "ELECTRICITY";
        amount = 2;
      }

      const newLog = await logActivity({
        category,
        actionType,
        amount,
      });

      setLogs((prev) => [newLog, ...prev]);
      router.refresh();
    } catch (error) {
      logError("Failed to quick-log activity from tip", error, { tipId: tip.id });
      alert(getErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex flex-col space-y-8">
      {/* 1. Header & Quick Summary */}
      <section aria-labelledby="dashboard-title">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
          <div>
            <h1 id="dashboard-title" className="font-display font-extrabold text-3xl text-white">Welcome back, {profile.name}</h1>
            <p className="text-sm text-gray-300">Here is your customized carbon coach & footprint pulse.</p>
          </div>
          <div className="flex items-center space-x-3 text-xs bg-slate-900 border border-white/5 rounded-2xl p-3 shadow-inner">
            <Calendar className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            <span className="font-medium text-gray-300">Tracking Month: <strong className="text-white">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</strong></span>
          </div>
        </div>
      </section>

      {/* 2. Primary Summary Cards */}
      <section aria-labelledby="summary-title">
        <div id="summary-title" className="sr-only">Your Carbon Summary</div>
        <SummaryGrid
          baselineFootprint={profile.baselineFootprint}
          totalTrackedMonth={totalTrackedMonth}
          activeGoalsCount={goals.filter((g) => !g.isCompleted).length}
          completedGoalsCount={goals.filter((g) => g.isCompleted).length}
          streakCount={streakCount}
        />
      </section>

      {/* 3. Primary Coach Recommendation Card & Weekly Comparison */}
      {primaryTip && (
        <section aria-labelledby="coach-title">
          <div id="coach-title" className="sr-only">AI Coach Recommendations</div>
          <CoachAssistant
            primaryTip={primaryTip}
            profile={profile}
            highestCategory={highestCategory}
            logs={logs}
            actionLoading={actionLoading}
            handleQuickLogTip={handleQuickLogTip}
            handlePinRecommendation={handlePinRecommendation}
          />
        </section>
      )}

      {/* 3.5. Weekly Feedback - "You reduced X kg" */}
      <section aria-labelledby="weekly-feedback-title">
        <div id="weekly-feedback-title" className="sr-only">Your Weekly Progress</div>
        <WeeklyFeedback
          logs={logs}
          baseline={profile.baselineFootprint}
          topCategory={highestCategory}
        />
      </section>

      {/* 3.7. Streak & Nudges - Habit Formation */}
      <section aria-labelledby="streak-title">
        <div id="streak-title" className="sr-only">Your Tracking Streak</div>
        <StreakAndNudges logs={logs} />
      </section>

      {/* Science 'Why this matters' Card for Highest Category */}
      <section aria-labelledby="science-title">
        <div id="science-title" className="sr-only">Why This Matters - Scientific Context</div>
        <WhyThisMattersCard highestCategory={highestCategory} />
      </section>

      {/* 3.9. Footprint Explainer - "What makes up your footprint?" */}
      <section aria-labelledby="explainer-title">
        <div id="explainer-title" className="sr-only">Understanding Your Carbon Footprint Breakdown</div>
        <FootprintExplainer
          breakdown={breakdown}
          topCategory={highestCategory}
          monthlyTotal={profile.baselineFootprint}
        />
      </section>

      {/* 4. Charts Section */}
      <section aria-labelledby="charts-title">
        <div id="charts-title" className="sr-only">Your Carbon Footprint Analytics</div>
        <FootprintCharts
          breakdown={breakdown}
          logs={logs}
          mounted={mounted}
        />
      </section>

      {/* 5. Lower Content: Goals & Recent Activity Grid */}
      <section aria-labelledby="tracking-title">
        <div id="tracking-title" className="sr-only">Goals and Activity Tracking</div>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Active Goals Checklist */}
          <GoalsChecklist
            goals={goals}
            handleToggleGoal={handleToggleGoal}
            actionLoading={actionLoading}
          />

          {/* Recent Activity Feed */}
          <div className="glass-panel rounded-3xl p-6 border-white/5 flex flex-col space-y-4">
            <div className="flex justify-between items-center text-left">
              <h2 className="font-display font-bold text-lg text-white">Recent Log History</h2>
              <Link href="/history" className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded px-1">
                View All
              </Link>
            </div>

            <div className="overflow-y-auto max-h-[320px]">
              <LogHistoryTable
                logs={logs.slice(0, 5)}
                actionLoading={actionLoading}
                handleDelete={handleDeleteActivity}
                showCategoryIcon={true}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. Transparency & Trust */}
      <section aria-labelledby="transparency-title">
        <div id="transparency-title" className="sr-only">How We Calculate Your Emissions</div>
        <TransparencyCard />
      </section>

      {/* 7. Top Micro-Dose Recommendations */}
      {recommendations.length > 0 && (
        <section aria-labelledby="recommendations-title">
          <h2 id="recommendations-title" className="font-display font-bold text-xl text-white mb-4">
            Recommended Actions for You
          </h2>
          <div className="space-y-4">
            {recommendations.slice(0, 3).map((tip) => (
              <MicroDoseRecommendation
                key={tip.id}
                recommendation={tip}
                onPin={handlePinRecommendation}
                isPinned={goals.some((g) => g.title === tip.title)}
                loading={actionLoading === `pin_${tip.id}`}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
