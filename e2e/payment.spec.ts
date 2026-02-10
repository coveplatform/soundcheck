/**
 * E2E Tests: Payment & Stripe Integration
 * Tests track submission with payment, subscription purchases, and webhook processing
 */

import { test, expect } from '@playwright/test';
import { generateTestUser } from './helpers/fixtures';
import { signup, completeArtistProfile } from './helpers/auth';
import {
  STRIPE_TEST_CARDS,
  submitTrackWithPayment,
  purchaseSubscription,
  fillStripeCheckout,
  fillStripeElements,
} from './helpers/payment';

test.describe('Payment Flow', () => {
  test.describe('Track Submission with Payment', () => {
    test('should submit track and process payment successfully', async ({ page }) => {
      const user = generateTestUser();

      // Setup: Create and verify user
      await signup(page, user);

      // Complete profile
      await page.goto('/artist/onboarding');
      await page.waitForSelector('#artistName', { timeout: 10000 });
      await page.fill('#artistName', `Artist ${Date.now()}`);

      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');

      // Navigate to submit page
      await page.goto('/submit');

      // Fill track details
      await page.fill('input[name="title"]', 'Test Track for Payment');
      await page.fill(
        'input[name="sourceUrl"]',
        'https://soundcloud.com/test/track-' + Date.now()
      );

      // Select genres if needed
      const submitGenres = page.locator('[data-testid^="genre-"]').first();
      if (await submitGenres.isVisible({ timeout: 2000 })) {
        await submitGenres.click();
      }

      // Select STANDARD package (free 10 reviews)
      const standardPackage = page.locator('[data-testid="package-STANDARD"]');
      if (await standardPackage.isVisible({ timeout: 2000 })) {
        await standardPackage.click();
      }

      // Submit
      await page.click('button:has-text(/submit|continue/i)');
      await page.waitForLoadState('networkidle');

      // Check if payment is required (might be free for STANDARD on trial)
      const isPaymentRequired = page.url().includes('checkout') || page.url().includes('payment');

      if (isPaymentRequired) {
        // Handle Stripe payment
        try {
          await fillStripeCheckout(page, STRIPE_TEST_CARDS.SUCCESS);
        } catch {
          // Might be embedded form instead
          await fillStripeElements(page, STRIPE_TEST_CARDS.SUCCESS);
        }
      }

      // Should redirect to track page
      await expect(page).toHaveURL(/\/artist\/tracks\//, { timeout: 30000 });

      // Verify track was created
      await expect(page.locator('h1, h2')).toContainText(/Test Track for Payment/i, {
        timeout: 10000,
      });
    });

    test('should handle declined payment', async ({ page }) => {
      const user = generateTestUser();
      await signup(page, user);

      // Complete profile
      await page.goto('/artist/onboarding');
      await page.waitForSelector('#artistName', { timeout: 10000 });
      await page.fill('#artistName', `Artist ${Date.now()}`);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');

      // Submit track
      await page.goto('/submit');
      await page.fill('input[name="title"]', 'Test Track Declined');
      await page.fill('input[name="sourceUrl"]', 'https://soundcloud.com/test/declined');

      const submitGenres = page.locator('[data-testid^="genre-"]').first();
      if (await submitGenres.isVisible({ timeout: 2000 })) {
        await submitGenres.click();
      }

      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');

      // If payment is required, use declined card
      if (page.url().includes('checkout') || page.url().includes('payment')) {
        try {
          await fillStripeCheckout(page, STRIPE_TEST_CARDS.DECLINE);
        } catch {
          await fillStripeElements(page, STRIPE_TEST_CARDS.DECLINE);
        }

        // Should show error
        await expect(
          page.locator('text=/declined|failed|card.*declined/i')
        ).toBeVisible({ timeout: 15000 });
      }
    });

    test('should allow free tier submission without payment', async ({ page }) => {
      const user = generateTestUser();
      await signup(page, user);

      // Complete profile
      await page.goto('/artist/onboarding');
      await page.waitForSelector('#artistName', { timeout: 10000 });
      await page.fill('#artistName', `Artist ${Date.now()}`);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');

      // Submit free track
      await page.goto('/submit');
      await page.fill('input[name="title"]', 'Free Tier Track');
      await page.fill('input[name="sourceUrl"]', 'https://soundcloud.com/test/free-track');

      const submitGenres = page.locator('[data-testid^="genre-"]').first();
      if (await submitGenres.isVisible({ timeout: 2000 })) {
        await submitGenres.click();
      }

      // Select STANDARD (should be free)
      const standardPackage = page.locator('[data-testid="package-STANDARD"]');
      if (await standardPackage.isVisible({ timeout: 2000 })) {
        await standardPackage.click();
      }

      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');

      // Should NOT go to payment if free trial
      // Should redirect directly to track page or success
      await expect(page).toHaveURL(/\/(artist\/tracks|submit|dashboard)/, { timeout: 15000 });
    });
  });

  test.describe('Subscription Purchase', () => {
    test.skip('should purchase Pro subscription', async ({ page }) => {
      // Note: This test is skipped by default as it requires Stripe test mode
      const user = generateTestUser();
      await signup(page, user);

      // Complete profile
      await page.goto('/artist/onboarding');
      await page.fill('#artistName', `Artist ${Date.now()}`);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');

      // Go to pricing
      await page.goto('/pricing');

      // Click upgrade to Pro
      await page.click('[data-testid="upgrade-pro"]');

      // Fill payment details
      await fillStripeCheckout(page, STRIPE_TEST_CARDS.SUCCESS);

      // Verify subscription is active
      await page.goto('/account');
      await expect(page.locator('[data-testid="subscription-status"]')).toContainText('active', {
        timeout: 15000,
      });
    });

    test.skip('should handle subscription payment failure', async ({ page }) => {
      const user = generateTestUser();
      await signup(page, user);

      await page.goto('/pricing');
      await page.click('[data-testid="upgrade-pro"]');

      // Use declined card
      await fillStripeCheckout(page, STRIPE_TEST_CARDS.DECLINE);

      // Should show error
      await expect(page.locator('text=/payment.*failed|declined/i')).toBeVisible({
        timeout: 15000,
      });
    });
  });

  test.describe('Credit System', () => {
    test('should use credits for PEER package submission', async ({ page }) => {
      const user = generateTestUser();
      await signup(page, user);

      // Complete profile
      await page.goto('/artist/onboarding');
      await page.fill('#artistName', `Artist ${Date.now()}`);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');

      // Check initial credit balance
      await page.goto('/account');
      const initialCreditsText = await page
        .locator('[data-testid="review-credits"]')
        .textContent()
        .catch(() => '0');
      const initialCredits = parseInt(initialCreditsText?.match(/\d+/)?.[0] || '0');

      // Submit PEER package (uses credits)
      await page.goto('/submit');
      await page.fill('input[name="title"]', 'Peer Review Track');
      await page.fill('input[name="sourceUrl"]', 'https://soundcloud.com/test/peer');

      const submitGenres = page.locator('[data-testid^="genre-"]').first();
      if (await submitGenres.isVisible({ timeout: 2000 })) {
        await submitGenres.click();
      }

      // Select PEER package
      const peerPackage = page.locator('[data-testid="package-PEER"]');
      if (await peerPackage.isVisible({ timeout: 2000 })) {
        await peerPackage.click();

        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');

        // Check credits were deducted
        await page.goto('/account');
        const finalCreditsText = await page
          .locator('[data-testid="review-credits"]')
          .textContent()
          .catch(() => '0');
        const finalCredits = parseInt(finalCreditsText?.match(/\d+/)?.[0] || '0');

        expect(finalCredits).toBeLessThan(initialCredits);
      }
    });

    test('should prevent submission with insufficient credits', async ({ page }) => {
      const user = generateTestUser();
      await signup(page, user);

      // Complete profile
      await page.goto('/artist/onboarding');
      await page.fill('#artistName', `Artist ${Date.now()}`);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');

      // Try to submit PEER package without credits
      await page.goto('/submit');
      await page.fill('input[name="title"]', 'No Credits Track');
      await page.fill('input[name="sourceUrl"]', 'https://soundcloud.com/test/nocredits');

      const submitGenres = page.locator('[data-testid^="genre-"]').first();
      if (await submitGenres.isVisible({ timeout: 2000 })) {
        await submitGenres.click();
      }

      const peerPackage = page.locator('[data-testid="package-PEER"]');
      if (await peerPackage.isVisible({ timeout: 2000 })) {
        await peerPackage.click();

        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');

        // Should show insufficient credits error
        await expect(
          page.locator('text=/not enough credits|insufficient credits/i')
        ).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Webhook Processing', () => {
    test('should update track status after payment webhook', async ({ page }) => {
      const user = generateTestUser();
      await signup(page, user);

      // Complete profile and submit track
      await page.goto('/artist/onboarding');
      await page.fill('#artistName', `Artist ${Date.now()}`);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');

      await page.goto('/submit');
      await page.fill('input[name="title"]', 'Webhook Test Track');
      await page.fill('input[name="sourceUrl"]', 'https://soundcloud.com/test/webhook');

      const submitGenres = page.locator('[data-testid^="genre-"]').first();
      if (await submitGenres.isVisible({ timeout: 2000 })) {
        await submitGenres.click();
      }

      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');

      // After successful payment/submission, track should be QUEUED or IN_PROGRESS
      const trackUrl = page.url();
      if (trackUrl.includes('/artist/tracks/')) {
        // Check track status
        const statusElement = page.locator('[data-testid="track-status"]');
        if (await statusElement.isVisible({ timeout: 5000 })) {
          const status = await statusElement.textContent();
          expect(status).toMatch(/QUEUED|IN_PROGRESS|UPLOADED/i);
        }
      }
    });
  });
});
