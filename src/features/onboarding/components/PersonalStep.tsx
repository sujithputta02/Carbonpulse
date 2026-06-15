import React from "react";

interface PersonalStepProps {
  name: string;
  setName: (val: string) => void;
  location: string;
  setLocation: (val: string) => void;
  householdSize: number;
  setHouseholdSize: (val: number) => void;
  budgetSensitivity: "LOW" | "MEDIUM" | "HIGH";
  setBudgetSensitivity: (val: "LOW" | "MEDIUM" | "HIGH") => void;
  errors: Record<string, string>;
}

export default function PersonalStep({
  name,
  setName,
  location,
  setLocation,
  householdSize,
  setHouseholdSize,
  budgetSensitivity,
  setBudgetSensitivity,
  errors,
}: PersonalStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-left">
        <h2 className="font-display font-extrabold text-2xl text-white">Let&apos;s start with the basics</h2>
        <p className="text-sm text-gray-400">Introduce yourself so the CarbonPulse coach can personalize your dashboard.</p>
      </div>

      <div className="flex flex-col space-y-4">
        {/* Name input */}
        <div className="space-y-2 text-left">
          <label htmlFor="name-input" className="text-sm font-semibold text-gray-300">What should we call you?</label>
          <input
            id="name-input"
            type="text"
            placeholder="e.g. Sarah"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl bg-slate-950/60 border ${
              errors.name ? "border-rose-500/50 focus:border-rose-500" : "border-white/10 focus:border-emerald-500"
            } text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/25 transition-all`}
            required
          />
          {errors.name && <p className="text-xs text-rose-400 font-semibold mt-1">{errors.name}</p>}
        </div>

        {/* Location & Household */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <div className="space-y-2">
            <label htmlFor="location-input" className="text-sm font-semibold text-gray-300">Location (Country or State)</label>
            <input
              id="location-input"
              type="text"
              placeholder="e.g. New York, USA"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all font-semibold"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="household-size-input" className="text-sm font-semibold text-gray-300">Household Size</label>
            <input
              id="household-size-input"
              type="number"
              min="1"
              value={householdSize}
              onChange={(e) => setHouseholdSize(Math.max(1, Number(e.target.value)))}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all font-semibold"
              required
            />
            <span className="text-[11px] text-gray-500">Shared utility carbon is split among members.</span>
          </div>
        </div>

        {/* Budget Sensitivity */}
        <div className="space-y-2 text-left">
          <label className="text-sm font-semibold text-gray-300">Budget sensitivity for recommendations</label>
          <div className="grid grid-cols-3 gap-2">
            {(["LOW", "MEDIUM", "HIGH"] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setBudgetSensitivity(level)}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold text-center transition-all cursor-pointer ${
                  budgetSensitivity === level
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                    : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10"
                }`}
              >
                {level === "HIGH" ? "Tight (Saves Money)" : level === "MEDIUM" ? "Moderate" : "Flexible"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
