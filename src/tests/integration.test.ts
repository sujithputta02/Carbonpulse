import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { calculateBaseline, calculateActivityCO2e } from "../lib/carbon/calculateFootprint";
import { getRecommendedTips, filterTipsByAttributes } from "../lib/recommendations/rankActions";
import { generateWeeklyInsight, getNextBestAction } from "../lib/recommendations/generateInsight";
import { onboardingSchema, logActivitySchema } from "../lib/validation/onboardingSchema";
import { ActivityLog, Goal, EmissionFactor } from "../types/activity";
import { UserProfile } from "../types/user";

// Mock factors
const mockFactors: EmissionFactor[] = [
  { id: "f1", category: "TRANSPORT", key: "CAR_PETROL", value: 0.27, unit: "kg/km", updatedAt: "" },
  { id: "f2", category: "TRANSPORT", key: "EV", value: 0.05, unit: "kg/km", updatedAt: "" },
  { id: "f3", category: "FOOD", key: "DIET_HIGH_MEAT", value: 7.26, unit: "kg/day", updatedAt: "" },
  { id: "f4", category: "FOOD", key: "DIET_VEGAN", value: 2.89, unit: "kg/day", updatedAt: "" },
  { id: "f5", category: "ENERGY", key: "ELECTRICITY", value: 0.38, unit: "kg/kWh", updatedAt: "" },
  { id: "f6", category: "ENERGY", key: "NATURAL_GAS", value: 0.18, unit: "kg/kWh", updatedAt: "" },
  { id: "f7", category: "SHOPPING", key: "CONSUMER_HEAVY", value: 350.0, unit: "kg/month", updatedAt: "" },
  { id: "f8", category: "SHOPPING", key: "CONSUMER_MODERATE", value: 180.0, unit: "kg/month", updatedAt: "" },
];

