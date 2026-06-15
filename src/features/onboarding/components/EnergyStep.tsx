import React from "react";

interface EnergyStepProps {
  electricityMonthlyKwh: number;
  setElectricityMonthlyKwh: (val: number) => void;
  naturalGasMonthlyKwh: number;
  setNaturalGasMonthlyKwh: (val: number) => void;
  shoppingPattern: "HEAVY" | "MODERATE" | "MINIMALIST";
  setShoppingPattern: (val: "HEAVY" | "MODERATE" | "MINIMALIST") => void;
  errors: Record<string, string>;
}

export default function EnergyStep({
  electricityMonthlyKwh,
  setElectricityMonthlyKwh,
  naturalGasMonthlyKwh,
  setNaturalGasMonthlyKwh,
  shoppingPattern,
  setShoppingPattern,
  errors,
}: EnergyStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-left">
        <h2 className="font-display font-extrabold text-2xl text-white">Home Energy & Shopping</h2>
        <p className="text-sm text-gray-400">Heating, cooling, and shopping frequency complete your initial baseline.</p>
      </div>

      <div className="space-y-6 text-left">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="elec-input" className="text-sm font-semibold text-gray-300">Est. Electricity (kWh/mo)</label>
            <input
              id="elec-input"
              type="number"
              min="0"
              value={electricityMonthlyKwh}
              onChange={(e) => setElectricityMonthlyKwh(Math.max(0, Number(e.target.value)))}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all font-semibold"
              required
            />
            {errors.electricityMonthlyKwh && <p className="text-xs text-rose-400 font-semibold mt-1">{errors.electricityMonthlyKwh}</p>}
            <span className="text-[10px] text-gray-500">Average apartment uses 150-300 kWh.</span>
          </div>

          <div className="space-y-2">
            <label htmlFor="gas-input" className="text-sm font-semibold text-gray-300">Est. Natural Gas (kWh/mo)</label>
            <input
              id="gas-input"
              type="number"
              min="0"
              value={naturalGasMonthlyKwh}
              onChange={(e) => setNaturalGasMonthlyKwh(Math.max(0, Number(e.target.value)))}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all font-semibold"
              required
            />
            {errors.naturalGasMonthlyKwh && <p className="text-xs text-rose-400 font-semibold mt-1">{errors.naturalGasMonthlyKwh}</p>}
            <span className="text-[10px] text-gray-500">Average apartment uses 30-80 kWh.</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300">Purchasing & shopping habits</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "MINIMALIST", label: "Minimalist", desc: "Rarely buy new" },
              { key: "MODERATE", label: "Moderate", desc: "Average buyer" },
              { key: "HEAVY", label: "Heavy", desc: "Frequent new tech/clothes" },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setShoppingPattern(opt.key as any)}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                  shoppingPattern === opt.key
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                    : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10"
                }`}
              >
                <span className="text-xs font-semibold">{opt.label}</span>
                <span className="text-[9px] text-gray-500 mt-1">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
