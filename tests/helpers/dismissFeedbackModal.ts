import { Page } from '@playwright/test';

/**
 * Dismiss feedback/experience modals that overlay the viewport.
 *
 * WHY THIS EXISTS: Bloom shows feedback modals unpredictably on any page. They overlay
 * the entire viewport and block ALL test interactions — clicks, fills, and aiAssert calls.
 * Without dismissal, tests time out waiting for elements hidden behind the modal.
 *
 * WHEN TO CALL: After every page navigation (goto, click link, goBack) and before every
 * aiAssert or critical interaction. The modal can appear at any time, so err on the side
 * of calling too often — each call exits in ~2s if no modal is present.
 *
 * Known variants:
 * 1. "How's your Bloom experience so far?" — has "Love it!" and "Give feedback" buttons
 * 2. "Give feedback directly to the founder" — full feedback form with teal X close button
 * 3. "Bloom experience" heading variant (older UI)
 *
 * IMPORTANT: Uses waitFor() with short timeouts, NOT isVisible(). Playwright's isVisible()
 * silently ignores the timeout option and returns immediately — this is the #1 cause of
 * race conditions in modal dismissal guards.
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
    const heading = page.getByRole('heading', { name: /Bloom experience/i }).first();
    await heading.waitFor({ state: 'visible', timeout: 1000 });
    await page.keyboard.press('Escape');
    await heading.waitFor({ state: 'hidden', timeout: 1500 }).catch(() => {});
  } catch {
    // No modal — nothing to do
  }
}
