import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// Minimal, dependency-free loader for an optional gitignored `e2e/.env` so
// credentials never have to be hardcoded or kept in shell history. Real shell
// env vars take precedence over the file.
const envFile = resolve(__dirname, 'e2e/.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

/**
 * Phase 6.12d — browser-console route smoke.
 *
 * Drives the REAL served frontend (which talks to the real API) and asserts
 * that no `console.error` / `pageerror` is emitted while navigating key routes.
 * This is the only check that reproduces the NG0201 blank-page class of bug
 * (build-green + Karma-green yet routes render blank because a runtime DI/render
 * error surfaces only in the browser console) — see the refactor plan, 6.12.
 *
 * Requires a running stack (API + MongoDB + Redis + served frontend). Nothing
 * is auto-spawned: the API cannot be started without its own datastores, so a
 * frontend-only `ng serve` would just produce noise. Bring the stack up
 * manually, then configure via env:
 *
 *   E2E_BASE_URL        served frontend origin (default http://localhost:4200)
 *   E2E_ADMIN_EMAIL     admin account email    (authed routes skipped if absent)
 *   E2E_ADMIN_PASSWORD  admin account password (never hardcode credentials)
 *
 * Run with: `npm run e2e` (see package.json).
 */

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:4200';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    ignoreHTTPSErrors: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
