/**
 * check:console — fails if stray `console.log`, `console.debug`, or `debugger`
 * statements remain in production source. Coding rules forbid debug logging in
 * shipped code; `console.error`/`console.warn` are allowed (the app routes real
 * errors through GlobalErrorHandler, but these are not flagged here).
 *
 * Scans src/**.ts, excluding *.spec.ts. Comment-aware (line + block comments)
 * so commented-out examples do not trip the check. No ESLint is configured in
 * this project, so this is the source guard for Phase 6.12c.
 *
 * Usage: `node check-console.js` (wired as `npm run check:console` and `pretest`).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const FORBIDDEN = /\b(?:console\.(?:log|debug)|debugger)\b/;

/** Recursively collect non-spec .ts files under a directory. */
function collectTsFiles(dir, acc) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectTsFiles(full, acc);
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) {
      acc.push(full);
    }
  }
  return acc;
}

/**
 * Return forbidden hits in a file as `{ line, text }`, ignoring matches inside
 * line (`//`) and block comments. Tracks block-comment state across lines so
 * multi-line commented examples are skipped while line numbers stay accurate.
 */
function scanFile(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const hits = [];
  let inBlockComment = false;

  lines.forEach((rawLine, index) => {
    let code = rawLine;

    if (inBlockComment) {
      const end = code.indexOf('*/');
      if (end === -1) return; // entire line is still inside the block comment
      code = code.slice(end + 2);
      inBlockComment = false;
    }

    code = code.replace(/\/\*[\s\S]*?\*\//g, ''); // inline block comments
    const openBlock = code.indexOf('/*');
    if (openBlock !== -1) {
      code = code.slice(0, openBlock);
      inBlockComment = true;
    }

    code = code.replace(/\/\/.*$/, ''); // line comment

    if (FORBIDDEN.test(code)) {
      hits.push({ line: index + 1, text: rawLine.trim() });
    }
  });

  return hits;
}

function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`check:console: source directory not found at ${SRC_DIR}`);
    process.exit(1);
  }

  const violations = [];
  for (const file of collectTsFiles(SRC_DIR, [])) {
    for (const hit of scanFile(file)) {
      violations.push(`${path.relative(__dirname, file)}:${hit.line}  ${hit.text}`);
    }
  }

  if (violations.length > 0) {
    console.error(
      `check:console: found ${violations.length} forbidden statement(s) ` +
        `(console.log / console.debug / debugger) in production source:`
    );
    for (const violation of violations) {
      console.error('  ' + violation);
    }
    process.exit(1);
  }

  console.log('check:console: OK — no stray console.log/console.debug/debugger in src.');
}

main();
