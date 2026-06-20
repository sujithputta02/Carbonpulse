"use server";

import { db } from "@/utils/db";
import { hashPassword, getCurrentUser, verifyPassword, setSessionCookie, clearSessionCookie } from "@/utils/auth";
import { redirect } from "next/navigation";
import { signupSchema, loginSchema } from "@/lib/validation/onboardingSchema";
import { getFormString } from "@/lib/typeGuards";

/**
 * Result type for authentication actions.
 * Used by React's useFormState hook to display errors/success messages.
 */
export interface AuthActionResult {
  /** Error message to display to user (if action failed) */
  error?: string;
  /** Success flag (if action succeeded) */
  success?: boolean;
}

/**
 * Creates a new user account and logs them in automatically.
 * 
 * **What this function does:**
 * 1. Extracts email and password from form data
 * 2. Validates email format and password strength using Zod
 * 3. Checks if email is already registered
 * 4. Hashes the password securely (never stores plain text!)
 * 5. Creates user account in database
 * 6. Sets session cookie to log them in
 * 7. Redirects to onboarding page
 * 
 * **Validation rules:**
 * - Email: Must be valid email format (contains @)
 * - Password: Minimum 6 characters (configured in validation schema)
 * 
 * **Security features:**
 * - Password is hashed with SHA-256 + salt before storage
 * - Email uniqueness is checked to prevent duplicates
 * - Session cookie is signed to prevent tampering
 * 
 * **Error handling:**
 * - Returns error object instead of throwing (React form-friendly)
 * - Validation errors show field-specific messages
 * - Duplicate email shows user-friendly message
 * 
 * **Example usage in React:**
 * ```typescript
 * import { useFormState } from 'react-dom';
 * 
 * function SignupForm() {
 *   const [state, formAction] = useFormState(signupAction, null);
 *   
 *   return (
 *     <form action={formAction}>
 *       <input name="email" type="email" required />
 *       <input name="password" type="password" required />
 *       {state?.error && <p className="error">{state.error}</p>}
 *       <button type="submit">Sign Up</button>
 *     </form>
 *   );
 * }
 * ```
 * 
 * @param prevState - Previous form state (null on first render, or previous result)
 * @param formData - Form data containing email and password fields
 * @returns AuthActionResult with error message if failed, or redirects to /onboarding if successful
 */
export async function signupAction(prevState: AuthActionResult | null, formData: FormData): Promise<AuthActionResult> {
  // Safely extract form values using type guards
  const email = getFormString(formData, "email");
  const password = getFormString(formData, "password");
  
  // Check if values were successfully extracted
  if (!email || !password) {
    return { error: "Email and password are required" };
  }
  
  // Validate email and password format with Zod
  const validated = signupSchema.safeParse({ email, password });
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }
  
  // Check if email is already registered
  const existingUser = db.getUserByEmail(email);
  if (existingUser) {
    return { error: "An account with this email already exists." };
  }
  
  // Hash password securely (SHA-256 + salt)
  const passwordHash = hashPassword(password);
  const user = db.createUser(email, passwordHash);
  
  // Log in the new user by setting session cookie
  await setSessionCookie(user.id);
  
  // Redirect to onboarding to set up their profile
  redirect("/onboarding");
}

