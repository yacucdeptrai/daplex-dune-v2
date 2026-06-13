# DaPlex Dune v2 (Web Client)

Angular single-page app for the DaPlex streaming platform — browsing, playback, auth, media management, and i18n. Talks to [`../DaPlex-API`](../DaPlex-API) over REST and WebSocket.

## Stack

- **Angular 21** (standalone components, signals)
- State: `@ngrx/signals`; HTTP caching: `@ngneat/cashew`
- i18n: **`@jsverse/transloco`** (+ messageformat, persisted translations)
- UI: Tailwind CSS, PrimeNG, Material Symbols
- Playback: Vidstack + dash.js, JASSUB (ASS/SSA subtitles), media-captions
- Misc: swiper, ng-recaptcha, ngx-infinite-scroll, ngx-image-cropper
- Tests: **Karma + Jasmine** (unit), **Playwright** (e2e)

## Prerequisites

- **Node.js 20+** (workspace runs Node 24)
- **npm 10+**
- **Chrome/Chromium** for Karma unit tests

## Install

```bash
npm install --legacy-peer-deps
```

`--legacy-peer-deps` is required — it avoids peer-range conflicts among the Angular 21 / ngrx / forked packages.

## Configure

API endpoints live in `src/environments/environment.ts` (dev) and `environment.prod.ts` (prod, swapped at build time via `angular.json`):

```ts
apiUrl:    'http://localhost:3000/api'
socketUrl: 'http://localhost:3000/ws'
```

Point these at your running DaPlex-API (default dev port **3000**). E2E settings live in `e2e/.env` (`cp e2e/.env.example e2e/.env`).

## Run (dev)

```bash
npm run start          # ng serve -> http://localhost:4200
```

## Build

```bash
npm run build          # ng build -> dist/daplex-v2 (postbuild.js runs after)
```

## Test (unit)

`npm test` runs `ng test`, which defaults to **watch mode** — Karma stays open and never exits. For a single run (CI, scripts, or headless Linux/WSL) disable watch and use the headless launcher:

```bash
npm test -- --watch=false --browsers=ChromeHeadlessCI
# or
npx ng test --watch=false --browsers=ChromeHeadlessCI
```

`ChromeHeadlessCI` is defined in `karma.conf.js` (`--no-sandbox --headless=new`) for CI and WSL. Plain `npm test` (watch + headed Chrome) is fine for local TDD with a display. `pretest` runs `check-console.js` to catch stray `console` statements.

## Test (e2e)

```bash
npm run e2e            # playwright test
npm run e2e:report     # open the last HTML report
```

## i18n utilities

```bash
npm run i18n:extract   # extract translation keys
npm run i18n:find      # find missing / unused keys
```

## Related services

- Talks to [`../DaPlex-API`](../DaPlex-API) (REST + WebSocket).
- Backed indirectly by [`../DaPlex-Transcoder`](../DaPlex-Transcoder) and [`../Redis`](../Redis) through the API.
