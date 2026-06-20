/**
 * TYPE GUARDS TESTS
 * ==================
 * Tests for runtime type checking functions.
 * 
 * **Why test type guards:**
 * - They're the first line of defense against bad data
 * - Runtime errors can crash the application
 * - Edge cases must be handled correctly
 */

import { describe, it, expect } from 'vitest';
import {
  isString,
  isNonEmptyString,
  isNumber,
  isPositiveNumber,
  isNonNegativeNumber,
  isInteger,
  isBoolean,
  isArray,
  isStringArray,
  isNumberArray,
  isObject,
  hasProperty,
  hasStringProperty,
  hasNumberProperty,
  isActivityCategory,
  isCommuteType,
  isDietPattern,
  isShoppingPattern,
  isBudgetSensitivity,
  getFormString,
  getFormNumber,
  getFormInteger,
  getFormBoolean,
  getFormStringArray,
  isValidEmail,
  isInRange,
  meetsMinLength,
} from '../typeGuards';

describe('Basic Type Guards', () => {
  describe('isString', () => {
    it('returns true for strings', () => {
      expect(isString('hello')).toBe(true);
      expect(isString('')).toBe(true);
      expect(isString('  ')).toBe(true);
    });

    it('returns false for non-strings', () => {
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
      expect(isString({})).toBe(false);
      expect(isString([])).toBe(false);
    });
  });

  describe('isNonEmptyString', () => {
    it('returns true for non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString('  a  ')).toBe(true);
    });

    it('returns false for empty or whitespace strings', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('  ')).toBe(false);
      expect(isNonEmptyString('\t\n')).toBe(false);
    });

    it('returns false for non-strings', () => {
      expect(isNonEmptyString(123)).toBe(false);
      expect(isNonEmptyString(null)).toBe(false);
    });
  });

  describe('isNumber', () => {
    it('returns true for valid numbers', () => {
      expect(isNumber(0)).toBe(true);
      expect(isNumber(123)).toBe(true);
      expect(isNumber(-456)).toBe(true);
      expect(isNumber(3.14)).toBe(true);
    });

    it('returns false for NaN and Infinity', () => {
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber(Infinity)).toBe(false);
      expect(isNumber(-Infinity)).toBe(false);
    });

    it('returns false for non-numbers', () => {
      expect(isNumber('123')).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
    });
  });

  describe('isPositiveNumber', () => {
    it('returns true for positive numbers', () => {
      expect(isPositiveNumber(1)).toBe(true);
      expect(isPositiveNumber(0.1)).toBe(true);
      expect(isPositiveNumber(999)).toBe(true);
    });

    it('returns false for zero and negative numbers', () => {
      expect(isPositiveNumber(0)).toBe(false);
      expect(isPositiveNumber(-1)).toBe(false);
      expect(isPositiveNumber(-0.1)).toBe(false);
    });
  });

  describe('isInteger', () => {
    it('returns true for integers', () => {
      expect(isInteger(0)).toBe(true);
      expect(isInteger(123)).toBe(true);
      expect(isInteger(-456)).toBe(true);
    });

    it('returns false for decimals', () => {
      expect(isInteger(1.5)).toBe(false);
      expect(isInteger(0.1)).toBe(false);
    });
  });
});

describe('Array Type Guards', () => {
  describe('isArray', () => {
    it('returns true for arrays', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray(['a', 'b'])).toBe(true);
    });

    it('returns false for non-arrays', () => {
      expect(isArray('array')).toBe(false);
      expect(isArray({})).toBe(false);
      expect(isArray(null)).toBe(false);
    });
  });

  describe('isStringArray', () => {
    it('returns true for string arrays', () => {
      expect(isStringArray(['a', 'b', 'c'])).toBe(true);
      expect(isStringArray([])).toBe(true);
    });

    it('returns false for mixed arrays', () => {
      expect(isStringArray(['a', 1, 'c'])).toBe(false);
      expect(isStringArray([1, 2, 3])).toBe(false);
    });
  });

  describe('isNumberArray', () => {
    it('returns true for number arrays', () => {
      expect(isNumberArray([1, 2, 3])).toBe(true);
      expect(isNumberArray([])).toBe(true);
    });

    it('returns false for mixed arrays', () => {
      expect(isNumberArray([1, 'two', 3])).toBe(false);
      expect(isNumberArray(['1', '2', '3'])).toBe(false);
    });
  });
});

describe('Object Type Guards', () => {
  describe('isObject', () => {
    it('returns true for objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: 'value' })).toBe(true);
    });

    it('returns false for null and arrays', () => {
      expect(isObject(null)).toBe(false);
      expect(isObject([])).toBe(false);
      expect(isObject('object')).toBe(false);
    });
  });

  describe('hasProperty', () => {
    it('returns true when property exists', () => {
      const obj = { name: 'John', age: 30 };
      expect(hasProperty(obj, 'name')).toBe(true);
      expect(hasProperty(obj, 'age')).toBe(true);
    });

    it('returns false when property missing', () => {
      const obj = { name: 'John' };
      expect(hasProperty(obj, 'age')).toBe(false);
    });
  });

  describe('hasStringProperty', () => {
    it('returns true when property is string', () => {
      const obj = { name: 'John', age: 30 };
      expect(hasStringProperty(obj, 'name')).toBe(true);
    });

    it('returns false when property is not string', () => {
      const obj = { name: 'John', age: 30 };
      expect(hasStringProperty(obj, 'age')).toBe(false);
    });
  });
});

