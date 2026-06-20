/**
 * TYPE GUARDS & VALIDATION UTILITIES
 * ===================================
 * Type guards help TypeScript understand what type a value is at runtime.
 * This eliminates the need for unsafe "as" type assertions.
 * 
 * **What are type guards?**
 * Functions that return true/false AND tell TypeScript the type.
 * After a type guard returns true, TypeScript knows the exact type.
 * 
 * **Why use type guards instead of "as"?**
 * - "as" can lie: `value as string` might not actually be a string
 * - Type guards verify at runtime: if (isString(value)) guarantees it's a string
 * - Safer code: catches bugs before they happen
 * 
 * **Example:**
 * ```typescript
 * // BAD: Using "as" (unsafe)
 * const email = formData.get("email") as string; // Might be null!
 * 
 * // GOOD: Using type guard (safe)
 * const emailValue = formData.get("email");
 * if (isNonEmptyString(emailValue)) {
 *   // TypeScript knows emailValue is string here
 *   console.log(emailValue.toLowerCase());
 * }
 * ```
 */

import { 
  ActivityCategory, 
  CommuteType, 
  DietPattern, 
  ShoppingPattern,
  BudgetSensitivity 
} from "./constants";

// ==========================================
// BASIC TYPE GUARDS
// ==========================================

/**
 * Checks if a value is a non-null, non-undefined string.
 * 
 * **Use this instead of:** `value as string`
 * 
 * @example
 * const value = formData.get("name");
 * if (isString(value)) {
 *   console.log(value.toUpperCase()); // Safe!
 * }
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Checks if a value is a non-empty string (not just whitespace).
 * 
 * **More strict than isString** - also checks the string has content.
 * 
 * @example
 * const name = formData.get("name");
 * if (isNonEmptyString(name)) {
 *   // We know name is a string with actual content
 *   await saveName(name);
 * } else {
 *   return { error: "Name is required" };
 * }
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Checks if a value is a valid number (not NaN, not Infinity).
 * 
 * **Use this instead of:** `value as number` or `Number(value)`
 * 
 * @example
 * const amount = formData.get("amount");
 * if (isNumber(amount)) {
 *   const co2e = amount * emissionFactor;
 * }
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value) && isFinite(value);
}

/**
 * Checks if a value is a positive number (> 0).
 * 
 * **Useful for:** amounts, distances, quantities that can't be negative.
 * 
 * @example
 * if (isPositiveNumber(distance)) {
 *   const emissions = distance * emissionFactor;
 * } else {
 *   return { error: "Distance must be positive" };
 * }
 */
export function isPositiveNumber(value: unknown): value is number {
  return isNumber(value) && value > 0;
}

/**
 * Checks if a value is a non-negative number (>= 0).
 * 
 * **Use when zero is valid:** counts, optional amounts.
 * 
 * @example
 * if (isNonNegativeNumber(gasUsage)) {
 *   // Zero is valid (no gas usage)
 *   const emissions = gasUsage * gasFactor;
 * }
 */
export function isNonNegativeNumber(value: unknown): value is number {
  return isNumber(value) && value >= 0;
}

/**
 * Checks if a value is a valid integer (whole number).
 * 
 * @example
 * const householdSize = formData.get("householdSize");
 * if (isInteger(householdSize)) {
 *   // Can't have 2.5 people in a household!
 *   saveHouseholdSize(householdSize);
 * }
 */
export function isInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value);
}

/**
 * Checks if a value is a boolean (true or false).
 * 
 * @example
 * const isCompleted = goal.isCompleted;
 * if (isBoolean(isCompleted)) {
 *   updateGoalStatus(goal.id, isCompleted);
 * }
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/**
 * Checks if a value is a valid Date object.
 * 
 * @example
 * if (isValidDate(date)) {
 *   const formatted = date.toISOString();
 * }
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

// ==========================================
// ARRAY TYPE GUARDS
// ==========================================

/**
 * Checks if a value is an array.
 * 
 * @example
 * const goals = formData.get("goals");
 * if (isArray(goals)) {
 *   goals.forEach(goal => console.log(goal));
 * }
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Checks if a value is an array of strings.
 * 
 * **Common use:** Form data with multiple selections.
 * 
 * @example
 * const selectedGoals = formData.getAll("goals");
 * if (isStringArray(selectedGoals)) {
 *   saveUserGoals(selectedGoals);
 * }
 */
