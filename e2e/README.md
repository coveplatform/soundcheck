# E2E Tests with Playwright

This directory contains end-to-end tests for the application using Playwright.

## Test Structure

```
e2e/
├── auth.spec.ts          # Authentication flow tests
├── payment.spec.ts       # Payment & Stripe integration tests
├── user-journey.spec.ts  # Complete user journey tests
└── helpers/
    ├── auth.ts           # Auth helper functions
    ├── payment.ts        # Payment helper functions
    └── fixtures.ts       # Test fixtures & data generators
```

## Running Tests

### Prerequisites

1. **Install Playwright browsers** (first time only):
   ```bash
   npx playwright install
   ```

2. **Start the dev server** in a separate terminal:
   ```bash
   npm run dev
   ```

3. **Set up test database** (optional, if using separate test DB):
   ```bash
   DATABASE_URL="postgresql://..." npm run db:push
   ```

### Run Commands

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug

# Run specific test file
npx playwright test auth.spec.ts

# Run specific test
npx playwright test -g "should create new user account"

# Run all tests (unit + E2E)
npm run test:all
```

## Test Coverage

### Authentication Flow (`auth.spec.ts`)
✅ User signup with validation
✅ Login with valid/invalid credentials
✅ Email verification requirement
✅ Profile completion (artist & reviewer)
✅ Session management
✅ Password reset flow

### Payment Flow (`payment.spec.ts`)
✅ Track submission with payment
✅ Stripe payment processing
✅ Declined payment handling
✅ Free tier submission
✅ Subscription purchase
✅ Credit system (PEER packages)
✅ Webhook processing

### User Journeys (`user-journey.spec.ts`)
✅ Complete artist flow: signup → profile → submit → track
✅ Complete reviewer flow: signup → profile → review
✅ Track details viewing
✅ Request more reviews
✅ Dashboard navigation
✅ Multi-user scenarios

## Test Data

### Stripe Test Cards

```typescript
// Success
4242 4242 4242 4242

// Declined
4000 0000 0000 0002

// Insufficient funds
4000 0000 0000 9995

// Requires 3DS authentication
4000 0025 0000 3155
```

### Test Users

Test users are automatically generated with unique emails:
```typescript
{
  email: "test-{timestamp}-{random}@example.com",
  password: "TestPassword123!",
  name: "Test User"
}
```

## Configuration

The test configuration is in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000` (configurable via `PLAYWRIGHT_TEST_BASE_URL`)
- **Browser**: Chromium (can enable Firefox, WebKit)
- **Retries**: 2 on CI, 0 locally
- **Parallel**: Yes (1 worker on CI)
- **Screenshots**: On failure
- **Traces**: On retry

## Environment Variables

```bash
# Base URL for tests
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000

# Database (if using separate test DB)
DATABASE_URL=postgresql://...

# Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_TEST_KEY }}
```

## Debugging Tests

### 1. UI Mode (Recommended)
```bash
npm run test:e2e:ui
```
Interactive mode with time travel debugging, watch mode, and screenshots.

### 2. Debug Mode
```bash
npm run test:e2e:debug
```
Opens Playwright Inspector to step through tests.

### 3. VSCode Extension
Install "Playwright Test for VSCode" extension for inline debugging.

### 4. View Reports
```bash
npx playwright show-report
```
View HTML report with screenshots and traces.

## Best Practices

1. **Use `data-testid` attributes** for stable selectors:
   ```tsx
   <button data-testid="submit-track">Submit</button>
   ```

2. **Wait for network idle** after navigation:
   ```typescript
   await page.waitForLoadState('networkidle');
   ```

3. **Handle dynamic content** with proper timeouts:
   ```typescript
   await expect(element).toBeVisible({ timeout: 10000 });
   ```

4. **Use fixtures** for common setup:
   ```typescript
   test('test name', async ({ authenticatedPage }) => {
     // User already logged in
   });
   ```

5. **Clean up test data** if necessary:
   ```typescript
   test.afterEach(async ({ page }) => {
     // Delete test data
   });
   ```

## Known Issues

1. **Stripe Checkout redirects**: Some tests use `.skip()` as they require Stripe test mode configuration
2. **Email verification**: Currently bypassed in tests (requires test email service or API endpoint)
3. **Timing issues**: Some elements may need increased timeouts on slower machines

## Troubleshooting

### Tests timing out
- Increase timeout in `playwright.config.ts`
- Check if dev server is running
- Verify network connectivity

### Element not found
- Check if element has `data-testid`
- Use `page.pause()` to inspect page
- Verify selector syntax

### Payment tests failing
- Ensure Stripe test mode is enabled
- Check API keys in `.env`
- Verify webhook endpoint is accessible

## Contributing

When adding new features:

1. Add corresponding E2E tests
2. Use helper functions for common actions
3. Follow existing test patterns
4. Add `data-testid` attributes to new UI elements
5. Update this README with new test coverage
