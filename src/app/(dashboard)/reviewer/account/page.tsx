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

  // Get listener profile with genres
  const reviewerProfile = await prisma.listenerProfile.findUnique({
    where: { userId: session.user.id },
    select: { genres: { select: { id: true } } },
  });

  // Get artist profile if user is also an artist
  const artistProfile = session.user.isArtist
    ? await (prisma.artistProfile as any).findUnique({
        where: { userId: session.user.id },
        select: { artistName: true },
      } as any)
    : null;

  if (!dbUser?.email) {
    redirect("/login");
  }

  const initialGenreIds =
    (reviewerProfile?.genres ?? []).map((g) => g.id);

  return (
    <div className="pt-14 sm:pt-16 px-6 sm:px-8 lg:px-12">
      <div className="max-w-4xl">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight">Account</h1>
          <p className="mt-2 text-sm text-black/40">Profile, security, and preferences</p>
        </div>

        <div className="space-y-6">
          <ReviewerGenrePreferences initialGenreIds={initialGenreIds} />
          <AccountSettingsClient
            initialName={dbUser.name ?? ""}
            artistName={artistProfile?.artistName ?? null}
            email={dbUser.email}
            isArtist={session.user.isArtist}
            isReviewer={session.user.isReviewer}
            hasPassword={Boolean(dbUser.password)}
            subscription={null}
          />
        </div>
      </div>
    </div>
  );
}
