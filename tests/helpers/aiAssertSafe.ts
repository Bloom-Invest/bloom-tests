import { test, expect, Page } from '@stablyai/playwright-test';

/**
 * Wraps Playwright's `aiAssert` with a graceful fallback for transient
 * **Stably AI-service** failures (not for app failures).
 *
 * Why this exists
 * ---------------
 * `aiAssert` makes a network call to Stably's AI service. When that
 * service is degraded (TypeError: fetch failed / ECONNRESET / 5xx), every
 * test using `aiAssert` flips red — even though the Bloom app under test
 * is perfectly healthy. We saw this on Apr 18: 4+ specs failed with
 * `TypeError: fetch failed [cause]: Error: read ECONNRESET` during a
 * Stably outage window, masking the only real failure (markets-page).
 *
 * Behaviour
 * ---------
 *   1. Run `aiAssert` normally.
 *   2. If it throws and the error looks like an **infra** error, fall back:
 *        - if a `fallback()` predicate was provided, treat the assertion as
 *          satisfied iff the predicate returns true.
 *        - if no fallback was provided, annotate the test (so it shows up
 *          in the Stably UI) and treat as soft-pass.
 *   3. If the error is anything else (i.e. the AI service reached a verdict
 *      and said the page is broken), re-throw — we still want to catch real
 *      app regressions.
 *
 * IMPORTANT: only "transport" errors are softened. A genuine
 *   `Expected page to satisfy "..."` failure still fails the test.
 */
export async function aiAssertSafe(
  page: Page,
  prompt: string,
  options: {
    timeout?: number;
    fullPage?: boolean;
    /**
     * Optional structural fallback. Should return `true` if the page looks
     * healthy enough to accept the assertion as satisfied. Use plain
     * Playwright locators (no `aiAssert`!) so the fallback itself is not
     * subject to the same outage.
     */
    fallback?: () => Promise<boolean>;
  } = {},
): Promise<void> {
  const { timeout = 60000, fullPage = false, fallback } = options;
  try {
    await expect(page).aiAssert(prompt, { timeout, fullPage });
    return;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack ?? '' : '';
    const haystack = `${msg}\n${stack}`;

    const isInfraError =
      /fetch failed/i.test(haystack) ||
      /ECONNRESET/i.test(haystack) ||
      /ETIMEDOUT/i.test(haystack) ||
      /ENOTFOUND/i.test(haystack) ||
      /socket hang up/i.test(haystack) ||
      /AI service/i.test(haystack) ||
      / 5\d\d /.test(haystack);

    if (!isInfraError) {
      // Genuine assertion failure (the AI judged the page broken). Re-throw.
      throw err;
    }

    const annotations = test.info().annotations;

    if (fallback) {
      const ok = await fallback().catch(() => false);
      if (ok) {
        annotations.push({
          type: 'aiAssert-fallback-pass',
          description: `Stably AI service unreachable; structural fallback satisfied. Prompt: "${prompt.slice(0, 200)}"`,
        });
        return;
      }
      throw new Error(
        `aiAssert was unreachable AND structural fallback failed.\n` +
          `Prompt: ${prompt}\n` +
          `Underlying: ${msg}`,
      );
    }

    annotations.push({
      type: 'aiAssert-soft-skip',
      description: `Stably AI service unreachable (${msg.slice(0, 120)}). No fallback provided; treating as soft-pass.`,
    });
    // eslint-disable-next-line no-console
    console.warn(
      `[aiAssertSafe] Soft-pass — Stably AI service unreachable.\n  Prompt: ${prompt.slice(0, 200)}\n  Error : ${msg.slice(0, 200)}`,
    );
  }
}
