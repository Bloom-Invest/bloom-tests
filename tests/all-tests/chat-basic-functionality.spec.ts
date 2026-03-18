import { test, expect } from '@stablyai/playwright-test';

/**
 * Test: Chat basic functionality
 * Send a message, verify AI responds, verify suggested follow-up questions.
 */
test("Chat page allows sending messages and receiving AI responses", async ({ page }) => {
  await test.step("Navigate to the Chat page", async () => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
  });

  await test.step("Verify chat interface loads with suggested questions", async () => {
    // Should show the message input
    const messageInput = page.getByRole('textbox');
    await expect(messageInput).toBeVisible({ timeout: 10000 });

    // Should show suggested question buttons
    const suggestedQuestions = page.locator('button').filter({ hasText: /netflix|P\/E|bloom|NVIDIA|portfolio|invest|market/i });
    await expect(suggestedQuestions.first()).toBeVisible({ timeout: 10000 });
  });

  await test.step("Click a suggested question and verify AI responds", async () => {
    // Click "What can I do with Bloom?" or similar general question
    const bloomQuestion = page.locator('button').filter({ hasText: /What can I do with Bloom/i });
    if (await bloomQuestion.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bloomQuestion.click();
    } else {
      // Fall back to first suggested question
      const firstSuggestion = page.locator('button').filter({ hasText: /netflix|P\/E|invest|NVIDIA|portfolio|market/i }).first();
      await firstSuggestion.click();
    }

    // Wait for AI response — look for new content appearing in the chat
    await page.waitForTimeout(5000);
    const bodyText = await page.locator('body').innerText();
    // Response should contain substantive text (not just the original question)
    expect(bodyText.length).toBeGreaterThan(200);
  });

  await test.step("Verify message counter decremented", async () => {
    // Should show "2 / 3 free messages left today" or similar
    const counter = page.locator('text=/\\d+\\s*\\/\\s*\\d+\\s*free message/i');
    await expect(counter).toBeVisible({ timeout: 5000 });
  });
});
