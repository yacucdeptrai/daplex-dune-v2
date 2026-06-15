/**
 * check:theme — asserts the PrimeNG v21 theme/style migration stayed intact.
 *
 * Three deterministic source checks (always run):
 *   1. styles.scss still imports the retained `md-dark-indigo-custom.css`.
 *   2. that theme file exists and carries a healthy floor of `.p-*` selectors.
 *   3. the renamed v21 selector families resolve in the theme (renames landed).
 *
 * One optional build check (only when a built styles bundle is present):
 *   4. PurgeCSS did not strip the retained `.p-*` selectors from the output.
 *
 * Floors are intentionally well below the measured counts so cosmetic theme
 * edits do not spuriously RED the gate; the checks catch a wholesale loss of
 * the theme (dropped import, emptied file, reverted renames, over-aggressive
 * purge), not minor selector churn. Exit 1 on any failure.
 *
 * Usage: `node check-theme.mjs` (wired as `npm run check-theme`, folded into `gate`).
 */
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const STYLES = path.join(ROOT, 'src/styles.scss');
const THEME = path.join(ROOT, 'src/assets/css/primeng/md-dark-indigo-custom.css');
const DIST = path.join(ROOT, 'dist/daplex-v2');

// Floors (measured: import present @ styles.scss:16; 677 distinct .p-* in theme;
// renamed families present; 675 .p-* in built styles bundle). Floors sit well
// below those so legitimate theme churn never trips the gate.
const MIN_THEME_SELECTORS = 300;
const MIN_DIST_SELECTORS = 300;
const RENAMED_FAMILIES = ['p-select', 'p-drawer', 'p-toggleswitch', 'p-datepicker', 'p-tabs'];

const SELECTOR_RE = /\.p-[a-zA-Z0-9_-]+/g;

const fail = (msg) => {
  console.error('check:theme: ' + msg);
  process.exit(1);
};

const distinctSelectors = (css) => new Set(css.match(SELECTOR_RE) ?? []);

function main() {
  // 1. retained theme import present in styles.scss
  if (!fs.existsSync(STYLES)) fail(`styles.scss not found at ${STYLES}`);
  const styles = fs.readFileSync(STYLES, 'utf8');
  const importLine = styles
    .split('\n')
    .findIndex((l) => /@import\s+["'][^"']*md-dark-indigo-custom\.css["']/.test(l));
  if (importLine === -1) {
    fail('retained theme import "md-dark-indigo-custom.css" is missing from styles.scss');
  }

  // 2. theme file exists with a healthy floor of .p-* selectors
  if (!fs.existsSync(THEME)) fail(`retained theme file not found at ${THEME}`);
  const theme = fs.readFileSync(THEME, 'utf8');
  const themeSelectors = distinctSelectors(theme);
  if (themeSelectors.size < MIN_THEME_SELECTORS) {
    fail(
      `theme has only ${themeSelectors.size} distinct .p-* selectors ` +
        `(floor ${MIN_THEME_SELECTORS}) — theme may have been stripped`
    );
  }

  // 3. renamed v21 selector families landed in the theme
  const missing = RENAMED_FAMILIES.filter((fam) => {
    const re = new RegExp('\\.' + fam + '(?![a-zA-Z0-9_-])');
    return !re.test(theme);
  });
  if (missing.length > 0) {
    fail(`renamed v21 selector families absent from theme: ${missing.join(', ')}`);
  }

  // 4. (optional) PurgeCSS kept retained .p-* selectors in the build output
  let distNote = 'skipped (no build output)';
  if (fs.existsSync(DIST)) {
    const bundle = fs
      .readdirSync(DIST)
      .find((f) => /^styles-.*\.css$/.test(f));
    if (bundle) {
      const css = fs.readFileSync(path.join(DIST, bundle), 'utf8');
      const distCount = distinctSelectors(css).size;
      if (distCount < MIN_DIST_SELECTORS) {
        fail(
          `built ${bundle} has only ${distCount} distinct .p-* selectors ` +
            `(floor ${MIN_DIST_SELECTORS}) — PurgeCSS may have over-stripped`
        );
      }
      distNote = `${distCount} .p-* in ${bundle}`;
    }
  }

  console.log(
    `check:theme: OK — import @ styles.scss:${importLine + 1}, ` +
      `${themeSelectors.size} theme .p-* selectors, ` +
      `renamed families [${RENAMED_FAMILIES.join(', ')}] present, ` +
      `build ${distNote}.`
  );
}

main();
