/**
 * TEST SETUP & CONFIGURATION
 * ===========================
 * Global test environment setup for Vitest.
 * 
 * **What this does:**
 * - Sets up environment variables for testing
 * - Configures test database
 * - Provides global test utilities
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret-key-for-testing-only-32-characters-long';

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  // Keep error and warn for debugging
  error: console.error,
  warn: console.warn,
  // Suppress info and log in tests
  log: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};
