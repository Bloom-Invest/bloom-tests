import { test, expect } from '@playwright/test';
import { dismissFeedbackModal } from '../helpers/dismissFeedbackModal';

test('Free onboarding grants access to content', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await dismissFeedbackModal(page);
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByTestId('experience-option-casual').click();
  await page.getByTestId('stock-row-AAPL').click();
  await page.getByRole('button', { name: 'Show me Apple' }).click();
  await expect(page.getByTestId('turn-4-read-card')).toBeVisible({ timeout: 60000 });
  await dismissFeedbackModal(page);
  await page.getByRole('button', { name: 'Makes sense' }).click();
  await page.getByRole('button', { name: 'Not now' }).click();

  await page.getByTestId('onboarding-plan-free').click();
  await page.getByRole('button', { name: 'Continue with Free' }).click();

  await expect(page.getByText('3 free messages today')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Portfolio' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ideas' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Markets' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Chat' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
});
