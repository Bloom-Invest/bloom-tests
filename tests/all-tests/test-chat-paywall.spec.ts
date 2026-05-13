import { test, expect } from '@stablyai/playwright-test';

test("Test chat + paywall", async ({ page }) => {
  await test.step("Navigate to the chat page.", async () => {
    await page.goto(`/chat`, { waitUntil: 'domcontentloaded' });
  });

  await test.step("Send first message.", async () => {
    const input = page.getByRole('textbox', { name: 'Write a message...' });
    await input.fill('hello');
    await input.press('Enter');
    // Wait for send to register, don't need to wait for full AI response
    await page.waitForTimeout(2000);
  });

  await test.step("Open new chat and send second message.", async () => {
    await page.getByRole('button', { name: '+ New' }).click();
    const input = page.getByRole('textbox', { name: 'Write a message...' });
    await input.fill('What stocks should I buy?');
    await input.press('Enter');
    await page.waitForTimeout(2000);
  });

  await test.step("Open new chat and send third message — paywall should appear.", async () => {
    await page.getByRole('button', { name: '+ New' }).click();
    const input = page.getByRole('textbox', { name: 'Write a message...' });
    await input.fill('Summarize the market today');
    await input.press('Enter');
  });

  await test.step("Assert paywall / subscribe prompt is visible after hitting the free message limit.", async () => {
    await expect(page).aiAssert(`A paywall, subscription prompt, or 'Subscribe now' link is visible on the page`, { timeout: 60000 });
  });
});
