import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountSettingsClient } from "@/components/account/account-settings-client";
import { ReviewerGenrePreferences } from "@/components/account/reviewer-genre-preferences";

export const dynamic = "force-dynamic";

export default async function ReviewerAccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, password: true },
  });

  // Get reviewer profile with genres
  const reviewerProfile = await prisma.reviewerProfile.findUnique({
    where: { userId: session.user.id },
    select: { genres: { select: { id: true } } },
  });

  if (!dbUser?.email) {
    redirect("/login");
  }

  const initialGenreIds = reviewerProfile?.genres.map((g) => g.id) ?? [];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-black">Account settings</h1>
      <p className="text-neutral-600 mt-1">Profile, security, and preferences</p>

      <div className="mt-6 space-y-4">
        {/* Genre Preferences - Reviewer specific */}
        <ReviewerGenrePreferences initialGenreIds={initialGenreIds} />

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
