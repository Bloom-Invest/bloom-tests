import { test, expect } from '@stablyai/playwright-test';

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
// Navigate to Magnificent 7 collection via search to avoid hardcoded ID
await page.goto('/search', { waitUntil: 'domcontentloaded' });
await page.waitForLoadState('domcontentloaded');
await page.getByRole('link', { name: /Magnificent 7/ }).describe('Magnificent 7 collection card').click();
await page.waitForLoadState('domcontentloaded');
await page.getByRole('button', { name: 'Copy collection to portfolio' }).describe('Copy collection to portfolio button').click();
await page.getByRole('button', { name: 'Create Portfolio' }).describe('Create portfolio from collection button').click();
});

await test.step("Assert portfolio was created successfully with graphs and stock holdings.", async () => {
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
try {
  await page.getByRole('heading', { name: /Bloom experience/i }).waitFor({ state: 'visible', timeout: 3000 });
  await page.keyboard.press('Escape');
} catch {
  // Feedback modal not present — nothing to do
}
await page.getByRole('button', { name: 'Options' }).click();
await page.getByRole('menuitem', { name: 'Edit portfolio' }).click();
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
