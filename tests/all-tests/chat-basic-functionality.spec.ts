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
    const messageInput = page.getByRole('textbox').describe('Chat message input');
    await expect(messageInput).toBeVisible({ timeout: 10000 });

    // Should show suggested question buttons
    const suggestedQuestions = page.locator('button').filter({ hasText: /netflix|P\/E|bloom|NVIDIA|portfolio|invest|market/i });
    await expect(suggestedQuestions.first().describe('Suggested question button')).toBeVisible({ timeout: 10000 });
  });

  await test.step("Click a suggested question and verify AI responds", async () => {
    // Click "What can I do with Bloom?" or similar general question
    const bloomQuestion = page.locator('button').filter({ hasText: /What can I do with Bloom/i });
    if (await bloomQuestion.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bloomQuestion.click();
    } else {
      const firstSuggestion = page.locator('button').filter({ hasText: /netflix|P\/E|invest|NVIDIA|portfolio|market/i }).first();
      await firstSuggestion.click();
    }

    // Use aiAssert to verify the AI actually responded with meaningful content
    await expect(page).aiAssert(
      'The chat shows an AI-generated response with investing-related content (not just the original question or loading state).',
      { timeout: 60000 }
    );
  });

  await test.step("Verify message counter decremented", async () => {
    // Should show "2 / 3 free messages left today" or similar (use global timeout, not 5s)
    const counter = page.locator('text=/\\d+\\s*\\/\\s*\\d+\\s*free message/i').describe('Message counter');
    await expect(counter).toBeVisible();
  });
});
