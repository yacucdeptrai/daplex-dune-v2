import { expectConsoleError } from './console-error-guard';

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
