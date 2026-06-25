import type { Metadata } from "next";

// The page itself is a client component, so route metadata lives here.
export const metadata: Metadata = {
  title: "Get Your Verdict — Is Your Track Ready to Release?",
  description:
    "Paste a link to your track and get an instant verdict on whether it's ready to release — measured against tracks that got released — then send it to a room of real listeners. Free to submit.",
  alternates: { canonical: "/submit-score" },
};

export default function SubmitScoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
