import React from "react";

interface DietStepProps {
  dietPattern: "HIGH_MEAT" | "LOW_MEAT" | "VEGETARIAN" | "VEGAN";
  setDietPattern: (val: "HIGH_MEAT" | "LOW_MEAT" | "VEGETARIAN" | "VEGAN") => void;
}

export default function DietStep({ dietPattern, setDietPattern }: DietStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-left">
        <h2 className="font-display font-extrabold text-2xl text-white">Diet & Food Habits</h2>
        <p className="text-sm text-gray-400">Diet choices have a massive cumulative impact due to methane emissions and land footprint.</p>
      </div>

      <div className="space-y-4 text-left">
        {[
          {
            key: "HIGH_MEAT",
            title: "High Meat Intake",
            desc: "Eat beef, pork, or poultry on a near-daily basis.",
            badge: "Highest Carbon Impact",
            badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/25",
          },
          {
            key: "LOW_MEAT",
            title: "Low Meat / Poultry Focus",
            desc: "Primarily eat chicken/fish, avoid beef, or eat meat occasionally.",
            badge: "Average Carbon Impact",
            badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/25",
          },
          {
            key: "VEGETARIAN",
            title: "Vegetarian",
            desc: "No meat, but eat dairy, eggs, and cheese.",
            badge: "Eco-Friendly",
            badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
          },
          {
            key: "VEGAN",
            title: "Vegan / Plant-based",
            desc: "Fully plant-based diet, no animal ingredients.",
            badge: "Minimal Footprint",
            badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/25",
          },
        ].map((pattern) => (
          <button
            key={pattern.key}
            type="button"
            onClick={() => setDietPattern(pattern.key as any)}
            className={`w-full p-4 rounded-2xl border text-left flex items-start justify-between gap-4 transition-all cursor-pointer ${
              dietPattern === pattern.key
                ? "bg-emerald-500/10 border-emerald-500"
                : "bg-white/5 border-white/5 hover:bg-white/10"
            }`}
          >
            <div className="space-y-1">
              <h4 className="font-semibold text-white text-sm">{pattern.title}</h4>
              <p className="text-xs text-gray-400">{pattern.desc}</p>
            </div>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-semibold ${pattern.badgeColor}`}>
              {pattern.badge}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
