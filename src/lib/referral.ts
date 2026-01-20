// Referral tracking for affiliate commission system

export const REFERRAL_COOKIE_NAME = "mr_ref";
export const REFERRAL_EXPIRY_DAYS = 30;
export const COMMISSION_AMOUNT_CENTS = 5; // $0.05 (10% of $0.50 purchase)

export interface ReferralData {
  reviewerId: string;
  shareId: string;
  trackId: string;
  timestamp: number;
}

export function setReferralCookie(data: ReferralData): void {
  if (typeof document === "undefined") return;

  const maxAge = REFERRAL_EXPIRY_DAYS * 24 * 60 * 60; // 30 days in seconds
  const value = encodeURIComponent(JSON.stringify(data));

  document.cookie = `${REFERRAL_COOKIE_NAME}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function getReferralCookie(): ReferralData | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split("; ");
  const cookie = cookies.find((c) => c.startsWith(`${REFERRAL_COOKIE_NAME}=`));

  if (!cookie) return null;

  try {
    const value = cookie.split("=")[1];
    const data = JSON.parse(decodeURIComponent(value)) as ReferralData;

    // Validate structure
    if (!data.reviewerId || !data.shareId || !data.trackId || !data.timestamp) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export function clearReferralCookie(): void {
  if (typeof document === "undefined") return;

  document.cookie = `${REFERRAL_COOKIE_NAME}=; path=/; max-age=0`;
}

export function isReferralExpired(data: ReferralData): boolean {
  const maxAgeMs = REFERRAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const age = Date.now() - data.timestamp;
  return age > maxAgeMs;
}
