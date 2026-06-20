/**
 * APPLICATION CONSTANTS
 * ======================
 * Central location for all magic numbers, strings, and configuration values.
 * 
 * **Why use constants?**
 * - Makes code self-documenting (BASELINE_REDUCTION_TARGET explains itself)
 * - Easy to update values in one place
 * - Prevents typos (using string literals repeatedly causes errors)
 * - Type-safe (TypeScript knows the exact values)
 */

// ==========================================
// CARBON FOOTPRINT TARGETS & GOALS
// ==========================================

/**
 * Default percentage reduction target for first-time users.
 * Example: If baseline is 500 kg CO2e/month, first goal is 50 kg (10%).
 */
export const BASELINE_REDUCTION_TARGET = 0.1; // 10%

/**
 * Average household carbon footprint in kg CO2e per year.
 * Used for comparisons and context.
 * Source: EPA (varies by country, this is US average)
 */
export const AVERAGE_ANNUAL_FOOTPRINT_KG = 16000;

/**
 * Monthly equivalent of average footprint.
 */
export const AVERAGE_MONTHLY_FOOTPRINT_KG = AVERAGE_ANNUAL_FOOTPRINT_KG / 12; // ~1,333 kg

// ==========================================
// USER SESSION & AUTHENTICATION
// ==========================================

/**
 * Demo account email address.
 * Used when creating demo data for first-time visitors.
 */
export const DEMO_EMAIL = "demo@carbonpulse.com";

/**
 * Default password for demo account (in development only).
 */
export const DEMO_PASSWORD = "password";

/**
 * Session cookie duration in seconds (30 days).
 */
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 2,592,000 seconds

/**
 * Session cookie name stored in browser.
 */
export const SESSION_COOKIE_NAME = "session_user_id";

// ==========================================
// DATA SEEDING & DEMO
// ==========================================

/**
 * Number of days of historical data to generate for demo.
 */
export const DEMO_DATA_DAYS = 28; // 4 weeks

/**
 * Demo user profile name.
 */
export const DEMO_USER_NAME = "Alex";

/**
 * Demo user location.
 */
export const DEMO_USER_LOCATION = "New York, USA";

/**
 * Demo user household size.
 */
export const DEMO_HOUSEHOLD_SIZE = 2;

/**
 * Demo user baseline footprint in kg CO2e per month.
 */
export const DEMO_BASELINE_FOOTPRINT = 535.40;

// ==========================================
// ACTIVITY LOGGING CONSTANTS
// ==========================================

/**
 * Valid activity categories for logging.
 */
export const ACTIVITY_CATEGORIES = {
  TRANSPORT: "TRANSPORT",
  FOOD: "FOOD",
  ENERGY: "ENERGY",
  SHOPPING: "SHOPPING",
  GENERAL: "GENERAL",
} as const;

/**
 * Type for activity categories.
 */
export type ActivityCategory = keyof typeof ACTIVITY_CATEGORIES;

/**
 * Transport action types.
 */
export const TRANSPORT_ACTIONS = {
  PETROL_CAR: "PETROL_CAR",
  DIESEL_CAR: "DIESEL_CAR",
  EV: "EV",
  BUS: "BUS",
  TRAIN: "TRAIN",
  BICYCLE: "BICYCLE",
  WALK: "WALK",
} as const;

/**
 * Food action types.
 */
export const FOOD_ACTIONS = {
  HIGH_MEAT_MEAL: "HIGH_MEAT_MEAL",
  LOW_MEAT_MEAL: "LOW_MEAT_MEAL",
  VEGGIE_MEAL: "VEGGIE_MEAL",
  VEGAN_MEAL: "VEGAN_MEAL",
} as const;

/**
 * Energy action types.
 */
export const ENERGY_ACTIONS = {
  ELECTRICITY: "ELECTRICITY",
  NATURAL_GAS: "NATURAL_GAS",
} as const;

/**
 * Shopping action types.
 */
export const SHOPPING_ACTIONS = {
  CLOTHING: "CLOTHING",
  ELECTRONICS: "ELECTRONICS",
  FURNITURE: "FURNITURE",
  OTHER: "OTHER",
} as const;

