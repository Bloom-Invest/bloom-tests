import { test, expect } from '@stablyai/playwright-test';

test("Test chat + paywall", async ({ page, context, agent }) => {
await test.step("Navigate to the chat page.", async () => {
await page.goto(`/chat`);});

await test.step("Send 'hello' as a message.", async () => {
await page.getByRole('textbox', { name: 'Write a message...' }).describe('Message input field with placeholder "Write a message..."').click();
await page.getByRole('textbox', { name: 'Write a message...' }).describe('Message input field with placeholder \'Write a message...\'').fill(`hello`);
await agent.act(`Click on the send message button`, { page: page });});

await test.step("Assert the chatbot responded to my message correctly and offered suggested follow up questions.", async () => {
await page.waitForTimeout(7000);
await expect(page).aiAssert(`Assert the chatbot responded to my message correctly and offered suggested follow up questions`);});

await test.step("Click the '+ New' button, click the 'Write a message...' text input field, enter the query 'Summarize latest news for Netflix', send it, and then click on 'Retrieved' button.", async () => {
await page.getByRole('button', { name: '+ New' }).describe('\'+ New\' button').click();
await page.getByRole('textbox', { name: 'Write a message...' }).describe('"Write a message..." text input field').click();
await page.getByRole('textbox', { name: 'Write a message...' }).describe('Message input field with placeholder "Write a message..."').fill(`Summarize latest news for Netflix`);
await agent.act(`Click on the send message button`, { page: page });
await page.waitForTimeout(7000);
await page.getByText('Retrieved news▶').describe('"Retrieved" button with right arrow icon').click();});

await test.step("Assert that the answer includes Netflix news.", async () => {
await expect(page).aiAssert(`Assert answer includes netflix news`);});

await test.step("Click the '+ New' button, click the message input field, type 'What could I invest in' into the message field, send the message, wait for 7 seconds, and close the feedback dialog.", async () => {
await page.getByRole('button', { name: '+ New' }).describe('\'+ New\' button').click();
await page.getByRole('textbox', { name: 'Write a message...' }).describe('Message input field with placeholder "Write a message..."').click();
await page.getByRole('textbox', { name: 'Write a message...' }).describe('Text area with placeholder "Write a message..."').fill(`What could I invest in`);
await agent.act(`Click on the send message button`, { page: page });
await page.waitForTimeout(7000);});

await test.step("Click on the fourth close button, then click on the '+ New' button, click on one of the suggested questions, and then verify 'Subscribe to Bloom' button appears after clicking the 'Subscribe now' link", async () => {
await page.getByRole('button').filter({ hasText: /^$/ }).nth(3).describe('fourth close button').click({"force":true});
await page.getByRole('button', { name: '+ New' }).describe('\'+ New\' button').click();
await agent.act(`Click on one of the suggested questions`, { page: page });
await page.getByRole('link', { name: 'Subscribe now' }).describe('\'Subscribe now\' link').click();
await expect(page.getByRole('button', { name: 'Subscribe to Bloom' }).describe('\'Subscribe to Bloom\' button')).toBeVisible();
await expect(page).aiAssert(`The paywall for the app is open`);});
});
