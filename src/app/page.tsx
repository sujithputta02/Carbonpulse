"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { seedDemoDataAction } from "./actions";
import { ArrowRight, Leaf, Shield, Sparkles, BarChart3, Settings, Loader2 } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [seeding, setSeeding] = useState(false);
  
  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedDemoDataAction();
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      console.error("Failed to seed demo data", e);
      setSeeding(false);
    }
  };

  // Simple quick-estimate state for the landing page interactive widget
  const [commuteDist, setCommuteDist] = useState(150); // km/week
  const [commuteType, setCommuteType] = useState<"petrol" | "ev" | "transit" | "none">("petrol");
  const [diet, setDiet] = useState<"meat" | "veggie" | "vegan">("meat");
  const [shopping, setShopping] = useState<"heavy" | "moderate" | "minimalist">("moderate");

  // Local rule-based calculator for instant feedback on the landing page
  const calculateQuickEstimate = () => {
    let transportVal = 0;
    if (commuteType === "petrol") transportVal = commuteDist * 0.27 * 4.33;
    else if (commuteType === "ev") transportVal = commuteDist * 0.05 * 4.33;
    else if (commuteType === "transit") transportVal = commuteDist * 0.08 * 4.33;

    let dietVal = 7.26 * 30.4; // high meat
    if (diet === "veggie") dietVal = 3.81 * 30.4;
    else if (diet === "vegan") dietVal = 2.89 * 30.4;

    let shoppingVal = 180.0;
    if (shopping === "heavy") shoppingVal = 350.0;
    else if (shopping === "minimalist") shoppingVal = 50.0;

    const totalHome = (250 * 0.38 + 50 * 0.18) / 2; // average home share

    return Math.round(transportVal + dietVal + shoppingVal + totalHome);
  };

  const currentEstimate = calculateQuickEstimate();
  const usAverage = 1300;
  const globalTarget = 160;

  return (
    <div className="flex flex-col space-y-20 pb-12">
      {/* 1. Hero & Value Proposition */}
      <section className="relative pt-10 pb-8 md:pt-16 flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 flex flex-col space-y-6 text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 w-max">
            <Sparkles className="h-3 w-3" />
            <span>Lightweight Personal Carbon Coaching</span>
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-tight text-white">
            Understand your carbon footprint.
            <span className="block text-gradient-cyan mt-1 text-glow-green">
              Reduce it one simple action at a time.
            </span>
          </h1>

          <p className="text-gray-400 text-lg max-w-xl font-normal leading-relaxed">
            CarbonPulse turns daily habits into simple, personalized insights. No complicated utility bills required—just quick presets and a supportive, rule-based coach.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
            <Link
              href="/onboarding"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-[#090d16] font-display shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 group font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Start Onboarding
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <button
              disabled={seeding}
              onClick={handleSeed}
              aria-label={seeding ? "Loading demo dashboard, please wait" : "Explore demo dashboard with sample data"}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              {seeding ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" aria-hidden="true" />
                  Seeding Demo Data...
                </>
              ) : (
                "Explore Demo Dashboard"
              )}
            </button>
          </div>

          <div className="flex items-center space-x-4 pt-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1.5">
              <Shield className="h-4 w-4 text-cyan-500" />
              <span>100% Privacy-Conscious Local Storage</span>
            </div>
            <span>•</span>
            <span>Based on IPCC Research Data</span>
          </div>
        </div>

        {/* 2. Interactive Footprint Estimator Card */}
        <div className="w-full lg:w-[480px] glass-panel rounded-3xl p-6 sm:p-8 flex flex-col space-y-6 relative overflow-hidden border-white/10">
          <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/10 rounded-full filter blur-xl pointer-events-none"></div>

          <div>
            <h3 className="font-display font-bold text-lg text-white">Interactive Pulse Check</h3>
            <p className="text-xs text-gray-400">See your approximate footprint in real-time</p>
          </div>

          {/* Controls */}
          <div className="flex flex-col space-y-4 text-sm">
            {/* Commute Type & Distance */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-300">
                <span>Commute Distance:</span>
                <span className="text-emerald-400 font-semibold">{commuteDist} km/week</span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                step="25"
                value={commuteDist}
                onChange={(e) => setCommuteDist(Number(e.target.value))}
                aria-label={`Commute distance: ${commuteDist} km per week`}
                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="grid grid-cols-4 gap-1 pt-1">
                {(["petrol", "ev", "transit", "none"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setCommuteType(type)}
                    aria-label={`Commute by ${type === "petrol" ? "petrol car" : type === "ev" ? "electric vehicle" : type === "transit" ? "public transit" : "no commute"}`}
                    aria-pressed={commuteType === type}
                    className={`px-1 py-1 rounded text-xs border text-center capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      commuteType === type
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-semibold"
                        : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Diet Pattern */}
            <div className="space-y-2">
              <label htmlFor="diet-select" className="text-xs text-gray-300 block">Diet Pattern:</label>
              <div className="grid grid-cols-3 gap-1" role="group" aria-labelledby="diet-label">
                {(["meat", "veggie", "vegan"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDiet(d)}
                    aria-label={`${d === "meat" ? "Meat Lover" : d === "veggie" ? "Vegetarian" : "Vegan"} diet pattern`}
                    aria-pressed={diet === d}
                    className={`px-2 py-1 rounded text-xs border text-center capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      diet === d
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-semibold"
                        : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    {d === "meat" ? "Meat Lover" : d === "veggie" ? "Vegetarian" : "Vegan"}
                  </button>
                ))}
              </div>
            </div>

            {/* Shopping Pattern */}
            <div className="space-y-2">
              <label htmlFor="shopping-select" className="text-xs text-gray-300 block">Shopping Pattern:</label>
              <div className="grid grid-cols-3 gap-1" role="group" aria-labelledby="shopping-label">
                {(["heavy", "moderate", "minimalist"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setShopping(s)}
                    aria-label={`${s} shopping pattern`}
                    aria-pressed={shopping === s}
                    className={`px-2 py-1 rounded text-xs border text-center capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      shopping === s
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-semibold"
                        : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 block font-medium">Estimated Emissions</span>
              <span className="font-display font-extrabold text-3xl text-white">
                {currentEstimate} <span className="text-xs font-normal text-gray-400">kg CO₂e/mo</span>
              </span>
            </div>
            <div className="text-right">
              {currentEstimate > usAverage * 0.7 ? (
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                  Above Target
                </span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  Eco Efficient
                </span>
              )}
            </div>
          </div>

          {/* Simple Visual Comparison Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>Global Target ({globalTarget}kg)</span>
              <span>US Average ({usAverage}kg)</span>
            </div>
            <div className="w-full h-3 bg-gray-950 rounded-full overflow-hidden flex relative">
              {/* Target Marker */}
              <div
                className="absolute top-0 bottom-0 border-r border-emerald-400/80 z-10"
                style={{ left: `${(globalTarget / usAverage) * 100}%` }}
              ></div>
              {/* User estimate block */}
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                style={{ width: `${Math.min(100, (currentEstimate / usAverage) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Problem Statement & Research Foundation */}
      <section className="grid md:grid-cols-2 gap-12 items-center border-t border-white/5 pt-16">
        <div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white">
            Why CarbonPulse is different.
          </h2>
          <p className="text-gray-400 mt-4 leading-relaxed">
            Many ecological calculators overwhelm users with highly technical demands—such as asking for specific therms of gas or raw electric bills. 
          </p>
          <p className="text-gray-400 mt-3 leading-relaxed">
            Scientific studies show that carbon footprint calculators raise awareness, but behavior changes depend on getting **tailored, micro-feedback** and **manageable daily recommendations**. CarbonPulse is built as a coach, focusing you on the single, highest-yield habit changes that fit your budget.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-panel rounded-2xl p-5 border-white/5 flex flex-col space-y-3">
            <Leaf className="h-6 w-6 text-emerald-400" />
            <h4 className="font-semibold text-white text-sm">Micro-Doses</h4>
            <p className="text-xs text-gray-400">Receive exactly one custom recommendation at a time to stay focused.</p>
          </div>
          <div className="glass-panel rounded-2xl p-5 border-white/5 flex flex-col space-y-3">
            <BarChart3 className="h-6 w-6 text-cyan-400" />
            <h4 className="font-semibold text-white text-sm">Visual Trends</h4>
            <p className="text-xs text-gray-400">Watch weekly charts shift downward as you log positive presets.</p>
          </div>
          <div className="glass-panel rounded-2xl p-5 border-white/5 flex flex-col space-y-3">
            <Shield className="h-6 w-6 text-emerald-400" />
            <h4 className="font-semibold text-white text-sm">Total Privacy</h4>
            <p className="text-xs text-gray-400">All data stays in your local browser sandbox. No tracking files.</p>
          </div>
          <div className="glass-panel rounded-2xl p-5 border-white/5 flex flex-col space-y-3">
            <Settings className="h-6 w-6 text-cyan-400" />
            <h4 className="font-semibold text-white text-sm">Operations Panel</h4>
            <p className="text-xs text-gray-400">Modify emission factors dynamically as scientific coefficients evolve.</p>
          </div>
        </div>
      </section>

      {/* 4. CTA Banner */}
      <section className="glass-panel rounded-3xl p-8 sm:p-12 border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 bg-gradient-to-r from-emerald-950/25 via-slate-900/40 to-cyan-950/25 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none"></div>
        <div className="space-y-4 max-w-xl text-left relative z-10">
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
            Ready to establish your baseline?
          </h2>
          <p className="text-gray-400 text-sm">
            Complete our 1-minute questionnaire to customize your coach, define your target goals, and get your first carbon reduction action.
          </p>
        </div>
        <Link
          href="/onboarding"
          className="w-full md:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl bg-white text-[#090d16] hover:bg-gray-100 font-display transition-all hover:scale-105 active:scale-95 shadow-lg relative z-10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          Setup My Profile
        </Link>
      </section>
    </div>
  );
}
