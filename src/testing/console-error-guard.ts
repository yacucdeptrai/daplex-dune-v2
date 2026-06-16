/**
 * Global Karma/Jasmine guard that fails any spec which emits `console.error`.
 *
 * Why: a green production build plus a green unit suite previously still hid
 * runtime failures that only surfaced in the browser console — most notably the
 * NG0201 `ConfirmActionService` DI-scope regression that left the `/admin` pages
 * blank while every check stayed green. Treating `console.error` as a spec
 * failure turns that whole class of silent error into a red test.
 *
 * Scope: `console.error` only. `console.warn` is deliberately NOT enforced
 * because bundled third-party libraries (vidstack, Lit) emit unavoidable
 * dev-mode warnings that we do not control.
 *
 * Escape hatch: a spec that legitimately drives an error path (and asserts the
 * component logs it) calls {@link expectConsoleError} inside the `it` block,
 * before the code under test runs. Pass a {@link RegExp} to require the logged
 * message to match it — any other, unexpected `console.error` still fails.
 */

import { ErrorHandler, Injectable } from '@angular/core';

/** console.error argument lists recorded during the current spec. */
let recordedErrors: unknown[][] = [];

/** Per-spec allowance, reset to `'none'` before every spec. */
let allowance: 'none' | 'any' | RegExp = 'none';

/**
 * Permit `console.error` for the current spec without failing it.
 *
 * @param matcher When provided, only messages matching it are tolerated; any
 *   non-matching `console.error` still fails the spec. When omitted, all
 *   `console.error` calls for this spec are tolerated.
 */
export function expectConsoleError(matcher?: RegExp): void {
  allowance = matcher ?? 'any';
}

/**
 * Register the global guard. Call once from the test bootstrap (`test.ts`) after
 * `initTestEnvironment`. Wraps `console.error` for the duration of each spec and
 * restores the real implementation afterwards.
 */
export function installConsoleErrorGuard(): void {
  const original = console.error.bind(console) as (...args: unknown[]) => void;

  beforeEach(() => {
    recordedErrors = [];
    allowance = 'none';
    console.error = (...args: unknown[]): void => {
      recordedErrors.push(args);
      // Keep emitting so the failure is still visible in the Karma log.
      original(...args);
    };
  });

  afterEach(() => {
    console.error = original;

    if (recordedErrors.length === 0 || allowance === 'any') {
      return;
    }

    const messages = recordedErrors.map((args) => args.map((a) => String(a)).join(' '));

    if (allowance instanceof RegExp) {
      const matcher = allowance;
      const unexpected = messages.filter((message) => !matcher.test(message));
      if (unexpected.length === 0) {
        return;
      }
      fail(
        `Spec emitted console.error not matching ${matcher}:\n  ${unexpected.join('\n  ')}`
      );
      return;
    }

    fail(
      `Spec emitted ${recordedErrors.length} console.error call(s). ` +
        `If this is intentional, call expectConsoleError() in the spec.\n  ${messages.join('\n  ')}`
    );
  });
}

/**
 * Explicit in-spec checkpoint: fail now if any NG-coded (`NG####`) error was
 * recorded so far this spec. The global guard already fails the spec in
 * `afterEach` on ANY `console.error`; this gives smoke specs a synchronous,
 * NG-specific assertion mid-body (after a mount/route step) so the failure
 * points at the exact interaction that produced the framework error.
 */
export function assertNoNgErrors(): void {
  const ngErrors = recordedErrors
    .map((args) => args.map((a) => String(a)).join(' '))
    .filter((message) => /NG\d{3,4}/.test(message));
  if (ngErrors.length > 0) {
    fail(`Spec emitted ${ngErrors.length} NG-coded console.error(s):\n  ${ngErrors.join('\n  ')}`);
  }
}

/**
 * Test `ErrorHandler` that routes framework errors through `console.error` so the
 * installed guard fails the spec — instead of `GlobalErrorHandler` swallowing them.
 * The test bed (`app-config-test.ts`) swaps `GlobalErrorHandler` → this, so an
 * NG-coded error thrown during a mount/route surfaces as a red spec.
 */
@Injectable()
export class FailingErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
    // Routed through console.error so the installed guard records + fails it.
    console.error(message);
  }
}
