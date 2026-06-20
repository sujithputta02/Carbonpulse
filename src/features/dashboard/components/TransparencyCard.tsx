"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, BookOpen, Shield } from "lucide-react";

export default function TransparencyCard() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-6 flex items-start justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-start gap-4 text-left">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 shrink-0">
            <Shield className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">How we estimate your emissions</h3>
            <p className="text-xs text-gray-400 mt-1">
              Our calculations are based on scientific research and industry standards.
            </p>
          </div>
        </div>
        <div className="ml-4 shrink-0">
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/10 bg-white/5 p-6 space-y-6">
          {/* Data sources */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-cyan-400" />
              <h4 className="font-semibold text-white text-sm">Data Sources</h4>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-300">
                We use emissions factors from:
              </p>
              <ul className="space-y-1.5 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold mt-1">•</span>
                  <span><span className="font-semibold text-gray-300">IPCC</span> (Intergovernmental Panel on Climate Change)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold mt-1">•</span>
                  <span><span className="font-semibold text-gray-300">EPA</span> (U.S. Environmental Protection Agency)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold mt-1">•</span>
                  <span><span className="font-semibold text-gray-300">Defra</span> (UK Department for Business, Energy & Industrial Strategy)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold mt-1">•</span>
                  <span><span className="font-semibold text-gray-300">Academic research</span> on lifestyle carbon impacts</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Key calculation methods */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">How We Calculate</h4>
            <div className="space-y-3">
              {/* Transportation */}
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="font-semibold text-white text-xs mb-2">Transportation</p>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• Car: 0.27 kg CO₂e per km (petrol), 0.25 (diesel), 0.05 (electric)</li>
                  <li>• Bus: 0.08 kg CO₂e per km (shared)</li>
                  <li>• Train: 0.04 kg CO₂e per km (shared)</li>
                </ul>
              </div>

              {/* Food */}
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="font-semibold text-white text-xs mb-2">Food & Diet</p>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• High-meat diet: 7.26 kg CO₂e/day</li>
                  <li>• Low-meat diet: 4.67 kg CO₂e/day</li>
                  <li>• Vegetarian: 3.81 kg CO₂e/day</li>
                  <li>• Vegan: 2.89 kg CO₂e/day</li>
                </ul>
              </div>

              {/* Energy */}
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="font-semibold text-white text-xs mb-2">Home Energy</p>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• Electricity: 0.38 kg CO₂e per kWh (average grid)</li>
                  <li>• Natural gas: 0.18 kg CO₂e per kWh</li>
                  <li>• Divided by household size for per-person impact</li>
                </ul>
              </div>

              {/* Shopping */}
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="font-semibold text-white text-xs mb-2">Shopping & Goods</p>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• Electronics: 80 kg CO₂e per item (production)</li>
                  <li>• Clothing: 15 kg CO₂e per item</li>
                  <li>• Other goods: 5 kg CO₂e per item</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Accuracy note */}
          <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
            <p className="text-xs text-yellow-300">
              <span className="font-semibold">🎯 Accuracy:</span> Our estimates are good enough for tracking trends and making behavior changes,
              but not for official carbon audits. They're designed to be simple and actionable, not scientifically precise.
            </p>
          </div>

          {/* Transparency commitment */}
          <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
            <p className="text-xs text-emerald-300">
              <span className="font-semibold">✓ Our commitment:</span> We use science-backed factors and update them annually. Your data
              is never sold or shared. You own your carbon footprint insights.
            </p>
          </div>

          {/* Learn more link */}
          <div className="text-center pt-2">
            <a
              href="#"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline"
              onClick={(e) => {
                e.preventDefault();
                // Would link to full methodology docs
              }}
            >
              Read our full methodology →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
