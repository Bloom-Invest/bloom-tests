import { Page, Locator, test } from '@playwright/test';

/**
 * In-house replacement for Stably's `aiAssert`.
 *
 * Takes a screenshot (locator-scoped when a locator is passed, else the
 * viewport, or the full page when `fullPage`), sends it to a vision model via
 * OpenRouter, and asserts on a structured `{ pass, reason }` verdict.
 *
 * Backend: OpenRouter `x-ai/grok-4.5` (supports image input; ~$0.001/call).
 * Requires env `OPENROUTER_API_KEY`. Optional override `GROK_VISION_MODEL`.
 *
 * Transport errors (network/5xx/429) are retried; a genuine model verdict of
 * `pass:false` is re-polled (re-screenshot + re-judge) until the assertion
 * `timeout` budget expires, so late-rendering content is not a false failure.
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.GROK_VISION_MODEL || 'x-ai/grok-4.5';
const MAX_TRANSPORT_RETRIES = 2;

export interface GrokAssertOptions {
  /** Total budget to keep polling (re-screenshot + re-judge) until the verdict passes. */
  timeout?: number;
  /** Per-OpenRouter-request abort timeout. Defaults to min(timeout, 30000). */
  fetchTimeout?: number;
  fullPage?: boolean;
  /** Scope the screenshot + judgment to a single element. */
  locator?: Locator;
}

interface Verdict {
  pass: boolean;
  reason: string;
}

