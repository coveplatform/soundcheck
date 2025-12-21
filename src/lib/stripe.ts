import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
});

let platformDefaultsPromise: Promise<{ country: string; currency: string }> | null = null;

export async function getStripePlatformDefaults(): Promise<{
  country: string;
  currency: string;
}> {
  if (platformDefaultsPromise) return platformDefaultsPromise;

  platformDefaultsPromise = (async () => {
    const account = await stripe.accounts.retrieve();
    if ("deleted" in account && account.deleted) {
      return { country: "US", currency: "usd" };
    }

    return {
      country: (account.country ?? "US").toUpperCase(),
      currency: (account.default_currency ?? "usd").toLowerCase(),
    };
  })();

  return platformDefaultsPromise;
}

export function getStripePublishableKey(): string {
  const publicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const key =
    publicKey && !publicKey.includes("your_stripe_publishable_key")
      ? publicKey
      : process.env.STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error("Stripe publishable key is not defined");
  }
  return key;
}
