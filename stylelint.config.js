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
        // Features intentionally NOT gated, each for a verified reason. The real
        // iOS-13 traps (flexbox-gap, css-has, css-is/where, css-cascade-layers,
        // css-focus-visible) stay ACTIVE so a new unguarded use is still caught;
        // guarded sites use a per-line stylelint-disable with a reason.
        ignore: [
          // We author SCSS; Angular's compiler flattens `&`/descendant nesting to
          // plain CSS before ship, so iOS 13 never receives native CSS Nesting.
          // (30 source-only false positives — see W0.0 baseline §1a.)
          'css-nesting',
          // Misattribution: the warning cites only future Edge/FF/Chrome partial
          // support for `flex-wrap: nowrap`, no iOS — it is not an iOS 13 trap.
          'multicolumn',
          // `overflow: hidden` partial-support nuance only; the plain value we use
          // is fully supported on iOS 13. (W0.0 baseline §1b — benign.)
          'css-overflow',
          // `minmax()` is supported on iOS 13.4+ (partial 13.0–13.3 only) and used
          // in a grid template where the column still resolves; low-risk per baseline.
          'css-math-functions',
        ],
      },
    ],
  },
  ignoreFiles: ['src/assets/css/**', 'dist/**', 'node_modules/**'],
};
