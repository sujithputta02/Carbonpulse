/**
 * PASSWORD VALIDATION TESTS
 * ==========================
 * Tests for security-critical password validation.
 * 
 * **Why test password validation:**
 * - Security critical - weak passwords endanger users
 * - Must block common weak passwords
 * - Must enforce complexity requirements
 * - Edge cases must be handled correctly
 */

import { describe, it, expect } from 'vitest';
import {
  validatePasswordStrength,
  getPasswordStrength,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
} from '../passwordSchema';

describe('validatePasswordStrength', () => {
  describe('Length requirements', () => {
    it('rejects passwords shorter than minimum', () => {
      const result = validatePasswordStrength('Short1!');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least');
    });

    it('accepts passwords at minimum length', () => {
      const result = validatePasswordStrength('Valid1Pass!');
      expect(result.valid).toBe(true);
    });

    it('rejects passwords longer than maximum', () => {
      const longPassword = 'A1!' + 'a'.repeat(MAX_PASSWORD_LENGTH);
      const result = validatePasswordStrength(longPassword);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not exceed');
    });
  });

  describe('Complexity requirements', () => {
    it('requires uppercase letter', () => {
      const result = validatePasswordStrength('lowercase123!');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('uppercase');
    });

    it('requires lowercase letter', () => {
      const result = validatePasswordStrength('UPPERCASE123!');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('lowercase');
    });

    it('requires digit', () => {
      const result = validatePasswordStrength('NoDigitsHere!');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('number');
    });

    it('requires special character', () => {
      const result = validatePasswordStrength('NoSpecial123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('special');
    });

    it('accepts password with all requirements', () => {
      const result = validatePasswordStrength('ValidPass123!');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Weak password detection', () => {
    it('rejects exact weak password matches', () => {
      // "password123" is in the weak list
      // Add complexity to make it pass other checks first
      const result = validatePasswordStrength('Password123!');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too common');
    });

    it('is case-insensitive for weak password check', () => {
      // "password123" in lowercase form, but checked case-insensitively
      // Must have both cases to pass complexity check first
      const result = validatePasswordStrength('Password123!');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too common');
    });
    
    it('accepts passwords not in weak list', () => {
      const result = validatePasswordStrength('MyUnique123!Pass');
      expect(result.valid).toBe(true);
    });
  });

  describe('Email/username in password', () => {
    it('rejects password containing email username', () => {
      const result = validatePasswordStrength('JohnSecure123!', 'john@example.com');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('email');
    });

    it('accepts password not containing email', () => {
      const result = validatePasswordStrength('SecurePass123!', 'john@example.com');
      expect(result.valid).toBe(true);
    });

    it('handles short usernames (< 4 chars)', () => {
      // Short usernames are not checked to avoid false positives
      const result = validatePasswordStrength('JoePass123!', 'joe@example.com');
      expect(result.valid).toBe(true);
    });
  });

  describe('Valid passwords', () => {
    const validPasswords = [
      'MySecure123!',
      'Complex$Pass99',
      'Tr0ng*Passw0rd',
      'Super#Safe2024',
    ];

    it('accepts strong valid passwords', () => {
      validPasswords.forEach(password => {
        const result = validatePasswordStrength(password);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });
  });
});

describe('getPasswordStrength', () => {
  it('rates very weak passwords', () => {
    const result = getPasswordStrength('abc');
    expect(result.score).toBeLessThanOrEqual(1);
    expect(result.label).toMatch(/Weak/);
    expect(result.color).toBeTruthy();
  });

  it('rates weak passwords', () => {
    const result = getPasswordStrength('abcdef12');
    expect(result.score).toBeGreaterThanOrEqual(1);
    expect(result.score).toBeLessThanOrEqual(4);
  });

  it('rates strong passwords highly', () => {
    const result = getPasswordStrength('MyVeryStrong123!Pass');
    expect(result.score).toBeGreaterThanOrEqual(3);
    expect(result.label).toMatch(/Good|Strong/);
  });

  it('maxes out at score 4', () => {
    const result = getPasswordStrength('SuperLongAndComplex123!@#$%');
    expect(result.score).toBeLessThanOrEqual(4);
  });

  it('provides color coding', () => {
    const weak = getPasswordStrength('short');
    const strong = getPasswordStrength('VeryStrong123!Pass');
    
    expect(weak.color).toBeTruthy();
    expect(strong.color).toBeTruthy();
    expect(weak.color).not.toBe(strong.color);
  });
});
