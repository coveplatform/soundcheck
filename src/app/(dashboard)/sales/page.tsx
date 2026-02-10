import { redirect } from "next/navigation";

export default function SalesRedirect() {
  // Sales has been merged into the unified Business page
  redirect("/business");
}
