/**
 * Simple in-memory rate limiter for auth endpoints
 * In production, consider using Redis for distributed rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds?: number;
}

/**
 * Check rate limit for a given identifier (e.g., IP address, email)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  const entry = rateLimitStore.get(key);

  // If no entry or entry has expired, create new entry
  if (!entry || entry.resetAt < now) {
    const resetAt = now + config.windowSeconds * 1000;
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      success: true,
      remaining: config.limit - 1,
      resetAt,
    };
  }

  // Entry exists and hasn't expired
  if (entry.count >= config.limit) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterSeconds,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    success: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback - in development this might be localhost
  return "unknown";
}

// Pre-configured rate limits for different endpoints
export const RATE_LIMITS = {
  // Auth endpoints - more restrictive
  signup: { limit: 5, windowSeconds: 60 * 15 }, // 5 per 15 minutes
  login: { limit: 10, windowSeconds: 60 * 15 }, // 10 per 15 minutes
  forgotPassword: { limit: 3, windowSeconds: 60 * 15 }, // 3 per 15 minutes
  resetPassword: { limit: 5, windowSeconds: 60 * 15 }, // 5 per 15 minutes
  resendVerification: { limit: 3, windowSeconds: 60 * 15 }, // 3 per 15 minutes
} as const;
