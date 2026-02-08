import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/dashboard/sidebar";
import { VerifyEmailBanner } from "@/components/ui/verify-email-banner";
import { AudioProvider } from "@/components/dashboard/audio-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch user for email verification status
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true },
  });

  // Fetch artist profile - use `as any` since new peer review columns may
  // not be reflected in the generated Prisma client during migration.
  let artistProfile: any = null;
  try {
    artistProfile = await (prisma.artistProfile as any).findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        artistName: true,
        reviewCredits: true,
        subscriptionStatus: true,
      },
    });
  } catch {
    // Fallback without reviewCredits if the column doesn't exist yet
    artistProfile = await (prisma.artistProfile as any).findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        artistName: true,
        subscriptionStatus: true,
      },
    });
  }

  // If no artist profile exists, redirect to onboarding
  if (!artistProfile) {
    redirect("/onboarding");
  }

  const artistName = artistProfile.artistName || session.user.name || "Artist";
  const credits: number = artistProfile.reviewCredits ?? 0;
  const isPro = artistProfile.subscriptionStatus === "active";

  // Count pending peer reviews assigned to this artist
  let pendingReviews = 0;
  try {
    pendingReviews = await (prisma.review as any).count({
      where: {
        peerReviewerArtistId: artistProfile.id,
        status: { in: ["ASSIGNED", "IN_PROGRESS"] },
      },
    });
  } catch {
    // peerReviewerArtistId field may not exist yet during migration
    pendingReviews = 0;
  }

  return (
    <AudioProvider>
      <div className="min-h-screen bg-[#faf8f5]">
        <Sidebar
          artistName={artistName}
          credits={credits}
          isPro={isPro}
          pendingReviews={pendingReviews}
        />

        {/* Main content with sidebar offset */}
        <div className="md:pl-64">
          {!user?.emailVerified && (
            <div className="pt-6 px-6 sm:px-8">
              <VerifyEmailBanner />
            </div>
          )}

          <main className="pb-24 md:pb-8">{children}</main>
        </div>
      </div>
    </AudioProvider>
  );
}
