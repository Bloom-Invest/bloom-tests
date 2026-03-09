import { test, expect } from '@stablyai/playwright-test';

/**
 * User Prompt:
 * Navigate to the AI Arena page (/ideas/ai-arena). Verify the page loads and shows
 * AI-generated portfolio managers or investment strategies. Click on one of the AI
 * portfolio managers or strategies and verify details are shown.
 */
test("AI Arena page displays AI portfolio managers and shows details on selection", async ({ page }) => {
  await test.step("Navigate to the AI Arena page and dismiss any overlays", async () => {
    await page.goto('/ideas/ai-arena');

    // Handle subscription overlay if it appears
    const closeBtn = page.getByRole('button', { name: 'Close' });
    const exploreBtn = page.getByRole('button', { name: 'Explore free' });
    if (await exploreBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await exploreBtn.click();
      // If redirected, navigate back
      if (!page.url().includes('/ideas/ai-arena')) {
        // Dismiss any tutorial overlay
        const tapOverlay = page.getByText('Tap anywhere to continue');
        if (await tapOverlay.isVisible({ timeout: 2000 }).catch(() => false)) {
          await tapOverlay.click();
        }
        await page.goto('/ideas/ai-arena');
      }
    } else if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click();
    }
  });

  await test.step("Verify the AI Arena page heading is visible", async () => {
    await expect(page.getByRole('heading', { name: 'Copy trade Bloom AI', level: 1 })).toBeVisible();
  });

  await test.step("Verify three AI portfolio managers are displayed with performance data", async () => {
    // Verify GPT 5.2 card
    const gptCard = page.getByRole('button', { name: /GPT 5\.2/ });
    await expect(gptCard).toBeVisible();
    await expect(gptCard.getByText(/[+-]?\d+\.\d+%/)).toBeVisible();

    // Verify Gemini 3 card
    const geminiCard = page.getByRole('button', { name: /Gemini 3/ });
    await expect(geminiCard).toBeVisible();
    await expect(geminiCard.getByText(/[+-]?\d+\.\d+%/)).toBeVisible();

    // Verify Opus 4.6 card
    const opusCard = page.getByRole('button', { name: /Opus 4\.6/ });
    await expect(opusCard).toBeVisible();
    await expect(opusCard.getByText(/[+-]?\d+\.\d+%/)).toBeVisible();
  });

  await test.step("Verify the Performance History chart section is visible", async () => {
    await expect(page.getByRole('heading', { name: 'Performance History' })).toBeVisible();

    // Verify time period buttons are present
    await expect(page.getByRole('button', { name: '1W' })).toBeVisible();
    await expect(page.getByRole('button', { name: '1M' })).toBeVisible();
    await expect(page.getByRole('button', { name: '3M' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'YTD' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'ALL' })).toBeVisible();

    // Verify chart legend shows all three AI managers with performance percentages
    await expect(page.getByText(/GPT 5\.2/)).toHaveCount(2); // card + legend
    await expect(page.getByText(/Gemini 3/)).toHaveCount(2); // card + legend
    await expect(page.getByText(/Opus 4\.6/)).toHaveCount(2); // card + legend
  });

  await test.step("Click on an AI portfolio manager and verify it becomes selected", async () => {
    // Click on the GPT 5.2 card
    const gptCard = page.getByRole('button', { name: /GPT 5\.2/ });
    await gptCard.click();

    // Verify the card is now in active/selected state
    await expect(gptCard).toHaveAttribute('class', /active|selected|highlight/i);
  });

  await test.step("Verify Portfolio Breakdown section is visible", async () => {
    await expect(page.getByRole('heading', { name: 'Portfolio Breakdown' })).toBeVisible();
    await expect(page.getByText('See what positions our AI portfolio managers are buying and selling')).toBeVisible();
  });
});
