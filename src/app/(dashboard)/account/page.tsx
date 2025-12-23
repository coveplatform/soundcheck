import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.isReviewer && !session.user.isArtist) {
    redirect("/reviewer/account");
  }

  redirect("/artist/account");
}
