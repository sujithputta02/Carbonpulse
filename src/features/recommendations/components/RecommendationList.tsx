import React, { useState } from "react";
import { ScoredTip } from "@/types/recommendation";
import { UserProfile } from "@/types/user";
import { Goal } from "@/types/activity";
import { filterTipsByAttributes } from "@/lib/recommendations/rankActions";
import { generatePersonalizedExplanation } from "@/lib/recommendations/generateInsight";
import { 
  Car, Leaf, Zap, ShoppingBag, Star, ChevronDown, 
  ChevronUp, Plus, CheckCircle2, Loader2 
} from "lucide-react";

interface RecommendationListProps {
  tips: ScoredTip[];
  profile: UserProfile;
  highestCategory: string;
  goals: Goal[];
  actionLoading: string | null;
  handlePinGoal: (tip: ScoredTip) => void;
}

export default function RecommendationList({
  tips,
  profile,
  highestCategory,
  goals,
  actionLoading,
  handlePinGoal,
}: RecommendationListProps) {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [activeAttribute, setActiveAttribute] = useState<
    "ALL" | "BUDGET_FRIENDLY" | "LOW_EFFORT" | "HIGH_IMPACT" | "TIME_SAVING"
  >("ALL");
  const [expandedTipId, setExpandedTipId] = useState<string | null>(null);

  // 1. Filter by category
  let filtered = activeCategory === "ALL" 
    ? tips 
    : tips.filter(tip => tip.category === activeCategory);

  // 2. Filter by attribute
  filtered = filterTipsByAttributes(filtered, activeAttribute);

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
    <div className="flex flex-col space-y-6">
      {/* Filters Header */}
      <div className="flex flex-col space-y-4">
        {/* Category Filters */}
        <div className="flex flex-col space-y-1.5 text-left">
          <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Filter by Category</h3>
          <div className="flex flex-wrap gap-2">
            {["ALL", "TRANSPORT", "FOOD", "ENERGY", "SHOPPING"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                aria-label={`Filter by ${cat} category`}
                aria-pressed={activeCategory === cat}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  activeCategory === cat
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-semibold"
                    : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Attribute Filters */}
        <div className="flex flex-col space-y-1.5 text-left">
          <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Refine Suggestions</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "ALL", label: "All Priorities" },
              { key: "BUDGET_FRIENDLY", label: "Budget-Friendly" },
              { key: "LOW_EFFORT", label: "Low-Effort" },
              { key: "HIGH_IMPACT", label: "High-Impact" },
              { key: "TIME_SAVING", label: "Time-Saving" },
            ].map((attr) => (
              <button
                key={attr.key}
                type="button"
                onClick={() => setActiveAttribute(attr.key as any)}
                aria-label={`Filter by ${attr.label}`}
                aria-pressed={activeAttribute === attr.key}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                  activeAttribute === attr.key
                    ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 font-semibold"
                    : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10"
                }`}
              >
                {attr.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accordion List */}
      <div className="flex flex-col space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm glass-panel rounded-2xl p-8 border-white/5">
            No carbon reduction suggestions found matching the selected filters.
          </div>
        ) : (
          filtered.map((tip, idx) => {
            const isExpanded = expandedTipId === tip.id;
            const isPinned = goals.some((g) => g.title === tip.title);
            const personalizedExplanation = generatePersonalizedExplanation(tip, profile, highestCategory);

            return (
              <div
                key={tip.id}
                className={`glass-panel rounded-2xl border-white/5 transition-all overflow-hidden ${
                  idx === 0 && activeCategory === "ALL" && activeAttribute === "ALL"
                    ? "border-emerald-500/20 shadow-lg shadow-emerald-500/5"
                    : ""
                }`}
              >
                {/* Accordion Header */}
                <button
                  onClick={() => setExpandedTipId(isExpanded ? null : tip.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`tip-content-${tip.id}`}
                  aria-label={`${tip.title}. Est. savings: ${tip.potentialSavingsCO2e} kg per month. ${isExpanded ? "Collapse" : "Expand"} details`}
                  className="w-full p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/5 text-left"
                >
                  <div className="flex items-center space-x-3 text-left">
                    <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0" aria-hidden="true">
                      {getCategoryIcon(tip.category)}
                    </div>
                    <div>
                      {idx === 0 && activeCategory === "ALL" && activeAttribute === "ALL" && (
                        <span className="text-[9px] font-bold tracking-wider text-emerald-400 uppercase flex items-center space-x-1 mb-0.5">
                          <Star className="h-3 w-3 fill-emerald-400/20" aria-hidden="true" />
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
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-500" aria-hidden="true" /> : <ChevronDown className="h-4 w-4 text-gray-500" aria-hidden="true" />}
                  </div>
                </button>

                {/* Accordion Body */}
                {isExpanded && (
                  <div id={`tip-content-${tip.id}`} role="region" aria-labelledby={`tip-header-${tip.id}`} className="px-5 pb-6 pt-2 border-t border-white/5 bg-slate-900/10 flex flex-col space-y-4 text-left">
                    <p className="text-gray-300 text-sm leading-relaxed">{personalizedExplanation}</p>
                    
                    {/* Score Breakdown Bars */}
                    <div className="grid sm:grid-cols-3 gap-4 pt-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Carbon Savings</span>
                          <span className="font-semibold text-white">{tip.impactScore}/10</span>
                        </div>
                        <div className="w-full h-1 bg-gray-950 rounded-full overflow-hidden" role="progressbar" aria-valuenow={tip.impactScore} aria-valuemin={0} aria-valuemax={10} aria-label={`Carbon savings score: ${tip.impactScore} out of 10`}>
                          <div className="h-full bg-emerald-500" style={{ width: `${tip.impactScore * 10}%` }}></div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Adoption Ease</span>
                          <span className="font-semibold text-white">{tip.effortScore}/10</span>
                        </div>
                        <div className="w-full h-1 bg-gray-950 rounded-full overflow-hidden" role="progressbar" aria-valuenow={tip.effortScore} aria-valuemin={0} aria-valuemax={10} aria-label={`Adoption ease score: ${tip.effortScore} out of 10`}>
                          <div className="h-full bg-cyan-500" style={{ width: `${tip.effortScore * 10}%` }}></div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Budget Fit</span>
                          <span className="font-semibold text-white">{tip.costScore}/10</span>
                        </div>
                        <div className="w-full h-1 bg-gray-950 rounded-full overflow-hidden" role="progressbar" aria-valuenow={tip.costScore} aria-valuemin={0} aria-valuemax={10} aria-label={`Budget fit score: ${tip.costScore} out of 10`}>
                          <div className="h-full bg-amber-500" style={{ width: `${tip.costScore * 10}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/5">
                      {isPinned ? (
                        <span className="inline-flex items-center text-xs text-emerald-400 font-semibold py-2">
                          <CheckCircle2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
                          Pinned to Active Goals
                        </span>
                      ) : (
                        <button
                          disabled={actionLoading === tip.id}
                          onClick={() => handlePinGoal(tip)}
                          aria-label={`Pin ${tip.title} as an active goal`}
                          className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500 text-[#090d16] hover:bg-emerald-400 font-display transition-all active:scale-95 disabled:opacity-50"
                        >
                          {actionLoading === tip.id ? (
                            <Loader2 className="animate-spin h-3.5 w-3.5" aria-label="Pinning goal" />
                          ) : (
                            <>
                              <Plus className="mr-1.5 h-4 w-4 stroke-[3]" aria-hidden="true" />
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
          })
        )}
      </div>
    </div>
  );
}
