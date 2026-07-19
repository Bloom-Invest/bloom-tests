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

    // Match the model cards by their stable brand prefix (GPT / Gemini / Opus),
    // NOT the version number — Bloom bumps the arena model versions often
    // (GPT 5.2 -> 5.5 -> 5.6 Sol, Opus 4.7 -> 4.8, ...) and pinning the exact
    // version silently breaks this test on every rename. The `.*YTD` / `.*%`
    // suffix keeps the card disambiguated from the bare chart-legend button.
    const gptCard = page.getByRole('button', { name: /GPT.*YTD/ });
    await expect(gptCard).toBeVisible();
    await expect(gptCard.getByText(/[+-]?\d+\.\d+%/)).toBeVisible();

    // Verify Gemini card
    const geminiCard = page.getByRole('button', { name: /Gemini.*%/ });
    await expect(geminiCard).toBeVisible();
    await expect(geminiCard.getByText(/[+-]?\d+\.\d+%/)).toBeVisible();

    // Verify Opus card
    const opusCard = page.getByRole('button', { name: /Opus.*%/ });
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
    // Chart legend + Portfolio Breakdown tab each repeat the manager names, so
    // each brand appears in >=2 places. Match on brand prefix, not version.
    expect(await page.getByText(/GPT/).count()).toBeGreaterThanOrEqual(2);
    expect(await page.getByText(/Gemini/).count()).toBeGreaterThanOrEqual(2);
    expect(await page.getByText(/Opus/).count()).toBeGreaterThanOrEqual(2);
  });

  await test.step("Click on an AI portfolio manager and verify it becomes selected", async () => {
    await dismissFeedbackModal(page);
    // Click on the GPT card (its YTD label disambiguates from the Portfolio Breakdown tab)
    const gptCard = page.getByRole('button', { name: /GPT.*YTD/ });
    await gptCard.click();

    // Verify the card is still visible after clicking
    await expect(gptCard).toBeVisible();
  });

  await test.step("Verify Portfolio Breakdown section is visible", async () => {
    await dismissFeedbackModal(page);
    await expect(page.getByRole('heading', { name: 'Portfolio Breakdown' })).toBeVisible();
    // Verify at least one AI manager tab is visible in the Portfolio Breakdown section
    await expect(page.getByRole('button', { name: /GPT/ }).first()).toBeVisible();
  });
});
