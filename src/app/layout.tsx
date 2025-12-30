import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    "A private feedback marketplace where artists get structured reviews from a curated listener panel and reviewers get paid to discover new music. Get 5-20 structured reviews starting at $4.95.",
  keywords: [
    "music feedback",
    "song reviews",
    "music production feedback",
    "track reviews",
    "music critique",
    "pre-release feedback",
    "music listeners",
    "artist feedback",
    "honest music reviews",
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
      "A private feedback marketplace where artists get genuine listener feedback and reviewers get paid to discover new music.",
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
      "Get structured feedback from genre-matched listeners before you release.",
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

// JSON-LD structured data for Google
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MixReflect",
  url: "https://mixreflect.com",
  logo: "https://mixreflect.com/logo.png",
  description: "A private feedback marketplace where artists get structured reviews from genre-matched listeners before release.",
  sameAs: [
    "https://twitter.com/mixreflect",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    url: "https://mixreflect.com/support",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
