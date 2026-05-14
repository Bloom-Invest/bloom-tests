import { test, expect } from '@stablyai/playwright-test';
import { dismissFeedbackModal } from '../helpers/dismissFeedbackModal';

/**
 * BLOOM PITFALLS (portfolio features):
 *
 * 1. FEEDBACK MODAL: The "How's your Bloom experience so far?" modal can appear on ANY page
 *    at ANY time, overlaying the entire viewport and blocking all clicks. Call
 *    dismissFeedbackModal() after every navigation and before every interaction step.
 *    It has appeared mid-portfolio-creation, mid-edit, and on the collection page.
 *
 * 2. "COPY COLLECTION TO PORTFOLIO" BUTTON: On the collection detail page, this button is
 *    often below the fold (below the stock list). Use scrollIntoViewIfNeeded() before clicking.
 *
 * 3. CLEANUP (afterAll): The afterAll hook deletes the "Magnificent 7" portfolio to prevent
 *    state leaking between runs. Uses waitFor (not isVisible, which silently ignores timeout
 *    in Playwright). If the portfolio doesn't exist, the catch block handles it gracefully.
 *
 * 4. isVisible({ timeout }) ANTI-PATTERN: Playwright's locator.isVisible() returns immediately
 *    regardless of timeout option. Always use waitFor({ state: 'visible', timeout }) in a
 *    try/catch instead. This is the #1 cause of race conditions in modal checks.
 */
test.afterAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    await page.goto('/portfolios', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    const portfolioLink = page.getByText('Magnificent 7').first();
    try {
      await portfolioLink.waitFor({ state: 'visible', timeout: 5000 });
      await portfolioLink.click();
      await page.getByRole('button', { name: 'Options' }).click();
      await page.getByRole('menuitem', { name: 'Delete portfolio' }).click();
    } catch {
      // Portfolio doesn't exist — nothing to clean up
    }
  } catch {
    // Portfolio doesn't exist or already cleaned up — nothing to do
  } finally {
    await page.close();
  }
});

test("Assert portfolio features around add, edit, and delete work fine", async ({ page }) => {
await test.step("Create a portfolio from the Magnificent 7 collection.", async () => {
await page.goto('/search', { waitUntil: 'domcontentloaded' });
await page.waitForLoadState('domcontentloaded');
await dismissFeedbackModal(page);
await page.getByRole('link', { name: /Magnificent 7/ }).describe('Magnificent 7 collection card').click();
await page.waitForLoadState('domcontentloaded');
await dismissFeedbackModal(page);
// Scroll down to find the "Copy collection to portfolio" button (may be below fold)
const copyBtn = page.getByRole('button', { name: 'Copy collection to portfolio' });
await copyBtn.scrollIntoViewIfNeeded();
await copyBtn.click();
await dismissFeedbackModal(page);
await page.getByRole('button', { name: 'Create Portfolio' }).describe('Create portfolio from collection button').click();
});

await test.step("Assert portfolio was created successfully with graphs and stock holdings.", async () => {
await dismissFeedbackModal(page);
await expect(page.getByRole('heading', { name: 'Magnificent 7' })).toBeVisible();
await expect(page.getByRole('heading', { name: 'Holdings' })).toBeVisible();
await expect(page.getByRole('link', { name: /AAPL/ })).toBeVisible();
await expect(page.getByRole('link', { name: /MSFT/ })).toBeVisible();
});

await test.step("Open the 'Change columns' modal, configure columns, and verify sortable headers.", async () => {
await page.getByRole('button', { name: 'Change columns' }).describe('Change columns button').click();
await page.getByRole('group', { name: 'Left' }).getByRole('combobox').selectOption('symbol');
await page.getByRole('group', { name: 'Middle' }).getByRole('combobox').selectOption('marketCap');
await page.locator('form').getByText('3M', { exact: true }).click();
await page.getByRole('button', { name: 'Done' }).click();
await expect(page.getByText('Symbol')).toBeVisible();
await expect(page.getByText('Market cap')).toBeVisible();
await expect(page.getByText('3m Change')).toBeVisible();
});

await test.step("Edit portfolio allocation and save changes.", async () => {
await dismissFeedbackModal(page);
await page.getByRole('button', { name: 'Options' }).click();
await page.getByRole('menuitem', { name: 'Edit portfolio' }).click();
await dismissFeedbackModal(page);
await page.locator('#allocation-0').fill('20');
await page.getByRole('button', { name: 'Save Changes' }).click();
await expect(page.getByRole('heading', { name: 'Magnificent 7' })).toBeVisible();
await page.getByText('YTD').click();
});

await test.step("Verify Delete and undo", async () => {
await page.getByRole('button', { name: 'Options' }).click();
await page.getByRole('menuitem', { name: 'Delete portfolio' }).click();
await page.getByRole('button', { name: 'Undo' }).click();
await expect(page.getByRole('heading', { name: 'Magnificent 7' })).toBeVisible();
});

await test.step("Click 'Options', then 'Delete portfolio'. Verify empty portfolio state.", async () => {
await page.getByRole('button', { name: 'Options' }).click();
await page.getByRole('menuitem', { name: 'Delete portfolio' }).click();
await expect(page).aiAssert('Assert there are no portfolios and we are on empty state.', { timeout: 60000 });
});
});
