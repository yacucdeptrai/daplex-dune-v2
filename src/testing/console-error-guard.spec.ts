import {
  expectConsoleError,
  FailingErrorHandler,
  NG_CODE_PATTERN,
  assertNoNgErrors
} from './console-error-guard';

/**
 * The guard itself is installed globally in test.ts (installConsoleErrorGuard),
 * so its enforcement is exercised by every spec in the suite. These tests pin
 * the escape-hatch behaviour: a spec may opt in to emitting console.error.
 */
describe('console-error-guard', () => {
  it('does not fail the spec when expectConsoleError() tolerates any error', () => {
    expectConsoleError();
    console.error('intentional error from a tolerated spec');
    expect(true).toBeTrue();
  });

  it('tolerates a console.error whose message matches the given matcher', () => {
    expectConsoleError(/expected failure/);
    console.error('an expected failure occurred');
    expect(true).toBeTrue();
  });

  it('does not interfere with specs that never emit console.error', () => {
    expect(true).toBeTrue();
  });
});

/**
 * A1 NG-code layer: detection regex + FailingErrorHandler call path. The
 * afterEach-based global enforcement is exercised by the whole suite staying
 * green; here we pin the building blocks so weakening NG detection breaks loudly.
 */
describe('console-error-guard: NG_CODE_PATTERN', () => {
  it('matches 3- and 4-digit NG runtime codes', () => {
    expect(NG_CODE_PATTERN.test('NG0201: No provider for ConfirmationService')).toBeTrue();
    expect(NG_CODE_PATTERN.test('ERROR Error: NG0950 Input is required')).toBeTrue();
    expect(NG_CODE_PATTERN.test('NG100 hydration mismatch')).toBeTrue();
  });

  it('does not match non-NG noise (vidstack/Lit dev warnings)', () => {
    expect(NG_CODE_PATTERN.test('vidstack: dev mode warning')).toBeFalse();
    expect(NG_CODE_PATTERN.test('NG: not a real code')).toBeFalse();
    expect(NG_CODE_PATTERN.test('SomethingNG0201InAWord')).toBeFalse();
  });
});

describe('console-error-guard: FailingErrorHandler', () => {
  it('records via the ErrorHandler call path without throwing on a benign error', () => {
    const handler = new FailingErrorHandler();
    // It logs through console.error (tolerated below) and records NG codes; a
    // non-NG error must not turn this spec red.
    expectConsoleError(/plain runtime error/);
    expect(() => handler.handleError(new Error('plain runtime error, no NG code'))).not.toThrow();
    // No NG code was recorded, so the inline assertion is clean.
    assertNoNgErrors();
  });
});
