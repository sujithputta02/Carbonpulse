/**
 * Environmental impact metrics conversion.
 * Converts CO₂e values into relatable environmental impact equivalents.
 * 
 * Used for hackathon: Making carbon footprint tangible and understandable.
 */

/**
 * Environmental conversion factors (scientific-based).
 * Sources: EPA, IPCC, carbon footprint databases
 */
const IMPACT_FACTORS = {
  /**
   * Trees needed to sequester CO₂e for 1 year
   * Average tree: 21.77 kg CO2e/year
   * Source: EPA, Global Forest Watch
   */
  TREES_PER_KG_CO2E: 1 / 21.77,

  /**
   * Average car emissions: 4.6 metric tons CO₂e/year
   * Approximate distance: 16,000 km/year in US
   * Emissions: 0.287 kg CO₂e per km
   */
  KM_PETROL_CAR_PER_KG_CO2E: 1 / 0.287,

  /**
   * US average electricity: 0.392 kg CO₂e per kWh
   * Global average: 0.475 kg CO₂e per kWh
   * Using US average for conservative estimate
   */
  KWH_ELECTRICITY_PER_KG_CO2E: 1 / 0.392,

  /**
   * Average household daily emissions: 37.2 kg CO₂e
   * Based on US average footprint ~13.5 tons/year
   */
  HOUSEHOLD_DAYS_PER_KG_CO2E: 1 / 37.2,

  /**
   * Plane trip (short-haul): 0.255 kg CO₂e per km per person
   * 1000 km flight ≈ 255 kg CO₂e
   */
  KM_FLIGHT_PER_KG_CO2E: 1 / 0.255,

  /**
   * Smartphones: average 85 kg CO₂e to manufacture
   * Lifespan: 4 years
   */
  SMARTPHONES_PER_KG_CO2E: 1 / 85,

  /**
   * Gallons of gasoline: 8.887 kg CO₂e per gallon
   */
  GALLONS_PETROL_PER_KG_CO2E: 1 / 8.887,
} as const;

/**
 * Calculates human-readable environmental impact metrics.
 *
 * @param kgCO2e - Amount of CO₂e in kilograms
 * @returns Object with relatable environmental impact equivalents
 *
 * @example
 * ```ts
 * const impact = calculateImpactMetrics(100); // 100 kg CO₂e
 * console.log(impact.trees);         // ≈ 4.6 trees
 * console.log(impact.carKm);         // ≈ 348 km driving
 * console.log(impact.electricity);   // ≈ 255 kWh
 * ```
 */
export function calculateImpactMetrics(kgCO2e: number) {
  return {
    /**
     * Trees that would need to sequester this amount in 1 year
     */
    trees: Math.round(kgCO2e * IMPACT_FACTORS.TREES_PER_KG_CO2E * 10) / 10,

    /**
     * Equivalent km driven in an average petrol car
     */
    carKm: Math.round(kgCO2e * IMPACT_FACTORS.KM_PETROL_CAR_PER_KG_CO2E),

    /**
     * Equivalent kWh of electricity consumption (US average grid)
     */
    electricity: Math.round(kgCO2e * IMPACT_FACTORS.KWH_ELECTRICITY_PER_KG_CO2E),

    /**
     * Equivalent number of household days (average US household)
     */
    householdDays: Math.round(kgCO2e * IMPACT_FACTORS.HOUSEHOLD_DAYS_PER_KG_CO2E * 10) / 10,

    /**
     * Equivalent km of flight (short-haul, per person)
     */
    flightKm: Math.round(kgCO2e * IMPACT_FACTORS.KM_FLIGHT_PER_KG_CO2E),

    /**
     * Equivalent new smartphones that could be manufactured
     */
    smartphones: Math.round(kgCO2e * IMPACT_FACTORS.SMARTPHONES_PER_KG_CO2E * 100) / 100,

    /**
     * Equivalent gallons of gasoline burned
     */
    gallonsPetrol: Math.round(kgCO2e * IMPACT_FACTORS.GALLONS_PETROL_PER_KG_CO2E * 10) / 10,
  };
}

/**
 * Generates human-friendly text descriptions of carbon impact.
 * Perfect for dashboard display and user communication.
 *
 * @param kgCO2e - Amount of CO₂e in kilograms
 * @returns Array of impact descriptions
 *
 * @example
 * ```ts
 * const descriptions = getImpactDescriptions(50);
 * console.log(descriptions);
 * // Output:
 * // [
 * //   "equivalent to 2.3 trees planted",
 * //   "equivalent to 174 km driven in a petrol car",
 * //   "equivalent to 128 kWh of electricity",
 * // ]
 * ```
 */
export function getImpactDescriptions(kgCO2e: number): string[] {
  const metrics = calculateImpactMetrics(kgCO2e);

  return [
    `planting ${metrics.trees} tree${metrics.trees !== 1 ? "s" : ""}`,
    `driving a petrol car ${metrics.carKm} km`,
    `${metrics.electricity} kWh of electricity used`,
    `${metrics.householdDays} days of average household emissions`,
  ];
}

/**
 * Get the most impactful metric for highlighting.
 * Useful for dashboard "wow factor" statements.
 *
 * @param kgCO2e - Amount of CO₂e
 * @returns Most impressive impact description
 *
 * @example
 * ```ts
 * // User reduced 150 kg CO₂e this month
 * const headline = getTopImpactStat(150);
 * // "Equivalent to planting 7 trees"
 * ```
 */
export function getTopImpactStat(kgCO2e: number): string {
  const metrics = calculateImpactMetrics(kgCO2e);

  // Return the most visually impressive metric
  if (metrics.trees >= 1) {
    return `Equivalent to planting ${metrics.trees} tree${metrics.trees !== 1 ? "s" : ""}`;
  } else if (metrics.carKm >= 10) {
    return `Same as avoiding ${metrics.carKm} km of driving`;
  } else if (metrics.householdDays >= 0.1) {
    return `One household's emissions for ${metrics.householdDays} day${metrics.householdDays !== 1 ? "s" : ""}`;
  } else {
    return `${kgCO2e.toFixed(2)} kg CO₂e saved`;
  }
}

/**
 * Generates a comprehensive impact statement for reports.
 *
 * @param kgCO2e - CO₂e reduction amount
 * @param context - Optional context (e.g., "this month", "today")
 * @returns Formatted impact statement
 *
 * @example
 * ```ts
 * const statement = getImpactStatement(150, "this month");
 * // "This month you reduced 150 kg CO₂e,
 * //  equivalent to planting 7 trees and avoiding 523 km of car driving!"
 * ```
 */
export function getImpactStatement(kgCO2e: number, context: string = "today"): string {
  const metrics = calculateImpactMetrics(kgCO2e);

  return `You reduced ${kgCO2e.toFixed(1)} kg CO₂e ${context}, equivalent to:
    • Planting ${metrics.trees} tree${metrics.trees !== 1 ? "s" : ""}
    • Avoiding ${metrics.carKm} km of car driving
    • Saving ${metrics.electricity} kWh of electricity
    • One household's daily emissions for ${metrics.householdDays} day${metrics.householdDays !== 1 ? "s" : ""}`;
}
