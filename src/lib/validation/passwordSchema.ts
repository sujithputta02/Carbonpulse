/**
 * SECURE PASSWORD VALIDATION
 * ===========================
 * Implements OWASP password requirements to prevent weak passwords.
 * 
 * **Security Standards Applied:**
 * - OWASP Authentication Cheat Sheet
 * - NIST Digital Identity Guidelines (SP 800-63B)
 * - CWE-521: Weak Password Requirements
 * 
 * **Password Requirements:**
 * - Minimum 8 characters (industry standard)
 * - At least one uppercase letter (complexity)
 * - At least one lowercase letter (complexity)
 * - At least one number (complexity)
 * - At least one special character (complexity)
 * 
 * **Why These Requirements:**
 * - Increases password entropy (randomness)
 * - Makes brute force attacks computationally expensive
 * - Prevents common weak passwords (password123, qwerty, etc.)
 */

import { z } from "zod";

/**
 * Minimum password length (8 characters meets OWASP standard).
 * 6 characters is too weak and vulnerable to brute force.
 */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Maximum password length to prevent DoS attacks.
 * Very long passwords can cause bcrypt/hash functions to consume excessive CPU.
 */
export const MAX_PASSWORD_LENGTH = 128;

/**
 * Regular expressions for password complexity requirements.
 * Each regex checks for a specific character class.
 */
const PASSWORD_REGEX = {
  // At least one uppercase letter (A-Z)
  uppercase: /[A-Z]/,
  // At least one lowercase letter (a-z)
  lowercase: /[a-z]/,
  // At least one digit (0-9)
  digit: /[0-9]/,
  // At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
  special: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/,
};

/**
 * Common weak passwords that should be rejected.
 * These are frequently used and easily cracked.
 * 
 * **Sources:**
 * - NCSC/NIST banned password lists
 * - Most common passwords from data breaches
 * - Keyboard patterns and sequences
 */
const WEAK_PASSWORDS = [
  "password",
  "password123",
  "12345678",
  "qwerty",
  "abc123",
  "monkey",
  "letmein",
  "trustno1",
  "dragon",
  "baseball",
  "iloveyou",
  "master",
  "sunshine",
  "ashley",
  "bailey",
  "shadow",
  "superman",
  "qazwsx",
  "michael",
  "football",
];

/**
 * Validates password strength according to security best practices.
 * 
 * **Validation Steps:**
 * 1. Check length (8-128 characters)
 * 2. Check complexity requirements (uppercase, lowercase, digit, special)
 * 3. Check against weak password list
 * 4. Check for username/email in password (prevents using username as password)
 * 
 * @param password - The password to validate
 * @param email - Optional email to check password doesn't contain it
 * @returns Validation result with specific error messages
 */
export function validatePasswordStrength(
  password: string,
  email?: string
): { valid: boolean; error?: string } {
  // Check minimum length
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
    };
  }

  // Check maximum length (DoS prevention)
  if (password.length > MAX_PASSWORD_LENGTH) {
    return {
      valid: false,
      error: `Password must not exceed ${MAX_PASSWORD_LENGTH} characters`,
    };
  }

  // Check for uppercase letter
  if (!PASSWORD_REGEX.uppercase.test(password)) {
    return {
      valid: false,
      error: "Password must contain at least one uppercase letter (A-Z)",
    };
  }

  // Check for lowercase letter
  if (!PASSWORD_REGEX.lowercase.test(password)) {
    return {
      valid: false,
      error: "Password must contain at least one lowercase letter (a-z)",
    };
  }

  // Check for digit
  if (!PASSWORD_REGEX.digit.test(password)) {
    return {
      valid: false,
      error: "Password must contain at least one number (0-9)",
    };
  }

  // Check for special character
  if (!PASSWORD_REGEX.special.test(password)) {
    return {
      valid: false,
      error: "Password must contain at least one special character (!@#$%^&* etc.)",
    };
  }

  // Check against weak password list (case-insensitive)
  // Check both exact match and if password contains weak password as substring
  const lowerPassword = password.toLowerCase();
  if (WEAK_PASSWORDS.includes(lowerPassword)) {
    return {
      valid: false,
      error: "This password is too common. Please choose a stronger password",
    };
  }
  
  // Check if password contains any weak password as substring
  const containsWeakPassword = WEAK_PASSWORDS.some(weak => 
    lowerPassword.includes(weak)
  );
  if (containsWeakPassword) {
    return {
      valid: false,
      error: "This password is too common. Please choose a stronger password",
    };
  }

  // Check if password contains email/username (security risk)
  if (email) {
    const emailUsername = email.split("@")[0].toLowerCase();
    if (lowerPassword.includes(emailUsername) && emailUsername.length > 3) {
      return {
        valid: false,
        error: "Password should not contain your email or username",
      };
    }
  }

  return { valid: true };
}

/**
 * Zod schema for strong password validation.
 * Use this in form validation schemas.
 * 
 * **Example:**
 * ```typescript
 * const signupSchema = z.object({
 *   email: z.string().email(),
 *   password: strongPasswordSchema,
 * });
 * ```
 */
export const strongPasswordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, {
    message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
  })
  .max(MAX_PASSWORD_LENGTH, {
    message: `Password must not exceed ${MAX_PASSWORD_LENGTH} characters`,
  })
  .refine((password) => PASSWORD_REGEX.uppercase.test(password), {
    message: "Password must contain at least one uppercase letter",
  })
  .refine((password) => PASSWORD_REGEX.lowercase.test(password), {
    message: "Password must contain at least one lowercase letter",
  })
  .refine((password) => PASSWORD_REGEX.digit.test(password), {
    message: "Password must contain at least one number",
  })
  .refine((password) => PASSWORD_REGEX.special.test(password), {
    message: "Password must contain at least one special character",
  })
  .refine((password) => !WEAK_PASSWORDS.includes(password.toLowerCase()), {
    message: "This password is too common. Please choose a stronger password",
  });

/**
 * Password strength meter for UI feedback.
 * Returns score 0-4 and color indicator.
 * 
 * **Usage in React:**
 * ```typescript
 * const { score, label, color } = getPasswordStrength(password);
 * <div>
 *   Strength: <span style={{color}}>{label}</span>
 * </div>
 * ```
 */
export function getPasswordStrength(password: string): {
  score: number; // 0-4
  label: string; // Weak, Fair, Good, Strong, Very Strong
  color: string; // Color for UI
} {
  let score = 0;

  // Length scoring
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Complexity scoring
  if (PASSWORD_REGEX.uppercase.test(password)) score++;
  if (PASSWORD_REGEX.lowercase.test(password)) score++;
  if (PASSWORD_REGEX.digit.test(password)) score++;
  if (PASSWORD_REGEX.special.test(password)) score++;

  // Adjust score (max 4)
  score = Math.min(score, 4);

  // Map score to label and color
  const strengthMap = {
    0: { label: "Very Weak", color: "#ef4444" }, // red-500
    1: { label: "Weak", color: "#f97316" }, // orange-500
    2: { label: "Fair", color: "#eab308" }, // yellow-500
    3: { label: "Good", color: "#22c55e" }, // green-500
    4: { label: "Strong", color: "#10b981" }, // emerald-500
  };

  return {
    score,
    ...strengthMap[score as keyof typeof strengthMap],
  };
}
