"use client";

import { AudioProvider } from "./audio-context";

export function ArtistLayoutClient({ children }: { children: React.ReactNode }) {
  return <AudioProvider>{children}</AudioProvider>;
}
