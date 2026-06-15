import React from "react";

interface TransitStepProps {
  commuteType: "CAR_PETROL" | "CAR_DIESEL" | "EV" | "TRANSIT" | "NONE";
  setCommuteType: (val: "CAR_PETROL" | "CAR_DIESEL" | "EV" | "TRANSIT" | "NONE") => void;
  commuteDistanceWeekly: number;
  setCommuteDistanceWeekly: (val: number) => void;
  errors: Record<string, string>;
}

export default function TransitStep({
  commuteType,
  setCommuteType,
  commuteDistanceWeekly,
  setCommuteDistanceWeekly,
  errors,
}: TransitStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-left">
        <h2 className="font-display font-extrabold text-2xl text-white">Commute & Travel</h2>
        <p className="text-sm text-gray-400">Transport is often the largest single source of carbon. Let&apos;s map your week.</p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2 text-left">
          <label className="text-sm font-semibold text-gray-300">How do you primarily commute?</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { key: "CAR_PETROL", label: "Petrol Car" },
              { key: "CAR_DIESEL", label: "Diesel Car" },
              { key: "EV", label: "Electric Vehicle" },
              { key: "TRANSIT", label: "Public Transit" },
              { key: "NONE", label: "No Commute / Walk" },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setCommuteType(option.key as any)}
                className={`py-3 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                  commuteType === option.key
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                    : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {commuteType !== "NONE" && (
          <div className="space-y-2 text-left">
            <label htmlFor="commute-dist-input" className="text-sm font-semibold text-gray-300">Estimated weekly commute distance (km)</label>
            <div className="flex items-center space-x-4">
              <input
                id="commute-dist-input"
                type="number"
                min="0"
                value={commuteDistanceWeekly}
                onChange={(e) => setCommuteDistanceWeekly(Math.max(0, Number(e.target.value)))}
                className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all font-semibold"
                required
              />
              <span className="text-sm text-gray-400 font-semibold whitespace-nowrap">km / week</span>
            </div>
            {errors.commuteDistanceWeekly && <p className="text-xs text-rose-400 font-semibold mt-1">{errors.commuteDistanceWeekly}</p>}
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={commuteDistanceWeekly}
              onChange={(e) => setCommuteDistanceWeekly(Number(e.target.value))}
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        )}
      </div>
    </div>
  );
}
