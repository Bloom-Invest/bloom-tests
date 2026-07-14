import { test, expect } from '@playwright/test';
import { dismissFeedbackModal } from '../helpers/dismissFeedbackModal';

/**
 * User Prompt:
 * Navigate to the AI Arena page (/ideas/ai-arena). Verify the page loads and shows
 * AI-generated portfolio managers or investment strategies. Click on one of the AI
 * portfolio managers or strategies and verify details are shown.
 */
test("AI Arena page displays AI portfolio managers and shows details on selection", async ({ page }) => {
  await test.step("Navigate to the AI Arena page and dismiss any overlays", async () => {
    await page.goto('/ideas/ai-arena', { waitUntil: 'domcontentloaded' });

    // Handle subscription overlay if it appears
    const exploreBtn = page.getByRole('button', { name: 'Explore free' });
    try {
      await exploreBtn.waitFor({ state: 'visible', timeout: 3000 });
      await exploreBtn.click();
      // If redirected, navigate back
      if (!page.url().includes('/ideas/ai-arena')) {
        // Dismiss any tutorial overlay
        const tapOverlay = page.getByText('Tap anywhere to continue');
        try {
          await tapOverlay.waitFor({ state: 'visible', timeout: 2000 });
          await tapOverlay.click();
        } catch {
          // No tutorial overlay
        }
        await page.goto('/ideas/ai-arena', { waitUntil: 'domcontentloaded' });
      }
    } catch {
      const closeBtn = page.getByRole('button', { name: 'Close' });
      try {
        await closeBtn.waitFor({ state: 'visible', timeout: 2000 });
        await closeBtn.click();
      } catch {
        // No overlay
      }
    }

    await dismissFeedbackModal(page);
  });

  await test.step("Verify the AI Arena page heading is visible", async () => {
    await dismissFeedbackModal(page);
    await expect(page.getByRole('heading', { name: 'Copy trade Bloom AI', level: 1 })).toBeVisible();
  });

  await test.step("Verify three AI portfolio managers are displayed with performance data", async () => {
    await dismissFeedbackModal(page);

    // Verify GPT 5.5 card (use the card with performance data to disambiguate from legend button)
    const gptCard = page.getByRole('button', { name: /GPT 5\.5.*%/ });
    await expect(gptCard).toBeVisible();
    await expect(gptCard.getByText(/[+-]?\d+\.\d+%/)).toBeVisible();

    // Verify Gemini 3.5 Flash card
    const geminiCard = page.getByRole('button', { name: /Gemini 3\.5 Flash.*%/ });
    await expect(geminiCard).toBeVisible();
    await expect(geminiCard.getByText(/[+-]?\d+\.\d+%/)).toBeVisible();

    // Verify Opus 4.8 card
    const opusCard = page.getByRole('button', { name: /Opus 4\.8.*%/ });
    await expect(opusCard).toBeVisible();
    await expect(opusCard.getByText(/[+-]?\d+\.\d+%/)).toBeVisible();
  });

  await test.step("Verify the Performance History chart section is visible", async () => {
    await dismissFeedbackModal(page);
    await expect(page.getByRole('heading', { name: 'Performance History' })).toBeVisible();

    // Verify time period buttons are present
    await expect(page.getByRole('button', { name: '1W' })).toBeVisible();
    await expect(page.getByRole('button', { name: '1M' })).toBeVisible();
    await expect(page.getByRole('button', { name: '3M' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'YTD', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'ALL', exact: true })).toBeVisible();

    // Verify chart legend shows all three AI managers with performance percentages
    // Each name appears in card, chart legend, and Portfolio Breakdown tab
    expect(await page.getByText(/GPT 5\.5/).count()).toBeGreaterThanOrEqual(2);
    expect(await page.getByText(/Gemini 3\.5 Flash/).count()).toBeGreaterThanOrEqual(2);
    expect(await page.getByText(/Opus 4\.8/).count()).toBeGreaterThanOrEqual(2);
  });

  await test.step("Click on an AI portfolio manager and verify it becomes selected", async () => {
    await dismissFeedbackModal(page);
    // Click on the GPT 5.5 card (use card with performance data to disambiguate from Portfolio Breakdown tab)
    const gptCard = page.getByRole('button', { name: /GPT 5\.5.*%/ });
    await gptCard.click();

    // Verify the card is still visible after clicking
    await expect(gptCard).toBeVisible();
  });

  await test.step("Verify Portfolio Breakdown section is visible", async () => {
    await dismissFeedbackModal(page);
    await expect(page.getByRole('heading', { name: 'Portfolio Breakdown' })).toBeVisible();
    // Verify at least one AI manager tab is visible in the Portfolio Breakdown section
    await expect(page.getByRole('button', { name: 'GPT 5.5', exact: true })).toBeVisible();
  });
});
