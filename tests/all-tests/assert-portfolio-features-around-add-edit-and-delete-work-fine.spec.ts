import { test, expect } from '@stablyai/playwright-test';

test.afterAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    await page.goto('/portfolios');
    await page.waitForLoadState('networkidle');
    const portfolioLink = page.getByText('Magnificent 7').first();
    if (await portfolioLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await portfolioLink.click();
      await page.getByRole('button', { name: 'Options' }).click();
      await page.getByRole('menuitem', { name: 'Delete portfolio' }).click();
    }
  } catch {
    // Portfolio doesn't exist or already cleaned up — nothing to do
  } finally {
    await page.close();
  }
});

test("Assert portfolio features around add, edit, and delete work fine", async ({ page }) => {
await test.step("Create a portfolio from the Magnificent 7 collection.", async () => {
await page.goto('/collection/90');
await page.waitForLoadState('networkidle');
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
