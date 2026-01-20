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
  const isReviewerPath =
    pathname === "/reviewer" || pathname.startsWith("/reviewer/");
  const isListenerPath =
    pathname === "/listener" || pathname.startsWith("/listener/");
  const isAccountPath = pathname === "/account" || pathname.startsWith("/account/");
  const isApiAdminPath = pathname.startsWith("/api/admin/") || pathname === "/api/admin";

  if (isReviewerPath) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/reviewer/, "/listener");
    return NextResponse.redirect(url);
  }

  if (
    !isAdminPath &&
    !isArtistPath &&
    !isReviewerPath &&
    !isListenerPath &&
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
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // Allow checkout flow through even without profile in JWT
    // (profile is created by API before redirect, but JWT not yet refreshed)
    if (isCheckoutFlow) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // No profile and not on onboarding? Redirect to onboarding to complete setup
    if (!hasArtistProfile) {
      return NextResponse.redirect(new URL("/artist/onboarding", request.url));
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (isListenerPath) {
    const isListenerOnboarding = pathname === "/listener/onboarding";
    // Check for actual profile, not just the isReviewer flag
    const tokenWithProfiles = token as unknown as {
      listenerProfileId?: string;
      reviewerProfileId?: string;
    };
    const hasListenerProfile = Boolean(
      tokenWithProfiles.listenerProfileId ?? tokenWithProfiles.reviewerProfileId
    );

    if (isListenerOnboarding) {
      // Always allow access to onboarding so partially-onboarded listeners
      // (e.g. admin-enabled accounts) don't get stuck in a redirect loop.
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    // No profile and not on onboarding? Redirect to onboarding to complete setup
    if (!hasListenerProfile) {
      return NextResponse.redirect(new URL("/listener/onboarding", request.url));
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/artist/:path*",
    "/reviewer/:path*",
    "/listener/:path*",
    "/account/:path*",
    "/api/admin/:path*",
  ],
};
