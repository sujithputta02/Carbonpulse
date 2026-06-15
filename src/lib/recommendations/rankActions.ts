import { UserProfile } from "@/types/user";
import { Tip, ScoredTip } from "@/types/recommendation";

export const TIPS: Tip[] = [
  {
    id: "tip_walk_cycle",
    title: "Walk or cycle for short trips",
    category: "TRANSPORT",
    reason: "Your commute distance is short, and walking or cycling is completely carbon-free and saves on fuel costs.",
    impactScore: 6,
    effortScore: 7,
    costScore: 10,
    potentialSavingsCO2e: 45,
    applicabilityRule: (profile) => {
      return profile.commuteType !== "NONE" && profile.commuteType !== "EV";
    },
  },
  {
    id: "tip_carpool",
    title: "Carpool to work twice a week",
    category: "TRANSPORT",
    reason: "Commuting by car contributes significantly to your footprint. Sharing rides splits emissions and travel expenses.",
    impactScore: 7,
    effortScore: 6,
    costScore: 9,
    potentialSavingsCO2e: 75,
    applicabilityRule: (profile) => profile.commuteType === "CAR_PETROL" || profile.commuteType === "CAR_DIESEL",
  },
  {
    id: "tip_public_transit",
    title: "Commute by bus or train",
    category: "TRANSPORT",
    reason: "Public transit has a much lower carbon footprint per passenger-km compared to single-occupancy fossil fuel vehicles.",
    impactScore: 8,
    effortScore: 5,
    costScore: 8,
    potentialSavingsCO2e: 110,
    applicabilityRule: (profile) => profile.commuteType === "CAR_PETROL" || profile.commuteType === "CAR_DIESEL",
  },
  {
    id: "tip_meatless_day",
    title: "Try one meat-free day a week",
    category: "FOOD",
    reason: "Animal-based agriculture (especially beef) generates heavy methane. Reducing meat intake by just one day a week saves carbon.",
    impactScore: 5,
    effortScore: 9,
    costScore: 10,
    potentialSavingsCO2e: 28,
    applicabilityRule: (profile) => profile.dietPattern === "HIGH_MEAT" || profile.dietPattern === "LOW_MEAT",
  },
  {
    id: "tip_vegetarian",
    title: "Transition to a vegetarian diet",
    category: "FOOD",
    reason: "Eating a vegetarian diet reduces food emissions by nearly half compared to standard heavy-meat diets.",
    impactScore: 8,
    effortScore: 4,
    costScore: 9,
    potentialSavingsCO2e: 100,
    applicabilityRule: (profile) => profile.dietPattern === "HIGH_MEAT" || profile.dietPattern === "LOW_MEAT",
  },
  {
    id: "tip_vegan",
    title: "Explore plant-based eating (vegan)",
    category: "FOOD",
    reason: "A fully plant-based diet has the lowest carbon, land, and water footprint of any dietary pattern.",
    impactScore: 9,
    effortScore: 2,
    costScore: 9,
    potentialSavingsCO2e: 130,
    applicabilityRule: (profile) => profile.dietPattern !== "VEGAN",
  },
  {
    id: "tip_cold_wash",
    title: "Wash laundry in cold water",
    category: "ENERGY",
    reason: "Heating water accounts for 75-90% of the energy used by washing machines. Switching to cold water reduces electricity bills and carbon.",
    impactScore: 3,
    effortScore: 10,
    costScore: 10,
    potentialSavingsCO2e: 15,
    applicabilityRule: () => true,
  },
  {
    id: "tip_thermostat",
    title: "Adjust your thermostat by 2°F",
    category: "ENERGY",
    reason: "Lowering heating by 2°F in winter or raising AC by 2°F in summer yields significant savings in gas and electric emissions.",
    impactScore: 5,
    effortScore: 9,
    costScore: 10,
    potentialSavingsCO2e: 35,
    applicabilityRule: () => true,
  },
  {
    id: "tip_smart_thermostat",
    title: "Upgrade to a smart thermostat",
    category: "ENERGY",
    reason: "Smart thermostats optimize heating and cooling schedules, reducing energy waste while you are away or asleep.",
    impactScore: 6,
    effortScore: 6,
    costScore: 5,
    potentialSavingsCO2e: 55,
    applicabilityRule: (profile) => profile.budgetSensitivity !== "HIGH",
  },
  {
    id: "tip_secondhand",
    title: "Buy secondhand clothing and goods",
    category: "SHOPPING",
    reason: "Manufacturing new products generates heavy manufacturing and transit emissions. Buying used circular items extends product lifespans.",
    impactScore: 7,
    effortScore: 7,
    costScore: 10,
    potentialSavingsCO2e: 70,
    applicabilityRule: (profile) => profile.dietPattern !== undefined,
  },
  {
    id: "tip_electronics",
    title: "Extend the life of your digital gadgets",
    category: "SHOPPING",
    reason: "Electronics represent a high carbon footprint due to rare mineral extraction and manufacturing. Keeping your phone for 4 years instead of 2 cuts its footprint in half.",
    impactScore: 8,
    effortScore: 8,
    costScore: 10,
    potentialSavingsCO2e: 140,
    applicabilityRule: (profile) => profile.dietPattern !== undefined,
  },
];

