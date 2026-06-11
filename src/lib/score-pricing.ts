/**
 * Score-product pricing. Kept free of server-only imports (prisma) so client
 * code — pricing UI, ad-pixel conversion values — can import it too.
 */

const SUB_MONTHLY_CENTS = 1995; // $19.95 / month
const SUB_ANNUAL_CENTS = 14340; // $143.40 / year (= $11.95/mo, ~40% off monthly)

/** One-time price to unlock a single report's full results. */
export const UNLOCK_PRICE_CENTS = 695; // $6.95 one-time

export type SubPlan = "monthly" | "annual";

export function scoreSubPrice(plan: SubPlan): {
  amount: number;
  interval: "month" | "year";
} {
  return plan === "annual"
    ? { amount: SUB_ANNUAL_CENTS, interval: "year" }
    : { amount: SUB_MONTHLY_CENTS, interval: "month" };
}
