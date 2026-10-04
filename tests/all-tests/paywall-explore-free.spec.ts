import { test, expect } from '@playwright/test';
import { dismissFeedbackModal } from '../helpers/dismissFeedbackModal';

test.use({ permissions: ['notifications'] });

test('Free onboarding grants access to content', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await dismissFeedbackModal(page);
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByTestId('experience-option-casual').click();
  await page.getByTestId('stock-row-AAPL').click();
  await page.getByRole('button', { name: /^Show me / }).click();
  await expect(page.getByTestId('turn-4-read-card')).toContainText('AAPL', { timeout: 60000 });
  await dismissFeedbackModal(page);
  await page.getByRole('button', { name: 'Show me a story' }).click();
  await page.getByRole('button', { name: 'Next: alerts' }).click();
  await page.getByRole('button', { name: 'Not now' }).click();

  await dismissFeedbackModal(page);
  await page.getByRole('button', { name: 'Continue with Free' }).click();
  await page.getByTestId('paywall-exit-survey').getByRole('button', { name: 'Skip and explore' }).click();

  await dismissFeedbackModal(page);
  const nav = page.getByRole('navigation', { name: 'Primary' });
  for (const name of ['Discover', 'Ask', 'Following', 'Portfolio']) {
    await expect(nav.getByRole('link', { name, exact: true })).toBeVisible();
  }
});
