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

  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isArtistPath = pathname === "/artist" || pathname.startsWith("/artist/");
  const isReviewerPath =
    pathname === "/reviewer" || pathname.startsWith("/reviewer/");
  const isAccountPath = pathname === "/account" || pathname.startsWith("/account/");
  const isApiAdminPath = pathname.startsWith("/api/admin/") || pathname === "/api/admin";

  if (
    !isAdminPath &&
    !isArtistPath &&
    !isReviewerPath &&
    !isAccountPath &&
    !isApiAdminPath
  ) {
    return NextResponse.next();
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

    return NextResponse.next();
  }

  if (isArtistPath) {
    const isArtistOnboarding = pathname === "/artist/onboarding";
    // Checkout and success pages are accessed immediately after profile creation,
    // before the JWT token is refreshed - allow them through
    const isCheckoutFlow = pathname.startsWith("/artist/submit/checkout") ||
                           pathname.startsWith("/artist/submit/success");
    // Check for actual profile, not just the isArtist flag
    const hasArtistProfile = Boolean(token.artistProfileId);

    if (isArtistOnboarding) {
      // Has a profile? Redirect to dashboard instead of showing onboarding
      if (hasArtistProfile) {
        return NextResponse.redirect(new URL("/artist/dashboard", request.url));
      }
      return NextResponse.next();
    }

    // Allow checkout flow through even without profile in JWT
    // (profile is created by API before redirect, but JWT not yet refreshed)
    if (isCheckoutFlow) {
      return NextResponse.next();
    }

    // No profile and not on onboarding? Redirect to onboarding to complete setup
    if (!hasArtistProfile) {
      return NextResponse.redirect(new URL("/artist/onboarding", request.url));
    }
    return NextResponse.next();
  }

  if (isReviewerPath) {
    const isReviewerOnboarding = pathname === "/reviewer/onboarding";
    // Check for actual profile, not just the isReviewer flag
    const hasReviewerProfile = Boolean(token.reviewerProfileId);

    if (isReviewerOnboarding) {
      // Always allow access to onboarding so partially-onboarded reviewers
      // (e.g. admin-enabled accounts) don't get stuck in a redirect loop.
      return NextResponse.next();
    }
    // No profile and not on onboarding? Redirect to onboarding to complete setup
    if (!hasReviewerProfile) {
      return NextResponse.redirect(new URL("/reviewer/onboarding", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/artist/:path*",
    "/reviewer/:path*",
    "/account/:path*",
    "/api/admin/:path*",
  ],
};
