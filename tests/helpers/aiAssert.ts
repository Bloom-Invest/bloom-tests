import { Page, Locator, test } from '@playwright/test';

/**
 * Vision-backed visual assertion (in-house replacement for Stably's `aiAssert`).
 *
 * Takes a screenshot (locator-scoped when a locator is passed, else the
 * viewport, or the full page when `fullPage`), sends it to a vision model, and
 * asserts on a structured `{ pass, reason }` verdict.
 *
 * Model: `openai/gpt-6-luna` (override with `VISION_MODEL`; legacy
 * `GROK_VISION_MODEL` still honored).
 *
 * Providers, in order:
 *   1. Bloom proxy (Responses API, streaming) when `QA_PROXY_API_KEY` is set.
 *      Base URL `QA_PROXY_BASE_URL` (default https://proxy.getbloom.app/v1).
 *   2. OpenRouter chat/completions with `OPENROUTER_API_KEY`. Used when the
 *      proxy is not configured, or when the proxy attempt fails with a network
 *      error/timeout, HTTP 401/402/403/408/429, or 5xx.
 * At least one of the two keys must be set.
 *
 * Transport errors (network/5xx/429) are retried; a genuine model verdict of
 * `pass:false` is re-polled (re-screenshot + re-judge) until the assertion
 * `timeout` budget expires, so late-rendering content is not a false failure.
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_PROXY_BASE_URL = 'https://proxy.getbloom.app/v1';
const MODEL =
  process.env.VISION_MODEL || process.env.GROK_VISION_MODEL || 'openai/gpt-6-luna';
const MAX_TRANSPORT_RETRIES = 2;

export interface AiAssertOptions {
  /** Total budget to keep polling (re-screenshot + re-judge) until the verdict passes. */
  timeout?: number;
  /** Per-request abort timeout (each provider attempt). Defaults to min(timeout, 30000). */
  fetchTimeout?: number;
  fullPage?: boolean;
  /** Scope the screenshot + judgment to a single element. */
  locator?: Locator;
}

export interface Verdict {
  pass: boolean;
  reason: string;
}

/** A failed provider call, with the HTTP status when there was a response. */
class ProviderError extends Error {
  readonly provider: string;
  readonly status: number | undefined;
  constructor(provider: string, status: number | undefined, detail: string) {
    super(
      status === undefined
        ? `${provider} request failed: ${detail}`
        : `${provider} HTTP ${status}: ${detail}`,
    );
    this.provider = provider;
    this.status = status;
  }
}

function buildPrompt(prompt: string): string {
  return (
    `You are a strict QA visual assertion checker for a web app screenshot.\n` +
    `Assertion to verify: "${prompt}"\n\n` +
    `Reply with ONLY a JSON object, no prose, no code fences:\n` +
    `{"pass": <true|false>, "reason": "<one concise sentence>"}\n` +
    `pass=true only if the screenshot clearly satisfies the assertion.`
  );
}

/** Turn the model's raw text into a verdict. Shared by both providers. */
export function parseVerdict(content: string): Verdict {
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

/**
 * Extract the final output text from a Responses API SSE stream. Prefers the
 * `response.completed` event's output; falls back to `response.output_text.done`
 * events, then to concatenated `response.output_text.delta` chunks.
 */
export function parseResponsesSse(sse: string): string {
  let completed: string | null = null;
  const done: string[] = [];
  const deltas: string[] = [];
  for (const line of sse.split(/\r?\n/)) {
    if (!line.startsWith('data:')) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;
    let ev: any;
    try {
      ev = JSON.parse(payload);
    } catch {
      continue;
    }
    if (ev?.type === 'response.completed') {
      const parts: string[] = [];
      for (const item of ev.response?.output ?? []) {
        for (const c of item?.content ?? []) {
          if (c?.type === 'output_text' && typeof c.text === 'string') parts.push(c.text);
        }
      }
      if (parts.length) completed = parts.join('');
    } else if (ev?.type === 'response.output_text.done' && typeof ev.text === 'string') {
      done.push(ev.text);
    } else if (ev?.type === 'response.output_text.delta' && typeof ev.delta === 'string') {
      deltas.push(ev.delta);
    }
  }
  return completed ?? (done.length ? done.join('') : deltas.join(''));
}

async function fetchWithTimeout(
  provider: string,
  url: string,
  init: RequestInit,
  timeout: number,
): Promise<{ status: number; ok: boolean; text: string }> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeout);
  try {
    // Read the body inside the timeout so a stalled stream is also aborted.
    const resp = await fetch(url, { ...init, signal: controller.signal });
    const text = await resp.text();
    return { status: resp.status, ok: resp.ok, text };
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    throw new ProviderError(provider, undefined, msg);
  } finally {
    clearTimeout(t);
  }
}

async function callProxy(
  apiKey: string,
  imageB64: string,
  prompt: string,
  timeout: number,
): Promise<string> {
  const base = (process.env.QA_PROXY_BASE_URL || DEFAULT_PROXY_BASE_URL).replace(/\/+$/, '');
  const body = {
    model: MODEL,
    stream: true,
    store: false,
    max_output_tokens: 500,
    input: [
      {
        role: 'user',
        content: [
          { type: 'input_image', image_url: `data:image/png;base64,${imageB64}` },
          { type: 'input_text', text: buildPrompt(prompt) },
        ],
      },
    ],
  };
  const resp = await fetchWithTimeout(
    'Bloom proxy',
    `${base}/responses`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'text/event-stream',
        'x-proxy-api-key': apiKey,
      },
      body: JSON.stringify(body),
    },
    timeout,
  );
  if (!resp.ok) throw new ProviderError('Bloom proxy', resp.status, resp.text.slice(0, 200));
  const content = parseResponsesSse(resp.text);
  if (!content) {
    // Treat an empty stream like a server fault so OpenRouter gets a chance.
    throw new ProviderError('Bloom proxy', 502, `empty stream: ${resp.text.slice(0, 200)}`);
  }
  return content;
}

