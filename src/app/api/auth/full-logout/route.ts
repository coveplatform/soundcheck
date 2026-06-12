import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Robust logout.
 *
 * The session cookie historically lived in TWO scopes: host-only on
 * www.mixreflect.com AND domain=.mixreflect.com (cross-subdomain sharing from the
 * old try.mixreflect.com score product, added in c6d4662). NextAuth's signOut only
 * clears the scope matching the current cookie config, so the other variant
 * survived and users stayed logged in. This route clears every variant and kills
 * the matching DB session rows, so sign-out always works regardless of which
 * cookie(s) a given browser is holding.
 */

const SESSION_COOKIE_NAMES = [
  "__Secure-next-auth.session-token", // https / production
  "next-auth.session-token", // http / local
];

// The legacy cross-subdomain scope. www no longer shares auth with any subdomain
// (try.mixreflect.com is now just a redirect), so this only needs clearing, never
// setting.
const LEGACY_COOKIE_DOMAIN = ".mixreflect.com";

// Build a raw Set-Cookie expiry string. We append these as headers directly:
// NextResponse's `res.cookies.set()` keys its internal map by cookie NAME only,
// so setting the same name in two scopes (host-only + Domain=) silently drops
// one of them — exactly the bug that left users logged in after sign-out.
function expireCookie(name: string, domain?: string): string {
  const secure = name.startsWith("__Secure-");
  return [
    `${name}=`,
    "Path=/",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "HttpOnly",
    "SameSite=Lax",
    ...(secure ? ["Secure"] : []),
    ...(domain ? [`Domain=${domain}`] : []),
  ].join("; ");
}

export async function POST(req: NextRequest) {
  // A browser can hold the same cookie name in multiple scopes; cookies().get()
  // returns only one, so parse the raw Cookie header to collect every token value.
  // Session-token cookies may also arrive chunked (name.0, name.1, …) when the
  // JWT outgrows 4kB — match those too.
  const raw = req.headers.get("cookie") ?? "";
  const tokens = new Set<string>();
  const chunkNames = new Set<string>();
  for (const part of raw.split(/;\s*/)) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    const isChunk = SESSION_COOKIE_NAMES.some((base) =>
      new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.\\d+$`).test(name)
    );
    if (isChunk) chunkNames.add(name);
    if (!SESSION_COOKIE_NAMES.includes(name) && !isChunk) continue;
    const value = decodeURIComponent(part.slice(eq + 1));
    if (value) tokens.add(value);
  }

  if (tokens.size > 0) {
    await prisma.session.deleteMany({
      where: { sessionToken: { in: [...tokens] } },
    });
  }

  const res = NextResponse.json({ ok: true });
  for (const name of [...SESSION_COOKIE_NAMES, ...chunkNames]) {
    res.headers.append("Set-Cookie", expireCookie(name)); // host-only scope
    res.headers.append("Set-Cookie", expireCookie(name, LEGACY_COOKIE_DOMAIN)); // legacy scope
  }
  return res;
}
