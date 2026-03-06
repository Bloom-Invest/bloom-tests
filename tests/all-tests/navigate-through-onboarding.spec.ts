import { test, expect } from '@stablyai/playwright-test';

test("Navigate through onboarding", async ({ page, context, agent }) => {
await test.step("Go to https://bloom.onrender.com", async () => {
await page.goto(`/`);});

await test.step("Advance through the initial screens by clicking 'Setup your watchlist' and 'Continue' buttons.", async () => {
await page.getByRole('button', { name: 'Setup your watchlist' }).describe('\'Setup your watchlist\' button').click();
await page.getByRole('button', { name: 'Continue' }).describe('\'Continue\' button').click();});

await test.step("Search for and select 'CPNG Coupang Inc - Class A', then select 'Apple' as investments.", async () => {
await page.getByPlaceholder('Search stocks').describe('Search stocks input field').click();
await page.getByPlaceholder('Search stocks').describe('"Search stocks" input field').fill(`cpng`);
await page.getByRole('button', { name: 'CPNG logo container CPNG' }).describe('CPNG Coupang Inc - Class A search result item').click();
await page.getByRole('button', { name: 'AAPL logo Apple' }).describe('Apple logo and text "Apple" selectable item').click();
await page.getByRole('button', { name: 'Add to watchlist' }).describe('\'Add to watchlist\' button').click();});

await test.step("Allow content to load, then click on one of the suggested AI questions, then scroll down to view and assert that the chatbot answered the question, and then click the 'Continue' button.", async () => {
await agent.act(`Click on one of the suggested questions`, { page: page });
await expect(page).aiAssert(`Assert that the chatbot answered the question`, { timeout: 30000 });
await page.getByRole('button', { name: 'Continue' }).describe('\'Continue\' button').click();});

await test.step("First, click the toggle switch for Daily market update, then click 'Cancel'.", async () => {
await page.locator('span').nth(1).describe('toggle switch for Daily market update').click();
await page.getByRole('button', { name: 'Cancel' }).describe('\'Cancel\' button').click();
await expect(page).aiAssert(`The user is on onboarding and can configure multiple notification types on or off.`);
await page.getByRole('button', { name: 'Finish setup' }).describe('\'Finish setup\' button').click();});

await test.step("Click 'Continue', toggle the 'Notify me before trial ends' switch, click 'Cancel', click the 'Restore purchase' button, click 'Start for $0.00', and then click the 'Ask AI about my stocks' button.", async () => {
await page.getByRole('button', { name: 'Continue' }).describe('\'Continue\' button').click();
await page.locator('.css-j85ne4 > .css-s9em5d > span').describe('\'Notify me before trial ends\' toggle switch').click();
await page.getByRole('button', { name: 'Cancel' }).describe('\'Cancel\' button').click();
await page.getByRole('button', { name: 'Restore purchase' }).describe('\'Restore purchase\' button').click();
await page.getByRole('button', { name: 'Start for $' }).describe('"Start for $0.00" button').click();
await page.getByRole('button', { name: 'Ask AI about my stocks' }).describe('\'Ask AI about my stocks\' button').click();});

await test.step("Dismiss the 'Tap anywhere to continue' prompt.", async () => {
await page.getByText('Tap anywhere to continue').describe('Text "Tap anywhere to continue"').click();});

await test.step("From the chat tab, click the Portfolios link with the briefcase icon, then verify that AAPL and CPNG are present on the watchlist.", async () => {
await expect(page).aiAssert(`Assert the user is on the chat tab`);
await page.getByRole('link', { name: 'Portfolio' }).describe('Portfolios link with briefcase icon').click({"timeout":9000});
await expect(page).aiAssert(`Assert AAPL and CPNG are on the watchlist`);});
});
