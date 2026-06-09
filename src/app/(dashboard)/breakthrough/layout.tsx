import type { Metadata } from "next";

const baseUrl = process.env.NEXTAUTH_URL ?? "https://www.mixreflect.com";

export const metadata: Metadata = {
  title: "Breakthrough · MixReflect",
  description: "The best-reviewed independent track from today's peer review pipeline.",
  openGraph: {
    title: "Breakthrough · MixReflect",
    description: "The best-reviewed independent track from today's peer review pipeline.",
    url: `${baseUrl}/breakthrough`,
    siteName: "MixReflect",
    images: [
      {
        url: `${baseUrl}/api/og/charts`,
        width: 1200,
        height: 630,
        alt: "Track of the Day · MixReflect",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Breakthrough · MixReflect",
    description: "The best-reviewed independent track from today's peer review pipeline.",
    images: [`${baseUrl}/api/og/charts`],
  },
};

export default function ChartsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
