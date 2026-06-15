/**
 * Global Karma/Jasmine guard that fails any spec which emits a runtime error.
 *
 * Two enforcement layers:
 *
 * 1. **Generic `console.error` guard (unchanged behavior).** Any `console.error`
 *    during a spec fails it. This is the original net for the NG0201
 *    `ConfirmActionService` DI-scope regression that left `/admin` blank while
 *    every check stayed green.
 *
 * 2. **NG-code gate (new).** Any message matching `/\bNG[0-9]{3,4}\b/` on
 *    `console.error` OR `console.warn` OR thrown through the Angular
 *    `ErrorHandler` fails the spec — and is NOT silenceable by
 *    {@link expectConsoleError}. A framework runtime error (NG0201/NG0950/
 *    template/signal) is a real defect, never a tolerated error path. `warn`
 *    is hooked ONLY for NG codes; non-NG warnings (vidstack/Lit dev noise) are
 *    left alone so the bundled-library chatter does not turn the suite red.
 *
 * Escape hatch: a spec that legitimately drives an error path (and asserts the
 * component logs it) calls {@link expectConsoleError} inside the `it` block,
 * before the code under test runs. Pass a {@link RegExp} to require the logged
 * message to match it — any other, unexpected `console.error` still fails.
 * The escape hatch covers ONLY non-NG `console.error`; an NG-coded message is
 * always a failure regardless of the allowance.
 */

import { ErrorHandler, Injectable } from '@angular/core';

/** Matches Angular runtime error codes, e.g. `NG0201`, `NG0950`, `NG0100`. */
export const NG_CODE_PATTERN = /\bNG[0-9]{3,4}\b/;

/**
 * Benign dev-mode warnings emitted by bundled third-party libraries that we do
 * not control. Kept deliberately MINIMAL — only known vidstack/Lit dev noise.
 * A message is allowed past the warn-side NG gate only if it both matches one
 * of these AND does not carry an NG code (the NG check runs first regardless).
 */
const BENIGN_WARN_ALLOWLIST: RegExp[] = [
  /vidstack/i,
  /\bLit\b.*(dev mode|development mode)/i,
  /Multiple versions of Lit loaded/i
];

/** console.error argument lists recorded during the current spec. */
let recordedErrors: unknown[][] = [];

/** NG-coded messages seen this spec on console.error/warn/thrown. */
let ngErrors: string[] = [];

/** Per-spec allowance for generic console.error, reset before every spec. */
let allowance: 'none' | 'any' | RegExp = 'none';

/** Join a console argument list into a single inspectable string. */
function stringifyArgs(args: unknown[]): string {
  return args
    .map((a) => {
      if (a instanceof Error) {
        return `${a.message}\n${a.stack ?? ''}`;
      }
      return String(a);
    })
    .join(' ');
}

/** Record any NG-coded message; returns true when an NG code was present. */
function recordIfNgCoded(message: string): boolean {
  if (NG_CODE_PATTERN.test(message)) {
    ngErrors.push(message);
    return true;
  }
  return false;
}

/**
 * Permit `console.error` for the current spec without failing it.
 *
 * Note: this never permits an NG-coded message. An `NG\d{3,4}` error always
 * fails the spec, even when an allowance is set.
 *
 * @param matcher When provided, only messages matching it are tolerated; any
 *   non-matching `console.error` still fails the spec. When omitted, all
 *   (non-NG) `console.error` calls for this spec are tolerated.
 */
export function expectConsoleError(matcher?: RegExp): void {
  allowance = matcher ?? 'any';
}

/**
 * Assert no Angular NG-coded runtime error was observed so far in the current
 * spec. Call inside an `it` block after `detectChanges()` / navigation to fail
 * fast with the captured messages. The `afterEach` enforces this globally too;
 * this gives smoke specs an explicit, in-line assertion point.
 */
export function assertNoNgErrors(): void {
  if (ngErrors.length > 0) {
    const seen = [...ngErrors];
    fail(
      `Angular runtime error(s) detected (NG\\d{3,4}):\n  ${seen.join('\n  ')}`
    );
  }
}

/**
 * Angular `ErrorHandler` that records + fails the spec on any error whose
 * message matches the NG-code regex. This catches errors that the production
 * `GlobalErrorHandler` would swallow (it logs and returns), e.g. an NG0950
 * surfaced through the framework rather than `console.error`.
 *
 * Provided in {@link provideAppConfigForTest} as the `ErrorHandler`, swapping
 * out `GlobalErrorHandler` for tests.
 */
@Injectable()
export class FailingErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    const message =
      error instanceof Error
        ? `${error.message}\n${error.stack ?? ''}`
        : String(error);
    // Always surface in the Karma log.
    // eslint-disable-next-line no-console
    console.error(error);
    recordIfNgCoded(message);
  }
}

/**
 * Register the global guard. Call once from the test bootstrap (`test.ts`) after
 * `initTestEnvironment`. Wraps `console.error` and `console.warn` for the
 * duration of each spec and restores the real implementations afterwards.
 */
export function installConsoleErrorGuard(): void {
  const originalError = console.error.bind(console) as (...args: unknown[]) => void;
  const originalWarn = console.warn.bind(console) as (...args: unknown[]) => void;

  beforeEach(() => {
    recordedErrors = [];
    ngErrors = [];
    allowance = 'none';

    console.error = (...args: unknown[]): void => {
      recordedErrors.push(args);
      recordIfNgCoded(stringifyArgs(args));
      // Keep emitting so the failure is still visible in the Karma log.
      originalError(...args);
    };

    console.warn = (...args: unknown[]): void => {
      const message = stringifyArgs(args);
      // Only NG-coded warnings are enforced; benign library warnings pass.
      recordIfNgCoded(message);
      originalWarn(...args);
    };
  });

  afterEach(() => {
    console.error = originalError;
    console.warn = originalWarn;

    // NG-coded errors are unconditional failures — never silenced by an allowance.
    if (ngErrors.length > 0) {
      const seen = [...ngErrors];
      fail(
        `Spec emitted ${seen.length} Angular runtime error(s) (NG\\d{3,4}). ` +
          `These are framework defects and cannot be allowlisted:\n  ${seen.join('\n  ')}`
      );
      return;
    }

    // Generic console.error enforcement (original behavior, honors allowance).
    if (recordedErrors.length === 0 || allowance === 'any') {
      return;
    }

    const messages = recordedErrors.map((args) => stringifyArgs(args));

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

/** Exposed for tests of the guard itself; the allowlist stays minimal. */
export const __BENIGN_WARN_ALLOWLIST = BENIGN_WARN_ALLOWLIST;
