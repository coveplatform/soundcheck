/**
 * Playwright Test Fixtures
 * Shared setup and teardown logic for E2E tests
 */

import { test as base } from '@playwright/test';
import { TestUser } from './auth';

// Generate unique test data
export function generateTestEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

export function generateTestUser(overrides?: Partial<TestUser>): TestUser {
  return {
    email: generateTestEmail(),
    password: 'TestPassword123!',
    name: 'Test User',
    ...overrides,
  };
}

// Extended test fixture with authenticated user
type TestFixtures = {
  authenticatedPage: { page: any; user: TestUser };
};

export const test = base.extend<TestFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Setup: Create and login user
    const user = generateTestUser();

    // Create user via UI
    await page.goto('/signup');
    await page.waitForSelector('#email', { timeout: 10000 });
    await page.fill('#email', user.email);
    await page.fill('#password', user.password);
    await page.check('#terms');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Use the authenticated page
    await use({ page, user });

    // Teardown: Cleanup user (optional)
    // You might want to delete test users after each test
  },
});

export { expect } from '@playwright/test';
