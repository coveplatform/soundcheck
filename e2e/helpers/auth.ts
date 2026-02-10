/**
 * E2E Test Helpers for Authentication
 */

import { Page, expect } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  name: string;
}

export async function signup(page: Page, user: TestUser) {
  await page.goto('/signup');

  // Wait for form to load
  await page.waitForSelector('#email', { timeout: 10000 });

  // Fill in signup form (only email and password, no name field)
  await page.fill('#email', user.email);
  await page.fill('#password', user.password);

  // Accept terms
  await page.check('#terms');

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for URL to change from /signup (indicates navigation started)
  await page.waitForURL((url) => !url.pathname.includes('/signup'), { timeout: 15000 });

  // Give a moment for the page to start loading
  await page.waitForTimeout(1000);

  // Check current URL to understand where we landed
  const currentUrl = page.url();

  // If we're on login page, signup failed
  if (currentUrl.includes('/login')) {
    throw new Error('Signup redirected to login - authentication may have failed');
  }

  // If we're on onboarding, success - wait for the form to load
  if (currentUrl.includes('/onboarding')) {
    try {
      // Wait for the onboarding form to be ready (step 1: artist name)
      await page.waitForSelector('#artistName, button:has-text("Continue")', { timeout: 15000 });
      return; // Success!
    } catch (error) {
      // Onboarding page loaded but form didn't appear
      const pageText = await page.textContent('body');
      throw new Error(`On onboarding page but form not loading. Page text: ${pageText?.substring(0, 200)}`);
    }
  }

  // We're somewhere else - provide details
  const errorElement = await page.$('[role="alert"], .text-red-600, .text-red-700, .bg-red-50');
  const errorText = errorElement ? await errorElement.textContent() : 'No error message';

  throw new Error(
    `Signup did not reach onboarding page.\n` +
    `Current URL: ${currentUrl}\n` +
    `Error: ${errorText}`
  );
}

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');

  // Wait for form to load
  await page.waitForSelector('#email', { timeout: 10000 });

  // Fill in login form
  await page.fill('#email', email);
  await page.fill('#password', password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation
  await page.waitForLoadState('networkidle');

  // Give session time to establish
  await page.waitForTimeout(500);

  // Verify we're not still on login page (indicating login failed)
  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    const errorElement = await page.$('[role="alert"], .text-red-600, .text-red-700, .bg-red-50');
    const errorText = errorElement ? await errorElement.textContent() : 'Login failed';
    throw new Error(`Login failed: ${errorText}`);
  }
}

export async function logout(page: Page) {
  // Click user menu
  await page.click('[data-testid="user-menu"]');

  // Click logout
  await page.click('button:has-text("Sign out")');

  // Wait for redirect
  await page.waitForLoadState('networkidle');
}

export async function completeArtistProfile(page: Page, data: {
  artistName: string;
  genres?: string[];
}) {
  // Should already be on /onboarding after signup
  // If not, navigate there
  if (!page.url().includes('/onboarding')) {
    await page.goto('/onboarding');
  }

  // Step 1: Artist Name
  await page.waitForSelector('#artistName', { timeout: 10000 });
  await page.fill('#artistName', data.artistName);
  await page.click('button:has-text("Continue")');

  // Step 2: Genre Selection
  await page.waitForTimeout(500);

  // Select genres if provided (select first genre button if no genres specified)
  if (data.genres && data.genres.length > 0) {
    for (const genre of data.genres.slice(0, 5)) {
      // Click genre buttons (they toggle on/off)
      await page.click(`button:has-text("${genre}")`).catch(() => {
        console.log(`Genre "${genre}" not found, skipping`);
      });
    }
  } else {
    // Just select the first available genre
    const firstGenre = await page.$('button[class*="genre"]');
    if (firstGenre) {
      await firstGenre.click();
    }
  }

  await page.click('button:has-text("Continue")');

  // Step 3: Completion
  await page.waitForTimeout(500);
  await page.click('button:has-text("Go to Dashboard")');

  // Wait for redirect to dashboard
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}

export async function completeReviewerProfile(page: Page, data: {
  genres: string[];
}) {
  await page.goto('/reviewer/onboarding');

  // Select genres
  for (const genre of data.genres) {
    await page.click(`[data-testid="genre-${genre}"]`);
  }

  // Submit
  await page.click('button[type="submit"]');

  // Wait for completion
  await page.waitForLoadState('networkidle');
}

/**
 * Creates a test user via API (faster than UI)
 */
export async function createTestUserViaAPI(baseURL: string, user: TestUser) {
  const response = await fetch(`${baseURL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: user.name,
      email: user.email,
      password: user.password,
    }),
  });

  return response.json();
}

/**
 * Verify email via API (bypasses email sending in tests)
 */
export async function verifyEmailViaAPI(baseURL: string, userId: string) {
  const response = await fetch(`${baseURL}/api/test/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });

  return response.json();
}
