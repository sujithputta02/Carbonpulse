"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/types/user";
import { Goal, ActivityLog, EmissionFactor } from "@/types/activity";
import { getRecommendedTips } from "@/lib/recommendations/rankActions";
import { calculateBaseline } from "@/lib/carbon/calculateFootprint";
import { ScoredTip } from "@/types/recommendation";

import RecommendationList from "@/features/recommendations/components/RecommendationList";

import { Leaf, ArrowLeft, Info, Loader2 } from "lucide-react";

interface InsightsClientProps {
  profile: UserProfile | null;
  logs: ActivityLog[];
  goals: Goal[];
  factors: EmissionFactor[];
}

export default function InsightsClient({
  profile,
  goals,
  factors,
}: InsightsClientProps) {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (!profile) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-6">
        <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
          <Leaf className="h-8 w-8 text-emerald-400" />
        </div>
        <div className="text-left text-center">
          <h2 className="font-display font-extrabold text-2xl text-white">Baseline Required</h2>
          <p className="text-gray-400 text-sm mt-2">
            Please complete the onboarding setup to generate personalized recommendations.
          </p>
        </div>
        <Link href="/onboarding" className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-emerald-500 text-[#090d16] font-display font-bold">
          Start Onboarding
        </Link>
      </div>
    );
  }

  // Get categories calculations
  const getProfileBreakdown = () => {
    const commuteDistanceWeekly = profile.commuteType === "NONE" ? 0 : 100;
    return calculateBaseline({
      commuteType: profile.commuteType,
      commuteDistanceWeekly,
      dietPattern: profile.dietPattern,
      electricityMonthlyKwh: 250,
      naturalGasMonthlyKwh: 50,
      householdSize: profile.householdSize,
      shoppingPattern: profile.dietPattern === "HIGH_MEAT" ? ("HEAVY" as const) : ("MODERATE" as const),
    }, factors);
  };

  const breakdown = getProfileBreakdown();
  const recommendations = getRecommendedTips(profile, breakdown);

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

  // Toggle goal pinning
  const handlePinGoal = async (tip: ScoredTip) => {
    setActionLoading(tip.id);
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
      
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex flex-col space-y-8 text-left">
      <div className="flex items-center space-x-3">
        <Link
          href="/dashboard"
          className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display font-extrabold text-3xl text-white">Personalized Insights</h1>
          <p className="text-sm text-gray-400">View actionable coaching tips prioritized by carbon reduction and your budget.</p>
        </div>
      </div>

      {/* Heuristic Formula Info Card */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border-white/5 bg-slate-950/20 text-xs text-gray-400 flex items-start space-x-3 leading-relaxed">
        <Info className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-white mb-1">How are actions ranked?</h4>
          <p>
            CarbonPulse uses a rule-based weighted heuristics scoring model: 
            <strong className="text-gray-300"> Score = (Highest Emission Category Match * 4.0) + (Budget Compatibility * 3.0) + (Goal Preference * 3.0) + (Ease level * 0.1)</strong>. 
            This matches your profile constraints perfectly, keeping high-investment tips locked if you are budget-conscious, and bubbles high-yield, low-friction habits to the top.
          </p>
        </div>
      </div>

      <RecommendationList
        tips={recommendations}
        profile={profile}
        highestCategory={highestCategory}
        goals={goals}
        actionLoading={actionLoading}
        handlePinGoal={handlePinGoal}
      />
    </div>
  );
}
