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

  // NB: The Score product is now served directly at "/" (cutover 2026-06-09),
  // so the old SCORE_HOST subdomain rewrite (/ → /score) was removed — it would
  // now loop, since /score permanently redirects back to /.

  // Add pathname header for layouts to detect current route
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isArtistPath = pathname === "/artist" || pathname.startsWith("/artist/");
  const isAccountPath = pathname === "/account" || pathname.startsWith("/account/");
  const isApiAdminPath = pathname.startsWith("/api/admin/") || pathname === "/api/admin";
  // Submitting another track is a signed-in action — logged-out visitors belong
  // in the acquisition funnel at "/", not on the email-only submit form.
  const isSubmitScorePath =
    pathname === "/submit-score" || pathname.startsWith("/submit-score/");

  if (
    !isAdminPath &&
    !isArtistPath &&
    !isAccountPath &&
    !isApiAdminPath &&
    !isSubmitScorePath
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
    "/", // score-subdomain root rewrite
    "/admin/:path*",
    "/artist/:path*",
    "/account/:path*",
    "/api/admin/:path*",
    "/submit-score/:path*",
  ],
};
