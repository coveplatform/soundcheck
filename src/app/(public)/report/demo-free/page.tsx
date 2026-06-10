import type { Metadata } from "next";
import { FreeTeaserView } from "./free-teaser-view";

// Static segment wins over the sibling [id] route, so /report/demo-free
// lands here instead of hitting the DB. `?track=cutandrun` swaps in the
// real analyzed track (worker deep analysis, real waveform).
export const metadata: Metadata = {
  title: "demo · free report teaser",
  robots: { index: false, follow: false },
};

export default async function DemoFreeReportPage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string }>;
}) {
  const { track } = await searchParams;
  return <FreeTeaserView track={track} />;
}
