import { cookies } from "next/headers";
import crypto from "crypto";
import { db, UserAccount } from "./db";

// Use a fallback secret if process.env.SESSION_SECRET is not configured
const SESSION_SECRET = process.env.SESSION_SECRET || "carbon-pulse-fallback-secret-2026-secure-32chars";
const PASSWORD_SALT = "carbon-pulse-secure-salt-random-2026";

/**
 * Hashes a password using SHA-256 with a secure salt to resist dictionary attacks.
 */
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + PASSWORD_SALT).digest("hex");
}

/**
 * Signs a user ID with a HMAC signature to prevent cookie manipulation.
 */
export function signSession(userId: string): string {
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(userId).digest("hex");
  return `${userId}.${signature}`;
}

/**
 * Verifies the signature of a session value and returns the user ID if valid.
 */
export function verifySession(signedValue: string): string | null {
  const parts = signedValue.split(".");
  if (parts.length !== 2) return null;
  
  const [userId, signature] = parts;
  const expectedSignature = crypto.createHmac("sha256", SESSION_SECRET).update(userId).digest("hex");
  
  if (signature.length !== expectedSignature.length) return null;
  
  // Use constant-time comparison to protect against timing attacks
  if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return userId;
  }
  return null;
}

/**
 * Sets the session cookie securely.
 */
export async function setSessionCookie(userId: string): Promise<void> {
  const cookieStore = await cookies();
  const signedValue = signSession(userId);
  cookieStore.set("session_user_id", signedValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // Mitigate Cross-Site Request Forgery (CSRF)
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

/**
 * Clears the session cookie.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("session_user_id", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Retrieves the current logged-in user account from the session cookie.
 */
export async function getCurrentUser(): Promise<UserAccount | null> {
  try {
    const cookieStore = await cookies();
    const signedValue = cookieStore.get("session_user_id")?.value;
    if (!signedValue) return null;
    
    const userId = verifySession(signedValue);
    if (!userId) return null;
    
    return db.getUserById(userId);
  } catch {
    // Return null if cookies() is called outside a request context
    return null;
  }
}

/**
 * Verifies an input password against a stored hash.
 * If password matches legacy unsalted hash, indicates an upgrade is available.
 */
export function verifyPassword(password: string, storedHash: string): { valid: boolean; upgradeHash?: string } {
  const saltedHash = hashPassword(password);
  if (storedHash === saltedHash) {
    return { valid: true };
  }
  
  // Legacy fallback
  const legacyHash = crypto.createHash("sha256").update(password).digest("hex");
  if (storedHash === legacyHash) {
    return { valid: true, upgradeHash: saltedHash };
  }
  
  return { valid: false };
}
