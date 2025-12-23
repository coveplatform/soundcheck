import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountSettingsClient } from "@/components/account/account-settings-client";

export const dynamic = "force-dynamic";

export default async function ArtistAccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, password: true },
  });

  if (!dbUser?.email) {
    redirect("/login");
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-black">Account settings</h1>
      <p className="text-neutral-600 mt-1">Profile, security, and support</p>

      <div className="mt-6">
        <AccountSettingsClient
          initialName={dbUser.name ?? ""}
          email={dbUser.email}
          isArtist={session.user.isArtist}
          isReviewer={session.user.isReviewer}
          hasPassword={Boolean(dbUser.password)}
        />
      </div>
    </div>
  );
}
