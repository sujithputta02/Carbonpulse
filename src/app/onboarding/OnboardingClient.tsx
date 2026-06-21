"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "../actions";
import { ArrowLeft, ArrowRight, Leaf, Loader2 } from "lucide-react";
import { onboardingSchema } from "@/lib/validation/onboardingSchema";
import { onboardingDraftSchema } from "@/lib/validation/storageSchemas";
import { UserProfile } from "@/types/user";
import { useFormStorage } from "@/hooks/useFormStorage";
import { logError, getErrorMessage } from "@/lib/clientErrors";
import AccessibleDialog from "@/components/AccessibleDialog";

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
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Use form storage hook for automatic localStorage persistence
  const {
    formData,
    updateField,
    clearStorage,
    errors: formErrors,
    getErrorMessage: getFieldError,
  } = useFormStorage<FormState>({
    storageKey: "carbonpulse_onboarding_draft",
    defaultValue: DEFAULT_STATE,
    schema: onboardingDraftSchema,
  });

  /**
   * Validate current step with Zod schema
   */
  const validateStep = useCallback((): boolean => {
    try {
      if (step === 1) {
        onboardingSchema.pick({
          name: true,
          location: true,
          householdSize: true,
          budgetSensitivity: true,
        }).parse(formData);
      } else if (step === 2) {
        onboardingSchema.pick({
          commuteType: true,
          commuteDistanceWeekly: true,
        }).parse(formData);
      } else if (step === 4) {
        onboardingSchema.pick({
          electricityMonthlyKwh: true,
          naturalGasMonthlyKwh: true,
          shoppingPattern: true,
        }).parse(formData);
      }
      return true;
    } catch (error) {
      logError(`Validation failed at step ${step}`, error, { step });
      return false;
    }
  }, [step, formData]);

  /**
   * Handle next step with validation
   */
  const handleNext = useCallback(() => {
    if (validateStep()) {
      setStep((prev) => Math.min(prev + 1, 5));
    }
  }, [validateStep]);

  /**
   * Handle previous step
   */
  const handleBack = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 1));
  }, []);

  /**
   * Handle goal toggle
   */
  const handleGoalToggle = useCallback((goal: string) => {
    updateField({
      goals: formData.goals.includes(goal)
        ? formData.goals.filter((g) => g !== goal)
        : [...formData.goals, goal],
    });
  }, [formData.goals, updateField]);

  /**
   * Handle form submission with full validation
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateStep()) return;

      // Validate full schema on final submit
      try {
        onboardingSchema.parse(formData);
      } catch (error) {
        logError("Final validation failed", error, { formData });
        return;
      }

      setLoading(true);
      try {
        await saveProfile(formData);
        clearStorage();
        router.push("/dashboard");
      } catch (err) {
        logError("Failed to save profile", err, { formData });
        setDialogOpen(true);
      } finally {
        setLoading(false);
      }
    },
    [formData, validateStep, clearStorage, router]
  );

  const stepsCount = 5;
  const progressPercent = (step / stepsCount) * 100;

  return (
    <div className="max-w-2xl mx-auto w-full flex flex-col space-y-8 py-4 sm:py-8">
      {/* Accessible dialog for errors */}
      <AccessibleDialog
        isOpen={dialogOpen}
        type="error"
        title="Setup Failed"
        message="Failed to save your profile. Please check your information and try again."
        primaryLabel="Try Again"
        onPrimary={() => setDialogOpen(false)}
      />

      {/* Top Banner Indicator with ARIA support */}
      <div className="flex flex-col space-y-3">
        <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-emerald-400">
          <span>Profile Onboarding</span>
          <span aria-live="polite" aria-atomic="true">
            Step {step} of {stepsCount}
          </span>
        </div>
        <div
          className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Onboarding progress"
        >
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Main Glass Form Card */}
      <form
        onSubmit={handleSubmit}
        className="glass-panel rounded-3xl p-6 sm:p-10 border-white/5 flex flex-col space-y-8 text-left"
      >
        {step === 1 && (
          <PersonalStep
            name={formData.name}
            setName={(name) => updateField({ name })}
            location={formData.location}
            setLocation={(location) => updateField({ location })}
            householdSize={formData.householdSize}
            setHouseholdSize={(householdSize) => updateField({ householdSize })}
            budgetSensitivity={formData.budgetSensitivity}
            setBudgetSensitivity={(budgetSensitivity) =>
              updateField({ budgetSensitivity })
            }
            errors={{
              name: getFieldError("name") ?? "",
              location: getFieldError("location") ?? "",
              householdSize: getFieldError("householdSize") ?? "",
              budgetSensitivity: getFieldError("budgetSensitivity") ?? "",
            }}
          />
        )}

        {step === 2 && (
          <TransitStep
            commuteType={formData.commuteType}
            setCommuteType={(commuteType) => updateField({ commuteType })}
            commuteDistanceWeekly={formData.commuteDistanceWeekly}
            setCommuteDistanceWeekly={(commuteDistanceWeekly) =>
              updateField({ commuteDistanceWeekly })
            }
            errors={{
              commuteType: getFieldError("commuteType") ?? "",
              commuteDistanceWeekly: getFieldError("commuteDistanceWeekly") ?? "",
            }}
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
            setElectricityMonthlyKwh={(electricityMonthlyKwh) =>
              updateField({ electricityMonthlyKwh })
            }
            naturalGasMonthlyKwh={formData.naturalGasMonthlyKwh}
            setNaturalGasMonthlyKwh={(naturalGasMonthlyKwh) =>
              updateField({ naturalGasMonthlyKwh })
            }
            shoppingPattern={formData.shoppingPattern}
            setShoppingPattern={(shoppingPattern) =>
              updateField({ shoppingPattern })
            }
            errors={{
              electricityMonthlyKwh: getFieldError("electricityMonthlyKwh") ?? "",
              naturalGasMonthlyKwh: getFieldError("naturalGasMonthlyKwh") ?? "",
              shoppingPattern: getFieldError("shoppingPattern") ?? "",
            }}
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
              aria-label={`Go back to step ${step - 1}`}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Back
            </button>
          ) : (
            <div></div>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              aria-label={`Continue to step ${step + 1}`}
              className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-[#090d16] font-display shadow-lg shadow-emerald-500/10 transition-all hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              aria-label={
                loading ? "Completing setup" : "Finish setting up your profile"
              }
              className="inline-flex items-center px-6 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-[#090d16] font-display shadow-lg shadow-emerald-500/10 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              {loading ? (
                <>
                  <Loader2
                    className="animate-spin mr-2 h-4 w-4"
                    aria-hidden="true"
                  />
                  Calculating...
                </>
              ) : (
                <>
                  <Leaf className="mr-2 h-4 w-4" aria-hidden="true" />
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
