import { describe, it, expect } from "vitest";
import { getRecommendedTips } from "../utils/recommender";
import { UserProfile } from "../utils/db";

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

describe("CarbonPulse Recommendation Engine", () => {
  it("should prioritize cheap energy/food saving tips for highly budget-sensitive users", () => {
    const categoryBreakdown = {
      transport: 100,
      food: 220, // highest category
      energy: 80,
      shopping: 100,
    };

    const recommendations = getRecommendedTips(mockProfile, categoryBreakdown);

    // Food is highest emissions source (42%)
    // User is highly budget-sensitive and wants to save money
    // "Try one meat-free day a week" should be ranked extremely high
    // (category match = food, costScore = 10, goal matches save_money)
    
    expect(recommendations.length).toBeGreaterThan(0);
    const topTip = recommendations[0];
    
    // The top tip should be related to food or extremely high cost-savings
    expect(topTip.costScore).toBeGreaterThanOrEqual(9);
    expect(topTip.category === "FOOD" || topTip.category === "TRANSPORT" || topTip.category === "ENERGY").toBe(true);
  });

  it("should filter out carpool or transit tips if user does not commute", () => {
    const nonCommuterProfile: UserProfile = {
      ...mockProfile,
      commuteType: "NONE",
    };

    const categoryBreakdown = {
      transport: 0,
      food: 150,
      energy: 100,
      shopping: 80,
    };

    const recommendations = getRecommendedTips(nonCommuterProfile, categoryBreakdown);

    // Should not include carpooling or public transit suggestions since commuteType is NONE
    const hasCarpool = recommendations.some((r) => r.id === "tip_carpool");
    const hasTransit = recommendations.some((r) => r.id === "tip_public_transit");

    expect(hasCarpool).toBe(false);
    expect(hasTransit).toBe(false);
  });
});
