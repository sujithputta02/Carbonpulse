import { EmissionFactor } from "@/types/activity";

export const DEFAULT_EMISSION_FACTORS: EmissionFactor[] = [
  // Transport
  { id: "f1", category: "TRANSPORT", key: "CAR_PETROL", value: 0.27, unit: "kg CO2e / km", updatedAt: new Date().toISOString() },
  { id: "f2", category: "TRANSPORT", key: "CAR_DIESEL", value: 0.25, unit: "kg CO2e / km", updatedAt: new Date().toISOString() },
  { id: "f3", category: "TRANSPORT", key: "EV", value: 0.05, unit: "kg CO2e / km", updatedAt: new Date().toISOString() },
  { id: "f4", category: "TRANSPORT", key: "TRANSIT_BUS", value: 0.08, unit: "kg CO2e / passenger-km", updatedAt: new Date().toISOString() },
  { id: "f5", category: "TRANSPORT", key: "TRANSIT_TRAIN", value: 0.04, unit: "kg CO2e / passenger-km", updatedAt: new Date().toISOString() },
  { id: "f6", category: "TRANSPORT", key: "FLIGHT_SHORT", value: 0.15, unit: "kg CO2e / km", updatedAt: new Date().toISOString() },
  { id: "f7", category: "TRANSPORT", key: "FLIGHT_LONG", value: 0.12, unit: "kg CO2e / km", updatedAt: new Date().toISOString() },
  
  // Food
  { id: "f8", category: "FOOD", key: "DIET_HIGH_MEAT", value: 7.26, unit: "kg CO2e / day", updatedAt: new Date().toISOString() },
  { id: "f9", category: "FOOD", key: "DIET_LOW_MEAT", value: 4.67, unit: "kg CO2e / day", updatedAt: new Date().toISOString() },
  { id: "f10", category: "FOOD", key: "DIET_VEGETARIAN", value: 3.81, unit: "kg CO2e / day", updatedAt: new Date().toISOString() },
  { id: "f11", category: "FOOD", key: "DIET_VEGAN", value: 2.89, unit: "kg CO2e / day", updatedAt: new Date().toISOString() },
  
  // Home Energy
  { id: "f12", category: "ENERGY", key: "ELECTRICITY", value: 0.38, unit: "kg CO2e / kWh", updatedAt: new Date().toISOString() },
  { id: "f13", category: "ENERGY", key: "NATURAL_GAS", value: 0.18, unit: "kg CO2e / kWh", updatedAt: new Date().toISOString() },
  
  // Shopping
  { id: "f14", category: "SHOPPING", key: "CONSUMER_HEAVY", value: 350.0, unit: "kg CO2e / month", updatedAt: new Date().toISOString() },
  { id: "f15", category: "SHOPPING", key: "CONSUMER_MODERATE", value: 180.0, unit: "kg CO2e / month", updatedAt: new Date().toISOString() },
  { id: "f16", category: "SHOPPING", key: "CONSUMER_MINIMALIST", value: 50.0, unit: "kg CO2e / month", updatedAt: new Date().toISOString() },
];
