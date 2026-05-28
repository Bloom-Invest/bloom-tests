import { test, expect } from '@stablyai/playwright-test';
import { dismissFeedbackModal } from '../helpers/dismissFeedbackModal';

/**
 * Navigate through the redesigned Bloom onboarding flow from start to finish.
 * Flow: Welcome → Experience level → Stock selection → AI Moment →
 *       AI Arena → Notifications → Paywall (multi-step) → Result → Main app
 */
test("Navigate through onboarding flow", async ({ page }) => {

  await test.step("Navigate to the home page and verify the Get Started button is visible", async () => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Bloom/i);
    const getStartedButton = page.getByRole('button', { name: 'Get started' });
    await expect(getStartedButton).toBeVisible({ timeout: 15000 });
  });

  await test.step("Click 'Get started' and verify the experience level screen appears", async () => {
    await page.getByRole('button', { name: 'Get started' }).click();
    // New onboarding: "What kind of investor are you?"
    await expect(page.getByText('What kind of investor are you?')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('New to investing')).toBeVisible();
    await expect(page.getByText('Not sure yet? Skip this step')).toBeVisible();
  });

  await test.step("Skip experience level selection", async () => {
    await page.getByText('Not sure yet? Skip this step').click();
    await page.waitForTimeout(1000);
  });

  await test.step("Verify stock selection screen and pick stocks", async () => {
    // New screen: "Pick a few stocks to follow."
    await expect(page.getByText(/Pick a few stocks to follow/i)).toBeVisible({ timeout: 10000 });

    // Select a couple of stocks by clicking their buttons
    const aaplBtn = page.getByRole('button', { name: /AAPL/ }).first();
    try {
      await aaplBtn.waitFor({ state: 'visible', timeout: 5000 });
      await aaplBtn.click();
    } catch {
      // AAPL might not be in the list
    }

    const nvdaBtn = page.getByRole('button', { name: /NVDA/ }).first();
    try {
      await nvdaBtn.waitFor({ state: 'visible', timeout: 3000 });
      await nvdaBtn.click();
    } catch {
      // NVDA might not be in the list
    }

    // Click the follow/add button to proceed
    const followBtn = page.locator('button').filter({ hasText: /Follow \d+ stock|Add to my watchlist/i }).first();
    try {
      await followBtn.waitFor({ state: 'visible', timeout: 3000 });
      await followBtn.click();
    } catch {
      // If no stocks selected, use the skip link
      const skipBtn = page.getByText(/Skip.*I'll add stocks later/i);
      await skipBtn.click();
    }
    await page.waitForTimeout(1000);
  });

  await test.step("Handle AI Moment screen", async () => {
    // Screen 3: AI moment - "Here's what Bloom sees in <ticker>" or "Here's what Bloom sees"
    await expect(page.getByRole('heading', { name: /Here's what Bloom sees/i })).toBeVisible({ timeout: 15000 });

    // Click Continue to proceed
    const continueBtn = page.getByRole('button', { name: 'Continue' });
    await expect(continueBtn).toBeVisible({ timeout: 30000 });
    await continueBtn.click();
    await page.waitForTimeout(1000);
  });

  await test.step("Handle AI Arena teaser screen", async () => {
    // Screen 4: AI Arena - "Our AI portfolio managers beat the market"
    await expect(page.getByText(/AI portfolio managers/i)).toBeVisible({ timeout: 10000 });

    const continueBtn = page.getByRole('button', { name: 'Continue' });
    await expect(continueBtn).toBeVisible({ timeout: 5000 });
    await continueBtn.click();
    await page.waitForTimeout(1000);
  });

  await test.step("Handle notifications screen", async () => {
    // Screen 5: Notifications - "Get alerted when <ticker> moves" or "Stay informed"
    await expect(page.getByText(/Get alerted when.*moves|Stay informed/i)).toBeVisible({ timeout: 10000 });

    // Skip alerts
    const skipBtn = page.getByText(/Skip.*I'll set up alerts later/i);
    try {
      await skipBtn.waitFor({ state: 'visible', timeout: 3000 });
      await skipBtn.click();
    } catch {
      // Try the main button if skip link isn't visible
      const finishBtn = page.getByRole('button', { name: /Finish setup/i });
      await finishBtn.click();
    }
    await page.waitForTimeout(2000);
  });

  await test.step("Handle paywall - navigate through to 'Explore free'", async () => {
    // After notifications, the "Unlock Bloom Pro" paywall modal appears.
    // Step 1 only has "Continue" (no "Explore free"). Click Continue to get to step 2.
    // Step 2 shows pricing with "Explore free" below.
    await page.waitForTimeout(2000);

    // Step 1: Click "Continue" on the feature showcase
    const continueBtn = page.getByRole('button', { name: 'Continue' });
    try {
      await continueBtn.waitFor({ state: 'visible', timeout: 10000 });
      await continueBtn.click();
      await page.waitForTimeout(2000);
    } catch {
      // Continue button not found
    }

    // Step 2: Click "Explore free" on the pricing screen
    const exploreFree = page.locator('button').filter({ hasText: /^Explore free$/i }).first();
    try {
      await exploreFree.scrollIntoViewIfNeeded();
      await exploreFree.waitFor({ state: 'visible', timeout: 10000 });
      await exploreFree.click();
      await page.waitForTimeout(1500);
    } catch {
      // Explore free not found, try scrolling
      await page.keyboard.press('End');
      await page.waitForTimeout(500);
      try {
        await exploreFree.waitFor({ state: 'visible', timeout: 3000 });
        await exploreFree.click();
        await page.waitForTimeout(1500);
      } catch {
        // Still not found
      }
    }
  });

  await test.step("Dismiss one-time offer if shown", async () => {
    // After clicking "Explore free", a one-time offer may appear
    const exploreFreeVersion = page.locator('button, a, [role="button"]').filter({ hasText: /explore free version/i }).first();
    try {
      await exploreFreeVersion.waitFor({ state: 'visible', timeout: 5000 });
      await exploreFreeVersion.click();
      await page.waitForTimeout(1000);
    } catch {
      // No one-time offer
    }
  });

  await test.step("Handle 'You're all set!' result page", async () => {
    // After paywall dismissal, lands on result page with "Open Bloom"
    const openBloomBtn = page.getByRole('button', { name: /Open Bloom/i });
    try {
      await openBloomBtn.waitFor({ state: 'visible', timeout: 5000 });
      await openBloomBtn.click();
      await page.waitForTimeout(1500);
    } catch {
      // Not on result page, might have gone straight to app
    }
  });

  await test.step("Dismiss the 'Tap anywhere to continue' overlay", async () => {
    try {
      const tapOverlay = page.getByText('Tap anywhere to continue');
      await tapOverlay.waitFor({ state: 'visible', timeout: 5000 });
      await tapOverlay.click();
      await page.waitForTimeout(1000);
    } catch {
      // No overlay
    }
  });

  await test.step("Dismiss feedback modal if shown", async () => {
    await dismissFeedbackModal(page);
  });

  await test.step("Verify landing on the main app with navigation bar", async () => {
    // Should be on the main app with navigation links
    await expect(page.getByRole('link', { name: 'Portfolio' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: 'Chat' })).toBeVisible();
  });
});