// ==========================================
// RECOMMENDATION SYSTEM
// ==========================================

/**
 * Maximum number of recommendations to show to user at once.
 */
export const MAX_RECOMMENDATIONS = 3;

/**
 * Minimum CO2e savings (in kg) for a recommendation to be considered impactful.
 */
export const MIN_IMPACTFUL_SAVINGS_KG = 5;

/**
 * Categories for goal recommendations.
 */
export const GOAL_CATEGORIES = {
  SAVE_MONEY: "SAVE_MONEY",
  REDUCE_EMISSIONS: "REDUCE_EMISSIONS",
  BUILD_HABITS: "BUILD_HABITS",
} as const;

// ==========================================
// UI/UX CONSTANTS
// ==========================================

/**
 * Number of recent activity logs to show on dashboard.
 */
export const DASHBOARD_RECENT_LOGS_COUNT = 10;

/**
 * Chart colors for different categories (Tailwind classes).
 */
export const CATEGORY_COLORS = {
  TRANSPORT: "rgb(59, 130, 246)", // blue-500
  FOOD: "rgb(34, 197, 94)", // green-500
  ENERGY: "rgb(251, 146, 60)", // orange-400
  SHOPPING: "rgb(168, 85, 247)", // purple-500
  GENERAL: "rgb(156, 163, 175)", // gray-400
} as const;

/**
 * Chart colors in hex format (for exports/PDFs).
 */
export const CATEGORY_COLORS_HEX = {
  TRANSPORT: "#3B82F6",
  FOOD: "#22C55E",
  ENERGY: "#FB923C",
  SHOPPING: "#A855F7",
  GENERAL: "#9CA3AF",
} as const;

/**
 * Icon names for each category (from lucide-react).
 */
export const CATEGORY_ICONS = {
  TRANSPORT: "Car",
  FOOD: "Utensils",
  ENERGY: "Zap",
  SHOPPING: "ShoppingBag",
  GENERAL: "Target",
} as const;

/**
 * Human-readable labels for categories.
 */
export const CATEGORY_LABELS = {
  TRANSPORT: "Transportation",
  FOOD: "Food & Diet",
  ENERGY: "Home Energy",
  SHOPPING: "Shopping & Goods",
  GENERAL: "General",
} as const;

// ==========================================
// VALIDATION CONSTANTS
// ==========================================

/**
 * Minimum password length for security.
 */
export const MIN_PASSWORD_LENGTH = 6;

/**
 * Maximum household size (for validation).
 */
export const MAX_HOUSEHOLD_SIZE = 20;

/**
 * Maximum commute distance per week in kilometers (for validation).
 */
export const MAX_COMMUTE_DISTANCE_WEEKLY = 1000; // 1000 km/week = ~50km each way daily

/**
 * Maximum electricity usage per month in kWh (for validation).
 */
export const MAX_ELECTRICITY_MONTHLY_KWH = 10000; // Very high usage household

/**
 * Maximum natural gas usage per month in kWh (for validation).
 */
export const MAX_NATURAL_GAS_MONTHLY_KWH = 10000;

// ==========================================
// FILE EXPORT CONSTANTS
// ==========================================

/**
 * Export file name for JSON format.
 */
export const EXPORT_FILENAME_JSON = "carbon-pulse-activity-logs.json";

/**
 * Export file name for CSV format.
 */
export const EXPORT_FILENAME_CSV = "carbon-pulse-activity-logs.csv";

/**
 * CSV header column names.
 */
export const CSV_HEADERS = ["id", "category", "actionType", "amount", "date", "estimatedCO2e"] as const;

// ==========================================
// LOCAL STORAGE KEYS
// ==========================================

/**
 * Local storage key for onboarding draft (auto-save).
 */
export const LS_ONBOARDING_DRAFT = "carbonpulse_onboarding_draft";

/**
 * Local storage key for database backup (client-side sync).
 */
export const LS_DATABASE_BACKUP = "carbonpulse_db";

/**
 * Local storage key for user preferences.
 */
export const LS_USER_PREFERENCES = "carbonpulse_preferences";

// ==========================================
// STREAK & GAMIFICATION
// ==========================================

