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
  await page.getByRole('button', { name: 'Makes sense' }).click();
  await page.getByRole('button', { name: 'Not now' }).click();

  await dismissFeedbackModal(page);
  await page.getByTestId('onboarding-plan-free').click();
  await page.getByRole('button', { name: 'Continue with Free' }).click();

  await dismissFeedbackModal(page);
  await page.getByRole('region', { name: 'Turn 7' }).getByRole('button', { name: 'Not now' }).click();
  await expect(page.getByRole('link', { name: 'Portfolio' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ideas' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Markets' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Chat' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
});
