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

import SummaryGrid from "@/features/dashboard/components/SummaryGrid";
import FootprintCharts from "@/features/dashboard/components/FootprintCharts";
import GoalsChecklist from "@/features/dashboard/components/GoalsChecklist";
import CoachAssistant from "@/features/recommendations/components/CoachAssistant";
import WhyThisMattersCard from "@/features/recommendations/components/WhyThisMattersCard";
import LogHistoryTable from "@/features/tracking/components/LogHistoryTable";

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
    } catch (e) {
      console.error(e);
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
    } catch (e) {
      console.error(e);
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
    } catch (e) {
      console.error(e);
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
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex flex-col space-y-8">
      {/* 1. Header & Quick Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-white">Welcome back, {profile.name}</h1>
          <p className="text-sm text-gray-400">Here is your customized carbon coach & footprint pulse.</p>
        </div>
        <div className="flex items-center space-x-3 text-xs bg-slate-900 border border-white/5 rounded-2xl p-3 shadow-inner">
          <Calendar className="h-4 w-4 text-emerald-400" />
          <span className="font-medium text-gray-300">Tracking Month: <strong className="text-white">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</strong></span>
        </div>
      </div>

      {/* 2. Primary Summary Cards */}
      <SummaryGrid
        baselineFootprint={profile.baselineFootprint}
        totalTrackedMonth={totalTrackedMonth}
        activeGoalsCount={goals.filter((g) => !g.isCompleted).length}
        completedGoalsCount={goals.filter((g) => g.isCompleted).length}
        streakCount={streakCount}
      />

      {/* 3. Primary Coach Recommendation Card & Weekly Comparison */}
      {primaryTip && (
        <CoachAssistant
          primaryTip={primaryTip}
          profile={profile}
          highestCategory={highestCategory}
          logs={logs}
          actionLoading={actionLoading}
          handleQuickLogTip={handleQuickLogTip}
          handlePinRecommendation={handlePinRecommendation}
        />
      )}

      {/* Science 'Why this matters' Card for Highest Category */}
      <WhyThisMattersCard highestCategory={highestCategory} />

      {/* 4. Charts Section */}
      <FootprintCharts
        breakdown={breakdown}
        logs={logs}
        mounted={mounted}
      />

      {/* 5. Lower Content: Goals & Recent Activity Grid */}
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
            <h3 className="font-display font-bold text-lg text-white">Recent Log History</h3>
            <Link href="/history" className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer">
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
    </div>
  );
}
