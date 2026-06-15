import { describe, it, expect } from "vitest";
import { calculateBaseline, calculateActivityCO2e, BaselineInput } from "../utils/calculator";
import { EmissionFactor } from "../utils/db";

const mockFactors: EmissionFactor[] = [
  { id: "1", category: "TRANSPORT", key: "CAR_PETROL", value: 0.27, unit: "kg CO2e / km", updatedAt: "" },
  { id: "2", category: "TRANSPORT", key: "CAR_DIESEL", value: 0.25, unit: "kg CO2e / km", updatedAt: "" },
  { id: "3", category: "TRANSPORT", key: "EV", value: 0.05, unit: "kg CO2e / km", updatedAt: "" },
  { id: "4", category: "TRANSPORT", key: "TRANSIT_BUS", value: 0.08, unit: "kg CO2e / passenger-km", updatedAt: "" },
  { id: "5", category: "TRANSPORT", key: "TRANSIT_TRAIN", value: 0.04, unit: "kg CO2e / passenger-km", updatedAt: "" },
  { id: "6", category: "FOOD", key: "DIET_HIGH_MEAT", value: 7.26, unit: "kg CO2e / day", updatedAt: "" },
  { id: "7", category: "FOOD", key: "DIET_VEGAN", value: 2.89, unit: "kg CO2e / day", updatedAt: "" },
  { id: "8", category: "ENERGY", key: "ELECTRICITY", value: 0.38, unit: "kg CO2e / kWh", updatedAt: "" },
  { id: "9", category: "ENERGY", key: "NATURAL_GAS", value: 0.18, unit: "kg CO2e / kWh", updatedAt: "" },
  { id: "10", category: "SHOPPING", key: "CONSUMER_HEAVY", value: 350.0, unit: "kg CO2e / month", updatedAt: "" },
  { id: "11", category: "SHOPPING", key: "CONSUMER_MINIMALIST", value: 50.0, unit: "kg CO2e / month", updatedAt: "" },
];

describe("CarbonPulse Calculation Engine", () => {
  it("should calculate correct baseline footprints for a single high-meat petrol driver", () => {
    const input: BaselineInput = {
      commuteType: "CAR_PETROL",
      commuteDistanceWeekly: 100, // 100 km / week
      dietPattern: "HIGH_MEAT",
      electricityMonthlyKwh: 300,
      naturalGasMonthlyKwh: 100,
      householdSize: 1, // solo household
      shoppingPattern: "HEAVY",
    };

    const result = calculateBaseline(input, mockFactors);

    // Transport: 100 * 4.333 = 433.3 km/month. 433.3 * 0.27 = 117.0 kg CO2e
    // Food: 7.26 * 30.4 = 220.704 kg CO2e
    // Energy: (300 * 0.38 + 100 * 0.18) / 1 = 132 kg CO2e
    // Shopping: CONSUMER_HEAVY = 350.0 kg CO2e
    // Total = 117.0 + 220.7 + 132 + 350 = 819.7 kg CO2e

    expect(result.transport).toBeCloseTo(117.0, 1);
    expect(result.food).toBeCloseTo(220.7, 1);
    expect(result.energy).toBe(132);
    expect(result.shopping).toBe(350);
    expect(result.total).toBeCloseTo(819.7, 1);
  });

  it("should divide energy footprint among household members", () => {
    const input: BaselineInput = {
      commuteType: "NONE",
      commuteDistanceWeekly: 0,
      dietPattern: "VEGAN",
      electricityMonthlyKwh: 300,
      naturalGasMonthlyKwh: 100,
      householdSize: 4, // 4 people sharing energy
      shoppingPattern: "MINIMALIST",
    };

    const result = calculateBaseline(input, mockFactors);

    // Total Energy = 300 * 0.38 + 100 * 0.18 = 132 kg. Divided by 4 = 33 kg.
    expect(result.energy).toBe(33);
    expect(result.transport).toBe(0);
    expect(result.shopping).toBe(50);
    expect(result.food).toBeCloseTo(87.9, 1); // 2.89 * 30.4 = 87.856
  });

  it("should calculate correct co2 for a single travel entry", () => {
    const co2 = calculateActivityCO2e("TRANSPORT", "BUS", 50, mockFactors);
    // 50 km * 0.08 = 4.0 kg CO2e
    expect(co2).toBe(4);
  });

  it("should calculate correct co2 for a meal entry", () => {
    const co2 = calculateActivityCO2e("FOOD", "VEGAN_MEAL", 3, mockFactors);
    // 3 meals * (2.89 / 3) = 2.89 kg CO2e
    expect(co2).toBe(2.89);
  });
});
