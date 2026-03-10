import { defineConfig, devices } from '@stablyai/playwright-test';

export default defineConfig({
  testDir: './tests',
  timeout: 300000,
  expect: { timeout: 60000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['@stablyai/playwright-test'],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://bloom.onrender.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/all-tests/**'],
      stably: {
        notifications: {
          slack: {
            channelName: 'stably-ai',
            notifyOnStart: true,
            notifyOnResult: 'all',
          },
        },
      },
    },
    {
      name: 'all-tests',
      testDir: './tests/all-tests',
      use: { ...devices['Desktop Chrome'] },
      stably: {
        notifications: {
          slack: {
            channelName: '#stably-ai',
            notifyOnResult: 'all',
            notifyOnStart: true,
          },
        },
      },
    },
  ],
});
