import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "@/components/providers";
import { ChangeoverBanner } from "@/components/changeover-banner";
import { WelcomeBanner } from "@/components/welcome-banner";
import { headers } from "next/headers";
import "./globals.css";

const GDPR_COUNTRIES = new Set([
  // EU member states
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR",
  "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL",
  "PT", "RO", "SE", "SI", "SK",
  // EEA non-EU
  "IS", "LI", "NO",
  // UK
  "GB",
]);

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mixreflect.com";

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MixReflect — Get Your Track Scored by AI + a Room of Real Listeners",
    template: "%s | MixReflect",
  },
  description:
    "Paste a link to your track and get an instant AI read — a score out of 100, a verdict and a breakdown — plus honest reactions from a room of real, paid listeners. Free to submit.",
  keywords: [
    "music feedback",
    "song score",
    "track score",
    "ai music feedback",
    "get feedback on my music",
    "honest music reviews",
    "pre-release feedback",
    "is my song good",
    "rate my track",
    "music critique",
    "song feedback before release",
  ],
  authors: [{ name: "MixReflect" }],
  creator: "MixReflect",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "MixReflect",
    title: "MixReflect — Get Your Track Scored by AI + a Room of Real Listeners",
    description:
      "Paste a link, get an instant AI read — score, verdict and breakdown — plus honest reactions from a room of real, paid listeners. Free to submit.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MixReflect — instant track score + a room of real listeners",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MixReflect — Get Your Track Scored by AI + a Room of Real Listeners",
    description:
      "Paste a link, get an instant AI read plus honest reactions from a room of real, paid listeners. Free to submit.",
    images: ["/og-image.png"],
    creator: "@mixreflect",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

// JSON-LD structured data for Google and AI crawlers
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "MixReflect",
      url: "https://mixreflect.com",
      applicationCategory: "MusicApplication",
      operatingSystem: "Web",
      description: "Paste a link to your track and get an instant AI read — a score out of 100, a verdict and a breakdown across hook, production, retention, emotion and commercial pull — plus honest reactions from a room of real, paid listeners. Free to submit.",
      offers: [
        {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          name: "Free",
          description: "Submit a track and get your instant AI score, verdict and a teaser of the full report.",
        },
        {
          "@type": "Offer",
          price: "6.95",
          priceCurrency: "USD",
          name: "Unlock",
          description: "One-time unlock of a track's full report — the complete breakdown plus every listener reaction. Yours forever.",
        },
        {
          "@type": "Offer",
          price: "19.95",
          priceCurrency: "USD",
          name: "Unlimited",
          description: "Every track you submit is auto-unlocked. Unlimited full reports, billed monthly.",
        },
      ],
    },
    {
      "@type": "Organization",
      name: "MixReflect",
      url: "https://mixreflect.com",
      logo: "https://mixreflect.com/logo.png",
      description: "Instant AI track scoring plus honest reactions from a room of real, paid listeners. Free to submit.",
      sameAs: ["https://twitter.com/mixreflect"],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        url: "https://mixreflect.com/support",
      },
    },
    {
      "@type": "WebSite",
      name: "MixReflect",
      url: "https://mixreflect.com",
      description: "Instant AI track scoring plus a room of real listeners — honest feedback before you release.",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://mixreflect.com/feedback/{search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const country = headersList.get("x-vercel-ip-country") ?? "";
  const requiresConsent = GDPR_COUNTRIES.has(country);

  return (
    <html lang="en" data-theme="light" style={{ colorScheme: "light" }}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${plusJakarta.variable} antialiased`}
      >
        <Providers requiresConsent={requiresConsent}>
          <ChangeoverBanner />
          <WelcomeBanner />
          {children}
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
