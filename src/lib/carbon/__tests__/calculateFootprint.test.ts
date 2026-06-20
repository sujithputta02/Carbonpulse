/**
 * CARBON CALCULATION TESTS
 * =========================
 * Tests for CO2e emission calculations.
 * 
 * **Why test calculations:**
 * - Accuracy is critical (users depend on these numbers)
 * - Edge cases must be handled correctly
 * - Scientific accuracy must be maintained
 */

import { describe, it, expect } from 'vitest';
import {
  getFactorValue,
  calculateBaseline,
  calculateActivityCO2e,
} from '../calculateFootprint';
import { EmissionFactor } from '@/types/activity';

// Mock emission factors for testing
const mockFactors: EmissionFactor[] = [
  {
    id: '1',
    key: 'CAR_PETROL',
    value: 0.27,
    unit: 'kg CO2e per km',
    description: 'Petrol car',
    source: 'Test',
    updatedAt: '2026-01-01',
  },
  {
    id: '2',
    key: 'EV',
    value: 0.05,
    unit: 'kg CO2e per km',
    description: 'Electric vehicle',
    source: 'Test',
    updatedAt: '2026-01-01',
  },
  {
    id: '3',
    key: 'DIET_HIGH_MEAT',
    value: 7.26,
    unit: 'kg CO2e per day',
    description: 'High meat diet',
    source: 'Test',
    updatedAt: '2026-01-01',
  },
  {
    id: '4',
    key: 'DIET_VEGAN',
    value: 2.89,
    unit: 'kg CO2e per day',
    description: 'Vegan diet',
    source: 'Test',
    updatedAt: '2026-01-01',
  },
  {
    id: '5',
    key: 'ELECTRICITY',
    value: 0.38,
    unit: 'kg CO2e per kWh',
    description: 'Electricity',
    source: 'Test',
    updatedAt: '2026-01-01',
  },
  {
    id: '6',
    key: 'NATURAL_GAS',
    value: 0.18,
    unit: 'kg CO2e per kWh',
    description: 'Natural gas',
    source: 'Test',
    updatedAt: '2026-01-01',
  },
  {
    id: '7',
    key: 'CONSUMER_MODERATE',
    value: 80.0,
    unit: 'kg CO2e per month',
    description: 'Moderate shopping',
    source: 'Test',
    updatedAt: '2026-01-01',
  },
];

describe('getFactorValue', () => {
  it('returns factor value when found', () => {
    expect(getFactorValue(mockFactors, 'CAR_PETROL', 0)).toBe(0.27);
    expect(getFactorValue(mockFactors, 'EV', 0)).toBe(0.05);
  });

  it('returns fallback when factor not found', () => {
    expect(getFactorValue(mockFactors, 'UNKNOWN', 0.5)).toBe(0.5);
    expect(getFactorValue([], 'CAR_PETROL', 1.0)).toBe(1.0);
  });

  it('handles empty factor array', () => {
    expect(getFactorValue([], 'ANY_KEY', 0.1)).toBe(0.1);
  });
});

