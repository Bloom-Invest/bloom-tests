import { Page } from '@stablyai/playwright-test';

/**
 * Dismiss feedback/experience modals that overlay the viewport.
 *
 * Known variants:
 * 1. "How's your Bloom experience so far?" — has "Love it!" and "Give feedback" buttons
 * 2. "Give feedback directly to the founder" — full feedback form with X close button
 * 3. "Bloom experience" heading variant
 *
 * Uses waitFor instead of isVisible (which silently ignores timeout in Playwright).
 */
export async function dismissFeedbackModal(page: Page): Promise<void> {
  // Variant 1: "How's your Bloom experience" with action buttons
  try {
    const experienceModal = page.getByText(/How's your Bloom experience/i).first();
    await experienceModal.waitFor({ state: 'visible', timeout: 2000 });
    // Click "Love it!" to dismiss quickly
    const loveItBtn = page.getByRole('button', { name: /Love it/i });
    try {
      await loveItBtn.waitFor({ state: 'visible', timeout: 1000 });
      await loveItBtn.click();
      await experienceModal.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
      return;
    } catch {
      // "Love it!" not found, try Escape
      await page.keyboard.press('Escape');
      await experienceModal.waitFor({ state: 'hidden', timeout: 1500 }).catch(() => {});
      return;
    }
  } catch {
    // Modal not present
  }

  // Variant 2: "Give feedback directly to the founder" form
  try {
    const feedbackForm = page.getByText(/Give feedback directly/i).first();
    await feedbackForm.waitFor({ state: 'visible', timeout: 1000 });
    await page.keyboard.press('Escape');
    await feedbackForm.waitFor({ state: 'hidden', timeout: 1500 }).catch(() => {});
    return;
  } catch {
    // Modal not present
  }

  // Variant 3: Generic "Bloom experience" heading
  try {
    const heading = page.getByRole('heading', { name: /Bloom experience/i });
    await heading.waitFor({ state: 'visible', timeout: 1000 });
    await page.keyboard.press('Escape');
    await heading.waitFor({ state: 'hidden', timeout: 1500 }).catch(() => {});
  } catch {
    // No modal — nothing to do
  }
}