/**
 * Authenticates an existing user and logs them in.
 * 
 * **What this function does:**
 * 1. Extracts email and password from form data
 * 2. Validates input format using Zod
 * 3. Looks up user by email
 * 4. Verifies password matches stored hash
 * 5. Upgrades password hash if using old format (security improvement)
 * 6. Sets session cookie to log them in
 * 7. Redirects to dashboard (or onboarding if profile not complete)
 * 
 * **Security features:**
 * - Uses timing-safe password comparison to prevent timing attacks
 * - Generic error message for wrong email/password (doesn't reveal which is wrong)
 * - Automatically upgrades legacy password hashes to new secure format
 * - Session cookie is signed and HttpOnly to prevent XSS attacks
 * 
 * **Smart redirect logic:**
 * - Has profile → /dashboard (user has completed onboarding)
 * - No profile → /onboarding (user needs to complete setup)
 * 
 * **Error handling:**
 * - Returns error object instead of throwing (React form-friendly)
 * - Same error for wrong email or wrong password (security best practice)
 * - Validation errors show specific issues
 * 
 * **Example usage in React:**
 * ```typescript
 * import { useFormState } from 'react-dom';
 * 
 * function LoginForm() {
 *   const [state, formAction] = useFormState(loginAction, null);
 *   
 *   return (
 *     <form action={formAction}>
 *       <input name="email" type="email" required />
 *       <input name="password" type="password" required />
 *       {state?.error && <p className="error">{state.error}</p>}
 *       <button type="submit">Log In</button>
 *     </form>
 *   );
 * }
 * ```
 * 
 * @param prevState - Previous form state (null on first render, or previous result)
 * @param formData - Form data containing email and password fields
 * @returns AuthActionResult with error message if failed, or redirects if successful
 */
export async function loginAction(prevState: AuthActionResult | null, formData: FormData): Promise<AuthActionResult> {
  // Safely extract form values using type guards
  const email = getFormString(formData, "email");
  const password = getFormString(formData, "password");
  
  // Check if values were successfully extracted
  if (!email || !password) {
    return { error: "Email and password are required" };
  }
  
  // Validate email and password format with Zod
  const validated = loginSchema.safeParse({ email, password });
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }
  
  // Look up user by email (case-insensitive)
  const user = db.getUserByEmail(email);
  if (!user) {
    // Generic error message for security (don't reveal if email exists)
    return { error: "Invalid email or password." };
  }
  
  // Verify password matches stored hash
  const verification = verifyPassword(password, user.passwordHash);
  if (!verification.valid) {
    // Generic error message for security (don't reveal if email exists)
    return { error: "Invalid email or password." };
  }
  
  // If password used old hash format, upgrade to new secure format
  if (verification.upgradeHash) {
    db.updateUserPasswordHash(user.id, verification.upgradeHash);
  }
  
  // Log in the user by setting session cookie
  await setSessionCookie(user.id);
  
  // Redirect based on whether they've completed onboarding
  const profile = db.getProfile(user.id);
  if (profile) {
    redirect("/dashboard"); // Profile exists, go to main app
  } else {
    redirect("/onboarding"); // No profile yet, complete setup
  }
}

/**
 * Logs out the current user and clears their session.
 * 
 * **What this function does:**
 * 1. Clears the session cookie (sets it to empty with maxAge 0)
 * 2. Browser automatically deletes the cookie
 * 3. Redirects to home page
 * 
 * **Security:**
 * - Immediately invalidates session
 * - No way to reuse the old session cookie
 * - User must log in again to access protected pages
 * 
 * **Example usage:**
 * ```typescript
 * <form action={logoutAction}>
 *   <button type="submit">Log Out</button>
 * </form>
 * ```
 * 
 * Or as a regular function:
 * ```typescript
 * async function handleLogout() {
 *   await logoutAction();
 * }
 * ```
 * 
 * @returns Nothing (void) - automatically redirects to home page
 */
export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/");
}

/**
 * Seeds demo data for the currently logged-in user.
 * 
 * **What this creates:**
 * - Complete user profile (Alex from New York)
 * - 28 days of realistic activity logs
 * - 3 sample goals (transport, food, energy)
 * 
 * **When to use:**
 * - User clicks "Load Demo Data" button
 * - Testing with realistic data
 * - Demonstrations
 * 
 * **Difference from seedDemoDataAction:**
 * - This requires user to be logged in first
 * - seedDemoDataAction creates and logs in demo user automatically
 * - This keeps their existing account, just adds data
 * 
 * **Example:**
 * ```typescript
 * <button onClick={async () => {
 *   await seedDemoDataForCurrentUserAction();
 *   router.refresh(); // Reload page to show new data
 * }}>
 *   Load Demo Data
 * </button>
 * ```
 * 
 * @returns Nothing (void) - data is added to database
 * @throws Error if user is not authenticated
 */
export async function seedDemoDataForCurrentUserAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  db.seedDemoData(user.id);
}
