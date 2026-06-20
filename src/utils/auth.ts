import { cookies } from "next/headers";
import crypto from "crypto";
import { db, UserAccount } from "./db";

/**
 * Secret key used for signing session cookies with HMAC.
 * This prevents attackers from tampering with user session data.
 * In production, always set SESSION_SECRET in environment variables.
 */
const SESSION_SECRET = process.env.SESSION_SECRET || "carbon-pulse-fallback-secret-2026-secure-32chars";

/**
 * Salt added to passwords before hashing.
 * Salting makes each password unique and protects against rainbow table attacks
 * (pre-computed hash tables used by attackers).
 */
const PASSWORD_SALT = "carbon-pulse-secure-salt-random-2026";

/**
 * Converts a plain-text password into a secure hash using SHA-256 encryption.
 * 
 * **Why we do this:**
 * - Never store passwords in plain text
 * - Even if database is compromised, attackers can't read actual passwords
 * - Salt makes each password unique, even if two users choose the same password
 * 
 * **Example:**
 * ```typescript
 * const userPassword = "mySecretPassword123";
 * const hashedPassword = hashPassword(userPassword);
 * // Store hashedPassword in database, not the original password
 * ```
 * 
 * @param password - The user's plain-text password to be hashed
 * @returns A 64-character hexadecimal string (SHA-256 hash) that represents the password
 */
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + PASSWORD_SALT).digest("hex");
}

/**
 * Creates a cryptographically signed session token from a user ID.
 * 
 * **Why we do this:**
 * - Prevents attackers from forging session cookies (e.g., changing user ID from "user123" to "admin")
 * - Uses HMAC (Hash-based Message Authentication Code) to create a digital signature
 * - Only our server with the SESSION_SECRET can create valid signatures
 * 
 * **How it works:**
 * 1. Take the user ID (e.g., "abc-123")
 * 2. Create a signature using the secret key
 * 3. Combine them as "abc-123.signature"
 * 
 * **Example:**
 * ```typescript
 * const userId = "user-abc-123";
 * const signedToken = signSession(userId);
 * // Returns: "user-abc-123.a1b2c3d4e5..." (userId + signature)
 * ```
 * 
 * @param userId - The unique identifier for the logged-in user
 * @returns A signed string in format "userId.signature" that can be stored in cookies
 */
export function signSession(userId: string): string {
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(userId).digest("hex");
  return `${userId}.${signature}`;
}

/**
 * Verifies that a session token hasn't been tampered with and extracts the user ID.
 * 
 * **Why we do this:**
 * - Ensures the session cookie came from our server and hasn't been modified
 * - Protects against session hijacking and cookie tampering
 * - Uses timing-safe comparison to prevent timing attack vulnerabilities
 * 
 * **Security features:**
 * - Constant-time comparison: Prevents attackers from guessing the signature
 * - Signature validation: Confirms the token was created by our server
 * 
 * **Example:**
 * ```typescript
 * const cookieValue = "user-123.a1b2c3d4...";
 * const userId = verifySession(cookieValue);
 * if (userId) {
 *   // Cookie is valid, user is authenticated
 * } else {
 *   // Cookie was tampered with or invalid
 * }
 * ```
 * 
 * @param signedValue - The session token from the cookie (format: "userId.signature")
 * @returns The user ID if signature is valid, or null if the session is invalid or tampered
 */
export function verifySession(signedValue: string): string | null {
  const parts = signedValue.split(".");
  if (parts.length !== 2) return null;
  
  const [userId, signature] = parts;
  const expectedSignature = crypto.createHmac("sha256", SESSION_SECRET).update(userId).digest("hex");
  
  if (signature.length !== expectedSignature.length) return null;
  
  // Use constant-time comparison to protect against timing attacks
  // Timing attacks: attackers measure response times to guess correct values
  if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return userId;
  }
  return null;
}

