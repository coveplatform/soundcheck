import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep crawlers out of the app, auth, API and the sunsetting Classic
      // product. Only the public marketing surface should be indexed.
      disallow: [
        "/dashboard",
        "/admin",
        "/api",
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
        "/account",
        "/onboarding",
        "/submit/checkout",
        "/submit/success",
        "/review/",
        "/reviewer/review/",
        "/support/tickets",
        "/score-review/",
        "/r/",
        "/classic",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