/**
 * Minimum number of consecutive completions to show streak badge.
 */
export const MIN_STREAK_FOR_BADGE = 3;

/**
 * Number of days to calculate streak over.
 */
export const STREAK_CALCULATION_DAYS = 7; // Weekly streak

/**
 * Points awarded for completing a goal.
 */
export const POINTS_PER_GOAL_COMPLETION = 10;

// ==========================================
// BUDGET SENSITIVITY LEVELS
// ==========================================

/**
 * Budget sensitivity levels for recommendations.
 */
export const BUDGET_LEVELS = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
} as const;

/**
 * Type for budget sensitivity.
 */
export type BudgetSensitivity = keyof typeof BUDGET_LEVELS;

// ==========================================
// COMMUTE TYPES
// ==========================================

/**
 * Available commute types for profile.
 */
export const COMMUTE_TYPES = {
  CAR_PETROL: "CAR_PETROL",
  CAR_DIESEL: "CAR_DIESEL",
  EV: "EV",
  TRANSIT: "TRANSIT",
  NONE: "NONE",
} as const;

/**
 * Type for commute types.
 */
export type CommuteType = keyof typeof COMMUTE_TYPES;

/**
 * Human-readable labels for commute types.
 */
export const COMMUTE_TYPE_LABELS = {
  CAR_PETROL: "Petrol Car",
  CAR_DIESEL: "Diesel Car",
  EV: "Electric Vehicle",
  TRANSIT: "Public Transit",
  NONE: "No Commute / Work from Home",
} as const;

// ==========================================
// DIET PATTERNS
// ==========================================

/**
 * Available diet patterns for profile.
 */
export const DIET_PATTERNS = {
  HIGH_MEAT: "HIGH_MEAT",
  LOW_MEAT: "LOW_MEAT",
  VEGETARIAN: "VEGETARIAN",
  VEGAN: "VEGAN",
} as const;

/**
 * Type for diet patterns.
 */
export type DietPattern = keyof typeof DIET_PATTERNS;

/**
 * Human-readable labels for diet patterns.
 */
export const DIET_PATTERN_LABELS = {
  HIGH_MEAT: "High Meat (daily red meat)",
  LOW_MEAT: "Low Meat (occasional meat)",
  VEGETARIAN: "Vegetarian (no meat, eggs/dairy ok)",
  VEGAN: "Vegan (plant-based only)",
} as const;

// ==========================================
// SHOPPING PATTERNS
// ==========================================

/**
 * Available shopping patterns for profile.
 */
export const SHOPPING_PATTERNS = {
  HEAVY: "HEAVY",
  MODERATE: "MODERATE",
  MINIMALIST: "MINIMALIST",
} as const;

/**
 * Type for shopping patterns.
 */
export type ShoppingPattern = keyof typeof SHOPPING_PATTERNS;

/**
 * Human-readable labels for shopping patterns.
 */
export const SHOPPING_PATTERN_LABELS = {
  HEAVY: "Heavy (frequent purchases)",
  MODERATE: "Moderate (occasional purchases)",
  MINIMALIST: "Minimalist (rare purchases)",
} as const;

// ==========================================
// ERROR MESSAGES
// ==========================================

/**
 * Common error messages used throughout the application.
 */
export const ERROR_MESSAGES = {
  UNAUTHORIZED: "You must be logged in to perform this action",
  NO_PROFILE: "Please complete onboarding first",
  INVALID_INPUT: "Please check your input and try again",
  NETWORK_ERROR: "Network error. Please check your connection",
  SERVER_ERROR: "Something went wrong. Please try again later",
  NOT_FOUND: "The requested resource was not found",
} as const;

// ==========================================
// SUCCESS MESSAGES
// ==========================================

/**
 * Common success messages used throughout the application.
 */
export const SUCCESS_MESSAGES = {
  PROFILE_SAVED: "Profile saved successfully!",
  ACTIVITY_LOGGED: "Activity logged successfully!",
  GOAL_COMPLETED: "Goal completed! Well done!",
  GOAL_CREATED: "Goal created successfully!",
  DATA_EXPORTED: "Data exported successfully!",
  DATA_IMPORTED: "Data imported successfully!",
} as const;