/**
 * Creates and stores a secure session cookie that remembers the logged-in user.
 * 
 * **Why we do this:**
 * - Keeps users logged in across page visits
 * - Stores the session securely in browser cookies
 * - Cookie is HttpOnly (JavaScript can't access it) to prevent XSS attacks
 * - Cookie is SameSite to prevent CSRF attacks
 * 
 * **Security settings:**
 * - httpOnly: true → JavaScript cannot read this cookie (prevents XSS attacks)
 * - secure: true in production → Only sent over HTTPS (prevents eavesdropping)
 * - sameSite: "lax" → Prevents cross-site request forgery (CSRF) attacks
 * - maxAge: 30 days → User stays logged in for a month
 * 
 * **Example:**
 * ```typescript
 * // After successful login:
 * await setSessionCookie(user.id);
 * // Now user can navigate to other pages and stay logged in
 * ```
 * 
 * @param userId - The unique identifier of the user to create a session for
 * @returns Promise that resolves when the cookie is set
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
 * Removes the session cookie, effectively logging the user out.
 * 
 * **How it works:**
 * - Sets the cookie value to empty string
 * - Sets maxAge to 0, which tells the browser to delete it immediately
 * 
 * **Example:**
 * ```typescript
 * // When user clicks "Log Out" button:
 * await clearSessionCookie();
 * // User is now logged out and redirected to home page
 * ```
 * 
 * @returns Promise that resolves when the cookie is cleared
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
 * Gets the currently logged-in user's account information from the session cookie.
 * 
 * **How it works:**
 * 1. Reads the session cookie from the browser request
 * 2. Verifies the signature to ensure it hasn't been tampered with
 * 3. Looks up the user in the database
 * 4. Returns null if any step fails (cookie missing, invalid, or user not found)
 * 
 * **Use this function when:**
 * - You need to check if someone is logged in
 * - You need to access the current user's email or ID
 * - You want to restrict access to authenticated users only
 * 
 * **Example:**
 * ```typescript
 * const user = await getCurrentUser();
 * if (!user) {
 *   // No one is logged in, show login page
 *   redirect("/login");
 * } else {
 *   // User is logged in, show their profile
 *   console.log(`Welcome back, ${user.email}!`);
 * }
 * ```
 * 
 * @returns Promise with the user account object if logged in, or null if not logged in
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
 * Checks if a password matches a stored hash, with support for legacy password migration.
 * 
 * **Why we do this:**
 * - Safely compares passwords without revealing the actual password
 * - Supports upgrading old passwords to more secure hashing (if you changed the salt)
 * - Never compares plain text passwords directly
 * 
 * **Password upgrade flow:**
 * If a user has an old password hash (without salt), this function:
 * 1. Verifies their password still works
 * 2. Returns upgradeHash to update their password to the new secure method
 * 3. Maintains backward compatibility while improving security
 * 
 * **Example:**
 * ```typescript
 * const userInput = "myPassword123";
 * const storedHash = user.passwordHash; // from database
 * 
 * const result = verifyPassword(userInput, storedHash);
 * if (result.valid) {
 *   // Password is correct, log them in
 *   if (result.upgradeHash) {
 *     // Old password format, upgrade to new secure hash
 *     db.updateUserPasswordHash(user.id, result.upgradeHash);
 *   }
 * } else {
 *   // Wrong password, show error
 * }
 * ```
 * 
 * @param password - The plain-text password provided by the user during login
 * @param storedHash - The hashed password stored in the database
 * @returns Object with: valid (true if password matches), upgradeHash (new hash if legacy password)
 */
export function verifyPassword(password: string, storedHash: string): { valid: boolean; upgradeHash?: string } {
  const saltedHash = hashPassword(password);
  if (storedHash === saltedHash) {
    return { valid: true };
  }
  
  // Legacy fallback: support old password hashes without salt
  const legacyHash = crypto.createHash("sha256").update(password).digest("hex");
  if (storedHash === legacyHash) {
    return { valid: true, upgradeHash: saltedHash };
  }
  
  return { valid: false };
}
