/**
 * check:flex-gap — fails if a Tailwind `tw-gap-*` class lands on an element that
 * is ALSO `tw-flex` (or `tw-inline-flex`). Flexbox `gap` is unsupported on iOS
 * Safari < 14.5, so a flex container relying on it collapses to zero spacing on
 * the iOS 13 support floor (see .browserslistrc + the ios13-firefox-compat note).
 *
 * GRID gap is fine (`tw-grid` + `tw-gap-*` is allowed and skipped here). The fix
 * for offenders is `tw-space-*` utilities or a grid layout — owned by slice W0.16.
 *
 * Scans src/**.html. Reports every offending element with file:line so W0.16 has
 * a worklist. Exit 1 on any hit so the script can gate once the backlog clears.
 *
 * Usage: `node check-flex-gap.js` (wired as `npm run check:flex-gap`).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');

// A `class="..."` / `[class]="..."`-free single element's class list contains a
// flex display token and at least one gap utility (x/y/uniform). Responsive and
// state variants (md:tw-gap-2, hover:tw-gap-2) count too.
const FLEX_TOKEN = /(?:^|[\s:])tw-(?:inline-)?flex(?:$|[\s"'])/;
const GAP_TOKEN = /(?:^|[\s:])tw-gap(?:-[xy])?-[\w./[\]-]+/;
const GRID_TOKEN = /(?:^|[\s:])tw-grid(?:$|[\s"'])/;

/** Recursively collect .html files under a directory. */
function collectHtmlFiles(dir, acc) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectHtmlFiles(full, acc);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      acc.push(full);
    }
  }
  return acc;
}

/**
 * Return offending class attributes in a file as `{ line, classes }`. Matches
 * both static `class="..."` and Angular `class="..." ngClass`-style static lists
 * (binding expressions like `[class]`/`[ngClass]` are not statically analyzable
 * and are skipped — flagged manually in W0.16 if needed).
 */
function scanFile(file) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split('\n');
  const hits = [];
  const attrRe = /\bclass\s*=\s*"([^"]*)"/g;

  let match;
  while ((match = attrRe.exec(text)) !== null) {
    const classes = match[1];
    const hasFlex = FLEX_TOKEN.test(classes);
    const hasGap = GAP_TOKEN.test(classes);
    const hasGrid = GRID_TOKEN.test(classes);
    // Flex + gap is the trap. A grid container is allowed even if it also carries
    // a flex token on some descendant string — but a single element being both
    // flex and grid is malformed, so flex+gap still flags unless grid is present
    // AND flex is not (pure grid).
    if (hasGap && hasFlex && !hasGrid) {
      const line = text.slice(0, match.index).split('\n').length;
      hits.push({ line, classes: classes.trim() });
    }
  }
  return { lines, hits };
}

function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`check:flex-gap: source directory not found at ${SRC_DIR}`);
    process.exit(1);
  }

  const violations = [];
  for (const file of collectHtmlFiles(SRC_DIR, [])) {
    for (const hit of scanFile(file).hits) {
      const rel = path.relative(__dirname, file);
      violations.push(`${rel}:${hit.line}  ${hit.classes}`);
    }
  }

  if (violations.length > 0) {
    console.error(
      `check:flex-gap: found ${violations.length} element(s) using tw-gap-* on a ` +
        `tw-flex container (unsupported on iOS Safari < 14.5):`
    );
    for (const violation of violations) {
      console.error('  ' + violation);
    }
    process.exit(1);
  }

  console.log('check:flex-gap: OK — no tw-gap-* on tw-flex containers.');
}

main();
