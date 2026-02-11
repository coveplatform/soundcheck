import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { isAdminEmail } from "./src/lib/admin";

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set(
    "callbackUrl",
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  );
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Add pathname header for layouts to detect current route
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isArtistPath = pathname === "/artist" || pathname.startsWith("/artist/");
  const isAccountPath = pathname === "/account" || pathname.startsWith("/account/");
  const isApiAdminPath = pathname.startsWith("/api/admin/") || pathname === "/api/admin";

  if (
    !isAdminPath &&
    !isArtistPath &&
    !isAccountPath &&
    !isApiAdminPath
  ) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    if (isApiAdminPath) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return redirectToLogin(request);
  }

  if (isAdminPath || isApiAdminPath) {
    const email = typeof token.email === "string" ? token.email : null;

    if (!isAdminEmail(email)) {
      if (isApiAdminPath) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (isArtistPath) {
    // Checkout and success pages are accessed immediately after profile creation,
    // before the JWT token is refreshed - allow them through
    const isCheckoutFlow = pathname.startsWith("/artist/submit/checkout") ||
                           pathname.startsWith("/artist/submit/success");
    const hasArtistProfile = Boolean(token.artistProfileId);

    // Allow checkout flow through even without profile in JWT
    if (isCheckoutFlow) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // No profile? Redirect to unified onboarding
    if (!hasArtistProfile) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/artist/:path*",
    "/account/:path*",
    "/api/admin/:path*",
  ],
};
