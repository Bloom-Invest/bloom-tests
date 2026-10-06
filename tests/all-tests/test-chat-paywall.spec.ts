import { test, expect } from '@playwright/test';
import { dismissFeedbackModal } from '../helpers/dismissFeedbackModal';

// Daily quota spans new conversations. A completed SSE response decrements it;
// the final message replaces the composer with the upgrade action.
// Bloom #2859 moved "+ New" into the chat header's Options menu as "Start a new chat".
async function startNewChat(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Start a new chat', exact: true }).click();
  // A fresh thread has no prior user message.
  await expect(page.getByText('hello', { exact: true })).toHaveCount(0);
}

async function sendAndConfirm(
  page: import('@playwright/test').Page,
  text: string,
  expectedRemaining: number,
) {
  const input = page.getByRole('textbox', { name: 'Write a message...' });
  await input.waitFor({ state: 'visible', timeout: 10000 });
  await input.fill(text);
  await input.press('Enter');
  if (expectedRemaining > 0) {
    await expect(page.getByTestId('chat-composer-dock')
      .getByLabel(`${expectedRemaining} / 3 free messages left today`, { exact: true }))
      .toHaveText(`${expectedRemaining} left`, { timeout: 120000 });
  } else {
    await expect(page.getByText('Free messages reset tomorrow', { exact: true }))
      .toBeVisible({ timeout: 120000 });
  }
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
    await startNewChat(page);
    await dismissFeedbackModal(page);
    await sendAndConfirm(page, 'What stocks should I buy?', 1);
  });

  await test.step("Open new chat and send third message.", async () => {
    await startNewChat(page);
    await dismissFeedbackModal(page);
    await sendAndConfirm(page, 'Summarize the market today', 0);
  });

  await test.step("Assert paywall / subscribe prompt is visible after hitting the free message limit.", async () => {
    await dismissFeedbackModal(page);
    await expect(page.getByRole('textbox', { name: 'Write a message...' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Upgrade to keep chatting', exact: true }))
      .toBeVisible();
  });
});
