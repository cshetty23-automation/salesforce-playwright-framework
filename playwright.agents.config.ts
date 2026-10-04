import { defineConfig } from '@playwright/test';
import config from './playwright.config';

/**
 * Config for the playwright-test MCP server that the planner, healer and generator agents
 * drive (.mcp.json passes it with -c).
 *
 * The healer's test_run takes locations and projects but no grep, and with no locations it
 * runs every spec — including the four @writes specs, each of which creates a real record
 * that nothing deletes. Filtering here means the agents cannot list or run those specs at
 * all, whatever they are asked. Drop the -c from .mcp.json once they have earned trust on
 * the read-only specs.
 *
 * Spreads playwright.config.ts rather than the base so agents run exactly what `npm test`
 * runs, minus @writes — the same filter as `npm run test:readonly`.
 */
export default defineConfig({
  ...config,
  grepInvert: /@writes/,
});
