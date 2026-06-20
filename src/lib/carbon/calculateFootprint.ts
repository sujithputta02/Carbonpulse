import { EmissionFactor, CategoryType } from "@/types/activity";

/**
 * CARBON FOOTPRINT CALCULATION ENGINE
 * ====================================
 * This file contains the core logic for calculating CO2e (carbon dioxide equivalent) emissions.
 * 
 * **What is CO2e?**
 * Carbon dioxide equivalent - a standard unit that combines different greenhouse gases
 * (CO2, methane, nitrous oxide) into a single number for comparison.
 * Example: 1 kg of methane = 25 kg CO2e (methane is 25x more potent than CO2)
 * 
 * **How calculations work:**
 * Activity Amount × Emission Factor = CO2e Emissions
 * Example: 100 km driven × 0.27 kg CO2e/km = 27 kg CO2e
 */

/**
 * Looks up an emission factor by its unique key with fallback value.
 * 
 * **Why we need this:**
 * - Emission factors can be updated by admins
 * - Different regions have different values (e.g., electricity grid mix)
 * - Fallback ensures calculations don't break if factor is missing
 * 
 * **Example emission factors:**
 * - CAR_PETROL: 0.27 kg CO2e per km (average gasoline car)
 * - ELECTRICITY: 0.38 kg CO2e per kWh (US grid average)
 * - DIET_HIGH_MEAT: 7.26 kg CO2e per day (meat with every meal)
 * 
 * @param factors - Array of emission factors from database
 * @param key - Unique identifier for the factor (e.g., "CAR_PETROL")
 * @param fallback - Default value if factor not found in database
 * @returns The emission factor value
 */
export function getFactorValue(factors: EmissionFactor[], key: string, fallback: number): number {
  const factor = factors.find((f) => f.key === key);
  return factor ? factor.value : fallback;
}

/**
 * Input data for calculating a user's baseline monthly carbon footprint.
 * Collected during onboarding to establish starting point.
 */
export interface BaselineInput {
  /** Primary commute method (affects transportation emissions) */
  commuteType: "CAR_PETROL" | "CAR_DIESEL" | "EV" | "TRANSIT" | "NONE";
  /** Total kilometers commuted per week (both directions) */
  commuteDistanceWeekly: number;
  /** Dietary pattern (affects food emissions - meat production is carbon-intensive) */
  dietPattern: "HIGH_MEAT" | "LOW_MEAT" | "VEGETARIAN" | "VEGAN";
  /** Monthly electricity consumption in kilowatt-hours */
  electricityMonthlyKwh: number;
  /** Monthly natural gas consumption in kilowatt-hours (for heating/cooking) */
  naturalGasMonthlyKwh: number;
  /** Number of people in household (energy emissions are shared equally) */
  householdSize: number;
  /** Shopping frequency (affects material consumption emissions) */
  shoppingPattern: "HEAVY" | "MODERATE" | "MINIMALIST";
}

/**
 * Calculates a user's baseline monthly carbon footprint during onboarding.
 * 
 * **What is a baseline?**
 * The starting point - how much CO2e the user currently produces per month.
 * This becomes the reference for tracking improvements.
 * 
 * **Why calculate by category?**
 * - Shows which areas have biggest impact (transport vs food vs energy)
 * - Helps prioritize recommendations (focus on biggest categories first)
 * - Tracks category-specific progress over time
 * 
 * **Calculation methodology:**
 * 1. Transport: Weekly commute × 4.33 weeks/month × emission factor
 * 2. Food: Daily diet emissions × 30.4 days/month
 * 3. Energy: (Electricity + Gas) ÷ household size (shared consumption)
 * 4. Shopping: Monthly consumer goods based on shopping pattern
 * 
 * **Example result:**
 * ```
 * {
 *   total: 535.40,     // Overall monthly footprint
 *   transport: 234.00, // Biggest category - focus recommendations here
 *   food: 154.32,      // Second biggest
 *   energy: 97.08,     // Split between 2 household members
 *   shopping: 50.00    // Minimalist shopper
 * }
 * ```
 * 
 * @param input - User's lifestyle data from onboarding form
 * @param factors - Current emission factors from database
 * @returns Breakdown of monthly CO2e emissions by category
 */
