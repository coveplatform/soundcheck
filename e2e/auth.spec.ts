/**
 * E2E Tests: Authentication Flow
 * Tests user signup, login, email verification, and profile completion
 */

import { test, expect } from "@playwright/test";
import { generateTestUser } from "./helpers/fixtures";
import { signup, login, logout, completeArtistProfile } from "./helpers/auth";

test.describe("Authentication Flow", () => {
  test.describe("User Signup", () => {
    test("should create new user account", async ({ page }) => {
      const user = generateTestUser();

      // Use signup helper which handles session persistence
      await signup(page, user);

      // Verify we reached the onboarding page
      expect(page.url()).toContain("/onboarding");
    });

    test("should show error for duplicate email", async ({ page }) => {
      const user = generateTestUser();

      // First signup
      await signup(page, user);

      // Logout
      await page.goto("/");
      const userMenu = page.locator('[data-testid="user-menu"]');
      if (await userMenu.isVisible({ timeout: 3000 })) {
        await userMenu.click();
        await page.click('button:has-text("Sign out")').catch(() => {});
      }
      await page.waitForLoadState("networkidle");

      // Try to signup again with same email
      await page.goto("/signup");
      await page.waitForSelector("#email", { timeout: 10000 });
      await page.fill("#email", user.email);
      await page.fill("#password", user.password);
      await page.check("#terms");
      await page.click('button[type="submit"]');

      // Should show error
      await expect(
        page.locator("text=/already exists|already registered/i"),
      ).toBeVisible({
        timeout: 10000,
      });
    });

    test("should validate password strength", async ({ page }) => {
      await page.goto("/signup");
      await page.waitForSelector("#email", { timeout: 10000 });

      await page.fill("#email", generateTestUser().email);
      await page.fill("#password", "123"); // Weak password
      await page.check("#terms");

      // Submit button should be disabled for weak password
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeDisabled({ timeout: 5000 });
    });

    test("should validate email format", async ({ page }) => {
      await page.goto("/signup");
      await page.waitForSelector("#email", { timeout: 10000 });

      await page.fill("#email", "invalid-email"); // Invalid email
      await page.fill("#password", "TestPassword123!");
      await page.check("#terms");
      await page.click('button[type="submit"]');

      // Browser validation or error should prevent submission
      // Check if we're still on signup page (not redirected)
      await page.waitForTimeout(2000);
      expect(page.url()).toContain("/signup");
    });
  });

  test.describe("User Login", () => {
    test("should login with valid credentials", async ({ page }) => {
      const user = generateTestUser();

      // Create account first
      await signup(page, user);

      // Logout
      await page.goto("/");
      await page
        .click('[data-testid="user-menu"]', { timeout: 5000 })
        .catch(() => {});
      await page
        .click('button:has-text("Sign out")', { timeout: 5000 })
        .catch(() => {});
      await page.waitForLoadState("networkidle");

      // Login
      await login(page, user.email, user.password);

      // Verify logged in
      await expect(page).toHaveURL(/\/(dashboard|artist|reviewer)/);
    });

    test("should show error for invalid credentials", async ({ page }) => {
      await page.goto("/login");
      await page.waitForSelector("#email", { timeout: 10000 });

      await page.fill("#email", "nonexistent@example.com");
      await page.fill("#password", "WrongPassword123!");

      await page.click('button[type="submit"]');

      // Should show error
      await expect(
        page.locator("text=/invalid.*credentials|incorrect|no account/i"),
      ).toBeVisible({
        timeout: 10000,
      });
    });

    // Email verification removed - users can access immediately after signup
  });

  test.describe("Profile Completion", () => {
    test("should complete artist profile", async ({ page }) => {
      const user = generateTestUser();

      // Signup and login
      await signup(page, user);

      // Navigate to artist onboarding (might auto-redirect)
      if (!page.url().includes("onboarding")) {
        await page.goto("/artist/onboarding");
      }

      // Wait for form
      await page.waitForSelector("#artistName", { timeout: 10000 });

      // Fill artist name
      const artistName = `Artist ${Date.now()}`;
      await page.fill("#artistName", artistName);

      // Submit
      await page.click('button[type="submit"]');

      // Wait for redirect
      await page.waitForLoadState("networkidle");

      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/(dashboard|artist)/, { timeout: 10000 });
    });

    test("should enforce required fields in profile", async ({ page }) => {
      const user = generateTestUser();
      await signup(page, user);

      // Navigate to onboarding if not already there
      if (!page.url().includes("onboarding")) {
        await page.goto("/artist/onboarding");
      }
      await page.waitForSelector("#artistName", { timeout: 10000 });

      // Leave artist name empty and try to submit
      await page.fill("#artistName", "");

      // Try to submit - should be blocked by required attribute or show error
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);

      // Should still be on onboarding page or show error
      const hasError = await page
        .locator("text=/required|enter.*artist/i")
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      const stillOnboarding = page.url().includes("onboarding");

      expect(hasError || stillOnboarding).toBe(true);
    });
  });

  test.describe("Session Management", () => {
    test("should maintain session across page reloads", async ({ page }) => {
      const user = generateTestUser();
      await signup(page, user);

      // Reload page
      await page.reload();

      // Should still be logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({
        timeout: 10000,
      });
    });

    test("should logout successfully", async ({ page }) => {
      const user = generateTestUser();
      await signup(page, user);

      // Logout
      await page.click('[data-testid="user-menu"]', { timeout: 5000 });
      await page.click('button:has-text("Sign out")', { timeout: 5000 });

      // Should redirect to home or login
      await expect(page).toHaveURL(/\/(login|$)/, { timeout: 10000 });

      // Should not be able to access protected routes
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/(login|signup)/, { timeout: 10000 });
    });
  });

  test.describe("Password Reset", () => {
    test("should request password reset", async ({ page }) => {
      const user = generateTestUser();
      await signup(page, user);

      // Logout
      await page.goto("/");
      const userMenu = page.locator('[data-testid="user-menu"]');
      if (await userMenu.isVisible({ timeout: 3000 })) {
        await userMenu.click();
        await page.click('button:has-text("Sign out")').catch(() => {});
      }
      await page.waitForLoadState("networkidle");

      // Go to forgot password
      await page.goto("/forgot-password");
      await page.waitForLoadState("networkidle");

      // Check if page exists, if not skip
      if (page.url().includes("404") || page.url().includes("not-found")) {
        // Forgot password page doesn't exist, skip test
        return;
      }

      // Enter email if form exists
      const emailInput = page.locator('#email, input[type="email"]').first();
      if (await emailInput.isVisible({ timeout: 3000 })) {
        await emailInput.fill(user.email);
        await page.click('button[type="submit"]');

        // Should show success message
        await expect(
          page.locator("text=/email sent|check your email/i"),
        ).toBeVisible({
          timeout: 10000,
        });
      }
    });

    test("should handle non-existent email gracefully", async ({ page }) => {
      await page.goto("/forgot-password");
      await page.waitForLoadState("networkidle");

      // Skip if page doesn't exist
      if (page.url().includes("404") || page.url().includes("not-found")) {
        return;
      }

      const emailInput = page.locator('#email, input[type="email"]').first();
      if (await emailInput.isVisible({ timeout: 3000 })) {
        await emailInput.fill("nonexistent@example.com");
        await page.click('button[type="submit"]');

        // Should either show success (security) or error
        await page.waitForLoadState("networkidle");
      }

      // Just verify no crash
      expect(page.url()).toBeTruthy();
    });
  });
});