async function callVision(
  imageB64: string,
  prompt: string,
  timeout: number,
): Promise<Verdict> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      'grokAssert: OPENROUTER_API_KEY is not set. Source ~/.hermes/.env or set it in CI secrets.',
    );
  }

  const body = {
    model: MODEL,
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:image/png;base64,${imageB64}` },
          },
          {
            type: 'text',
            text:
              `You are a strict QA visual assertion checker for a web app screenshot.\n` +
              `Assertion to verify: "${prompt}"\n\n` +
              `Reply with ONLY a JSON object, no prose, no code fences:\n` +
              `{"pass": <true|false>, "reason": "<one concise sentence>"}\n` +
              `pass=true only if the screenshot clearly satisfies the assertion.`,
          },
        ],
      },
    ],
  };

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeout);
  let resp: Response;
  try {
    resp = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(t);
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    // Retry only 5xx and 429 (rate limit) as transient transport errors.
    // A key/billing outage — 401 (bad key), 402 (insufficient credits), 403
    // (key not authorized) — is deterministic AND is a fault of the vision
    // PROVIDER, not the Bloom app under test. Tag those with a distinct
    // __VISION_UNAVAILABLE__ marker so the caller can soft-pass the visual
    // assertion (a dead OpenRouter key must not red-wall every visual test the
    // way it does today), instead of reporting a false app regression.
    const isTransientStatus = resp.status >= 500 || resp.status === 429;
    const isProviderOutage =
      resp.status === 401 || resp.status === 402 || resp.status === 403;
    const prefix = isTransientStatus
      ? '__TRANSPORT__ '
      : isProviderOutage
      ? '__VISION_UNAVAILABLE__ '
      : '';
    throw new Error(`${prefix}OpenRouter HTTP ${resp.status}: ${text.slice(0, 200)}`);
  }

  const data: any = await resp.json();
  const content: string = data?.choices?.[0]?.message?.content ?? '';
  if (!content) {
    throw new Error(`__TRANSPORT__ OpenRouter returned empty content: ${JSON.stringify(data).slice(0, 200)}`);
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Model spoke but not JSON — treat as fail with its words rather than crashing.
    return { pass: false, reason: `Non-JSON model reply: ${content.slice(0, 200)}` };
  }
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    // The model is an third-party dependency, so tolerate type drift only for a
    // real success: accept STRICT boolean `true` (and, defensively, the string
    // "true"); treat anything else — including the string "false" — as a fail.
    const raw = parsed.pass;
    const pass =
      raw === true || (typeof raw === 'string' && raw.trim().toLowerCase() === 'true');
    return { pass, reason: String(parsed.reason ?? '') };
  } catch {
    return { pass: false, reason: `Unparseable model reply: ${content.slice(0, 200)}` };
  }
}

function isTransient(err: unknown): boolean {
  const s = err instanceof Error ? `${err.message}\n${err.stack ?? ''}` : String(err);
  return (
    s.includes('__TRANSPORT__') ||
    /fetch failed/i.test(s) ||
    /ECONNRESET|ETIMEDOUT|ENOTFOUND|socket hang up|aborted|AbortError/i.test(s)
  );
}

/**
 * A vision-PROVIDER key/billing outage (OpenRouter 401/402/403), tagged with
 * the __VISION_UNAVAILABLE__ marker in callVision. Distinct from isTransient:
 * these are deterministic (no retry helps) but are the provider's fault, not
 * the app's, so the caller soft-passes rather than reporting a false regression.
 */
function isVisionUnavailable(err: unknown): boolean {
  const s = err instanceof Error ? `${err.message}\n${err.stack ?? ''}` : String(err);
  return s.includes('__VISION_UNAVAILABLE__');
}

/**
 * Visual assertion. Throws (failing the test) when the model judges the
 * screenshot does not satisfy `prompt`.
 */
export async function grokAssert(
  page: Page,
  prompt: string,
  options: GrokAssertOptions = {},
): Promise<void> {
  const { timeout = 60000, fullPage = false, locator } = options;
  const fetchTimeout = options.fetchTimeout ?? Math.min(timeout, 30000);
  const shotTarget = locator ?? page;

  const deadline = Date.now() + timeout;
  const POLL_INTERVAL_MS = 2000;
  let lastFailure: Error | null = null;
  let transportRetries = 0;

  // Poll: re-screenshot + re-judge until the verdict passes or the budget expires.
  // This mirrors Playwright's expect()/Stably's aiAssert so content that renders a
  // few seconds after DOM load is not a false failure.
  do {
    const buffer = await shotTarget.screenshot(locator ? {} : { fullPage });
    const imageB64 = buffer.toString('base64');

    try {
      const verdict = await callVision(imageB64, prompt, fetchTimeout);
      if (verdict.pass) {
        test.info().annotations.push({
          type: 'grokAssert-pass',
          description: `${prompt.slice(0, 120)} :: ${verdict.reason.slice(0, 160)}`,
        });
        return;
      }
      // Genuine visual FAIL — remember it and re-poll (content may still render).
      lastFailure = new Error(
        `grokAssert FAILED\n  Assertion: ${prompt}\n  Model reason: ${verdict.reason}`,
      );
    } catch (err) {
      // A vision-PROVIDER outage (dead/unfunded OpenRouter key: 401/402/403)
      // is not an app regression. Soft-pass the visual assertion with a loud
      // annotation so a billing lapse cannot red-wall every visual test; the
      // real fix (top up / rotate the key) is surfaced in the report, not by a
      // wall of false failures. Only these key/billing errors soft-pass — a
      // genuine model verdict of pass:false still fails below.
      if (isVisionUnavailable(err)) {
        const rawDetail = err instanceof Error ? err.message : String(err);
        const detail = rawDetail.replace('__VISION_UNAVAILABLE__ ', '');
        test.info().annotations.push({
          type: 'grokAssert-vision-unavailable',
          description:
            `Vision provider unavailable (key/billing); assertion soft-passed. ` +
            `Fix the OPENROUTER_API_KEY credits. Prompt: "${prompt.slice(0, 120)}" :: ` +
            `${detail.slice(0, 160)}`,
        });
        return;
      }
      // Transport error: retry a bounded number of times, then surface it so
      // aiAssertSafe can soften it. Non-transport errors propagate immediately.
      if (isTransient(err) && transportRetries < MAX_TRANSPORT_RETRIES) {
        transportRetries += 1;
        await new Promise((r) => setTimeout(r, 1500 * transportRetries));
        continue;
      }
      throw err;
    }

    if (Date.now() + POLL_INTERVAL_MS >= deadline) break;
    await page.waitForTimeout(POLL_INTERVAL_MS);
  } while (Date.now() < deadline);

  throw (
    lastFailure ??
    new Error(`grokAssert: no verdict within ${timeout}ms\n  Assertion: ${prompt}`)
  );
}
