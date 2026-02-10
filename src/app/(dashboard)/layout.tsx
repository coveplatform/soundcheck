import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch artist profile for sidebar
  let artistProfile: any = null;
  try {
    artistProfile = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        artistName: true,
        reviewCredits: true,
        subscriptionStatus: true,
      },
    });
  } catch {
    // Fallback without reviewCredits if column doesn't exist yet
    artistProfile = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        artistName: true,
        subscriptionStatus: true,
      },
    });
  }

  // If no artist profile, redirect to onboarding
  if (!artistProfile) {
    redirect("/onboarding");
  }

  const artistName = artistProfile.artistName || session.user.name || "Artist";
  const credits: number = artistProfile.reviewCredits ?? 0;
  const isPro = artistProfile.subscriptionStatus === "active";

  // Count pending peer reviews
  let pendingReviews = 0;
  try {
    pendingReviews = await prisma.review.count({
      where: {
        peerReviewerArtistId: artistProfile.id,
        status: { in: ["ASSIGNED", "IN_PROGRESS"] },
      },
    });
  } catch {
    pendingReviews = 0;
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <Sidebar
        artistName={artistName}
        credits={credits}
        isPro={isPro}
        pendingReviews={pendingReviews}
      />

      {/* Main content with sidebar offset */}
      <div className="md:pl-64">
        <main className="pb-24 md:pb-8">{children}</main>
      </div>
    </div>
  );
}
