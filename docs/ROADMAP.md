# Roadmap / Legacy Development Notes

This document preserves the forward-looking planning notes that previously lived in `DEVELOPMENT_GUIDE.md`.

## Current status

For MVP launch readiness, see `MVP_LAUNCH_CHECKLIST.md`.

High-level implemented areas (historical):

- Project setup (Next.js, Prisma, Tailwind)
- Auth (NextAuth, credentials + optional Google)
- Artist onboarding + track submission
- Stripe checkout integration
- Reviewer onboarding + queue + review submission
- Email notifications
- Stripe Connect onboarding + payouts

## Remaining work (high level)

- Quality & tier system improvements
- Polish & launch work (UX hardening, mobile responsiveness, error states)
- Growth features

## Testing strategy (suggested)

- Unit tests (Vitest)
- E2E tests (Playwright)

Existing scripts:

- `npm run test`
- `npm run test:run`

## Monitoring / analytics (suggested)

- Sentry for error tracking (already in dependencies)
- PostHog for product analytics (already in dependencies)

## Notes

If this file grows into operational procedures, consider splitting into:

- `docs/OPERATIONS.md` (monitoring, incident response)
- `docs/TESTING.md` (test setup + patterns)
