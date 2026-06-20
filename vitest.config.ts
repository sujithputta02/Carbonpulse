/**
 * VITEST CONFIGURATION
 * ====================
 * Test configuration for unit and integration testing.
 * 
 * **Testing Strategy:**
 * - Unit tests: Pure functions, utilities, type guards
 * - Integration tests: Server actions, database operations
 * - Coverage target: 80%+ for critical paths
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',
    
    // Global test setup
    globals: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        'dist/',
        '**/*.config.*',
        '**/types/**',
        '**/*.d.ts',
      ],
      // Target 80% coverage
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    
    // Test file patterns
    include: [
      '**/__tests__/**/*.test.{ts,tsx}',
      '**/tests/**/*.test.{ts,tsx}',
    ],
    
    // Setup files
    setupFiles: ['./tests/setup.ts'],
  },
  
  // Path resolution (matches tsconfig paths)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
