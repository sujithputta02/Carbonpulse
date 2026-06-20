"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Zap, DollarSign, Clock, CheckCircle2 } from "lucide-react";
import { ScoredTip } from "@/types/recommendation";

interface MicroDoseRecommendationProps {
  recommendation: ScoredTip;
  onPin?: (tip: ScoredTip) => void | Promise<void>;
  isPinned?: boolean;
  loading?: boolean;
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "EASY":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    case "MODERATE":
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    case "HARD":
      return "bg-red-500/20 text-red-300 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-300 border-gray-500/30";
  }
};

const getDifficultyLabel = (difficulty: string) => {
  switch (difficulty) {
    case "EASY":
      return "Takes 5 min";
    case "MODERATE":
      return "Takes 30 min";
    case "HARD":
      return "Requires change";
    default:
      return "Unknown";
  }
};

export default function MicroDoseRecommendation({
  recommendation,
  onPin,
  isPinned = false,
  loading = false,
}: MicroDoseRecommendationProps) {
  const [expanded, setExpanded] = useState(false);

  const handlePin = () => {
    if (onPin) {
      onPin(recommendation);
    }
  };

  // Extract values safely
  const monthlySavings = recommendation.potentialSavingsCO2e || 0;
  const costScore = recommendation.costScore || 5; // 1-10 scale
  const effortScore = recommendation.effortScore || 5; // 1-10 scale

  // Convert effort score to difficulty label
  const difficulty = effortScore >= 8 ? "EASY" : effortScore >= 5 ? "MODERATE" : "HARD";
  
  // Estimate cost based on cost score (higher score = more savings/lower cost)
  const estimatedCost = costScore >= 7 ? 0 : costScore >= 4 ? 50 : 200;

  // Context comparisons for relatability
  const getContextComparison = (kg: number): string => {
    if (kg < 1) return `${(kg * 1000).toFixed(0)}g (like a plastic bottle)`;
    if (kg < 10) return `${kg.toFixed(1)}kg (like a ${kg > 5 ? "short" : "very short"} car drive)`;
    if (kg < 50) return `${kg.toFixed(1)}kg (like a small weekly commute)`;
    return `${kg.toFixed(1)}kg (like a significant journey)`;
  };

  return (
    <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden transition-all hover:border-emerald-500/30">
      {/* Main card - always visible */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-display font-bold text-white text-lg leading-tight mb-2">{recommendation.title}</h3>
            <p className="text-sm text-gray-300">{recommendation.description}</p>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-2 p-2 hover:bg-white/5 rounded-lg transition-colors"
            aria-label={expanded ? "Collapse details" : "Expand details"}
          >
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>

        {/* Impact metrics - always visible */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* CO2e savings */}
          <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="h-4 w-4 text-emerald-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">CO₂e Saved</span>
            </div>
            <p className="font-display font-bold text-emerald-300 text-lg">{monthlySavings.toFixed(1)} kg</p>
            <p className="text-[10px] text-emerald-200/60 mt-1">/month</p>
          </div>

          {/* Cost */}
          <div className="bg-cyan-500/10 rounded-xl p-3 border border-cyan-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="h-4 w-4 text-cyan-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">Cost</span>
            </div>
            <p className="font-display font-bold text-cyan-300 text-lg">
              {estimatedCost === 0 ? "Free" : `$${estimatedCost.toFixed(0)}`}
            </p>
            <p className="text-[10px] text-cyan-200/60 mt-1">{estimatedCost > 0 ? "one-time" : "no cost"}</p>
          </div>

          {/* Difficulty */}
          <div className={`${getDifficultyColor(difficulty)} rounded-xl p-3 border`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Effort</span>
            </div>
            <p className="font-display font-bold text-sm">{difficulty}</p>
            <p className="text-[10px] opacity-70 mt-1">{getDifficultyLabel(difficulty)}</p>
          </div>
        </div>

        {/* Impact context */}
        <div className="bg-white/5 rounded-lg p-3 mb-4 border border-white/5">
          <p className="text-xs text-gray-300">
            <span className="text-emerald-400 font-semibold">Real impact:</span> {getContextComparison(monthlySavings)}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handlePin}
            disabled={loading}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${
              isPinned
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
            }`}
            aria-label={isPinned ? "Unpin this action" : "Pin this action as a goal"}
          >
            <CheckCircle2 className="h-4 w-4" />
            {isPinned ? "Pinned" : "Pin as Goal"}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-semibold border border-white/10 transition-all"
            aria-label="Learn more"
          >
            Learn More
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-white/10 bg-white/5 p-6 space-y-4">
          {/* Why this matters */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-2">Why this matters:</h4>
            <p className="text-sm text-gray-300 leading-relaxed">{recommendation.whyItMatters}</p>
          </div>

          {/* How to do it */}
          {recommendation.howToDo && (
            <div>
              <h4 className="font-semibold text-white text-sm mb-2">How to do it:</h4>
              <ol className="text-sm text-gray-300 space-y-1.5">
                {recommendation.howToDo.split("\n").map((step, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-emerald-400 font-semibold shrink-0">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Relevant for you */}
          <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
            <p className="text-xs text-emerald-300">
              ✓ <span className="font-semibold">Tailored for you:</span> This action matches your lifestyle and goals. That's why
              we're suggesting it.
            </p>
          </div>

          {/* Time to implement */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Time to implement</p>
              <p className="font-semibold text-white text-sm">{getDifficultyLabel(difficulty)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Annual impact</p>
              <p className="font-semibold text-white text-sm">{(monthlySavings * 12).toFixed(0)} kg CO₂e</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
