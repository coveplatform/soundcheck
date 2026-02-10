import { redirect } from "next/navigation";

export default function AnalyticsRedirect() {
  // Analytics has been moved to the Tracks page as "Portfolio" view
  redirect("/tracks");
}
