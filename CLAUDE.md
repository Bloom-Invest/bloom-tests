# bloom-tests

E2E test suite for the [Bloom](https://bloom.onrender.com) investing app using Playwright + [Stably AI](https://stably.ai).

## Quick Start

```bash
npm install
source ~/.hermes/.env  # STABLY_API_KEY, STABLY_PROJECT_ID

# Run all tests
STABLY_API_KEY=$STABLY_API_KEY STABLY_PROJECT_ID=$STABLY_PROJECT_ID \
  BASE_URL=https://bloom.onrender.com \
  ./node_modules/.bin/stably test --project all-tests

# Run a single test
./node_modules/.bin/stably test --grep "Test chat" --project all-tests

# View a run
./node_modules/.bin/stably runs view <runId>

# Auto-fix failures (runs in background, 10-120 min)
./node_modules/.bin/stably fix <runId>
```

## Project Structure

```
tests/
  all-tests/          ← 26 spec files, one per feature area
  helpers/
    aiAssertSafe.ts   ← Wraps aiAssert with infra-error fallback
    dismissFeedbackModal.ts ← Dismisses Bloom feedback modals (see pitfalls)
  knowledge.md        ← 178 items of app behavior learned from test runs
playwright.config.ts  ← Two projects: "chromium" (excludes all-tests) and "all-tests"
playwright.global-setup.ts ← Warms Render cold-start before tests run
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `STABLY_API_KEY` | Yes | Stably API key |
| `STABLY_PROJECT_ID` | Yes | Stably project ID |
| `BASE_URL` | No | App URL (default: `https://bloom.onrender.com`) |

## Bloom UI Pitfalls

These are the recurring causes of test failures. Read before writing or debugging tests.

### 1. Feedback Modal Overlays Everything

Bloom shows feedback modals ("How's your Bloom experience so far?" or "Give feedback directly to the founder") unpredictably on any page. They overlay the entire viewport and block all interactions, including `aiAssert`.

**Fix:** Call `dismissFeedbackModal(page)` from `tests/helpers/dismissFeedbackModal.ts` after every page navigation and before every assertion. It exits in ~2s if no modal is present.

### 2. `isVisible({ timeout })` Does NOT Wait

Playwright's `locator.isVisible()` returns immediately regardless of any timeout option. The timeout is **silently ignored**. This is the #1 cause of race conditions.

```ts
// WRONG — returns immediately, modal may not have rendered yet
if (await modal.isVisible({ timeout: 3000 })) { ... }

// RIGHT — actually waits up to 3s
try {
  await modal.waitFor({ state: 'visible', timeout: 3000 });
  // handle modal
} catch {
  // modal never appeared
}
```

### 3. Back Button Has No Accessible Name

The Bloom Header back button renders as `<Button>` with only an SVG arrow icon. No text, no aria-label. `getByRole('button', { name: /back/i })` will never match.

**Fix:** Use `page.goBack()` (Playwright's browser back) instead.

### 4. Chat Send Button Has No Accessible Name

The send button is an SVG icon with no text or aria-label.

**Fix:** Use `input.press('Enter')` to send messages. Wait 3s+ after each send for the message to register and the free-messages counter to update.

### 5. Free Message Limit

`MAX_FREE_MESSAGES = 3` (defined in `frontend/src/components/ChatPage/index.tsx`). The paywall triggers when `messageCount >= 3`. After 3 messages, the counter shows "0 / 3 free messages left today" with a "Subscribe" link. The 4th message attempt shows an inline paywall message.

### 6. Buttons Below the Fold

Buttons like "Copy collection to portfolio" on collection detail pages are often below the viewport. Use `scrollIntoViewIfNeeded()` before clicking.

### 7. Stock Name vs Ticker

The Bloom API returns `name: ""` for some stocks (including AAPL). Bookmark buttons vanish when name is empty. Always select stocks by ticker symbol (`/AAPL/`), never by company name (`'Apple Inc.'`).

### 8. Algolia Search Flakiness

Live search in headless runs can return unexpected results or hang. Prefer navigating directly from collection rows or known URLs instead of relying on search input.

### 9. Stably Dashboard URLs Require Auth

`app.stably.ai` URLs return a login page when fetched. Use `stably runs view <runId>` via CLI to inspect results.

### 10. Chronic Timeout Tests

These tests consistently time out even on a healthy app (as of May 2026): error-handling, symbol-page-deep-content, display-stock-news-financials, stock-chart-interactions, watchlist, different-asset-types, portfolio add/edit/delete. Check known-flaky tests first before blaming the app.

## Diagnosing Failures: App vs Test

Before running `stably fix`, check if the app itself was degraded:

1. Check Render deploys and Sentry for errors during the run window
2. Re-run the failing tests on a healthy app
3. If the same tests fail on both, it's a test issue; run `stably fix`
4. If they only fail during degradation, the tests are fine

## Writing New Tests

- Always import and use `dismissFeedbackModal` after page navigations
- Use `waitFor({ state: 'visible', timeout })` in try/catch, never `isVisible({ timeout })`
- Use `page.goBack()` for back navigation, not button selectors
- Use ticker symbols in selectors, not company names
- Use `scrollIntoViewIfNeeded()` before clicking below-fold elements
- Add `afterAll` cleanup for any state-mutating tests (bookmarks, portfolios)
- Prefer explicit Playwright selectors over `agent.act()` when the selector is known