export function calculateBaseline(input: BaselineInput, factors: EmissionFactor[]): {
  total: number;
  transport: number;
  food: number;
  energy: number;
  shopping: number;
} {
  // ==========================================
  // 1. TRANSPORT EMISSIONS
  // ==========================================
  // Convert weekly commute to monthly (4.333 is average weeks per month: 52 weeks ÷ 12 months)
  const monthlyCommuteDistance = input.commuteDistanceWeekly * 4.333;
  
  // Map user's commute type to emission factor key
  // Different vehicle types have very different emissions:
  // - Petrol car: ~0.27 kg CO2e/km (combustion engine)
  // - EV: ~0.05 kg CO2e/km (electricity-powered, depends on grid)
  // - Transit bus: ~0.08 kg CO2e/km (shared vehicle, lower per-person)
  let transportFactorKey = "CAR_PETROL";
  if (input.commuteType === "CAR_DIESEL") transportFactorKey = "CAR_DIESEL";
  else if (input.commuteType === "EV") transportFactorKey = "EV";
  else if (input.commuteType === "TRANSIT") transportFactorKey = "TRANSIT_BUS";
  
  // Get emission factor (kg CO2e per km) or use 0 if no commute
  const transportFactor = input.commuteType === "NONE" ? 0 : getFactorValue(factors, transportFactorKey, 0.27);
  const transportEmissions = monthlyCommuteDistance * transportFactor;

  // ==========================================
  // 2. FOOD EMISSIONS
  // ==========================================
  // Diet is a major carbon source due to livestock methane and land use
  // High meat diet: ~7.26 kg CO2e/day (beef production is very carbon-intensive)
  // Vegan diet: ~2.89 kg CO2e/day (60% lower than high meat!)
  let dietFactorKey = "DIET_HIGH_MEAT";
  if (input.dietPattern === "LOW_MEAT") dietFactorKey = "DIET_LOW_MEAT";
  else if (input.dietPattern === "VEGETARIAN") dietFactorKey = "DIET_VEGETARIAN";
  else if (input.dietPattern === "VEGAN") dietFactorKey = "DIET_VEGAN";
  
  // Get daily diet emissions and multiply by average days per month (30.4)
  const dailyDietEmissions = getFactorValue(factors, dietFactorKey, 7.26);
  const foodEmissions = dailyDietEmissions * 30.4;

  // ==========================================
  // 3. HOME ENERGY EMISSIONS
  // ==========================================
  // Electricity and gas emissions depend on:
  // - Usage amount (kWh)
  // - Energy source (coal/gas/solar/wind mix in local grid)
  // - Household size (shared usage reduces per-person emissions)
  const electricityFactor = getFactorValue(factors, "ELECTRICITY", 0.38);
  const gasFactor = getFactorValue(factors, "NATURAL_GAS", 0.18);
  
  // Calculate total household energy emissions
  const totalHomeEmissions = 
    (input.electricityMonthlyKwh * electricityFactor) + 
    (input.naturalGasMonthlyKwh * gasFactor);
  
  // Divide by household size to get per-person emissions
  // Living with others is more carbon-efficient (shared heating, appliances, etc.)
  const sharedSize = Math.max(1, input.householdSize); // Minimum 1 to avoid division by zero
  const energyEmissions = totalHomeEmissions / sharedSize;

  // ==========================================
  // 4. SHOPPING & CONSUMPTION EMISSIONS
  // ==========================================
  // Material goods have "embedded carbon" from manufacturing and shipping
  // Heavy shopper: ~180 kg CO2e/month (frequent clothes, electronics, furniture)
  // Minimalist: ~30 kg CO2e/month (only essentials)
  let shoppingFactorKey = "CONSUMER_HEAVY";
  if (input.shoppingPattern === "MODERATE") shoppingFactorKey = "CONSUMER_MODERATE";
  else if (input.shoppingPattern === "MINIMALIST") shoppingFactorKey = "CONSUMER_MINIMALIST";
  
  const shoppingEmissions = getFactorValue(factors, shoppingFactorKey, 180.0);

  // ==========================================
  // 5. TOTAL & FORMATTING
  // ==========================================
  // Sum all categories for total monthly footprint
  const total = transportEmissions + foodEmissions + energyEmissions + shoppingEmissions;

  // Round to 2 decimal places for clean display (535.397 → 535.40)
  return {
    total: Math.round(total * 100) / 100,
    transport: Math.round(transportEmissions * 100) / 100,
    food: Math.round(foodEmissions * 100) / 100,
    energy: Math.round(energyEmissions * 100) / 100,
    shopping: Math.round(shoppingEmissions * 100) / 100,
  };
}

