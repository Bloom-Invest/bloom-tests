import { test, expect } from '@stablyai/playwright-test';
import { dismissFeedbackModal } from '../helpers/dismissFeedbackModal';

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
