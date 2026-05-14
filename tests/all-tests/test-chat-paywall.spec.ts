import { test, expect } from '@stablyai/playwright-test';
import { dismissFeedbackModal } from '../helpers/dismissFeedbackModal';

/**
 * BLOOM PITFALLS (chat paywall):
 *
 * 1. FREE MESSAGE LIMIT: MAX_FREE_MESSAGES = 3 (frontend/src/components/ChatPage/index.tsx).
 *    The paywall triggers when messageCount >= 3, so the wall appears inline after sending
 *    the 3rd message (not on the 4th attempt). The counter shows "0 / 3 free messages left
 *    today" and a "Subscribe" link appears next to it.
 *
 * 2. FEEDBACK MODAL: A "How's your Bloom experience so far?" modal can appear at any time
 *    and overlays the entire viewport. It blocks aiAssert from seeing the paywall UI behind
 *    it. Must call dismissFeedbackModal() before every aiAssert and after navigation/sends.
 *
 * 3. SEND BUTTON: The chat send button has no accessible name (it's an SVG icon). Use
 *    input.press('Enter') instead of clicking the button.
 *
 * 4. NEW CHAT TIMING: After clicking "+ New", wait for the input to become visible before
 *    interacting. The textbox may not be ready immediately.
 *
 * 5. DETERMINISTIC SEND CONFIRMATION: After pressing Enter, wait for the free-messages
 *    counter to update (e.g. "2 / 3" -> "1 / 3") rather than using fixed waitForTimeout.
 *    This ensures the message actually registered before proceeding.
 */

/**
 * Send a chat message and wait for the free-messages counter to confirm it registered.
 * Uses the counter text pattern "N / 3 free messages left today" as the deterministic signal
 * instead of a fixed waitForTimeout (which is race-prone if the AI backend is slow).
 */
async function sendAndConfirm(
  page: import('@playwright/test').Page,
  text: string,
  expectedRemaining: number,
) {
  const input = page.getByRole('textbox', { name: 'Write a message...' });
  await input.waitFor({ state: 'visible', timeout: 10000 });
  await input.fill(text);
  await input.press('Enter');
  // Wait for the counter to show the expected remaining count, confirming the send registered.
  // The counter text is e.g. "2 / 3 free messages left today" or "0 / 3 free messages left today".
  await expect(page.getByText(`${expectedRemaining} / 3 free messages left`)).toBeVisible({ timeout: 30000 });
  await dismissFeedbackModal(page);
}

test("Test chat + paywall", async ({ page }) => {
  await test.step("Navigate to the chat page.", async () => {
    await page.goto(`/chat`, { waitUntil: 'domcontentloaded' });
    await dismissFeedbackModal(page);
  });

  await test.step("Send first message.", async () => {
    await sendAndConfirm(page, 'hello', 2);
  });

  await test.step("Open new chat and send second message.", async () => {
    await page.getByRole('button', { name: '+ New' }).click();
    await dismissFeedbackModal(page);
    await sendAndConfirm(page, 'What stocks should I buy?', 1);
  });

  await test.step("Open new chat and send third message.", async () => {
    await page.getByRole('button', { name: '+ New' }).click();
    await dismissFeedbackModal(page);
    await sendAndConfirm(page, 'Summarize the market today', 0);
  });

  await test.step("Assert paywall / subscribe prompt is visible after hitting the free message limit.", async () => {
    await dismissFeedbackModal(page);
    // After 3 messages the counter shows "0 / 3 free messages left today"
    // with a "Subscribe" link visible next to it.
    await expect(page).aiAssert(
      `The free messages counter shows 0 remaining (e.g. "0 / 3 free messages left today") ` +
      `and a "Subscribe" link or subscription prompt is visible on the page.`,
      { timeout: 60000 }
    );
  });
});
