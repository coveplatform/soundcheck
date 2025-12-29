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
    if (isArtistOnboarding) {
      // Already an artist? Redirect to dashboard instead of showing onboarding
      if (token.isArtist) {
        return NextResponse.redirect(new URL("/artist/dashboard", request.url));
      }
      return NextResponse.next();
    }
    // Not an artist and not on onboarding? Redirect to home
    if (!token.isArtist) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (isReviewerPath) {
    const isReviewerOnboarding = pathname === "/reviewer/onboarding";
    if (isReviewerOnboarding) {
      // Already a reviewer? Redirect to dashboard instead of showing onboarding
      if (token.isReviewer) {
        return NextResponse.redirect(new URL("/reviewer/dashboard", request.url));
      }
      return NextResponse.next();
    }
    // Not a reviewer and not on onboarding? Redirect to home
    if (!token.isReviewer) {
      return NextResponse.redirect(new URL("/", request.url));
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
