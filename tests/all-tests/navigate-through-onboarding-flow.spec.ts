import { test, expect } from '@playwright/test';
import { dismissFeedbackModal } from '../helpers/dismissFeedbackModal';

test.use({ permissions: ['notifications'] });

test('Navigate through onboarding flow', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await dismissFeedbackModal(page);
  await expect(page).toHaveTitle(/Bloom/i);
  await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();

  await page.getByRole('button', { name: 'Get started' }).click();
  await expect(page.getByText(/where are you in your investing journey/i)).toBeVisible();
  await page.getByTestId('experience-option-casual').click();

  await expect(page.getByText('What are you following?')).toBeVisible();
  await page.getByTestId('stock-row-AAPL').click();
  // Match on the CTA verb, not the company name: the API returns an empty name
  // for some symbols (AGENTS.md pitfall 7) and the label falls back to the ticker.
  await page.getByRole('button', { name: /^Show me / }).click();

  await expect(page.getByTestId('turn-4-tool-row-stock')).toContainText('Received stock info', { timeout: 60000 });
  await expect(page.getByTestId('turn-4-read-card')).toBeVisible({ timeout: 60000 });
  await dismissFeedbackModal(page);
  await page.getByRole('button', { name: 'Makes sense' }).click();

  await expect(page.getByText(/Want me to keep watching AAPL/i)).toBeVisible();
  await page.getByRole('button', { name: 'Not now' }).click();

  await dismissFeedbackModal(page);
  await expect(page.getByTestId('onboarding-plan-free')).toBeVisible();
  await page.getByTestId('onboarding-plan-free').click();
  await page.getByRole('button', { name: 'Continue with Free' }).click();

  await dismissFeedbackModal(page);
  // Onboarding hands off to the app: the nav bar is the durable end state.
  // The closing thread copy is not, the app can land on the portfolio view
  // with its own overlay instead.
  await expect(page.getByRole('link', { name: 'Portfolio' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Markets' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Chat' })).toBeVisible();
});
