import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "@/components/providers";
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
  weight: ["400", "500", "600", "700", "800"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mixreflect.com";

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MixReflect - Get Real Feedback on Your Music",
    template: "%s | MixReflect",
  },
  description:
    "A free peer-to-peer music feedback marketplace. Upload your track, review others in your genre, and earn credits for structured honest feedback. Genre-matched, artist-to-artist. Free forever.",
  keywords: [
    "music feedback",
    "online music feedback",
    "music production feedback",
    "peer music review",
    "song feedback",
    "track feedback",
    "music critique",
    "pre-release feedback",
    "artist feedback platform",
    "honest music reviews",
    "get feedback on my music",
  ],
  authors: [{ name: "MixReflect" }],
  creator: "MixReflect",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "MixReflect",
    title: "MixReflect - Get Real Feedback on Your Music",
    description:
      "A free peer-to-peer music feedback marketplace. Upload your track, review others in your genre, and earn credits for structured honest feedback.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MixReflect - Music Feedback Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MixReflect - Get Real Feedback on Your Music",
    description:
      "Free peer-to-peer music feedback. Review others in your genre, earn credits, get honest structured feedback on your own tracks.",
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
      description: "A free peer-to-peer music feedback marketplace where artists upload tracks, review others in their genre, and earn credits for structured honest feedback. Genre-matched, artist-to-artist.",
      offers: [
        {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          name: "Free",
          description: "1 track in review queue, earn credits by reviewing others, full analytics dashboard.",
        },
        {
          "@type": "Offer",
          price: "9.95",
          priceCurrency: "USD",
          name: "Credit Pack",
          description: "One-time purchase of 10 review credits. Never expire.",
        },
        {
          "@type": "Offer",
          price: "24.95",
          priceCurrency: "USD",
          name: "Pro",
          description: "30 credits every month, up to 10 reviews per track, 3 active slots, priority placement.",
        },
      ],
    },
    {
      "@type": "Organization",
      name: "MixReflect",
      url: "https://mixreflect.com",
      logo: "https://mixreflect.com/logo.png",
      sameAs: ["https://twitter.com/mixreflect"],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        url: "https://mixreflect.com/support",
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
        <Providers requiresConsent={requiresConsent}>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
