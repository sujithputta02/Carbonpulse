"use client";

import React from "react";
import { Car, Leaf, Zap, ShoppingBag, TrendingUp } from "lucide-react";

interface FootprintExplainerProps {
  breakdown: {
    transport: number;
    food: number;
    energy: number;
    shopping: number;
  };
  topCategory: string;
  monthlyTotal: number;
}

const categoryExplanations: Record<string, { icon: React.ReactNode; title: string; explanation: string; tips: string[] }> = {
  TRANSPORT: {
    icon: <Car className="h-6 w-6" />,
    title: "Transportation",
    explanation:
      "Your commute and travel. This includes cars, buses, trains, and flights. Even short trips add up when done daily.",
    tips: [
      "Carpool or use public transit when possible",
      "Consider an e-bike for short trips",
      "Combine errands to reduce total trips",
    ],
  },
  FOOD: {
    icon: <Leaf className="h-6 w-6" />,
    title: "Food & Diet",
    explanation:
      "What you eat matters more than you think. Meat production is resource-intensive. Plant-based meals have a lower footprint.",
    tips: [
      "Try 'Meatless Mondays'",
      "Buy local and seasonal produce",
      "Reduce food waste by meal planning",
    ],
  },
  ENERGY: {
    icon: <Zap className="h-6 w-6" />,
    title: "Home Energy",
    explanation:
      "Electricity and gas heating your home. This is often the biggest category. Renewable energy, efficiency, and behavior changes help.",
    tips: [
      "Switch to LED bulbs",
      "Adjust thermostat by 1-2 degrees",
      "Unplug devices when not in use",
    ],
  },
  SHOPPING: {
    icon: <ShoppingBag className="h-6 w-6" />,
    title: "Shopping & Goods",
    explanation:
      "New clothes, electronics, and items. Manufacturing is carbon-intensive. Buying less and choosing quality extends product life.",
    tips: [
      "Buy secondhand when possible",
      "Choose durable items over cheap ones",
      "Repair instead of replace",
    ],
  },
};

export default function FootprintExplainer({
  breakdown,
  topCategory,
  monthlyTotal,
}: FootprintExplainerProps) {
  // Sort categories by emissions
  const sortedCategories = [
    { key: "TRANSPORT", value: breakdown.transport },
    { key: "FOOD", value: breakdown.food },
    { key: "ENERGY", value: breakdown.energy },
    { key: "SHOPPING", value: breakdown.shopping },
  ]
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  // Calculate percentages
  const getPercentage = (value: number) => {
    return monthlyTotal > 0 ? Math.round((value / monthlyTotal) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      {/* Main explanation */}
      <div className="glass-panel border border-white/10 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0">
            <TrendingUp className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-display font-bold text-white mb-2">What makes up your carbon footprint?</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Your footprint is the total CO₂e your lifestyle generates. It's split into four main categories. Below you can see
              which areas matter most in your life—focus on the biggest ones first.
            </p>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="space-y-3">
        {sortedCategories.map(({ key, value }) => {
          const info = categoryExplanations[key];
          const percentage = getPercentage(value);
          const isTop = key === topCategory;

          return (
            <div
              key={key}
              className={`glass-panel rounded-2xl p-5 border transition-all ${
                isTop ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/10"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isTop ? "bg-emerald-500/20" : "bg-white/5"}`}>{info.icon}</div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">{info.title}</h4>
                    <p className="text-xs text-gray-400">
                      {value.toFixed(1)} kg CO₂e/month ({percentage}% of your total)
                    </p>
                  </div>
                </div>
                {isTop && <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full font-semibold">Your biggest</span>}
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all ${isTop ? "bg-emerald-500" : "bg-cyan-500/70"}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Explanation */}
              <p className="text-xs text-gray-300 mb-3 leading-relaxed">{info.explanation}</p>

              {/* Quick tips */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Quick actions:</p>
                <ul className="space-y-1">
                  {info.tips.map((tip, idx) => (
                    <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                      <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom insight */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-2xl p-4 border border-emerald-500/20">
        <p className="text-xs text-gray-300">
          💡 <span className="font-semibold text-emerald-300">Pro tip:</span> Start with your biggest category. Even small changes there
          have the biggest impact.
        </p>
      </div>
    </div>
  );
}
