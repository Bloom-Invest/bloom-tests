/**
 * Shared configuration helper for test files.
 * Provides the base URL so tests work both via CDP and normal Playwright execution.
 */
export const BASE_URL = process.env.URL || 'https://bloom.onrender.com';
