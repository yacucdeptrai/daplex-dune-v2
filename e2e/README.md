# E2E — route console smoke (Phase 6.12d)

`console-smoke.spec.ts` drives the **real running app** and fails if any route
emits a `console.error` or an uncaught `pageerror`.

## Why this exists

Build-green and Karma-green did **not** catch the NG0201 incident: `/admin/genres`,
`/admin/productions`, and `/admin/media` rendered **blank** because a runtime DI
error surfaced only in the browser console (the app's `GlobalErrorHandler`
swallowed the Angular-level one). Unit specs provide mocks, so the real-module
DI mismatch never occurs there. This smoke is the only check that reproduces
that failure class — real runtime, real DI, real router.

It complements the in-suite guards from 6.12a/b/c (console-error guard,
real-module DI smoke specs, `check:console`), which run under `npm test`.

## Prerequisites

The **whole stack** must be up — Playwright spawns nothing:

1. MongoDB + Redis running.
2. `DaPlex-API` running (default `http://localhost:3000`).
3. The frontend served: `npm start` (default `http://localhost:4200`).

## Configure

Copy `e2e/.env.example` to `e2e/.env` (gitignored) and fill it in, or export the
same variables in your shell:

| Variable | Default | Notes |
|---|---|---|
| `E2E_BASE_URL` | `http://localhost:4200` | Served frontend origin. |
| `E2E_ADMIN_EMAIL` | _(unset)_ | Admin account. Authed routes **skip** if unset. |
| `E2E_ADMIN_PASSWORD` | _(unset)_ | Never hardcode; keep it in `e2e/.env` or shell only. |

Public routes always run. Admin + user routes run only when both creds are set.

## Run

```bash
npm run e2e            # run the smoke
npm run e2e:report     # open the last HTML report (CI mode)
npx playwright test --list   # list tests without running (compile check)
```

## Tuning benign noise

`IGNORED_CONSOLE_PATTERNS` in the spec is a short, deliberate allowlist. Generic
"Failed to load resource" is ignored **only** for static assets (thumbnails /
fonts can 404 against an empty dev DB); a failing **API** call still fails the
smoke. Add new exceptions sparingly and comment why.

## Routes covered

- **Public:** `/`, `/sign-in`, `/sign-up`, `/forgot-password`
- **Admin:** `/admin/genres`, `/admin/productions`, `/admin/media`, `/admin/audit-log`
- **Settings:** `/users/settings`, `.../profile`, `.../privacy`, `.../media`, `.../subtitle`
- **Profile:** `/users/:id`, `.../history`, `.../playlists`, `.../rated` (id from the sign-in response)
