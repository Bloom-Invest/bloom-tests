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
 *    input.press('Enter') instead of clicking the button. Wait 3s+ after each send for the
 *    message to register and the counter to update.
 *
 * 4. NEW CHAT TIMING: After clicking "+ New", wait ~1s for the new thread to initialize
 *    before interacting with the input. The textbox may not be ready immediately.
 */
test("Test chat + paywall", async ({ page }) => {
  await test.step("Navigate to the chat page.", async () => {
    await page.goto(`/chat`, { waitUntil: 'domcontentloaded' });
    await dismissFeedbackModal(page);
  });

  await test.step("Send first message.", async () => {
    const input = page.getByRole('textbox', { name: 'Write a message...' });
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.fill('hello');
    await input.press('Enter');
    await page.waitForTimeout(3000);
    await dismissFeedbackModal(page);
  });

  await test.step("Open new chat and send second message.", async () => {
    await page.getByRole('button', { name: '+ New' }).click();
    await page.waitForTimeout(1000);
    await dismissFeedbackModal(page);
    const input = page.getByRole('textbox', { name: 'Write a message...' });
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.fill('What stocks should I buy?');
    await input.press('Enter');
    await page.waitForTimeout(3000);
    await dismissFeedbackModal(page);
  });

  await test.step("Open new chat and send third message.", async () => {
    await page.getByRole('button', { name: '+ New' }).click();
    await page.waitForTimeout(1000);
    await dismissFeedbackModal(page);
    const input = page.getByRole('textbox', { name: 'Write a message...' });
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.fill('Summarize the market today');
    await input.press('Enter');
    // Wait longer for the response + paywall to render
    await page.waitForTimeout(5000);
    await dismissFeedbackModal(page);
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
