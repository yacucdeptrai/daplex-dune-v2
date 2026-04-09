# DaPlex Dune V2 (Frontend)

Angular 17 frontend for the DaPlex streaming platform.

## Stack

- Angular 17
- RxJS
- PrimeNG
- Tailwind CSS
- Transloco (i18n)
- Karma/Jasmine (unit tests)

## Prerequisites

- Node.js 20.x (recommended)
- npm 10+

## Install

```bash
npm install
```

## Run (development)

```bash
npm run start
```

Default URL: `http://localhost:4200`

## Build

```bash
npm run build
```

Build output is generated in `dist/daplex-v2`.

## Test

```bash
npm run test
```

## i18n Utilities

```bash
npm run i18n:extract
npm run i18n:find
```

## Common Issues

- **Angular/Node compatibility**: use Node 20 LTS for best compatibility.
- **Style/PostCSS errors**: verify lockfile consistency and local dependency state.

## Related Services

This frontend depends on:

- `../DaPlex-API` (main backend API)
- `../DaPlex-Transcoder` (media jobs, indirectly via backend)
- `../Redis` (backend infrastructure dependency)
