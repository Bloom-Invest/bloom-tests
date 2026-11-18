# bloom-tests

E2E tests for Bloom — Playwright with in-house vision assertions (`openai/gpt-6-luna` via the Bloom proxy, falling back to OpenRouter).

## What changed (de-Stably)

The suite previously used Stably AI (`aiAssert`, `agent.act`, and the `stably` CLI runner),
which billed a per-call LLM markup. That's gone. Now:

- Runner is vanilla `@playwright/test` (`playwright test`).
- Visual assertions go through `tests/helpers/aiAssert.ts`, which screenshots the page and
  asks `openai/gpt-6-luna` for a `{ pass, reason }` verdict (see "Vision checks and AI keys").
- `agent.act` typing was replaced with deterministic `locator.fill()`.
- `aiAssertSafe()` still exists (same signature) and now delegates to `aiAssert`.

## Setup

```bash
npm install
npx playwright install chromium
```

Set environment variables:
```bash
export OPENROUTER_API_KEY="your_openrouter_key"   # or QA_PROXY_API_KEY; see below
export BASE_URL="https://bloom.onrender.com"       # default; override for staging
# Optional: export VISION_MODEL="openai/gpt-6-luna"
```

## Vision checks and AI keys

`aiAssert()` (`tests/helpers/aiAssert.ts`) screenshots the page and asks `openai/gpt-6-luna`
for a `{ pass, reason }` verdict. Override the model with `VISION_MODEL`.

It tries two providers in order:

1. **Bloom proxy**, only when `QA_PROXY_API_KEY` is set. Calls `QA_PROXY_BASE_URL`
   (default `https://proxy.getbloom.app/v1`) `/responses` with `stream: true, store: false`.
2. **OpenRouter** chat/completions with `OPENROUTER_API_KEY` (CI fills it from the
   `OPENROUTER_API_KEY` secret).

Fallback rules: the proxy falls back to OpenRouter on a network error/timeout or HTTP
401, 402, 403, 408, 429 or 5xx. Any other 4xx fails the call. Without `QA_PROXY_API_KEY`
only OpenRouter is used. At least one of the two keys must be set.

If every provider tried fails: 5xx/429/network errors are retried, then `aiAssertSafe()`
soft-passes them. 401/402/403 (dead key or no credits) **soft-pass** the assertion: the test
stays green but the report gets an `aiAssert-vision-unavailable` annotation. If every visual
check suddenly "passes" with `HTTP 402 ... Insufficient credits` in that annotation, the
OpenRouter key is out of money: top it up or set `QA_PROXY_API_KEY`. A real `pass:false`
verdict always fails the test.

Running locally: on Eric's Mac the proxy runs at `http://127.0.0.1:18802/v1` and needs no
real key, so `QA_PROXY_BASE_URL=http://127.0.0.1:18802/v1 QA_PROXY_API_KEY=local`.
Anywhere else, `export OPENROUTER_API_KEY=...`.

## Running tests

```bash
npm test                        # all-tests project
npm run test:headed             # browser visible
npm run test:one -- "Stats"     # single test by grep
npm run report                  # open the HTML report
```

## Writing visual assertions

```ts
import { aiAssert } from '../helpers/aiAssert';

// Whole-viewport check
await aiAssert(page, 'The page shows a price chart for AAPL with a visible dollar price');

// Full page (scrolls to capture off-screen content)
await aiAssert(page, 'Related stocks are visible', { fullPage: true });

// Scoped to one element (cheaper, tighter)
await aiAssert(page, 'The header shows a nav bar and avatar', {
  locator: page.locator('header'),
});
```

Prefer plain Playwright assertions for anything deterministic (text, counts, visibility).
Reserve `aiAssert` for genuinely visual/fuzzy checks ("chart is rendered", "looks plausible").
Every AI call costs money and adds latency.

## CI

CI reads the `QA_PROXY_API_KEY` secret (Bloom proxy, tried first) and the `OPENROUTER_API_KEY`
secret (the fallback).
