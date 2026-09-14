// @ts-check
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default defineConfig(
  { ignores: ['node_modules/', 'test-results/', 'playwright-report/', 'cleanup-results/', 'playwright/'] },

  {
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommended],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // An un-awaited Playwright call races whatever comes next and fails intermittently.
      // Type-aware, so it also covers helpers, where the Playwright plugin's await rule does not look.
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },

  {
    files: ['tests/**/*.ts', 'maintenance/**/*.ts', 'setup/**/*.ts', 'helpers/**/*.ts'],
    extends: [playwright.configs['flat/recommended']],
    rules: {
      // The testing conventions in CLAUDE.md, enforced rather than remembered.
      'playwright/no-wait-for-timeout': 'error',
      'playwright/missing-playwright-await': 'error',
      'playwright/no-force-option': 'error',
      'playwright/no-focused-test': 'error',
      'playwright/no-page-pause': 'error',
      // gotoObject asserts that the page rendered, so a test that only navigates still asserts something.
      'playwright/expect-expect': ['error', { assertFunctionNames: ['gotoObject'] }],
    },
  },

  {
    // Cleanup is an env-driven maintenance script dressed as a test: branching on
    // CLEANUP (dry run vs delete) and CLEANUP_LIMIT is its whole job.
    files: ['maintenance/**/*.ts'],
    rules: { 'playwright/no-conditional-in-test': 'off' },
  },
);