/**
 * Ranks all available tips for the user based on profile traits and current category breakdown.
 */
export function getRecommendedTips(
  profile: UserProfile,
  categoryBreakdown: { transport: number; food: number; energy: number; shopping: number }
): ScoredTip[] {
  // 1. Identify the user's highest emissions category
  let highestCategory: "TRANSPORT" | "FOOD" | "ENERGY" | "SHOPPING" = "TRANSPORT";
  let maxVal = categoryBreakdown.transport;
  
  if (categoryBreakdown.food > maxVal) {
    highestCategory = "FOOD";
    maxVal = categoryBreakdown.food;
  }
  if (categoryBreakdown.energy > maxVal) {
    highestCategory = "ENERGY";
    maxVal = categoryBreakdown.energy;
  }
  if (categoryBreakdown.shopping > maxVal) {
    highestCategory = "SHOPPING";
  }

  // 2. Score each tip based on rules
  const scored = TIPS.filter((tip) => tip.applicabilityRule(profile, categoryBreakdown))
    .map((tip) => {
      let score = 0;

      // Rule A: Highlight highest emissions source (40% weight / +4 points)
      if (tip.category === highestCategory) {
        score += 4.0;
      }

      // Rule B: Match budget sensitivity (30% weight / +3 points)
      if (profile.budgetSensitivity === "HIGH") {
        if (tip.costScore >= 8) {
          score += 3.0;
        } else if (tip.costScore <= 5) {
          score -= 3.0;
        }
      } else if (profile.budgetSensitivity === "LOW") {
        if (tip.costScore <= 6) {
          score += 2.0;
        }
      } else {
        if (tip.costScore >= 7) {
          score += 1.5;
        }
      }

      // Rule C: Match goals (30% weight / +3 points)
      if (profile.goals.includes("SAVE_MONEY") && tip.costScore >= 9) {
        score += 3.0;
      }
      if (profile.goals.includes("REDUCE_EMISSIONS") && tip.impactScore >= 8) {
        score += 2.0;
      }
      if (profile.goals.includes("BUILD_HABITS") && tip.effortScore >= 8) {
        score += 2.0;
      }

      // Add small weights for core characteristics to break ties
      score += tip.impactScore * 0.1;
      score += tip.effortScore * 0.1;

      return {
        ...tip,
        score: Math.round(score * 100) / 100,
      };
    });

  // Sort descending by score, and then by potential savings
  return scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return b.potentialSavingsCO2e - a.potentialSavingsCO2e;
  });
}

/**
 * Filter scored recommendations based on active coaching filters.
 */
export function filterTipsByAttributes(
  tips: ScoredTip[],
  filter: "ALL" | "BUDGET_FRIENDLY" | "LOW_EFFORT" | "HIGH_IMPACT" | "TIME_SAVING"
): ScoredTip[] {
  switch (filter) {
    case "BUDGET_FRIENDLY":
      return tips.filter((tip) => tip.costScore >= 8);
    case "LOW_EFFORT":
      return tips.filter((tip) => tip.effortScore >= 8);
    case "HIGH_IMPACT":
      return tips.filter((tip) => tip.impactScore >= 8);
    case "TIME_SAVING":
      // Time-saving activities are low effort and don't require complex behavioral adjustments
      return tips.filter((tip) => tip.effortScore >= 8 && tip.costScore >= 7);
    default:
      return tips;
  }
}
