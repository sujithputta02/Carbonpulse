"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserProfile, Goal, ActivityLog, EmissionFactor } from "@/utils/db";
import { getRecommendedTips, ScoredTip } from "@/utils/recommender";
import { SaveProfileInput } from "@/app/actions";
import { calculateBaseline } from "@/utils/calculator";
import { 
  Leaf, Car, Zap, ShoppingBag, ArrowLeft, Star, 
  ChevronDown, ChevronUp, Plus, CheckCircle2, Info, Loader2 
} from "lucide-react";

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
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [expandedTipId, setExpandedTipId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (!profile) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-6">
        <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
          <Leaf className="h-8 w-8 text-emerald-400" />
        </div>
        <div>
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
      commuteType: profile.commuteType as SaveProfileInput["commuteType"],
      commuteDistanceWeekly,
      dietPattern: profile.dietPattern as SaveProfileInput["dietPattern"],
      electricityMonthlyKwh: 250,
      naturalGasMonthlyKwh: 50,
      householdSize: profile.householdSize,
      shoppingPattern: profile.dietPattern === "HIGH_MEAT" ? "HEAVY" as const : "MODERATE" as const,
    }, factors);
  };

  const breakdown = getProfileBreakdown();
  const recommendations = getRecommendedTips(profile, breakdown);

  // Filter tips
  const filteredTips = activeFilter === "ALL" 
    ? recommendations 
    : recommendations.filter((tip) => tip.category === activeFilter);

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
      
      // Save locally
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "TRANSPORT": return <Car className="h-4 w-4 text-emerald-400" />;
      case "FOOD": return <Leaf className="h-4 w-4 text-cyan-400" />;
      case "ENERGY": return <Zap className="h-4 w-4 text-amber-400" />;
      case "SHOPPING": return <ShoppingBag className="h-4 w-4 text-purple-400" />;
      default: return <Leaf className="h-4 w-4 text-gray-400" />;
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

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {["ALL", "TRANSPORT", "FOOD", "ENERGY", "SHOPPING"].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeFilter === filter
                ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Recommendations List */}
      <div className="flex flex-col space-y-4">
        {filteredTips.map((tip, idx) => {
          const isExpanded = expandedTipId === tip.id;
          const isPinned = goals.some((g) => g.title === tip.title);
          
          return (
            <div
              key={tip.id}
              className={`glass-panel rounded-2xl border-white/5 transition-all overflow-hidden ${
                idx === 0 && activeFilter === "ALL" ? "border-emerald-500/20 shadow-lg shadow-emerald-500/5" : ""
              }`}
            >
              {/* Accordion Header */}
              <div
                onClick={() => setExpandedTipId(isExpanded ? null : tip.id)}
                className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/5"
              >
                <div className="flex items-center space-x-3 text-left">
                  <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                    {getCategoryIcon(tip.category)}
                  </div>
                  <div>
                    {idx === 0 && activeFilter === "ALL" && (
                      <span className="text-[9px] font-bold tracking-wider text-emerald-400 uppercase flex items-center space-x-1 mb-0.5">
                        <Star className="h-3 w-3 fill-emerald-400/20" />
                        <span>Best Action Matches Your Profile</span>
                      </span>
                    )}
                    <h3 className="font-semibold text-white text-sm sm:text-base leading-snug">{tip.title}</h3>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block mt-0.5">
                      Est. Savings: <strong className="text-emerald-400">{tip.potentialSavingsCO2e} kg/mo</strong> • Category: {tip.category.toLowerCase()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span className="hidden sm:inline-flex text-[10px] bg-slate-900 border border-white/5 text-gray-400 px-2.5 py-1 rounded-full font-semibold">
                    Score: {tip.score}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                </div>
              </div>

              {/* Accordion Body */}
              {isExpanded && (
                <div className="px-5 pb-6 pt-2 border-t border-white/5 bg-slate-900/10 flex flex-col space-y-4 text-left">
                  <p className="text-gray-300 text-sm leading-relaxed">{tip.reason}</p>
                  
                  {/* Score Breakdown Bars */}
                  <div className="grid sm:grid-cols-3 gap-4 pt-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Carbon Savings</span>
                        <span className="font-semibold text-white">{tip.impactScore}/10</span>
                      </div>
                      <div className="w-full h-1 bg-gray-950 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${tip.impactScore * 10}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Adoption Ease</span>
                        <span className="font-semibold text-white">{tip.effortScore}/10</span>
                      </div>
                      <div className="w-full h-1 bg-gray-950 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500" style={{ width: `${tip.effortScore * 10}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Budget Fit</span>
                        <span className="font-semibold text-white">{tip.costScore}/10</span>
                      </div>
                      <div className="w-full h-1 bg-gray-950 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: `${tip.costScore * 10}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/5">
                    {isPinned ? (
                      <span className="inline-flex items-center text-xs text-emerald-400 font-semibold py-2">
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        Pinned to Active Goals
                      </span>
                    ) : (
                      <button
                        disabled={actionLoading === tip.id}
                        onClick={() => handlePinGoal(tip)}
                        className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500 text-[#090d16] hover:bg-emerald-400 font-display transition-all active:scale-95 disabled:opacity-50"
                      >
                        {actionLoading === tip.id ? (
                          <Loader2 className="animate-spin h-3.5 w-3.5" />
                        ) : (
                          <>
                            <Plus className="mr-1.5 h-4 w-4 stroke-[3]" />
                            Pin Action as Goal
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
