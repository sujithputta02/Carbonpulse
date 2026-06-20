import React from "react";
import { Leaf, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ScoredTip } from "@/types/recommendation";
import { UserProfile } from "@/types/user";
import { ActivityLog } from "@/types/activity";
import { generateWeeklyInsight, generatePersonalizedExplanation } from "@/lib/recommendations/generateInsight";

interface CoachAssistantProps {
  primaryTip: ScoredTip;
  profile: UserProfile;
  highestCategory: string;
  logs: ActivityLog[];
  actionLoading: string | null;
  handleQuickLogTip: (tip: ScoredTip) => void;
  handlePinRecommendation: (tip: ScoredTip) => void;
}

export default function CoachAssistant({
  primaryTip,
  profile,
  highestCategory,
  logs,
  actionLoading,
  handleQuickLogTip,
  handlePinRecommendation,
}: CoachAssistantProps) {
  const weeklyInsight = generateWeeklyInsight(logs);
  const personalizedReason = generatePersonalizedExplanation(primaryTip, profile, highestCategory);

  const getTrendIcon = () => {
    if (weeklyInsight.direction === "UP") {
      return <TrendingUp className="h-4 w-4 text-rose-400" />;
    } else if (weeklyInsight.direction === "DOWN") {
      return <TrendingDown className="h-4 w-4 text-emerald-400" />;
    }
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getTrendClass = () => {
    if (weeklyInsight.direction === "UP") {
      return "text-rose-400 bg-rose-500/10 border-rose-500/25";
    } else if (weeklyInsight.direction === "DOWN") {
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/25";
    }
    return "text-gray-400 bg-white/5 border-transparent";
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* 1. What Changed This Week Banner */}
      <div 
        role="status" 
        aria-live="assertive" 
        aria-atomic="true"
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${getTrendClass()}`}
      >
        <div className="flex items-start space-x-3 text-left">
          <div className="mt-0.5 shrink-0">
            {getTrendIcon()}
          </div>
          <div>
            <h4 className="font-semibold text-sm text-white">{weeklyInsight.trendMessage}</h4>
            <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">{weeklyInsight.explanation}</p>
          </div>
        </div>
      </div>

      {/* 2. Primary Next Best Action Coach Recommendation */}
      <section className="glass-panel rounded-3xl p-6 sm:p-8 border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 via-slate-900/40 to-slate-950/70 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-500/5 rounded-full filter blur-2xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl text-left">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-xs font-semibold">
              <Leaf className="h-3.5 w-3.5" />
              <span>Next Best Action Match</span>
            </div>
            <h3 className="font-display font-extrabold text-xl sm:text-2xl text-white">{primaryTip.title}</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{personalizedReason}</p>
            
            {/* Impact / Effort / Cost badges */}
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/10">
                Carbon Impact: {primaryTip.impactScore}/10
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/10">
                Ease of Adoption: {primaryTip.effortScore}/10
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/10">
                {primaryTip.costScore >= 8 ? "Saves Money" : "Investment Option"}
              </span>
            </div>
          </div>

          <div className="flex flex-row md:flex-col items-center gap-3 w-full md:w-auto shrink-0">
            <button
              disabled={actionLoading !== null}
              onClick={() => handleQuickLogTip(primaryTip)}
              className="flex-1 md:w-44 inline-flex items-center justify-center px-4 py-3 text-xs font-bold rounded-xl bg-emerald-500 text-[#090d16] hover:bg-emerald-400 font-display transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {actionLoading === `quicklog_${primaryTip.id}` ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                "Log Action Now"
              )}
            </button>
            <button
              disabled={actionLoading !== null}
              onClick={() => handlePinRecommendation(primaryTip)}
              className="flex-1 md:w-44 inline-flex items-center justify-center px-4 py-3 text-xs font-bold rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all active:scale-95 disabled:opacity-50"
            >
              Pin to Goals
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
