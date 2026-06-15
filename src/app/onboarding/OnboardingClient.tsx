"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "../actions";
import { ArrowLeft, ArrowRight, Check, Leaf, Info, Loader2 } from "lucide-react";

// Types for form state
interface FormState {
  name: string;
  location: string;
  householdSize: number;
  goals: string[];
  budgetSensitivity: "LOW" | "MEDIUM" | "HIGH";
  commuteType: "CAR_PETROL" | "CAR_DIESEL" | "EV" | "TRANSIT" | "NONE";
  commuteDistanceWeekly: number;
  dietPattern: "HIGH_MEAT" | "LOW_MEAT" | "VEGETARIAN" | "VEGAN";
  electricityMonthlyKwh: number;
  naturalGasMonthlyKwh: number;
  shoppingPattern: "HEAVY" | "MODERATE" | "MINIMALIST";
}

const DEFAULT_STATE: FormState = {
  name: "",
  location: "United States",
  householdSize: 1,
  goals: ["SAVE_MONEY", "REDUCE_EMISSIONS"],
  budgetSensitivity: "MEDIUM",
  commuteType: "CAR_PETROL",
  commuteDistanceWeekly: 100,
  dietPattern: "LOW_MEAT",
  electricityMonthlyKwh: 250,
  naturalGasMonthlyKwh: 50,
  shoppingPattern: "MODERATE",
};

