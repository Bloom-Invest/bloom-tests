import { test, expect } from '@stablyai/playwright-test';

test.afterAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    await page.goto('/portfolios');
    const portfolioLink = page.getByText('tech stocks').first();
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

test("Assert portfolio features around add, edit, and delete work fine", async ({ page, context }) => {
await test.step("Navigate to the Portfolios page.", async () => {
await page.goto(`/portfolios`);});

await test.step("Create a portfolio", async () => {
await page.getByRole('button', { name: 'Create your first portfolio' }).describe('\'Create your first portfolio\' button').click();});

await test.step("Name it 'tech stocks', and then use the stock search functionality to add 'Apple Inc.' (AAPL) and 'Microsoft' (MSFT) to the portfolio, verifying both are selected in the investments, until the portfolio is created.", async () => {
await page.getByPlaceholder('e.g. tech stocks').describe('Input field with placeholder \'e.g. tech stocks\'').click();
await page.getByPlaceholder('e.g. tech stocks').describe('Input field with placeholder \'e.g. tech stocks\'').fill(`tech stocks`);
await page.getByRole('button', { name: 'Continue' }).describe('Green \'Continue\' button').click();
await page.getByPlaceholder('Search stocks').describe('"Search stocks" input field').click();
await page.getByPlaceholder('Search stocks').describe('Search stocks input field').click();
await page.getByPlaceholder('Search stocks').describe('Search stocks input field').fill(`AAPL`);
await page.getByText('Apple Inc.').describe('Company name \'Apple Inc.\' under AAPL ticker').click();
await page.getByPlaceholder('Search stocks').describe('"Search stocks" input field').click();
await page.getByPlaceholder('Search stocks').describe('"Search stocks" input field with magnifying glass icon').fill(`msft`);
await page.getByText('Microsoft', { exact: true }).describe('"Microsoft" text in the search results list').click();
await expect(page).aiAssert(`Assert AAPL and MSFT are selected in the investments`);
await page.getByRole('button', { name: 'Create Portfolio' }).describe('"Create Portfolio" button').click();});

await test.step("Assert portfolio was created successfully with graphs and stock holdings.", async () => {
await expect(page).aiAssert(`Assert portfolio was created successfully with graphs and stock holdings`);});

await test.step("Open the 'Change columns' modal, configure the displayed columns to 'Symbol' and 'Market Cap', and select the '3M' radio button. After confirming the changes, click on the 'Symbol', 'Market cap', and '3m Change' column headers.", async () => {
await page.getByRole('button', { name: 'Change columns' }).describe('\'Change columns\' button with adjust icon').click();
await page.getByRole('group', { name: 'Left' }).getByRole('combobox').describe('"Name" column combobox').click();
await page.getByRole('group', { name: 'Left' }).getByRole('combobox').describe('Dropdown with current value "Name" for column selection').selectOption(`symbol`);
await page.getByRole('group', { name: 'Middle' }).getByRole('combobox').describe('"52 week high-low" dropdown in the "Change columns" modal').click();
await page.getByRole('group', { name: 'Middle' }).getByRole('combobox').describe('"52 week high-low" selected option in the middle column dropdown').selectOption(`marketCap`);
await page.locator('form').getByText('3M', { exact: true }).describe('Radio button labeled "3M"').click();
await page.getByRole('button', { name: 'Done' }).describe('Done button').click();
await page.getByText('Symbol').describe('"Symbol" column header with sort icon').click();
await page.getByText('Market cap').describe('"Market cap" column header').click();
await page.getByText('3m Change').describe('"3m Change" column header').click();});

await test.step("Scroll down and verify that all stocks display their market capitalization and 3-month change percentage.", async () => {
await page.evaluate(({ deltaX, deltaY }) => {
  window.scrollBy(deltaX, deltaY);
}, { deltaX: 0, deltaY: 400 });
await expect(page).aiAssert(`Assert all stocks have market cap and 3m change percent`);});

await test.step("From the edit mode, add a new 'CPNG' ticker with 10% allocation, save the changes, and then click the YTD radio button.", async () => {
await page.getByRole('button', { name: 'Options' }).describe('\'Options\' button').click();
await page.getByRole('menuitem', { name: 'Edit portfolio' }).describe('\'Edit portfolio\' menu item').click();
await page.getByRole('button').nth(5).describe('close button on the feedback modal').click({"force":true});
await page.getByRole('button', { name: '+ Add Ticker' }).describe('Button with plus icon and "Add Ticker" text').click();
await page.locator('#symbol-2').describe('Third \'Symbol\' input field with placeholder \'AAPL\'').click();
await page.locator('#symbol-2').describe('Third \'Symbol\' input field with \'AAPL\' placeholder').click();
await page.locator('#symbol-2').describe('Third \'Symbol\' input field with placeholder \'AAPL\'').fill(`cpng`);
await page.locator('#allocation-2').describe('"Allocation %" input field with ID \'allocation-2\'').click();
await page.locator('#allocation-2').describe('Allocation % input field for CPNG').click();
await page.locator('#allocation-2').describe('Allocation % input field for CPNG ticker').fill(`10`);
await page.getByRole('button', { name: 'Save Changes' }).describe('Save Changes button').click();
await page.getByText('YTD').describe('YTD time period button').click();});

await test.step("Scroll down to verify that CPNG has been added to the portfolio.", async () => {
await page.evaluate(({ deltaX, deltaY }) => {
  window.scrollBy(deltaX, deltaY);
}, { deltaX: 0, deltaY: 400 });
await expect(page).aiAssert(`Verify CPNG is added to the portfolio`);});

await test.step("Verify Delete and undo", async () => {
await page.getByRole('button', { name: 'Options' }).describe('Options button').click();
await page.getByRole('menuitem', { name: 'Delete portfolio' }).describe('Delete portfolio menu item').click();
await page.getByRole('button', { name: 'Undo' }).describe('\'Undo\' button').click();});

await test.step("Click 'Options', then 'Delete portfolio'. Verify 'No portfolios yet' message is visible.", async () => {
await page.getByRole('button', { name: 'Options' }).describe('Options button').click();
await page.getByRole('menuitem', { name: 'Delete portfolio' }).describe('\'Delete portfolio\' menu item').click();
await expect(page).aiAssert(`Assert there are no portfolios and we are on empty state.`);});
});
