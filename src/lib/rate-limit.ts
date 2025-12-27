/**
 * Simple in-memory rate limiter for auth endpoints
 * In production, consider using Redis for distributed rate limiting
 */

import { prisma } from "@/lib/prisma";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

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
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + config.windowSeconds * 1000);
  const key = identifier;

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        INSERT INTO "RateLimit" ("id", "count", "resetAt", "createdAt", "updatedAt")
        VALUES (${key}, 1, ${resetAt}, ${now}, ${now})
        ON CONFLICT ("id") DO NOTHING
      `;

      const rows = await tx.$queryRaw<Array<{ count: number; resetAt: Date }>>`
        SELECT "count", "resetAt"
        FROM "RateLimit"
        WHERE "id" = ${key}
        FOR UPDATE
      `;

      const row = rows[0];
      if (!row) {
        return {
          success: false,
          remaining: 0,
          resetAt: resetAt.getTime(),
          retryAfterSeconds: config.windowSeconds,
        };
      }

      if (row.resetAt.getTime() < now.getTime()) {
        await tx.$executeRaw`
          UPDATE "RateLimit"
          SET "count" = 1, "resetAt" = ${resetAt}, "updatedAt" = ${now}
          WHERE "id" = ${key}
        `;

        return {
          success: true,
          remaining: config.limit - 1,
          resetAt: resetAt.getTime(),
        };
      }

      if (row.count >= config.limit) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((row.resetAt.getTime() - now.getTime()) / 1000)
        );
        return {
          success: false,
          remaining: 0,
          resetAt: row.resetAt.getTime(),
          retryAfterSeconds,
        };
      }

      await tx.$executeRaw`
        UPDATE "RateLimit"
        SET "count" = "count" + 1, "updatedAt" = ${now}
        WHERE "id" = ${key}
      `;

      const newCount = row.count + 1;

      return {
        success: true,
        remaining: Math.max(0, config.limit - newCount),
        resetAt: row.resetAt.getTime(),
      };
    });

    if (!result) {
      throw new Error("Rate limit store unavailable");
    }

    return result;
  } catch {
    if (process.env.NODE_ENV === "production") {
      return {
        success: false,
        remaining: 0,
        resetAt: resetAt.getTime(),
        retryAfterSeconds: config.windowSeconds,
      };
    }

    const nowMs = Date.now();
    const entry = rateLimitStore.get(key);
    if (!entry || entry.resetAt < nowMs) {
      const resetAtMs = nowMs + config.windowSeconds * 1000;
      rateLimitStore.set(key, { count: 1, resetAt: resetAtMs });
      return {
        success: true,
        remaining: config.limit - 1,
        resetAt: resetAtMs,
      };
    }

    if (entry.count >= config.limit) {
      const retryAfterSeconds = Math.ceil((entry.resetAt - nowMs) / 1000);
      return {
        success: false,
        remaining: 0,
        resetAt: entry.resetAt,
        retryAfterSeconds,
      };
    }

    entry.count++;
    rateLimitStore.set(key, entry);
    return {
      success: true,
      remaining: config.limit - entry.count,
      resetAt: entry.resetAt,
    };
  }
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
