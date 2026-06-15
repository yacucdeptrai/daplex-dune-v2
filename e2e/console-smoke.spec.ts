import { test, expect, type Page } from '@playwright/test';

/**
 * Browser-console route smoke.
 *
 * Navigates the key routes of the running app and fails if any `console.error`
 * or uncaught `pageerror` is emitted. This is the unit/Karma-proof catch for the
 * NG0201 blank-page class of bug: build-green and Karma-green, yet a route
 * renders blank because a runtime DI/render error surfaces only in the browser
 * console (the app's GlobalErrorHandler swallows the Angular-level one).
 *
 * Public routes always run. Authenticated routes (admin + user) run only when
 * E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD are set, and are skipped otherwise so
 * this spec is safe to keep in the repo without a live stack. See
 * playwright.config.ts for required env and how to run.
 */

// Settle window after a navigation: lets the lazy route module load, Angular
// change detection run, and the initial HTTP calls resolve so any late error
// has a chance to surface before we assert.
const SETTLE_MS = 2_000;

/**
 * Known-benign console noise that should NOT fail the smoke. Keep this list
 * short and specific; every entry is a deliberate exception. Resource-load
 * failures are only ignored for static assets (see isIgnored) so that a real
 * API call failing 4xx/5xx is still caught.
 */
const IGNORED_CONSOLE_PATTERNS: RegExp[] = [
  /favicon\.ico/i,
  /ResizeObserver loop/i,
  /Failed to load resource/i,
];

const STATIC_ASSET_URL = /\.(png|jpe?g|webp|gif|svg|ico|woff2?|ttf|css|mp4|m3u8|vtt)(\?|$)/i;

/**
 * Angular runtime error codes (NG0201/NG0950/NG0955/NG0303/…). An NG-coded
 * message is ALWAYS a failure: it can never be suppressed by an ignore pattern.
 * Mirrors the Karma-side guard (`src/testing/console-error-guard.ts`).
 */
const NG_CODE_PATTERN = /\bNG[0-9]{3,4}\b/;

function isIgnored(text: string, url: string): boolean {
  // NG-coded framework errors are never benign.
  if (NG_CODE_PATTERN.test(text)) return false;
  if (!IGNORED_CONSOLE_PATTERNS.some((re) => re.test(text))) return false;
  // A generic "Failed to load resource" is only benign for static assets
  // (media thumbnails / fonts can legitimately 404 against an empty dev DB).
  // API request failures must still fail the smoke.
  if (/Failed to load resource/i.test(text)) {
    return STATIC_ASSET_URL.test(url) || /favicon/i.test(url);
  }
  return true;
}

/**
 * Attaches console.error + pageerror collectors to a page. Returns a stable
 * array reference; clear it between routes with `errors.length = 0` (never
 * reassign, or the listeners lose their target).
 */
function makeConsoleCollector(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    const url = msg.location()?.url ?? '';
    if (isIgnored(text, url)) return;
    errors.push(`[console.error] ${text}${url ? ` (${url})` : ''}`);
  });
  page.on('pageerror', (err) => {
    const text = err.message || String(err);
    if (isIgnored(text, '')) return;
    errors.push(`[pageerror] ${text}`);
  });
  return errors;
}

async function visit(page: Page, route: string): Promise<void> {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load').catch(() => {
    /* SPA may keep connections open (websocket); 'load' is best-effort */
  });
  await page.waitForTimeout(SETTLE_MS);
}

function assertClean(errors: string[], route: string): void {
  expect(errors, `Console errors while visiting ${route}:\n  ${errors.join('\n  ')}`).toEqual([]);
}

const ADMIN_EMAIL = process.env['E2E_ADMIN_EMAIL'];
const ADMIN_PASSWORD = process.env['E2E_ADMIN_PASSWORD'];
const hasCreds = Boolean(ADMIN_EMAIL && ADMIN_PASSWORD);

/**
 * Logs in via the real sign-in form and returns the authenticated user's id.
 * No captcha is required on a first attempt (it only appears after
 * SIGN_IN_LIMIT_COUNT failures). The id comes straight from the sign-in
 * response payload (UserDetails._id), avoiding any DOM scraping.
 */
async function login(page: Page, email: string, password: string): Promise<string> {
  await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
  await page.fill('#email', email);
  await page.fill('#password', password);
  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/auth/sign-in') && r.request().method() === 'POST'),
    page.click('button[type="submit"]'),
  ]);
  if (!response.ok()) {
    throw new Error(`Sign-in failed: HTTP ${response.status()} — check E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD`);
  }
  const body = (await response.json()) as { payload?: { _id?: string } };
  await page.waitForURL((url) => !url.pathname.endsWith('/sign-in'), { timeout: 15_000 });
  const userId = body?.payload?._id;
  if (!userId) throw new Error('Sign-in response did not contain payload._id');
  return userId;
}

const PUBLIC_ROUTES: ReadonlyArray<readonly [name: string, path: string]> = [
  ['home', '/'],
  ['sign-in', '/sign-in'],
  ['sign-up', '/sign-up'],
  ['forgot-password', '/forgot-password'],
];

test.describe('public routes (no auth)', () => {
  for (const [name, path] of PUBLIC_ROUTES) {
    test(`${name} (${path}) emits no console errors`, async ({ page }) => {
      const errors = makeConsoleCollector(page);
      await visit(page, path);
      assertClean(errors, path);
    });
  }
});

// Authenticated routes share one logged-in context (the refresh cookie set at
// login lets each full-page goto re-auth via the APP_INITIALIZER refresh).
const authedDescribe = hasCreds ? test.describe.serial : test.describe.skip;

authedDescribe('authenticated routes', () => {
  let page: Page;
  let errors: string[];
  let userId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    errors = makeConsoleCollector(page);
    userId = await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test.beforeEach(() => {
    errors.length = 0;
  });

  const ADMIN_ROUTES: ReadonlyArray<readonly [name: string, path: string]> = [
    ['genres', '/admin/genres'],
    ['productions', '/admin/productions'],
    ['media', '/admin/media'],
    ['audit-log', '/admin/audit-log'],
  ];

  for (const [name, path] of ADMIN_ROUTES) {
    test(`admin ${name} (${path}) renders without console errors`, async () => {
      await visit(page, path);
      expect(page.url(), `Was redirected away from ${path} — auth/permission failure?`).toContain(path);
      assertClean(errors, path);
    });
  }

  const SETTINGS_ROUTES: ReadonlyArray<readonly [name: string, path: string]> = [
    ['account', '/users/settings'],
    ['profile', '/users/settings/profile'],
    ['privacy', '/users/settings/privacy'],
    ['media', '/users/settings/media'],
    ['subtitle', '/users/settings/subtitle'],
  ];

  for (const [name, path] of SETTINGS_ROUTES) {
    test(`settings ${name} (${path}) renders without console errors`, async () => {
      await visit(page, path);
      assertClean(errors, path);
    });
  }

  const PROFILE_SUBROUTES: ReadonlyArray<readonly [name: string, suffix: string]> = [
    ['profile', ''],
    ['history', '/history'],
    ['playlists', '/playlists'],
    ['rated', '/rated'],
  ];

  for (const [name, suffix] of PROFILE_SUBROUTES) {
    test(`user ${name} (/users/:id${suffix}) renders without console errors`, async () => {
      const path = `/users/${userId}${suffix}`;
      await visit(page, path);
      assertClean(errors, path);
    });
  }
});
