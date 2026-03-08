import { test, expect } from '@stablyai/playwright-test';

test("Test chat + paywall", async ({ page, agent }) => {
  await test.step("Navigate to the chat page.", async () => {
    await page.goto(`/chat`);
  });

  await test.step("Send first message.", async () => {
    await page.getByRole('textbox', { name: 'Write a message...' }).describe('Message input').fill(`hello`);
    await agent.act(`Click on the send message button`, { page });
    // Wait for send to register, don't need to wait for full AI response
    await page.waitForTimeout(2000);
  });

  await test.step("Open new chat and send second message.", async () => {
    await page.getByRole('button', { name: '+ New' }).describe('+ New button').click();
    await page.getByRole('textbox', { name: 'Write a message...' }).describe('Message input').fill(`What stocks should I buy?`);
    await agent.act(`Click on the send message button`, { page });
    await page.waitForTimeout(2000);
  });

  await test.step("Open new chat and send third message — paywall should appear.", async () => {
    await page.getByRole('button', { name: '+ New' }).describe('+ New button').click();
    await page.getByRole('textbox', { name: 'Write a message...' }).describe('Message input').fill(`Summarize the market today`);
    await agent.act(`Click on the send message button`, { page });
  });

  await test.step("Assert paywall / subscribe prompt is visible after hitting the free message limit.", async () => {
    await expect(page).aiAssert(`A paywall, subscription prompt, or 'Subscribe now' link is visible on the page`, { timeout: 60000 });
  });
});