describe('calculateBaseline', () => {
  const baseInput = {
    commuteType: 'CAR_PETROL' as const,
    commuteDistanceWeekly: 100,
    dietPattern: 'HIGH_MEAT' as const,
    electricityMonthlyKwh: 500,
    naturalGasMonthlyKwh: 100,
    householdSize: 1,
    shoppingPattern: 'MODERATE' as const,
  };

  it('calculates baseline footprint correctly', () => {
    const result = calculateBaseline(baseInput, mockFactors);
    
    // Transport: 100 km/week * 4.333 weeks/month * 0.27 kg/km
    const expectedTransport = 100 * 4.333 * 0.27;
    
    // Food: 7.26 kg/day * 30.4 days/month
    const expectedFood = 7.26 * 30.4;
    
    // Energy: (500 * 0.38 + 100 * 0.18) / 1 household
    const expectedEnergy = (500 * 0.38 + 100 * 0.18) / 1;
    
    // Shopping: 80 kg/month
    const expectedShopping = 80.0;
    
    expect(result.transport).toBeCloseTo(expectedTransport, 2);
    expect(result.food).toBeCloseTo(expectedFood, 2);
    expect(result.energy).toBeCloseTo(expectedEnergy, 2);
    expect(result.shopping).toBe(expectedShopping);
    
    const expectedTotal = expectedTransport + expectedFood + expectedEnergy + expectedShopping;
    expect(result.total).toBeCloseTo(expectedTotal, 2);
  });

  it('handles EV commute with lower emissions', () => {
    const evInput = { ...baseInput, commuteType: 'EV' as const };
    const result = calculateBaseline(evInput, mockFactors);
    
    // EV has much lower emissions (0.05 vs 0.27)
    const expectedTransport = 100 * 4.333 * 0.05;
    expect(result.transport).toBeCloseTo(expectedTransport, 2);
  });

  it('handles no commute (zero transport emissions)', () => {
    const noCommuteInput = { ...baseInput, commuteType: 'NONE' as const };
    const result = calculateBaseline(noCommuteInput, mockFactors);
    
    expect(result.transport).toBe(0);
  });

  it('handles vegan diet with lower emissions', () => {
    const veganInput = { ...baseInput, dietPattern: 'VEGAN' as const };
    const result = calculateBaseline(veganInput, mockFactors);
    
    // Vegan: 2.89 kg/day vs High Meat: 7.26 kg/day
    const expectedFood = 2.89 * 30.4;
    expect(result.food).toBeCloseTo(expectedFood, 2);
  });

  it('divides energy by household size', () => {
    const largeHousehold = { ...baseInput, householdSize: 4 };
    const result = calculateBaseline(largeHousehold, mockFactors);
    
    const totalEnergy = (500 * 0.38 + 100 * 0.18);
    const expectedEnergyPerPerson = totalEnergy / 4;
    expect(result.energy).toBeCloseTo(expectedEnergyPerPerson, 2);
  });

  it('handles zero values correctly', () => {
    const zeroInput = {
      commuteType: 'NONE' as const,
      commuteDistanceWeekly: 0,
      dietPattern: 'VEGAN' as const,
      electricityMonthlyKwh: 0,
      naturalGasMonthlyKwh: 0,
      householdSize: 1,
      shoppingPattern: 'MODERATE' as const,
    };
    
    const result = calculateBaseline(zeroInput, mockFactors);
    
    expect(result.transport).toBe(0);
    expect(result.energy).toBe(0);
    expect(result.total).toBeGreaterThan(0); // Still has food and shopping
  });

  it('rounds results to 2 decimal places', () => {
    const result = calculateBaseline(baseInput, mockFactors);
    
    // Check all values have max 2 decimal places
    expect(result.total.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    expect(result.transport.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    expect(result.food.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    expect(result.energy.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
  });
});

describe('calculateActivityCO2e', () => {
  describe('Transport category', () => {
    it('calculates petrol car emissions', () => {
      const co2e = calculateActivityCO2e('TRANSPORT', 'PETROL_CAR', 50, mockFactors);
      expect(co2e).toBe(13.5); // 50 * 0.27
    });

    it('calculates EV emissions (much lower)', () => {
      const co2e = calculateActivityCO2e('TRANSPORT', 'EV', 50, mockFactors);
      expect(co2e).toBe(2.5); // 50 * 0.05
    });

    it('handles zero distance', () => {
      const co2e = calculateActivityCO2e('TRANSPORT', 'PETROL_CAR', 0, mockFactors);
      expect(co2e).toBe(0);
    });
  });

  describe('Food category', () => {
    it('calculates meal emissions from daily factor', () => {
      const co2e = calculateActivityCO2e('FOOD', 'HIGH_MEAT_MEAL', 3, mockFactors);
      
      // Daily factor divided by 3 meals, then multiplied by meal count
      const expected = (7.26 / 3) * 3;
      expect(co2e).toBeCloseTo(expected, 2);
    });

    it('calculates vegan meal emissions (lower)', () => {
      const co2e = calculateActivityCO2e('FOOD', 'VEGAN_MEAL', 3, mockFactors);
      
      const expected = (2.89 / 3) * 3;
      expect(co2e).toBeCloseTo(expected, 2);
    });

    it('handles single meal', () => {
      const co2e = calculateActivityCO2e('FOOD', 'VEGAN_MEAL', 1, mockFactors);
      
      const expected = 2.89 / 3;
      expect(co2e).toBeCloseTo(expected, 2);
    });
  });

  describe('Energy category', () => {
    it('calculates electricity emissions', () => {
      const co2e = calculateActivityCO2e('ENERGY', 'ELECTRICITY', 100, mockFactors);
      expect(co2e).toBe(38); // 100 * 0.38
    });

    it('calculates natural gas emissions', () => {
      const co2e = calculateActivityCO2e('ENERGY', 'NATURAL_GAS', 100, mockFactors);
      expect(co2e).toBe(18); // 100 * 0.18
    });
  });

  describe('Shopping category', () => {
    it('calculates electronics emissions (high)', () => {
      const co2e = calculateActivityCO2e('SHOPPING', 'ELECTRONICS', 1, mockFactors);
      expect(co2e).toBe(80); // 1 * 80
    });

    it('calculates clothing emissions', () => {
      const co2e = calculateActivityCO2e('SHOPPING', 'CLOTHING', 2, mockFactors);
      expect(co2e).toBe(30); // 2 * 15
    });
  });

  it('rounds result to 2 decimal places', () => {
    const co2e = calculateActivityCO2e('TRANSPORT', 'PETROL_CAR', 33.333, mockFactors);
    
    // Should be rounded
    expect(co2e.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
  });

  it('handles missing factors with fallback', () => {
    const co2e = calculateActivityCO2e('TRANSPORT', 'UNKNOWN_TYPE', 10, []);
    
    // Should still calculate with fallback factor
    expect(co2e).toBeGreaterThanOrEqual(0);
  });
});
