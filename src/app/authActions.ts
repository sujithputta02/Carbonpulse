"use server";

import { db } from "@/utils/db";
import { hashPassword, getCurrentUser, verifyPassword, setSessionCookie, clearSessionCookie } from "@/utils/auth";
import { redirect } from "next/navigation";

export interface AuthActionResult {
  error?: string;
  success?: boolean;
}

/**
 * Server action to register a new user.
 */
export async function signupAction(prevState: AuthActionResult | null, formData: FormData): Promise<AuthActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  
  const existingUser = db.getUserByEmail(email);
  if (existingUser) {
    return { error: "An account with this email already exists." };
  }
  
  const passwordHash = hashPassword(password);
  const user = db.createUser(email, passwordHash);
  
  await setSessionCookie(user.id);
  
  redirect("/onboarding");
}

/**
 * Server action to log in an existing user.
 */
export async function loginAction(prevState: AuthActionResult | null, formData: FormData): Promise<AuthActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  
  const user = db.getUserByEmail(email);
  if (!user) {
    return { error: "Invalid email or password." };
  }
  
  const verification = verifyPassword(password, user.passwordHash);
  if (!verification.valid) {
    return { error: "Invalid email or password." };
  }
  
  // If legacy hash matched, upgrade it to salted hash
  if (verification.upgradeHash) {
    db.updateUserPasswordHash(user.id, verification.upgradeHash);
  }
  
  await setSessionCookie(user.id);
  
  const profile = db.getProfile(user.id);
  if (profile) {
    redirect("/dashboard");
  } else {
    redirect("/onboarding");
  }
}

/**
 * Server action to log out.
 */
export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/");
}

/**
 * Server action to seed demo data for the currently authenticated session.
 */
export async function seedDemoDataForCurrentUserAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  db.seedDemoData(user.id);
}