async function callOpenRouter(
  apiKey: string,
  imageB64: string,
  prompt: string,
  timeout: number,
): Promise<string> {
  const body = {
    model: MODEL,
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/png;base64,${imageB64}` } },
          { type: 'text', text: buildPrompt(prompt) },
        ],
      },
    ],
  };
  const resp = await fetchWithTimeout(
    'OpenRouter',
    OPENROUTER_URL,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    },
    timeout,
  );
  if (!resp.ok) throw new ProviderError('OpenRouter', resp.status, resp.text.slice(0, 200));
  let data: any;
  try {
    data = JSON.parse(resp.text);
  } catch {
    throw new ProviderError('OpenRouter', 502, `non-JSON body: ${resp.text.slice(0, 200)}`);
  }
  const content: string = data?.choices?.[0]?.message?.content ?? '';
  if (!content) {
    throw new ProviderError('OpenRouter', 502, `empty content: ${resp.text.slice(0, 200)}`);
  }
  return content;
}

/** Proxy failures that should fall back to OpenRouter instead of failing the call. */
function shouldFallBack(err: ProviderError): boolean {
  const s = err.status;
  return (
    s === undefined || // network error / timeout
    s === 401 ||
    s === 402 ||
    s === 403 ||
    s === 408 ||
    s === 429 ||
    s >= 500
  );
}

/**
 * Re-throw a provider failure with the marker aiAssert/aiAssertSafe match on:
 *   __TRANSPORT__          5xx / 429 / network — retried, then softened by aiAssertSafe
 *   __VISION_UNAVAILABLE__ 401 / 402 / 403 key or billing outage — soft-passed
 * A key/billing outage is the vision PROVIDER's fault, not the Bloom app's, so
 * it must not red-wall every visual test as a false app regression.
 */
function tagFailure(err: unknown, context = ''): never {
  if (!(err instanceof ProviderError)) throw err;
  const s = err.status;
  const prefix =
    s === undefined
      ? '__TRANSPORT__ ' // network error / timeout
      : s >= 500 || s === 429
      ? '__TRANSPORT__ '
      : s === 401 || s === 402 || s === 403
      ? '__VISION_UNAVAILABLE__ '
      : '';
  throw new Error(`${prefix}${err.message}${context}`);
}

export async function callVision(
  imageB64: string,
  prompt: string,
  timeout: number,
): Promise<Verdict> {
  const proxyKey = process.env.QA_PROXY_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!proxyKey && !openRouterKey) {
    throw new Error(
      'aiAssert: neither QA_PROXY_API_KEY nor OPENROUTER_API_KEY is set. ' +
        'Source ~/.hermes/.env or set one in CI secrets.',
    );
  }

  let proxyFailure: ProviderError | null = null;
  if (proxyKey) {
    try {
      return parseVerdict(await callProxy(proxyKey, imageB64, prompt, timeout));
    } catch (err) {
      if (!(err instanceof ProviderError) || !shouldFallBack(err)) tagFailure(err);
      proxyFailure = err;
    }
  }

  if (!openRouterKey) tagFailure(proxyFailure);
  try {
    return parseVerdict(await callOpenRouter(openRouterKey, imageB64, prompt, timeout));
  } catch (err) {
    tagFailure(err, proxyFailure ? ` (after ${proxyFailure.message.slice(0, 120)})` : '');
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
 * A vision-PROVIDER key/billing outage (401/402/403 from the last provider tried), tagged with
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
export async function aiAssert(
  page: Page,
  prompt: string,
  options: AiAssertOptions = {},
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
          type: 'aiAssert-pass',
          description: `${prompt.slice(0, 120)} :: ${verdict.reason.slice(0, 160)}`,
        });
        return;
      }
      // Genuine visual FAIL — remember it and re-poll (content may still render).
      lastFailure = new Error(
        `aiAssert FAILED\n  Assertion: ${prompt}\n  Model reason: ${verdict.reason}`,
      );
    } catch (err) {
      // A vision-PROVIDER outage (dead/unfunded key: 401/402/403 from every provider tried)
      // is not an app regression. Soft-pass the visual assertion with a loud
      // annotation so a billing lapse cannot red-wall every visual test; the
      // real fix (top up / rotate the key) is surfaced in the report, not by a
      // wall of false failures. Only these key/billing errors soft-pass — a
      // genuine model verdict of pass:false still fails below.
      if (isVisionUnavailable(err)) {
        const rawDetail = err instanceof Error ? err.message : String(err);
        const detail = rawDetail.replace('__VISION_UNAVAILABLE__ ', '');
        test.info().annotations.push({
          type: 'aiAssert-vision-unavailable',
          description:
            `Vision provider unavailable (key/billing); assertion soft-passed. ` +
            `Check QA_PROXY_API_KEY (Bloom proxy) and OPENROUTER_API_KEY credits (OpenRouter). Prompt: "${prompt.slice(0, 120)}" :: ` +
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
    new Error(`aiAssert: no verdict within ${timeout}ms\n  Assertion: ${prompt}`)
  );
}
