import { EmissionFactor, CategoryType } from "@/types/activity";

// Helper to look up a factor value by its unique key
export function getFactorValue(factors: EmissionFactor[], key: string, fallback: number): number {
  const factor = factors.find((f) => f.key === key);
  return factor ? factor.value : fallback;
}

export interface BaselineInput {
  commuteType: "CAR_PETROL" | "CAR_DIESEL" | "EV" | "TRANSIT" | "NONE";
  commuteDistanceWeekly: number; // km per week
  dietPattern: "HIGH_MEAT" | "LOW_MEAT" | "VEGETARIAN" | "VEGAN";
  electricityMonthlyKwh: number; // kWh per month
  naturalGasMonthlyKwh: number; // kWh per month
  householdSize: number; // to share home energy emissions
  shoppingPattern: "HEAVY" | "MODERATE" | "MINIMALIST";
}

/**
 * Calculates a baseline monthly carbon footprint (in kg CO2e) for onboarding.
 */
export function calculateBaseline(input: BaselineInput, factors: EmissionFactor[]): {
  total: number;
  transport: number;
  food: number;
  energy: number;
  shopping: number;
} {
  // 1. Transport (weekly distance * 4.33 weeks/month)
  const monthlyCommuteDistance = input.commuteDistanceWeekly * 4.333;
  let transportFactorKey = "CAR_PETROL";
  if (input.commuteType === "CAR_DIESEL") transportFactorKey = "CAR_DIESEL";
  else if (input.commuteType === "EV") transportFactorKey = "EV";
  else if (input.commuteType === "TRANSIT") transportFactorKey = "TRANSIT_BUS";
  
  const transportFactor = input.commuteType === "NONE" ? 0 : getFactorValue(factors, transportFactorKey, 0.27);
  const transportEmissions = monthlyCommuteDistance * transportFactor;

  // 2. Food (daily diet factor * 30.4 days/month)
  let dietFactorKey = "DIET_HIGH_MEAT";
  if (input.dietPattern === "LOW_MEAT") dietFactorKey = "DIET_LOW_MEAT";
  else if (input.dietPattern === "VEGETARIAN") dietFactorKey = "DIET_VEGETARIAN";
  else if (input.dietPattern === "VEGAN") dietFactorKey = "DIET_VEGAN";
  
  const dailyDietEmissions = getFactorValue(factors, dietFactorKey, 7.26);
  const foodEmissions = dailyDietEmissions * 30.4;

  // 3. Home Energy (shared among household size)
  const electricityFactor = getFactorValue(factors, "ELECTRICITY", 0.38);
  const gasFactor = getFactorValue(factors, "NATURAL_GAS", 0.18);
  
  const totalHomeEmissions = (input.electricityMonthlyKwh * electricityFactor) + (input.naturalGasMonthlyKwh * gasFactor);
  const sharedSize = Math.max(1, input.householdSize);
  const energyEmissions = totalHomeEmissions / sharedSize;

  // 4. Shopping
  let shoppingFactorKey = "CONSUMER_HEAVY";
  if (input.shoppingPattern === "MODERATE") shoppingFactorKey = "CONSUMER_MODERATE";
  else if (input.shoppingPattern === "MINIMALIST") shoppingFactorKey = "CONSUMER_MINIMALIST";
  
  const shoppingEmissions = getFactorValue(factors, shoppingFactorKey, 180.0);

  const total = transportEmissions + foodEmissions + energyEmissions + shoppingEmissions;

  return {
    total: Math.round(total * 100) / 100,
    transport: Math.round(transportEmissions * 100) / 100,
    food: Math.round(foodEmissions * 100) / 100,
    energy: Math.round(energyEmissions * 100) / 100,
    shopping: Math.round(shoppingEmissions * 100) / 100,
  };
}

/**
 * Calculates emissions for a single daily log action.
 */
export function calculateActivityCO2e(
  category: CategoryType,
  actionType: string,
  amount: number,
  factors: EmissionFactor[]
): number {
  let co2e = 0;
  
  switch (category) {
    case "TRANSPORT": {
      let factorKey = "CAR_PETROL";
      if (actionType === "DIESEL_CAR") factorKey = "CAR_DIESEL";
      else if (actionType === "EV") factorKey = "EV";
      else if (actionType === "BUS") factorKey = "TRANSIT_BUS";
      else if (actionType === "TRAIN") factorKey = "TRANSIT_TRAIN";
      else if (actionType === "FLIGHT_SHORT") factorKey = "FLIGHT_SHORT";
      else if (actionType === "FLIGHT_LONG") factorKey = "FLIGHT_LONG";
      
      const factor = getFactorValue(factors, factorKey, 0.27);
      co2e = amount * factor;
      break;
    }
    case "FOOD": {
      let factorKey = "DIET_HIGH_MEAT";
      if (actionType === "VEGGIE_MEAL") factorKey = "DIET_VEGETARIAN";
      else if (actionType === "VEGAN_MEAL") factorKey = "DIET_VEGAN";
      else if (actionType === "LOW_MEAT_MEAL") factorKey = "DIET_LOW_MEAT";
      
      const dailyFactor = getFactorValue(factors, factorKey, 7.26);
      const mealFactor = dailyFactor / 3.0; // split into 3 meals/day
      co2e = amount * mealFactor;
      break;
    }
    case "ENERGY": {
      let factorKey = "ELECTRICITY";
      if (actionType === "NATURAL_GAS") factorKey = "NATURAL_GAS";
      
      const factor = getFactorValue(factors, factorKey, 0.38);
      co2e = amount * factor;
      break;
    }
    case "SHOPPING": {
      let co2PerItem = 10;
      if (actionType === "ELECTRONICS") co2PerItem = 80;
      else if (actionType === "CLOTHING") co2PerItem = 15;
      else if (actionType === "MISC") co2PerItem = 5;
      
      co2e = amount * co2PerItem;
      break;
    }
  }

  return Math.round(co2e * 100) / 100;
}
