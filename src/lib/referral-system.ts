// Referral system for user sign-ups with credit rewards
import { getStripe } from "./stripe";
import { prisma } from "./prisma";
import Stripe from "stripe";

export const REFERRAL_DISCOUNT_AMOUNT = 500; // $5.00 in cents — kept for backwards compat with existing Stripe coupons
export const REFERRAL_CREDITS = 10; // Bonus credits granted to referee on signup
export const REFERRER_REWARD_CREDITS = 3; // Credits granted to referrer when their referral completes onboarding
export const REFERRAL_COOKIE_NAME = "mr_signup_ref";
export const REFERRAL_COOKIE_EXPIRY_DAYS = 30;

/**
 * Generate a unique referral code for a user
 * Format: FirstName + 4 random chars (e.g., STEVE2K4P)
 */
export async function generateReferralCode(name: string, userId: string): Promise<string> {
  const cleanName = (name || "USER")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 6);

  let attempts = 0;
  while (attempts < 10) {
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `${cleanName}${randomSuffix}`;

    // Check if code is unique
    const exists = await prisma.user.findUnique({
      where: { referralCode: code },
    });

    if (!exists) {
      return code;
    }

    attempts++;
  }

  // Fallback: use part of userId if all attempts fail
  return `${cleanName}${userId.slice(0, 4).toUpperCase()}`;
}

/**
 * Create a $5 off Stripe coupon for a user
 */
export async function createReferralCoupon(userId: string, userName: string): Promise<string> {
  const stripe = getStripe();

  const coupon = await stripe.coupons.create({
    amount_off: REFERRAL_DISCOUNT_AMOUNT,
    currency: "usd",
    duration: "once",
    name: `$5 Referral Reward - ${userName}`,
    metadata: {
      userId,
      type: "referral_reward",
      createdAt: new Date().toISOString(),
    },
  });

  return coupon.id;
}

/**
 * Apply a coupon to a checkout session
 */
export async function applyCouponToCheckout(
  sessionParams: Stripe.Checkout.SessionCreateParams,
  couponId: string
): Promise<Stripe.Checkout.SessionCreateParams> {
  return {
    ...sessionParams,
    discounts: [{ coupon: couponId }],
  };
}

/**
 * Reward a referrer when their referee completes onboarding — grants credits directly
 */
export async function rewardReferrer(referredByCode: string, refereeUserId: string): Promise<void> {
  // Avoid self-referral edge case
  const referrer = await prisma.user.findUnique({
    where: { referralCode: referredByCode },
    select: {
      id: true,
      ArtistProfile: { select: { id: true } },
    },
  });

  if (!referrer || referrer.id === refereeUserId || !referrer.ArtistProfile) return;

  await prisma.$transaction([
    prisma.artistProfile.update({
      where: { id: referrer.ArtistProfile.id },
      data: {
        reviewCredits: { increment: REFERRER_REWARD_CREDITS },
        totalCreditsEarned: { increment: REFERRER_REWARD_CREDITS },
      },
    }),
    prisma.user.update({
      where: { id: referrer.id },
      data: {
        totalReferrals: { increment: 1 },
        referralRewardsEarned: { increment: REFERRER_REWARD_CREDITS * 100 },
      },
    }),
  ]);

  console.log(`✅ Rewarded referrer ${referrer.id} with ${REFERRER_REWARD_CREDITS} credits for referral`);
}

/**
 * Mark a coupon as used after successful checkout
 */
export async function markCouponUsed(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { referralCouponId: null },
  });
}

/**
 * Get or create a referral code for a user
 */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true, name: true },
  });

  if (!user) throw new Error("User not found");

  if (user.referralCode) {
    return user.referralCode;
  }

  // Generate new code
  const code = await generateReferralCode(user.name || "USER", userId);

  await prisma.user.update({
    where: { id: userId },
    data: { referralCode: code },
  });

  return code;
}

/**
 * Get referral stats for a user
 */
export async function getReferralStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      referralCode: true,
      totalReferrals: true,
      referralRewardsEarned: true,
      referralCouponId: true,
    },
  });

  if (!user) return null;

  // Count pending referrals (signed up but haven't made first purchase yet)
  const pendingReferrals = await prisma.user.count({
    where: {
      referredByCode: user.referralCode,
      ArtistProfile: {
        totalSpent: 0, // Haven't made a purchase yet
      },
    },
  });

  // Get list of pending referral emails (for debugging/display)
  const pendingUsers = await prisma.user.findMany({
    where: {
      referredByCode: user.referralCode,
      ArtistProfile: {
        totalSpent: 0,
      },
    },
    select: {
      email: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return {
    code: user.referralCode,
    totalReferrals: user.totalReferrals, // Completed (purchased)
    pendingReferrals, // Signed up but not purchased
    pendingUsers, // List of pending users
    rewardsEarned: user.referralRewardsEarned,
    hasPendingCoupon: !!user.referralCouponId,
    couponId: user.referralCouponId,
  };
}
