import { Page } from '@playwright/test';
import { grokAssert } from './grokAssert';

/**
 * Backwards-compatible shim. Historically wrapped Stably's `aiAssert` with an
 * infra-error fallback. Now delegates to the in-house `grokAssert` (OpenRouter
 * vision). Kept so existing callers don't have to change.
 *
 * The `fallback` predicate is still honoured: if the vision call itself fails
 * for transport reasons after retries, and a structural fallback was provided,
 * we accept the assertion iff the fallback returns true.
 */
export async function aiAssertSafe(
  page: Page,
  prompt: string,
  options: {
    timeout?: number;
    fullPage?: boolean;
    fallback?: () => Promise<boolean>;
  } = {},
): Promise<void> {
  const { timeout = 60000, fullPage = false, fallback } = options;
  try {
    await grokAssert(page, prompt, { timeout, fullPage });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // A genuine visual FAIL should propagate. Only soften transport failures.
    const isInfra =
      /OpenRouter HTTP 5\d\d/i.test(msg) ||
      /fetch failed/i.test(msg) ||
      /ECONNRESET|ETIMEDOUT|ENOTFOUND|socket hang up|AbortError|aborted/i.test(msg) ||
      /exhausted retries/i.test(msg);
    if (!isInfra) throw err;

    if (fallback) {
      const ok = await fallback().catch(() => false);
      if (ok) return;
      throw new Error(
        `grokAssert was unreachable AND structural fallback failed.\n  Prompt: ${prompt}\n  Underlying: ${msg}`,
      );
    }
    // eslint-disable-next-line no-console
    console.warn(
      `[aiAssertSafe] Soft-pass — vision service unreachable.\n  Prompt: ${prompt.slice(0, 200)}\n  Error: ${msg.slice(0, 200)}`,
    );
  }
}
