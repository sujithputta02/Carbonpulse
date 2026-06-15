import { describe, it, expect } from "vitest";
import { generateWeeklyInsight, generatePersonalizedExplanation, getNextBestAction } from "../lib/recommendations/generateInsight";
import { onboardingSchema, logActivitySchema } from "../lib/validation/onboardingSchema";
import { UserProfile } from "../types/user";
import { ActivityLog, Goal } from "../types/activity";

const mockProfile: UserProfile = {
  id: "u1",
  name: "Sarah",
  location: "New York",
  householdSize: 1,
  goals: ["SAVE_MONEY"],
  budgetSensitivity: "HIGH",
  commuteType: "CAR_PETROL",
  dietPattern: "HIGH_MEAT",
  baselineFootprint: 500,
  createdAt: "",
  updatedAt: "",
};

describe("Dynamic Insights Generator", () => {
  it("should calculate correct weekly direction and percentage shifts", () => {
    // Current week logs total = 50 + 20 = 70 kg
    // Previous week logs total = 100 kg
    const logs: ActivityLog[] = [
      { id: "1", userId: "u1", category: "TRANSPORT", actionType: "PETROL_CAR", amount: 10, date: new Date().toISOString(), estimatedCO2e: 50 },
      { id: "2", userId: "u1", category: "FOOD", actionType: "MEAT_MEAL", amount: 1, date: new Date().toISOString(), estimatedCO2e: 20 },
      // 10 days ago (previous week)
      { id: "3", userId: "u1", category: "TRANSPORT", actionType: "PETROL_CAR", amount: 20, date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), estimatedCO2e: 100 },
    ];

    const insight = generateWeeklyInsight(logs);

    expect(insight.direction).toBe("DOWN");
    expect(insight.percentChange).toBe(30); // |70 - 100| / 100 = 30%
    expect(insight.trendMessage).toContain("decreased by 30%");
  });

  it("should generate proper personalized text matching goals and sensitivity", () => {
    const tip = {
      id: "tip_walk_cycle",
      title: "Walk or cycle for short trips",
      category: "TRANSPORT" as const,
      reason: "Walk more",
      impactScore: 6,
      effortScore: 7,
      costScore: 10,
      potentialSavingsCO2e: 45,
      applicabilityRule: () => true,
    };

    const explanation = generatePersonalizedExplanation(tip, mockProfile, "TRANSPORT");
    expect(explanation).toContain("budget is tight");
    expect(explanation).toContain("100% free");
  });

  it("should select the next best action avoiding active goals", () => {
    const scoredTips = [
      { id: "t1", title: "Walk or cycle for short trips", category: "TRANSPORT" as const, reason: "", impactScore: 6, effortScore: 7, costScore: 10, potentialSavingsCO2e: 45, score: 9.5, applicabilityRule: () => true },
      { id: "t2", title: "Wash laundry in cold water", category: "ENERGY" as const, reason: "", impactScore: 3, effortScore: 10, costScore: 10, potentialSavingsCO2e: 15, score: 8.2, applicabilityRule: () => true },
    ];

    const activeGoals: Goal[] = [
      { id: "g1", userId: "u1", title: "Walk or cycle for short trips", category: "TRANSPORT", targetCO2e: 45, isCompleted: false, streakCount: 0, createdAt: "" },
    ];

    const nextAction = getNextBestAction(scoredTips, activeGoals);
    expect(nextAction).not.toBeNull();
    expect(nextAction!.id).toBe("t2"); // t1 is active goal, so select t2
  });
});

describe("Zod Schema Validation", () => {
  it("should validate full onboarding inputs correctly", () => {
    const validOnboarding = {
      name: "Alex",
      location: "New York, USA",
      householdSize: 2,
      goals: ["SAVE_MONEY"],
      budgetSensitivity: "MEDIUM",
      commuteType: "CAR_PETROL",
      commuteDistanceWeekly: 120,
      dietPattern: "LOW_MEAT",
      electricityMonthlyKwh: 200,
      naturalGasMonthlyKwh: 40,
      shoppingPattern: "MODERATE",
    };

    const result = onboardingSchema.safeParse(validOnboarding);
    expect(result.success).toBe(true);
  });

  it("should fail validation on invalid negative electric or commute quantity", () => {
    const invalidOnboarding = {
      name: "Alex",
      location: "New York, USA",
      householdSize: 2,
      goals: ["SAVE_MONEY"],
      budgetSensitivity: "MEDIUM",
      commuteType: "CAR_PETROL",
      commuteDistanceWeekly: -10, // Invalid!
      dietPattern: "LOW_MEAT",
      electricityMonthlyKwh: -200, // Invalid!
      naturalGasMonthlyKwh: 40,
      shoppingPattern: "MODERATE",
    };

    const result = onboardingSchema.safeParse(invalidOnboarding);
    expect(result.success).toBe(false);
  });

  it("should fail activity logging validation on zero or negative values", () => {
    const invalidLog = {
      category: "TRANSPORT",
      actionType: "PETROL_CAR",
      amount: -10, // Invalid!
    };

    const result = logActivitySchema.safeParse(invalidLog);
    expect(result.success).toBe(false);
  });
});
