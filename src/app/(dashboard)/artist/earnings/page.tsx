import { redirect } from "next/navigation";

export default function EarningsRedirect() {
  // Earnings has been merged into the unified Business page
  redirect("/business");
}
