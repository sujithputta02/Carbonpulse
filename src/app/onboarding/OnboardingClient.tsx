"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "../actions";
import { ArrowLeft, ArrowRight, Leaf, Loader2 } from "lucide-react";
import { onboardingSchema } from "@/lib/validation/onboardingSchema";
import { UserProfile } from "@/types/user";

import PersonalStep from "@/features/onboarding/components/PersonalStep";
import TransitStep from "@/features/onboarding/components/TransitStep";
import DietStep from "@/features/onboarding/components/DietStep";
import EnergyStep from "@/features/onboarding/components/EnergyStep";
import GoalsStep from "@/features/onboarding/components/GoalsStep";

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
        setFormData(JSON.parse(savedDraft));
      }
    } catch (e) {
      console.error("Failed to load onboarding draft", e);
    }
  }, []);

  // 2. Save draft helper
  const updateField = (fields: Partial<FormState>) => {
    setFormData((prev) => {
      const next = { ...prev, ...fields };
      try {
        localStorage.setItem("carbonpulse_onboarding_draft", JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save onboarding draft", e);
      }
      return next;
    });

    // Clear specific errors
    const updatedKeys = Object.keys(fields);
    if (updatedKeys.length > 0) {
      setErrors((prev) => {
        const next = { ...prev };
        updatedKeys.forEach((k) => delete next[k]);
        return next;
      });
    }
  };

  // Zod validation per step
  const validateStep = (): boolean => {
    const stepErrors: Record<string, string> = {};

    if (step === 1) {
      const personalResult = onboardingSchema.pick({
        name: true,
        location: true,
        householdSize: true,
        budgetSensitivity: true,
      }).safeParse(formData);

      if (!personalResult.success) {
        personalResult.error.issues.forEach((err) => {
          if (err.path[0]) stepErrors[err.path[0] as string] = err.message;
        });
      }
    } else if (step === 2) {
      const transitResult = onboardingSchema.pick({
        commuteType: true,
        commuteDistanceWeekly: true,
      }).safeParse(formData);

      if (!transitResult.success) {
        transitResult.error.issues.forEach((err) => {
          if (err.path[0]) stepErrors[err.path[0] as string] = err.message;
        });
      }
    } else if (step === 4) {
      const energyResult = onboardingSchema.pick({
        electricityMonthlyKwh: true,
        naturalGasMonthlyKwh: true,
        shoppingPattern: true,
      }).safeParse(formData);

      if (!energyResult.success) {
        energyResult.error.issues.forEach((err) => {
          if (err.path[0]) stepErrors[err.path[0] as string] = err.message;
        });
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
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
    updateField({ goals: updatedGoals });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    // Validate the full schema on final submit
    const finalResult = onboardingSchema.safeParse(formData);
    if (!finalResult.success) {
      const finalErrors: Record<string, string> = {};
      finalResult.error.issues.forEach((err) => {
        if (err.path[0]) finalErrors[err.path[0] as string] = err.message;
      });
      setErrors(finalErrors);
      return;
    }

    setLoading(true);
    try {
      await saveProfile(formData);
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

        {step === 1 && (
          <PersonalStep
            name={formData.name}
            setName={(name) => updateField({ name })}
            location={formData.location}
            setLocation={(location) => updateField({ location })}
            householdSize={formData.householdSize}
            setHouseholdSize={(householdSize) => updateField({ householdSize })}
            budgetSensitivity={formData.budgetSensitivity}
            setBudgetSensitivity={(budgetSensitivity) => updateField({ budgetSensitivity })}
            errors={errors}
          />
        )}

        {step === 2 && (
          <TransitStep
            commuteType={formData.commuteType}
            setCommuteType={(commuteType) => updateField({ commuteType })}
            commuteDistanceWeekly={formData.commuteDistanceWeekly}
            setCommuteDistanceWeekly={(commuteDistanceWeekly) => updateField({ commuteDistanceWeekly })}
            errors={errors}
          />
        )}

        {step === 3 && (
          <DietStep
            dietPattern={formData.dietPattern}
            setDietPattern={(dietPattern) => updateField({ dietPattern })}
          />
        )}

        {step === 4 && (
          <EnergyStep
            electricityMonthlyKwh={formData.electricityMonthlyKwh}
            setElectricityMonthlyKwh={(electricityMonthlyKwh) => updateField({ electricityMonthlyKwh })}
            naturalGasMonthlyKwh={formData.naturalGasMonthlyKwh}
            setNaturalGasMonthlyKwh={(naturalGasMonthlyKwh) => updateField({ naturalGasMonthlyKwh })}
            shoppingPattern={formData.shoppingPattern}
            setShoppingPattern={(shoppingPattern) => updateField({ shoppingPattern })}
            errors={errors}
          />
        )}

        {step === 5 && (
          <GoalsStep
            goals={formData.goals}
            handleGoalToggle={handleGoalToggle}
          />
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between border-t border-white/5 pt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 transition-colors cursor-pointer"
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
              className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-[#090d16] font-display shadow-lg shadow-emerald-500/10 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-[#090d16] font-display shadow-lg shadow-emerald-500/10 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
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
