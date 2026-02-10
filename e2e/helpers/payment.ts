/**
 * E2E Test Helpers for Payment & Stripe Integration
 */

import { Page, expect } from '@playwright/test';

/**
 * Stripe test card numbers
 * @see https://stripe.com/docs/testing
 */
export const STRIPE_TEST_CARDS = {
  SUCCESS: '4242424242424242',
  DECLINE: '4000000000000002',
  INSUFFICIENT_FUNDS: '4000000000009995',
  REQUIRES_3DS: '4000002500003155',
} as const;

export interface TrackSubmissionData {
  title: string;
  sourceUrl: string;
  genreIds: string[];
  packageType: 'STARTER' | 'STANDARD' | 'PRO' | 'DEEP_DIVE';
  feedbackFocus?: string;
}

export async function submitTrackWithPayment(
  page: Page,
  trackData: TrackSubmissionData,
  cardNumber: string = STRIPE_TEST_CARDS.SUCCESS
) {
  // Navigate to submit page
  await page.goto('/submit');

  // Fill track details
  await page.fill('input[name="title"]', trackData.title);
  await page.fill('input[name="sourceUrl"]', trackData.sourceUrl);

  // Select genres
  for (const genreId of trackData.genreIds) {
    await page.click(`[data-testid="genre-${genreId}"]`);
  }

  // Select package type
  await page.click(`[data-testid="package-${trackData.packageType}"]`);

  if (trackData.feedbackFocus) {
    await page.fill('textarea[name="feedbackFocus"]', trackData.feedbackFocus);
  }

  // Submit to payment
  await page.click('button:has-text("Continue to Payment")');

  // Wait for Stripe checkout or payment form
  await page.waitForLoadState('networkidle');

  // Check if we're on Stripe checkout or embedded payment form
  const isStripeCheckout = page.url().includes('checkout.stripe.com');

  if (isStripeCheckout) {
    // Handle Stripe Checkout
    await fillStripeCheckout(page, cardNumber);
  } else {
    // Handle embedded Stripe Elements
    await fillStripeElements(page, cardNumber);
  }
}

export async function fillStripeCheckout(
  page: Page,
  cardNumber: string = STRIPE_TEST_CARDS.SUCCESS
) {
  // Wait for Stripe Checkout to load
  await page.waitForSelector('iframe[name*="stripe"]', { timeout: 10000 });

  // Switch to Stripe iframe
  const stripeFrame = page.frameLocator('iframe[name*="stripe"]').first();

  // Fill card details
  await stripeFrame.locator('input[name="cardnumber"]').fill(cardNumber);
  await stripeFrame.locator('input[name="exp-date"]').fill('12/34');
  await stripeFrame.locator('input[name="cvc"]').fill('123');
  await stripeFrame.locator('input[name="postal"]').fill('12345');

  // Submit payment
  await stripeFrame.locator('button[type="submit"]').click();

  // Wait for redirect back to app
  await page.waitForURL('**/artist/tracks/**', { timeout: 30000 });
}

export async function fillStripeElements(
  page: Page,
  cardNumber: string = STRIPE_TEST_CARDS.SUCCESS
) {
  // Wait for Stripe Elements to load
  await page.waitForSelector('iframe[title*="Secure card"]', { timeout: 10000 });

  // Fill card number
  const cardFrame = page.frameLocator('iframe[title*="Secure card number"]').first();
  await cardFrame.locator('input[name="cardnumber"]').fill(cardNumber);

  // Fill expiry
  const expiryFrame = page.frameLocator('iframe[title*="Secure expiration"]').first();
  await expiryFrame.locator('input[name="exp-date"]').fill('12/34');

  // Fill CVC
  const cvcFrame = page.frameLocator('iframe[title*="Secure CVC"]').first();
  await cvcFrame.locator('input[name="cvc"]').fill('123');

  // Fill postal code if present
  try {
    const postalFrame = page.frameLocator('iframe[title*="Secure postal"]').first();
    await postalFrame.locator('input[name="postal"]').fill('12345');
  } catch {
    // Postal code might not be required
  }

  // Submit payment
  await page.click('button[type="submit"]:has-text("Pay")');

  // Wait for success
  await page.waitForURL('**/artist/tracks/**', { timeout: 30000 });
}

export async function purchaseSubscription(
  page: Page,
  tier: 'pro' | 'enterprise',
  cardNumber: string = STRIPE_TEST_CARDS.SUCCESS
) {
  // Navigate to pricing
  await page.goto('/pricing');

  // Click upgrade button for tier
  await page.click(`[data-testid="upgrade-${tier}"]`);

  // Wait for Stripe checkout
  await page.waitForLoadState('networkidle');

  // Fill payment details
  await fillStripeCheckout(page, cardNumber);

  // Verify subscription is active
  await page.goto('/account');
  await expect(page.locator('[data-testid="subscription-status"]')).toContainText('active');
}

export async function requestMoreReviews(
  page: Page,
  trackId: string,
  reviewCount: number
) {
  await page.goto(`/artist/tracks/${trackId}/request-reviews`);

  // Set review count
  await page.fill('input[name="reviewsRequested"]', reviewCount.toString());

  // Submit (might trigger payment if needed)
  await page.click('button[type="submit"]');

  // Wait for completion
  await page.waitForLoadState('networkidle');
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(page: Page) {
  await page.goto('/account');

  // Click cancel button
  await page.click('[data-testid="cancel-subscription"]');

  // Confirm cancellation
  await page.click('button:has-text("Confirm")');

  // Wait for success
  await expect(page.locator('[data-testid="subscription-status"]')).toContainText('canceled');
}

/**
 * Verify webhook was processed (check database or UI state)
 */
export async function verifyPaymentWebhook(page: Page, trackId: string) {
  await page.goto(`/artist/tracks/${trackId}`);

  // Check that track status changed after payment
  await expect(page.locator('[data-testid="track-status"]')).toContainText('QUEUED');
}
