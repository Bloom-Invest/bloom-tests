import { test, expect } from '@playwright/test';
import { dismissFeedbackModal } from '../helpers/dismissFeedbackModal';

test('Navigate through onboarding flow', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await dismissFeedbackModal(page);
  await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();

  await page.getByRole('button', { name: 'Get started' }).click();
  await expect(page.getByText(/where are you in your investing journey/i)).toBeVisible();
  await page.getByTestId('experience-option-casual').click();

  await expect(page.getByText('What are you following?')).toBeVisible();
  await page.getByTestId('stock-row-AAPL').click();
  await page.getByRole('button', { name: 'Show me Apple' }).click();

  await expect(page.getByTestId('turn-4-tool-row-stock')).toContainText('Received stock info', { timeout: 60000 });
  await expect(page.getByTestId('turn-4-read-card')).toBeVisible({ timeout: 60000 });
  await dismissFeedbackModal(page);
  await page.getByRole('button', { name: 'Makes sense' }).click();

  await expect(page.getByText(/Want me to keep watching AAPL/i)).toBeVisible();
  await page.getByRole('button', { name: 'Not now' }).click();

  await expect(page.getByTestId('onboarding-plan-free')).toBeVisible();
  await page.getByTestId('onboarding-plan-free').click();
  await page.getByRole('button', { name: 'Continue with Free' }).click();

  await expect(page.getByText(/You're in.*this thread is where we keep talking/i)).toBeVisible();
  await expect(page.getByText('AAPL watched · alerts off · Free plan')).toBeVisible();
});
