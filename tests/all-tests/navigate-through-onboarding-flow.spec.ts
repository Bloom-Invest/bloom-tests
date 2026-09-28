import { test, expect } from '@playwright/test';
import { dismissFeedbackModal } from '../helpers/dismissFeedbackModal';

test.use({ permissions: ['notifications'] });

test('Navigate through onboarding flow', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await dismissFeedbackModal(page);
  await expect(page).toHaveTitle(/Bloom/i);
  await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();

  await page.getByRole('button', { name: 'Get started' }).click();
  await expect(page.getByTestId('onboarding-experience-intro')).toBeVisible();
  await page.getByTestId('experience-option-casual').click();

  await expect(page.getByTestId('onboarding-picks-intro')).toBeVisible();
  await page.getByTestId('stock-row-AAPL').click();
  // Match on the CTA verb, not the company name: the API returns an empty name
  // for some symbols (AGENTS.md pitfall 7) and the label falls back to the ticker.
  await page.getByRole('button', { name: /^Show me / }).click();

  await expect(page.getByRole('button', { name: /Researched \d+ sources/ })).toBeVisible({ timeout: 60000 });
  await expect(page.getByTestId('turn-4-read-card')).toBeVisible({ timeout: 60000 });
  await dismissFeedbackModal(page);
  await page.getByRole('button', { name: 'Continue setup' }).click();

  await expect(page.getByRole('region', { name: 'Turn 5' })).toContainText('AAPL');
  await page.getByRole('button', { name: 'Not now' }).click();

  await dismissFeedbackModal(page);
  await page.getByRole('button', { name: 'Continue with Free' }).click();

  await dismissFeedbackModal(page);
  // Free onboarding completes directly into the app.
  await expect(page.getByRole('link', { name: 'Portfolio' })).toBeVisible();
  await expect(page.getByRole('link', { name: /^(Search|Ideas)$/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Chat' })).toBeVisible();
});