export function isStringArray(value: unknown): value is string[] {
  return isArray(value) && value.every(item => isString(item));
}

/**
 * Checks if a value is an array of numbers.
 * 
 * @example
 * if (isNumberArray(values)) {
 *   const sum = values.reduce((a, b) => a + b, 0);
 * }
 */
export function isNumberArray(value: unknown): value is number[] {
  return isArray(value) && value.every(item => isNumber(item));
}

// ==========================================
// OBJECT TYPE GUARDS
// ==========================================

/**
 * Checks if a value is a non-null object (not array, not null).
 * 
 * @example
 * if (isObject(data)) {
 *   const keys = Object.keys(data);
 * }
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Checks if an object has a specific property.
 * 
 * **Use this instead of:** obj.property (which might error)
 * 
 * @example
 * if (hasProperty(user, "email")) {
 *   console.log(user.email); // Safe!
 * }
 */
export function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return isObject(obj) && key in obj;
}

/**
 * Checks if object has property AND it's a string.
 * 
 * @example
 * if (hasStringProperty(obj, "email")) {
 *   // obj.email is guaranteed to be a string
 *   const lowercase = obj.email.toLowerCase();
 * }
 */
export function hasStringProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, string> {
  return hasProperty(obj, key) && isString(obj[key]);
}

/**
 * Checks if object has property AND it's a number.
 * 
 * @example
 * if (hasNumberProperty(obj, "amount")) {
 *   const doubled = obj.amount * 2;
 * }
 */
export function hasNumberProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, number> {
  return hasProperty(obj, key) && isNumber(obj[key]);
}

// ==========================================
// DOMAIN-SPECIFIC TYPE GUARDS
// ==========================================

/**
 * Checks if a string is a valid activity category.
 * 
 * **Valid values:** "TRANSPORT", "FOOD", "ENERGY", "SHOPPING", "GENERAL"
 * 
 * @example
 * const category = formData.get("category");
 * if (isActivityCategory(category)) {
 *   // TypeScript knows it's one of the valid categories
 *   await logActivity({ category, actionType, amount });
 * }
 */
export function isActivityCategory(value: unknown): value is ActivityCategory {
  return (
    isString(value) &&
    ["TRANSPORT", "FOOD", "ENERGY", "SHOPPING", "GENERAL"].includes(value)
  );
}

/**
 * Checks if a string is a valid commute type.
 * 
 * **Valid values:** "CAR_PETROL", "CAR_DIESEL", "EV", "TRANSIT", "NONE"
 * 
 * @example
 * if (isCommuteType(value)) {
 *   const emissions = calculateCommuteEmissions(value, distance);
 * }
 */
export function isCommuteType(value: unknown): value is CommuteType {
  return (
    isString(value) &&
    ["CAR_PETROL", "CAR_DIESEL", "EV", "TRANSIT", "NONE"].includes(value)
  );
}

/**
 * Checks if a string is a valid diet pattern.
 * 
 * **Valid values:** "HIGH_MEAT", "LOW_MEAT", "VEGETARIAN", "VEGAN"
 * 
 * @example
 * if (isDietPattern(value)) {
 *   const foodEmissions = calculateDietEmissions(value);
 * }
 */
export function isDietPattern(value: unknown): value is DietPattern {
  return (
    isString(value) &&
    ["HIGH_MEAT", "LOW_MEAT", "VEGETARIAN", "VEGAN"].includes(value)
  );
}

/**
 * Checks if a string is a valid shopping pattern.
 * 
 * **Valid values:** "HEAVY", "MODERATE", "MINIMALIST"
 * 
 * @example
 * if (isShoppingPattern(value)) {
 *   const shoppingEmissions = calculateShoppingEmissions(value);
 * }
 */
export function isShoppingPattern(value: unknown): value is ShoppingPattern {
  return (
    isString(value) &&
    ["HEAVY", "MODERATE", "MINIMALIST"].includes(value)
  );
}

/**
 * Checks if a string is a valid budget sensitivity level.
 * 
 * **Valid values:** "LOW", "MEDIUM", "HIGH"
 * 
 * @example
 * if (isBudgetSensitivity(value)) {
 *   const recommendations = filterByBudget(tips, value);
 * }
 */
