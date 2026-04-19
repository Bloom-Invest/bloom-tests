/**
 * Playwright globalSetup
 *
 * Why this exists
 * ---------------
 * `bloom.onrender.com` runs on Render free tier, which spins down inactive
 * dynos. The first request after a cold-spin takes 30–60s and can fail
 * outright with `net::ERR_CONNECTION_CLOSED` while the new container starts.
 *
 * That cold-start cost was hitting a random test in every run instead of being
 * paid up-front (notifications-page.spec.ts most recently — Apr 18 full-suite
 * run `rxvr64w6pxc3hq0jrifpcuji`).
 *
 * What it does
 * ------------
 * Hits BASE_URL up to 6 times with exponential backoff. Once the host returns
 * any HTTP response (even 4xx — that means the dyno is awake and routing),
 * we're done. If the host is genuinely unreachable after ~2 minutes, we let
 * the suite proceed anyway — individual tests will fail loudly with a real
 * error rather than letting the suite silently skip.
 */

import type { FullConfig } from '@playwright/test';

const DEFAULT_BASE_URL = 'https://bloom.onrender.com';

async function globalSetup(_config: FullConfig): Promise<void> {
  const baseURL = process.env.BASE_URL || DEFAULT_BASE_URL;
  const target = `${baseURL.replace(/\/$/, '')}/`;
  const maxAttempts = 6;
  const startedAt = Date.now();

  // eslint-disable-next-line no-console
  console.log(`[globalSetup] Warming ${target} (Render cold-start guard)...`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const t0 = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 25_000);
      const res = await fetch(target, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': 'bloom-tests-warmup/1' },
      });
      clearTimeout(timer);
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      // Any HTTP status proves the host is awake and routing.
      // eslint-disable-next-line no-console
      console.log(
        `[globalSetup] ${target} → HTTP ${res.status} in ${elapsed}s (attempt ${attempt}/${maxAttempts})`,
      );
      if (res.status > 0) {
        const totalElapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
        // eslint-disable-next-line no-console
        console.log(`[globalSetup] Warmup complete in ${totalElapsed}s.`);
        return;
      }
    } catch (err) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      const msg = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console
      console.warn(
        `[globalSetup] attempt ${attempt}/${maxAttempts} failed after ${elapsed}s: ${msg}`,
      );
    }
    if (attempt < maxAttempts) {
      // Exponential backoff: 2s, 4s, 8s, 16s, 32s
      const wait = 2 ** attempt * 1000;
      await new Promise((r) => setTimeout(r, wait));
    }
  }

  const totalElapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  // eslint-disable-next-line no-console
  console.warn(
    `[globalSetup] Warmup gave up after ${totalElapsed}s — running tests anyway. ` +
      `Expect the first test or two to retry / fail noisily.`,
  );
}

export default globalSetup;