describe('Domain-Specific Type Guards', () => {
  describe('isActivityCategory', () => {
    it('returns true for valid categories', () => {
      expect(isActivityCategory('TRANSPORT')).toBe(true);
      expect(isActivityCategory('FOOD')).toBe(true);
      expect(isActivityCategory('ENERGY')).toBe(true);
      expect(isActivityCategory('SHOPPING')).toBe(true);
    });

    it('returns false for invalid categories', () => {
      expect(isActivityCategory('INVALID')).toBe(false);
      expect(isActivityCategory('transport')).toBe(false);
      expect(isActivityCategory(123)).toBe(false);
    });
  });

  describe('isCommuteType', () => {
    it('returns true for valid commute types', () => {
      expect(isCommuteType('CAR_PETROL')).toBe(true);
      expect(isCommuteType('EV')).toBe(true);
      expect(isCommuteType('TRANSIT')).toBe(true);
    });

    it('returns false for invalid types', () => {
      expect(isCommuteType('BICYCLE')).toBe(false);
      expect(isCommuteType('car_petrol')).toBe(false);
    });
  });

  describe('isDietPattern', () => {
    it('returns true for valid diet patterns', () => {
      expect(isDietPattern('HIGH_MEAT')).toBe(true);
      expect(isDietPattern('VEGAN')).toBe(true);
    });

    it('returns false for invalid patterns', () => {
      expect(isDietPattern('PESCATARIAN')).toBe(false);
    });
  });
});

describe('FormData Helpers', () => {
  describe('getFormString', () => {
    it('extracts string values', () => {
      const formData = new FormData();
      formData.set('name', 'John Doe');
      
      expect(getFormString(formData, 'name')).toBe('John Doe');
    });

    it('returns null for empty strings', () => {
      const formData = new FormData();
      formData.set('empty', '');
      
      expect(getFormString(formData, 'empty')).toBe(null);
    });

    it('returns null for missing fields', () => {
      const formData = new FormData();
      expect(getFormString(formData, 'missing')).toBe(null);
    });
  });

  describe('getFormNumber', () => {
    it('parses numeric strings', () => {
      const formData = new FormData();
      formData.set('age', '25');
      formData.set('price', '19.99');
      
      expect(getFormNumber(formData, 'age')).toBe(25);
      expect(getFormNumber(formData, 'price')).toBe(19.99);
    });

    it('returns null for invalid numbers', () => {
      const formData = new FormData();
      formData.set('invalid', 'abc');
      
      expect(getFormNumber(formData, 'invalid')).toBe(null);
    });
  });

  describe('getFormInteger', () => {
    it('parses integer strings', () => {
      const formData = new FormData();
      formData.set('count', '42');
      
      expect(getFormInteger(formData, 'count')).toBe(42);
    });

    it('returns null for decimals', () => {
      const formData = new FormData();
      formData.set('decimal', '3.14');
      
      expect(getFormInteger(formData, 'decimal')).toBe(null);
    });
  });

  describe('getFormBoolean', () => {
    it('parses boolean values', () => {
      const formData = new FormData();
      formData.set('checked', 'on');
      formData.set('enabled', 'true');
      
      expect(getFormBoolean(formData, 'checked')).toBe(true);
      expect(getFormBoolean(formData, 'enabled')).toBe(true);
    });

    it('returns false for unchecked', () => {
      const formData = new FormData();
      expect(getFormBoolean(formData, 'unchecked')).toBe(false);
    });
  });

  describe('getFormStringArray', () => {
    it('extracts multiple values', () => {
      const formData = new FormData();
      formData.append('tags', 'javascript');
      formData.append('tags', 'typescript');
      
      const tags = getFormStringArray(formData, 'tags');
      expect(tags).toEqual(['javascript', 'typescript']);
    });

    it('returns empty array for missing field', () => {
      const formData = new FormData();
      expect(getFormStringArray(formData, 'missing')).toEqual([]);
    });
  });
});

describe('Validation Helpers', () => {
  describe('isValidEmail', () => {
    it('validates correct emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('john.doe@company.co.uk')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('missing@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });
  });

  describe('isInRange', () => {
    it('validates numbers in range', () => {
      expect(isInRange(5, 1, 10)).toBe(true);
      expect(isInRange(1, 1, 10)).toBe(true);
      expect(isInRange(10, 1, 10)).toBe(true);
    });

    it('rejects numbers out of range', () => {
      expect(isInRange(0, 1, 10)).toBe(false);
      expect(isInRange(11, 1, 10)).toBe(false);
    });
  });

  describe('meetsMinLength', () => {
    it('validates strings meeting minimum', () => {
      expect(meetsMinLength('password', 6)).toBe(true);
      expect(meetsMinLength('12345678', 8)).toBe(true);
    });

    it('rejects strings too short', () => {
      expect(meetsMinLength('short', 10)).toBe(false);
      expect(meetsMinLength('', 1)).toBe(false);
    });
  });
});