/**
 * Calculates CO2e emissions for a single logged activity.
 * 
 * **When this is called:**
 * - User manually logs an activity ("I drove 25km today")
 * - User quick-logs from a recommendation
 * - Importing historical data
 * 
 * **How it works:**
 * Looks up the appropriate emission factor for the activity type,
 * then multiplies by the amount to get total CO2e.
 * 
 * **Examples:**
 * ```
 * // Driving
 * calculateActivityCO2e("TRANSPORT", "PETROL_CAR", 50, factors)
 * → 50 km × 0.27 kg/km = 13.5 kg CO2e
 * 
 * // Meals
 * calculateActivityCO2e("FOOD", "VEGAN_MEAL", 3, factors)
 * → 3 meals × 0.96 kg/meal = 2.89 kg CO2e
 * 
 * // Energy
 * calculateActivityCO2e("ENERGY", "ELECTRICITY", 100, factors)
 * → 100 kWh × 0.38 kg/kWh = 38 kg CO2e
 * ```
 * 
 * @param category - Activity category (TRANSPORT, FOOD, ENERGY, SHOPPING)
 * @param actionType - Specific action within category (PETROL_CAR, VEGAN_MEAL, etc.)
 * @param amount - Quantity (km for transport, meals for food, kWh for energy, items for shopping)
 * @param factors - Current emission factors from database
 * @returns CO2e emissions in kilograms, rounded to 2 decimal places
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
      // Map action type to emission factor key
      // Different transport modes have vastly different emissions per km:
      // - Petrol car: 0.27 kg CO2e/km (combustion engine, single occupant)
      // - Bus: 0.08 kg CO2e/km (shared vehicle, ~30x more efficient than driving alone)
      // - EV: 0.05 kg CO2e/km (depends on electricity grid mix)
      // - Flights are much higher per km due to altitude effects
      let factorKey = "CAR_PETROL";
      if (actionType === "DIESEL_CAR") factorKey = "CAR_DIESEL";
      else if (actionType === "EV") factorKey = "EV";
      else if (actionType === "BUS") factorKey = "TRANSIT_BUS";
      else if (actionType === "TRAIN") factorKey = "TRANSIT_TRAIN";
      else if (actionType === "FLIGHT_SHORT") factorKey = "FLIGHT_SHORT";
      else if (actionType === "FLIGHT_LONG") factorKey = "FLIGHT_LONG";
      
      const factor = getFactorValue(factors, factorKey, 0.27);
      co2e = amount * factor; // amount is kilometers traveled
      break;
    }
    
    case "FOOD": {
      // Food emissions vary widely by type:
      // - High meat: 7.26 kg CO2e/day (beef has huge land use + methane from cows)
      // - Low meat: 4.67 kg CO2e/day (less frequent meat, more plants)
      // - Vegetarian: 3.81 kg CO2e/day (no meat, but dairy still has emissions)
      // - Vegan: 2.89 kg CO2e/day (plant-based only, lowest footprint)
      let factorKey = "DIET_HIGH_MEAT";
      if (actionType === "VEGGIE_MEAL") factorKey = "DIET_VEGETARIAN";
      else if (actionType === "VEGAN_MEAL") factorKey = "DIET_VEGAN";
      else if (actionType === "LOW_MEAT_MEAL") factorKey = "DIET_LOW_MEAT";
      
      const dailyFactor = getFactorValue(factors, factorKey, 7.26);
      
      // Convert daily emissions to per-meal by dividing by 3
      // Assumes 3 meals per day: breakfast, lunch, dinner
      const mealFactor = dailyFactor / 3.0;
      co2e = amount * mealFactor; // amount is number of meals
      break;
    }
    
    case "ENERGY": {
      // Home energy emissions depend on the source:
      // - Electricity: Varies by grid (coal-heavy grids have higher emissions)
      // - Natural gas: Direct combustion for heating/cooking
      // US average electricity: 0.38 kg CO2e/kWh
      // Natural gas: 0.18 kg CO2e/kWh
      let factorKey = "ELECTRICITY";
      if (actionType === "NATURAL_GAS") factorKey = "NATURAL_GAS";
      
      const factor = getFactorValue(factors, factorKey, 0.38);
      co2e = amount * factor; // amount is kilowatt-hours (kWh)
      break;
    }
    
    case "SHOPPING": {
      // Consumer goods have "embodied carbon" from:
      // - Raw material extraction
      // - Manufacturing processes
      // - Transportation/shipping
      // - Packaging
      // Electronics have highest emissions (rare earth mining, complex manufacturing)
      let co2PerItem = 10; // Default for misc items
      if (actionType === "ELECTRONICS") co2PerItem = 80; // Smartphone, laptop, etc.
      else if (actionType === "CLOTHING") co2PerItem = 15; // Textile production
      else if (actionType === "MISC") co2PerItem = 5; // Small items
      
      co2e = amount * co2PerItem; // amount is number of items purchased
      break;
    }
  }

  // Round to 2 decimal places for clean display and storage
  // Example: 13.497 → 13.50
  return Math.round(co2e * 100) / 100;
}
