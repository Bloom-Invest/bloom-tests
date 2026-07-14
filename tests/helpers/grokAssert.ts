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
 * Transport errors (network/5xx) are retried; a genuine model verdict of
 * `pass:false` throws immediately with the model's reason.
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.GROK_VISION_MODEL || 'x-ai/grok-4.5';
const MAX_TRANSPORT_RETRIES = 2;

export interface GrokAssertOptions {
  timeout?: number;
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
    // 5xx / 429 are transport-ish; surface status so the retry loop can decide.
    const text = await resp.text().catch(() => '');
    throw new Error(`__TRANSPORT__ OpenRouter HTTP ${resp.status}: ${text.slice(0, 200)}`);
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
    return { pass: !!parsed.pass, reason: String(parsed.reason ?? '') };
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
 * Visual assertion. Throws (failing the test) when the model judges the
 * screenshot does not satisfy `prompt`.
 */
export async function grokAssert(
  page: Page,
  prompt: string,
  options: GrokAssertOptions = {},
): Promise<void> {
  const { timeout = 60000, fullPage = false, locator } = options;

  const shotTarget = locator ?? page;
  const buffer = await shotTarget.screenshot(
    locator ? {} : { fullPage },
  );
  const imageB64 = buffer.toString('base64');

  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_TRANSPORT_RETRIES; attempt++) {
    try {
      const verdict = await callVision(imageB64, prompt, timeout);
      if (verdict.pass) {
        test.info().annotations.push({
          type: 'grokAssert-pass',
          description: `${prompt.slice(0, 120)} :: ${verdict.reason.slice(0, 160)}`,
        });
        return;
      }
      throw new Error(
        `grokAssert FAILED\n  Assertion: ${prompt}\n  Model reason: ${verdict.reason}`,
      );
    } catch (err) {
      if (isTransient(err) && attempt < MAX_TRANSPORT_RETRIES) {
        lastErr = err;
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastErr ?? new Error('grokAssert: exhausted retries');
}