describe("Integration: Onboarding -> Activity Tracking -> Coach Insights", () => {
  it("should simulate a full user lifecycle flow with correct calculations", () => {
    // 1. User completes Onboarding
    const onboardingInput = {
      name: "John Doe",
      location: "California, USA",
      householdSize: 2,
      goals: ["SAVE_MONEY", "REDUCE_EMISSIONS"],
      budgetSensitivity: "HIGH" as const,
      commuteType: "CAR_PETROL" as const,
      commuteDistanceWeekly: 150, // 150 km per week
      dietPattern: "HIGH_MEAT" as const,
      electricityMonthlyKwh: 300,
      naturalGasMonthlyKwh: 80,
      shoppingPattern: "MODERATE" as const,
    };

    // Validate schema
    const parsed = onboardingSchema.parse(onboardingInput);
    expect(parsed.name).toBe("John Doe");

    // Calculate baseline
    const baseline = calculateBaseline(parsed, mockFactors);
    // Transport: 150 * 4.333 * 0.27 = 175.5
    // Food: 7.26 * 30.4 = 220.7
    // Energy: (300 * 0.38 + 80 * 0.18) / 2 = 64.2
    // Shopping: 180
    // Total = ~640.4
    expect(baseline.total).toBeCloseTo(640.4, 1);
    expect(baseline.transport).toBeCloseTo(175.5, 1);
    expect(baseline.food).toBeCloseTo(220.7, 1);
    expect(baseline.energy).toBeCloseTo(64.2, 1);
    expect(baseline.shopping).toBe(180);

    // Save profile representation
    const profile: UserProfile = {
      id: "u_test_1",
      name: parsed.name,
      location: parsed.location,
      householdSize: parsed.householdSize,
      goals: parsed.goals,
      budgetSensitivity: parsed.budgetSensitivity,
      commuteType: parsed.commuteType,
      dietPattern: parsed.dietPattern,
      baselineFootprint: baseline.total,
      createdAt: "",
      updatedAt: "",
    };

    // 2. User logs daily activities during the month
    const loggedActivitiesInput = [
      { category: "TRANSPORT" as const, actionType: "PETROL_CAR", amount: 50 },
      { category: "FOOD" as const, actionType: "VEGAN_MEAL", amount: 3 },
      { category: "ENERGY" as const, actionType: "ELECTRICITY", amount: 15 },
    ];

    const logs: ActivityLog[] = loggedActivitiesInput.map((input, index) => {
      const validated = logActivitySchema.parse(input);
      const co2e = calculateActivityCO2e(validated.category, validated.actionType, validated.amount, mockFactors);
      return {
        id: `log_${index}`,
        userId: profile.id,
        category: validated.category,
        actionType: validated.actionType,
        amount: validated.amount,
        date: new Date().toISOString(),
        estimatedCO2e: co2e,
      };
    });

    // Check individual logs
    expect(logs[0].estimatedCO2e).toBe(13.5); // 50 km * 0.27
    expect(logs[1].estimatedCO2e).toBeCloseTo(2.89, 1); // 3 meals * (2.89 / 3) = 2.89
    expect(logs[2].estimatedCO2e).toBe(5.7); // 15 kWh * 0.38

    const totalMonthEmissions = logs.reduce((sum, l) => sum + l.estimatedCO2e, 0);
    expect(totalMonthEmissions).toBeCloseTo(22.09, 1);

    // 3. User checks insights recommendations
    const recommendations = getRecommendedTips(profile, baseline);
    expect(recommendations.length).toBeGreaterThan(0);

    // Budget sensitivity is HIGH, so cheap/saves money tips should score higher
    const budgetFriendly = filterTipsByAttributes(recommendations, "BUDGET_FRIENDLY");
    expect(budgetFriendly.length).toBeGreaterThan(0);
    expect(budgetFriendly[0].costScore).toBeGreaterThanOrEqual(8);

    // 4. Generate Coach dynamic weekly trend comparisons
    // Mock last week's logs (high commute driving) vs this week's logs
    const mockHistoricLogs: ActivityLog[] = [
      ...logs,
      // Previous week logs (days 8-14 ago) - drove 200 km
      {
        id: "prev_log",
        userId: profile.id,
        category: "TRANSPORT",
        actionType: "PETROL_CAR",
        amount: 200,
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedCO2e: 54, // 200 * 0.27
      }
    ];

    const weeklyInsight = generateWeeklyInsight(mockHistoricLogs);
    // This week = 22.09 kg, Prev week = 54 kg. Down by ~59%.
    expect(weeklyInsight.direction).toBe("DOWN");
    expect(weeklyInsight.percentChange).toBe(59);
    expect(weeklyInsight.trendMessage).toContain("decreased by 59%");

    // 5. Select Next Best Action
    const activeGoals: Goal[] = [
      { id: "g_active", userId: profile.id, title: recommendations[0].title, category: "GENERAL", targetCO2e: 10, isCompleted: false, streakCount: 0, createdAt: "" }
    ];

    const nextAction = getNextBestAction(recommendations, activeGoals);
    // Top recommendation should NOT be the one already in active goals
    expect(nextAction).not.toBeNull();
    expect(nextAction!.title).not.toBe(recommendations[0].title);
  });
});

describe("Accessibility Audit: Form Labels and Landmarks Static Verification", () => {
  it("should statically verify onboarding steps have HTML labels and inputs matching IDs", () => {
    const onboardingFolder = path.join(process.cwd(), "src/features/onboarding/components");
    const files = fs.readdirSync(onboardingFolder);
    
    expect(files.length).toBeGreaterThan(0);

    files.forEach((file) => {
      const filePath = path.join(onboardingFolder, file);
      const content = fs.readFileSync(filePath, "utf8");

      // Verify that if there is an <input> or <select>, there is also an htmlFor matching label
      const inputIdMatches = content.match(/id="([^"]+)"/g);
      const labelHtmlForMatches = content.match(/htmlFor="([^"]+)"/g);

      if (inputIdMatches && labelHtmlForMatches) {
        const inputIds = inputIdMatches.map(m => m.replace(/id="|"/g, ""));
        const labelHtmlFors = labelHtmlForMatches.map(m => m.replace(/htmlFor="|"/g, ""));

        // Check that every label target corresponds to a valid input ID in the file
        labelHtmlFors.forEach((htmlFor) => {
          expect(inputIds).toContain(htmlFor);
        });
      }
    });
  });

  it("should statically verify layout has landmarks and skip bypass links", () => {
    const layoutPath = path.join(process.cwd(), "src/app/layout.tsx");
    const content = fs.readFileSync(layoutPath, "utf8");

    // Landmarks verification
    expect(content).toContain("<header");
    expect(content).toContain("<nav");
    expect(content).toContain("<main");
    expect(content).toContain("<footer");

    // SkipLink component verification
    expect(content).toContain("<SkipLink />");
    expect(content).toContain('id="main-content"');
  });
});
