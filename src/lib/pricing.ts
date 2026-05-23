// Single source of truth for pricing displayed to users.
// Keep these in sync with:
//   - src/app/api/subscriptions/checkout/route.ts (PRO_MONTHLY_AMOUNT_CENTS)
//   - src/app/api/credits/checkout/route.ts (CREDIT_PACK_AMOUNT_CENTS, CREDIT_PACK_CREDITS)
//   - src/app/api/webhooks/stripe/route.ts (PRO_MONTHLY_CREDITS)

export const PRO_MONTHLY_PRICE_CENTS = 2495;
export const PRO_MONTHLY_PRICE_DISPLAY = "$24.95";
export const PRO_MONTHLY_CREDITS = 30;
export const PRO_ACTIVE_SLOTS = 3;
export const PRO_MAX_REVIEWS_PER_TRACK = 10;

export const CREDIT_PACK_PRICE_CENTS = 995;
export const CREDIT_PACK_PRICE_DISPLAY = "$9.95";
export const CREDIT_PACK_CREDITS = 10;

export const FREE_ACTIVE_SLOTS = 1;
