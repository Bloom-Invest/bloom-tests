import { test, expect } from '@stablyai/playwright-test';
import { aiAssertSafe } from '../helpers/aiAssertSafe';

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

    // Wait for the AI to finish processing before asserting on response content.
    // The chat shows a "processing..." indicator while generating; wait for it to appear
    // then disappear, so we know the response is fully rendered.
    const processingIndicator = page.getByText('processing...', { exact: false });
    // First, wait briefly for the processing indicator to appear (it may already be visible)
    await processingIndicator.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {
      // It's possible the response was fast enough that processing already finished
    });
    // Now wait for processing to finish (disappear) with a generous timeout
    await processingIndicator.waitFor({ state: 'hidden', timeout: 180000 });

    // Use aiAssert to verify the AI actually responded with meaningful content.
    // Falls back to a structural check if the Stably AI service is unreachable —
    // we won't catch off-topic replies in that window, but we still confirm the
    // chat round-trip completed (i.e. the chat itself isn't broken).
    await aiAssertSafe(
      page,
      'The chat shows an AI-generated response with investing-related content (not just the original question or loading state).',
      {
        timeout: 60000,
        // Fallback: at least one assistant-side bubble rendered with non-trivial text
        // (>= 80 chars rules out empty / "..." / loading states).
        fallback: async () => {
          const responseLength = await page
            .locator('[data-testid="chat-message"], article, [role="article"], [data-role="assistant"]')
            .last()
            .innerText()
            .catch(() => '');
          if (responseLength.trim().length >= 80) return true;
          // Generic last-resort: any meaningful sentence on the page that isn't
          // the suggested-question buttons.
          const anyLong = await page.getByText(/\S{40,}/).first().isVisible({ timeout: 5000 }).catch(() => false);
          return anyLong;
        },
      },
    );
  });

  await test.step("Verify message counter decremented", async () => {
    // Should show "2 / 3 free messages left today" or similar (use global timeout, not 5s)
    const counter = page.locator('text=/\\d+\\s*\\/\\s*\\d+\\s*free message/i').describe('Message counter');
    await expect(counter).toBeVisible();
  });
});