export function isBudgetSensitivity(value: unknown): value is BudgetSensitivity {
  return (
    isString(value) &&
    ["LOW", "MEDIUM", "HIGH"].includes(value)
  );
}

// ==========================================
// FORM DATA TYPE GUARDS
// ==========================================

/**
 * Safely extracts a string from FormData.
 * 
 * **Use this instead of:** `formData.get("field") as string`
 * 
 * @example
 * const email = getFormString(formData, "email");
 * if (email) {
 *   // email is guaranteed to be a non-empty string
 *   await sendVerificationEmail(email);
 * } else {
 *   return { error: "Email is required" };
 * }
 */
export function getFormString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return isNonEmptyString(value) ? value : null;
}

/**
 * Safely extracts a number from FormData.
 * 
 * **Handles:** String numbers from form inputs (e.g., "25" → 25)
 * 
 * @example
 * const amount = getFormNumber(formData, "amount");
 * if (amount !== null) {
 *   const emissions = amount * factor;
 * } else {
 *   return { error: "Amount must be a valid number" };
 * }
 */
export function getFormNumber(formData: FormData, key: string): number | null {
  const value = formData.get(key);
  
  // Handle numeric string inputs from forms
  if (isString(value)) {
    const parsed = parseFloat(value);
    return isNumber(parsed) ? parsed : null;
  }
  
  return isNumber(value) ? value : null;
}

/**
 * Safely extracts an integer from FormData.
 * 
 * @example
 * const householdSize = getFormInteger(formData, "householdSize");
 * if (householdSize !== null) {
 *   saveHouseholdSize(householdSize);
 * }
 */
export function getFormInteger(formData: FormData, key: string): number | null {
  const value = getFormNumber(formData, key);
  return value !== null && Number.isInteger(value) ? value : null;
}

/**
 * Safely extracts a boolean from FormData (checkbox).
 * 
 * **Handles:** Checkbox values ("on", "true", true)
 * 
 * @example
 * const isCompleted = getFormBoolean(formData, "isCompleted");
 * await updateGoal(goalId, { isCompleted });
 */
export function getFormBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  
  if (isBoolean(value)) return value;
  if (value === "on" || value === "true") return true;
  
  return false;
}

/**
 * Safely extracts multiple string values from FormData.
 * 
 * **Use for:** Multi-select inputs, checkbox groups
 * 
 * @example
 * const selectedGoals = getFormStringArray(formData, "goals");
 * // selectedGoals is string[], never null or undefined
 * saveUserGoals(selectedGoals);
 */
export function getFormStringArray(formData: FormData, key: string): string[] {
  const values = formData.getAll(key);
  return values.filter(isString);
}

// ==========================================
// VALIDATION HELPERS
// ==========================================

/**
 * Validates email format using regex.
 * 
 * **Simple check:** Contains @ and . in reasonable positions
 * 
 * @example
 * if (isValidEmail(email)) {
 *   await sendEmail(email);
 * } else {
 *   return { error: "Please enter a valid email address" };
 * }
 */
export function isValidEmail(value: unknown): value is string {
  if (!isString(value)) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Validates that a number is within a range (inclusive).
 * 
 * @example
 * if (isInRange(householdSize, 1, 20)) {
 *   saveHouseholdSize(householdSize);
 * } else {
 *   return { error: "Household size must be between 1 and 20" };
 * }
 */
export function isInRange(value: unknown, min: number, max: number): value is number {
  return isNumber(value) && value >= min && value <= max;
}

/**
 * Validates that a string meets minimum length requirement.
 * 
 * @example
 * if (meetsMinLength(password, 6)) {
 *   await createAccount(email, password);
 * } else {
 *   return { error: "Password must be at least 6 characters" };
 * }
 */
export function meetsMinLength(value: unknown, minLength: number): value is string {
  return isString(value) && value.length >= minLength;
}

/**
 * Validates ISO date string format.
 * 
 * @example
 * if (isISODateString(dateStr)) {
 *   const date = new Date(dateStr);
 *   // date is valid
 * }
 */
export function isISODateString(value: unknown): value is string {
  if (!isString(value)) return false;
  
  const date = new Date(value);
  return isValidDate(date);
}
