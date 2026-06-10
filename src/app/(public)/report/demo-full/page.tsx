import type { Metadata } from "next";
import { FullReportView } from "./full-report-view";

// Static segment wins over the sibling [id] route, so /report/demo-full
// lands here instead of hitting the DB. The unlocked counterpart of
// /report/demo-free — same demo track, everything open, room on top.
// `?track=cutandrun` swaps in the real analyzed track.
export const metadata: Metadata = {
  title: "demo · full report",
  robots: { index: false, follow: false },
};

export default async function DemoFullReportPage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string }>;
}) {
  const { track } = await searchParams;
  return <FullReportView track={track} />;
}
