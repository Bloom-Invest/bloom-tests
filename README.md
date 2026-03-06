# bloom-tests

E2E tests for Bloom — powered by [Stably Agent 2.0](https://stably.ai) and Playwright.

## Setup

```bash
npm install
npx playwright install chromium
```

Set environment variables:
```bash
export STABLY_API_KEY="your_key_here"
export STABLY_PROJECT_ID="cmddjs2fq0000l70473vyhuwf"
export BASE_URL="https://app.getbloom.app"  # or your staging URL
```

## Running tests

```bash
npm test                  # Run all tests via Stably
npm run test:headed       # Run with browser visible
```

## Generating new tests

```bash
npm run create "describe what to test in plain English"
```

## Auto-fixing failures

```bash
npm run fix               # Auto-detect last run and fix failures
```

## Migrating Classic tests

Use the Stably dashboard: Settings → Migrate → "Migrate Classic Tests"

## Stably Dashboard

https://app.stably.ai/project/cmddjs2fq0000l70473vyhuwf
