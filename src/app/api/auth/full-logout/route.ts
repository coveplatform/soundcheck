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

export async function POST(req: NextRequest) {
  // A browser can hold the same cookie name in multiple scopes; cookies().get()
  // returns only one, so parse the raw Cookie header to collect every token value.
  const raw = req.headers.get("cookie") ?? "";
  const tokens = new Set<string>();
  for (const part of raw.split(/;\s*/)) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    if (!SESSION_COOKIE_NAMES.includes(name)) continue;
    const value = decodeURIComponent(part.slice(eq + 1));
    if (value) tokens.add(value);
  }

  if (tokens.size > 0) {
    await prisma.session.deleteMany({
      where: { sessionToken: { in: [...tokens] } },
    });
  }

  const res = NextResponse.json({ ok: true });
  for (const name of SESSION_COOKIE_NAMES) {
    const secure = name.startsWith("__Secure-");
    const base = {
      value: "",
      maxAge: 0,
      path: "/",
      httpOnly: true,
      sameSite: "lax" as const,
      secure,
    };
    res.cookies.set({ name, ...base }); // host-only scope
    res.cookies.set({ name, ...base, domain: LEGACY_COOKIE_DOMAIN }); // legacy scope
  }
  return res;
}