export default function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 1. Load draft from localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem("carbonpulse_onboarding_draft");
      if (savedDraft) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData(JSON.parse(savedDraft));
      }
    } catch (e) {
      console.error("Failed to load onboarding draft", e);
    }
  }, []);

  // 2. Save draft to localStorage on change
  const updateForm = (fields: Partial<FormState>) => {
    setFormData((prev) => {
      const next = { ...prev, ...fields };
      try {
        localStorage.setItem("carbonpulse_onboarding_draft", JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save onboarding draft", e);
      }
      return next;
    });
    // Clear field error if any
    const updatedKeys = Object.keys(fields);
    if (updatedKeys.length > 0) {
      setErrors((prev) => {
        const next = { ...prev };
        updatedKeys.forEach((k) => delete next[k]);
        return next;
      });
    }
  };

  // Step Validation
  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = "Nickname or name is required";
      if (!formData.location.trim()) newErrors.location = "Location is required";
      if (formData.householdSize < 1) newErrors.householdSize = "Household size must be at least 1";
    } else if (step === 2) {
      if (formData.commuteType !== "NONE" && formData.commuteDistanceWeekly < 0) {
        newErrors.commuteDistanceWeekly = "Distance cannot be negative";
      }
    } else if (step === 4) {
      if (formData.electricityMonthlyKwh < 0) newErrors.electricityMonthlyKwh = "Electricity cannot be negative";
      if (formData.naturalGasMonthlyKwh < 0) newErrors.naturalGasMonthlyKwh = "Natural Gas cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleGoalToggle = (goal: string) => {
    const active = formData.goals.includes(goal);
    const updatedGoals = active
      ? formData.goals.filter((g) => g !== goal)
      : [...formData.goals, goal];
    updateForm({ goals: updatedGoals });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    setLoading(true);
    try {
      await saveProfile(formData);
      // Clear draft
      localStorage.removeItem("carbonpulse_onboarding_draft");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setErrors({ submit: "Failed to save profile. Please try again." });
      setLoading(false);
    }
  };

  const stepsCount = 5;
  const progressPercent = (step / stepsCount) * 100;

  return (
    <div className="max-w-2xl mx-auto w-full flex flex-col space-y-8 py-4 sm:py-8">
      {/* Top Banner Indicator */}
      <div className="flex flex-col space-y-3">
        <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-emerald-400">
          <span>Profile Onboarding</span>
          <span>Step {step} of {stepsCount}</span>
        </div>
        <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Main Glass Form Card */}
      <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 sm:p-10 border-white/5 flex flex-col space-y-8 text-left">
        {errors.submit && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-sm font-medium">
            {errors.submit}
          </div>
        )}

        {/* STEP 1: Personal Details */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="font-display font-extrabold text-2xl text-white">Let&apos;s start with the basics</h2>
              <p className="text-sm text-gray-400">Introduce yourself so the CarbonPulse coach can personalize your dashboard.</p>
            </div>

            <div className="flex flex-col space-y-4">
              <div className="space-y-2">
                <label htmlFor="name-input" className="text-sm font-semibold text-gray-300">What should we call you?</label>
                <input
                  id="name-input"
                  type="text"
                  placeholder="e.g. Sarah"
                  value={formData.name}
                  onChange={(e) => updateForm({ name: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl bg-slate-950/60 border ${
                    errors.name ? "border-rose-500/50 focus:border-rose-500" : "border-white/10 focus:border-emerald-500"
                  } text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/25 transition-all`}
                />
                {errors.name && <p className="text-xs text-rose-400 font-semibold mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="location-input" className="text-sm font-semibold text-gray-300">Location (Country or State)</label>
                  <input
                    id="location-input"
                    type="text"
                    placeholder="e.g. New York, USA"
                    value={formData.location}
                    onChange={(e) => updateForm({ location: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="household-size-input" className="text-sm font-semibold text-gray-300">Household Size</label>
                  <input
                    id="household-size-input"
                    type="number"
                    min="1"
                    value={formData.householdSize}
                    onChange={(e) => updateForm({ householdSize: Math.max(1, Number(e.target.value)) })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all font-semibold"
                  />
                  <span className="text-[11px] text-gray-500">Shared utility carbon is split among members.</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-sm font-semibold text-gray-300">Budget sensitivity for recommendations</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["LOW", "MEDIUM", "HIGH"] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => updateForm({ budgetSensitivity: level })}
                      className={`py-3 px-4 rounded-xl border text-sm font-semibold text-center transition-all ${
                        formData.budgetSensitivity === level
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
        )}

        {/* STEP 2: Transit & Commute */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="font-display font-extrabold text-2xl text-white">Commute & Travel</h2>
              <p className="text-sm text-gray-400">Transport is often the largest single source of carbon. Let&apos;s map your week.</p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
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
                      onClick={() => updateForm({ commuteType: option.key as FormState["commuteType"] })}
                      className={`py-3 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                        formData.commuteType === option.key
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                          : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {formData.commuteType !== "NONE" && (
                <div className="space-y-2">
                  <label htmlFor="commute-dist-input" className="text-sm font-semibold text-gray-300">Estimated weekly commute distance (km)</label>
                  <div className="flex items-center space-x-4">
                    <input
                      id="commute-dist-input"
                      type="number"
                      min="0"
                      value={formData.commuteDistanceWeekly}
                      onChange={(e) => updateForm({ commuteDistanceWeekly: Math.max(0, Number(e.target.value)) })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all font-semibold"
                    />
                    <span className="text-sm text-gray-400 font-semibold whitespace-nowrap">km / week</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="10"
                    value={formData.commuteDistanceWeekly}
                    onChange={(e) => updateForm({ commuteDistanceWeekly: Number(e.target.value) })}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Diet Pattern */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="font-display font-extrabold text-2xl text-white">Diet & Food Habits</h2>
              <p className="text-sm text-gray-400">Diet choices have a massive cumulative impact due to methane emissions and land footprint.</p>
            </div>

            <div className="space-y-4">
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
                  onClick={() => updateForm({ dietPattern: pattern.key as FormState["dietPattern"] })}
                  className={`w-full p-4 rounded-2xl border text-left flex items-start justify-between gap-4 transition-all ${
                    formData.dietPattern === pattern.key
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
        )}

        {/* STEP 4: Home Energy & Shopping */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="font-display font-extrabold text-2xl text-white">Home Energy & Shopping</h2>
              <p className="text-sm text-gray-400">Heating, cooling, and shopping frequency complete your initial baseline.</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="elec-input" className="text-sm font-semibold text-gray-300">Est. Electricity (kWh/mo)</label>
                  <input
                    id="elec-input"
                    type="number"
                    min="0"
                    value={formData.electricityMonthlyKwh}
                    onChange={(e) => updateForm({ electricityMonthlyKwh: Math.max(0, Number(e.target.value)) })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all font-semibold"
                  />
                  <span className="text-[10px] text-gray-500">Average apartment uses 150-300 kWh.</span>
                </div>

                <div className="space-y-2">
                  <label htmlFor="gas-input" className="text-sm font-semibold text-gray-300">Est. Natural Gas (kWh/mo)</label>
                  <input
                    id="gas-input"
                    type="number"
                    min="0"
                    value={formData.naturalGasMonthlyKwh}
                    onChange={(e) => updateForm({ naturalGasMonthlyKwh: Math.max(0, Number(e.target.value)) })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all font-semibold"
                  />
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
                      onClick={() => updateForm({ shoppingPattern: opt.key as FormState["shoppingPattern"] })}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                        formData.shoppingPattern === opt.key
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
        )}

        {/* STEP 5: Goals & Submit */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="font-display font-extrabold text-2xl text-white">Select Your Goals</h2>
              <p className="text-sm text-gray-400">Almost finished! Choose what matters most to adjust recommendation prioritization.</p>
            </div>

            <div className="space-y-4">
              {[
                { key: "SAVE_MONEY", label: "Save Money", desc: "Prioritize low-cost and utility bill reductions." },
                { key: "REDUCE_EMISSIONS", label: "Maximize Carbon Reductions", desc: "Prioritize high-impact changes regardless of effort." },
                { key: "BUILD_HABITS", label: "Build Sustainable Habits", desc: "Focus on simple, repeatable micro-actions first." },
              ].map((goal) => {
                const checked = formData.goals.includes(goal.key);
                return (
                  <button
                    key={goal.key}
                    type="button"
                    onClick={() => handleGoalToggle(goal.key)}
                    className={`w-full p-4 rounded-xl border text-left flex items-center justify-between gap-4 transition-all ${
                      checked
                        ? "bg-emerald-500/10 border-emerald-500"
                        : "bg-white/5 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="font-semibold text-white text-sm block">{goal.label}</span>
                      <span className="text-xs text-gray-400 block">{goal.desc}</span>
                    </div>
                    <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                      checked ? "bg-emerald-500 border-emerald-500 text-[#090d16]" : "border-white/20"
                    }`}>
                      {checked && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-start space-x-3 text-xs text-gray-400 leading-normal">
              <Info className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>
                By clicking Complete, CarbonPulse will calculate your baseline emissions, establish your tracking logs, and customize your recommendations. You can reset this configuration at any time.
              </p>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between border-t border-white/5 pt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </button>
          ) : (
            <div></div>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-[#090d16] font-display shadow-lg shadow-emerald-500/10 transition-all hover:scale-105 active:scale-95"
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-[#090d16] font-display shadow-lg shadow-emerald-500/10 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Calculating...
                </>
              ) : (
                <>
                  <Leaf className="mr-2 h-4 w-4" />
                  Complete Setup
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
