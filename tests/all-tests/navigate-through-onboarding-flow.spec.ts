import { test, expect } from '@stablyai/playwright-test';
import { BASE_URL } from '../helpers/config.helper';

/**
 * User Prompt: Navigate through the Bloom onboarding flow from start to finish.
 * Start at the home page, click through all onboarding screens (Get started,
 * investing style, AI portfolios, stock selection, AI chat suggestions,
 * notifications, paywall/subscription), and end up on the main app.
 */
test("Navigate through onboarding flow", async ({ page, context, agent }) => {

  await test.step("Navigate to the home page and verify the Get Started button is visible", async () => {
    await page.goto(`${BASE_URL}/`);
    await expect(page).toHaveTitle(/Bloom/i);
    const getStartedButton = page.getByRole('button', { name: 'Get started' });
    await expect(getStartedButton).toBeVisible();
  });

  await test.step("Click 'Get started' and verify the investing style screen appears", async () => {
    await page.getByRole('button', { name: 'Get started' }).click();
    await expect(page.getByRole('heading', { name: "What's your investing style?" })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Not sure yet? Skip this step' })).toBeVisible();
  });

  await test.step("Skip investing style selection and verify AI portfolio managers screen", async () => {
    await page.getByRole('button', { name: 'Not sure yet? Skip this step' }).click();
    await expect(page.getByRole('heading', { name: /AI portfolio managers/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Show me their portfolios' })).toBeVisible();
  });

  await test.step("Click 'Show me their portfolios' and verify stock selection screen", async () => {
    await page.getByRole('button', { name: 'Show me their portfolios' }).click();
    await expect(page.getByRole('heading', { name: /Top ideas for you/i })).toBeVisible();
  });

  await test.step("Add AAPL and NVDA to the watchlist", async () => {
    await page.getByTestId('stock-row-AAPL').click();
    await page.getByTestId('stock-row-NVDA').click();
    const addButton = page.getByRole('button', { name: 'Add to my watchlist' });
    await expect(addButton).toBeEnabled();
    await addButton.click();
  });

  await test.step("Verify AI research screen and click a suggested question", async () => {
    await expect(page.getByRole('heading', { name: /Ask our AI about/i })).toBeVisible();
    await page.getByRole('button', { name: /bull case and bear/i }).click();
  });

  await test.step("Wait for AI response and click Continue", async () => {
    // The Continue button becomes available once the AI starts responding
    const continueButton = page.getByRole('button', { name: 'Continue' });
    await expect(continueButton).toBeVisible({ timeout: 60000 });
    await continueButton.click();
  });

  await test.step("Verify notifications screen and interact with alert toggles", async () => {
    await expect(page.getByRole('heading', { name: /Get alerted when.*moves/i })).toBeVisible();
    await expect(page.getByText('Daily market update')).toBeVisible();
    // Toggle daily market update
    await page.locator('label').first().click();
  });

  await test.step("Dismiss the notifications blocked modal", async () => {
    await expect(page.getByRole('heading', { name: 'Notifications Blocked' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
  });

  await test.step("Skip alerts setup to proceed to subscription screen", async () => {
    await page.getByRole('button', { name: /Skip.*alerts later/i }).click();
  });

  await test.step("Verify subscription paywall screen appears with key elements", async () => {
    await expect(page.getByRole('heading', { name: /Unlock Bloom Pro/i })).toBeVisible();
    await expect(page.getByText(/What investors are saying/i)).toBeVisible();
  });

  await test.step("Browse subscription features and click Continue", async () => {
    await page.getByRole('button', { name: 'View AI-Curated Stock Picks' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
  });

  await test.step("Verify detailed subscription screen with pricing and click 'Explore free'", async () => {
    await expect(page.getByRole('button', { name: /Start for/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Explore free' })).toBeVisible();
    await page.getByRole('button', { name: 'Explore free' }).click();
  });

  await test.step("Dismiss the one-time offer modal", async () => {
    await expect(page.getByRole('heading', { name: 'One-Time Offer' })).toBeVisible();
    await page.getByRole('button', { name: 'Explore free version' }).click();
  });

  await test.step("Dismiss the 'Tap anywhere to continue' overlay", async () => {
    await expect(page.getByText('Tap anywhere to continue')).toBeVisible();
    await page.getByText('Tap anywhere to continue').click();
  });

  await test.step("Verify landing on the main Chat page with navigation bar", async () => {
    await expect(page.getByRole('heading', { name: 'Chat' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Portfolio' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ideas' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Markets' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Chat' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
    await expect(page.getByText(/free messages left today/i)).toBeVisible();
  });
});
