/**
 * Stylelint compat gate — flags CSS features unsupported by the browser floor
 * declared in .browserslistrc (iOS 13 Safari + current Firefox). The plugin reads
 * that same browserslist, so this config is purely "what to scan, how loud".
 *
 * Scope: OWNED source only. Vendored / third-party CSS under src/assets/css/** is
 * ignored so the gate targets code we can actually fix. NOTE: src/assets/css/cdk/
 * styles.scss is OWNED (its `:is()` usage is a real W0.16 item) but lives under the
 * ignored vendored tree — it is tracked manually in the W0.0 baseline, not here.
 *
 * Runnable via `npm run lint:css`. It is intentionally NOT wired as a blocking
 * `pretest`/CI gate yet: the owned backlog it surfaces is cleared by slice W0.16,
 * after which this becomes a hard gate.
 */
module.exports = {
  customSyntax: 'postcss-scss',
  plugins: ['stylelint-no-unsupported-browser-features'],
  rules: {
    'plugin/no-unsupported-browser-features': [
      true,
      {
        severity: 'error',
        // Report partial-support features (e.g. flex `gap`) too — those are exactly
        // the iOS 13 traps we care about.
        ignorePartialSupport: false,
      },
    ],
  },
  ignoreFiles: ['src/assets/css/**', 'dist/**', 'node_modules/**'],
};
