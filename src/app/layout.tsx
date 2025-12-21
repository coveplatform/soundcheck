import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://soundcheck.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SoundCheck - Get Real Feedback on Your Music",
    template: "%s | SoundCheck",
  },
  description:
    "A private feedback marketplace where artists get genuine listener feedback and reviewers get paid to discover new music. Get 5-25 structured reviews starting at $3.",
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
  authors: [{ name: "SoundCheck" }],
  creator: "SoundCheck",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "SoundCheck",
    title: "SoundCheck - Get Real Feedback on Your Music",
    description:
      "A private feedback marketplace where artists get genuine listener feedback and reviewers get paid to discover new music.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SoundCheck - Music Feedback Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SoundCheck - Get Real Feedback on Your Music",
    description:
      "Get structured feedback from genre-matched listeners before you release.",
    images: ["/og-image.png"],
    creator: "@soundcheck",
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
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
