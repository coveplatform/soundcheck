import type { Metadata } from "next";
import { VerdictReportView } from "./verdict-report-view";

// Static segment wins over the sibling [id] route, so /report/demo-verdict
// lands here instead of hitting the DB. A sandbox for the "own the release
// decision" reposition — the verdict as the hero, the score demoted to
// evidence, and the release bar (measured vs the genre's release envelope).
export const metadata: Metadata = {
  title: "demo · release verdict",
  robots: { index: false, follow: false },
};

export default function DemoVerdictReportPage() {
  return <VerdictReportView />;
}
