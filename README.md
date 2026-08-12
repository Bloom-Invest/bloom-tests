# bloom-tests

E2E tests for Bloom — Playwright with in-house vision assertions (OpenRouter Grok).

## What changed (de-Stably)

The suite previously used Stably AI (`aiAssert`, `agent.act`, and the `stably` CLI runner),
which billed a per-call LLM markup. That's gone. Now:

- Runner is vanilla `@playwright/test` (`playwright test`).
- Visual assertions go through `tests/helpers/grokAssert.ts`, which screenshots the page and
  asks OpenRouter `x-ai/grok-4.5` for a `{ pass, reason }` verdict (~$0.001/call).
- `agent.act` typing was replaced with deterministic `locator.fill()`.
- `aiAssertSafe()` still exists (same signature) and now delegates to `grokAssert`.

## Setup

```bash
npm install
npx playwright install chromium
```

Set environment variables:
```bash
export OPENROUTER_API_KEY="your_openrouter_key"   # required for grokAssert
export BASE_URL="https://bloom.onrender.com"       # default; override for staging
# Optional: export VISION_MODEL="openai/gpt-5.6-luna"
```

## Running tests

```bash
npm test                        # all-tests project
npm run test:headed             # browser visible
npm run test:one -- "Stats"     # single test by grep
npm run report                  # open the HTML report
```

## Writing visual assertions

```ts
import { grokAssert } from '../helpers/grokAssert';

// Whole-viewport check
await grokAssert(page, 'The page shows a price chart for AAPL with a visible dollar price');

// Full page (scrolls to capture off-screen content)
await grokAssert(page, 'Related stocks are visible', { fullPage: true });

// Scoped to one element (cheaper, tighter)
await grokAssert(page, 'The header shows a nav bar and avatar', {
  locator: page.locator('header'),
});
```

Prefer plain Playwright assertions for anything deterministic (text, counts, visibility).
Reserve `grokAssert` for genuinely visual/fuzzy checks ("chart is rendered", "looks plausible").
Every AI call costs money and adds latency.

## CI

`OPENROUTER_API_KEY` must be set as a repo secret for CI runs. No local proxy dependency.
