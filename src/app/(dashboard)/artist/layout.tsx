import { ArtistLayoutClient } from "@/components/dashboard/artist-layout-client";

export default function ArtistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Parent (dashboard)/layout.tsx already handles auth, sidebar, and layout.
  // This layout only adds AudioProvider for track playback on artist pages.
  return <ArtistLayoutClient>{children}</ArtistLayoutClient>;
}
