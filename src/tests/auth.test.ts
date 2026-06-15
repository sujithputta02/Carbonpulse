import { describe, it, expect } from "vitest";
import { hashPassword, signSession, verifySession, verifyPassword } from "../utils/auth";
import crypto from "crypto";

describe("CarbonPulse Security and Authentication Engine", () => {
  it("should securely hash passwords with a salt", () => {
    const p1 = "password123";
    const h1 = hashPassword(p1);
    const h2 = hashPassword(p1);
    
    // Hash should be consistent
    expect(h1).toBe(h2);
    
    // Hash should NOT be the simple unsalted SHA-256 (ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f)
    expect(h1).not.toBe("ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f");
  });

  it("should generate cryptographically signed session tokens", () => {
    const userId = "user-uuid-12345";
    const signedSession = signSession(userId);
    
    // Signed session must include the user ID and signature separated by dot
    expect(signedSession).toContain(userId);
    expect(signedSession.split(".").length).toBe(2);
  });

  it("should verify valid signed session tokens and extract user ID", () => {
    const userId = "user-uuid-12345";
    const signedSession = signSession(userId);
    const verifiedId = verifySession(signedSession);
    
    expect(verifiedId).toBe(userId);
  });

  it("should reject tampered or invalid session signatures", () => {
    const userId = "user-uuid-12345";
    const signedSession = signSession(userId);
    
    // Tamper with signature
    const parts = signedSession.split(".");
    const tamperedSession = `${parts[0]}.wrongsignature`;
    
    const verifiedId = verifySession(tamperedSession);
    expect(verifiedId).toBeNull();
  });

  it("should verify passwords using salted method and fallback to legacy unsalted checking", () => {
    const rawPassword = "mypassword";
    
    // 1. Salted verify
    const saltedHash = hashPassword(rawPassword);
    const v1 = verifyPassword(rawPassword, saltedHash);
    expect(v1.valid).toBe(true);
    expect(v1.upgradeHash).toBeUndefined();
    
    // 2. Legacy unsalted verify
    const unsaltedHash = crypto.createHash("sha256").update(rawPassword).digest("hex");
    
    const v2 = verifyPassword(rawPassword, unsaltedHash);
    expect(v2.valid).toBe(true);
    expect(v2.upgradeHash).toBe(saltedHash); // Indicates upgrade needed to salted hash
    
    // 3. Invalid credentials check
    const v3 = verifyPassword("wrongpassword", saltedHash);
    expect(v3.valid).toBe(false);
  });
});
