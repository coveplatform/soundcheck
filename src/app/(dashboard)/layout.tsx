import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/dashboard/sidebar";

// Cache sidebar data per user for 30s to avoid re-fetching on every navigation
const getSidebarData = unstable_cache(
  async (userId: string) => {
    let artistProfile: any = null;
    try {
      artistProfile = await prisma.artistProfile.findUnique({
        where: { userId },
        select: {
          id: true,
          artistName: true,
          reviewCredits: true,
          completedOnboarding: true,
        },
      });
    } catch {
      artistProfile = await prisma.artistProfile.findUnique({
        where: { userId },
        select: {
          id: true,
          artistName: true,
          completedOnboarding: true,
        },
      });
    }

    if (!artistProfile) return null;

    // Count available tracks in the review queue (not just claimed)
    let pendingReviews = 0;
    try {
      const excludeTrackIds = await prisma.review.findMany({
        where: { peerReviewerArtistId: artistProfile.id },
        select: { trackId: true },
      });
      const excludeIds = excludeTrackIds.map((r: { trackId: string }) => r.trackId);

      const availableTracks = await prisma.track.findMany({
        where: {
          packageType: "PEER",
          status: { in: ["QUEUED", "IN_PROGRESS"] },
          artistId: { not: artistProfile.id },
          id: { notIn: excludeIds },
        },
        select: {
          reviewsRequested: true,
          _count: { select: { Review: { where: { status: { in: ["ASSIGNED", "IN_PROGRESS", "COMPLETED"] } } } } },
        },
      });
      pendingReviews = availableTracks.filter((t: any) => t._count.Review < t.reviewsRequested).length;
    } catch {
      pendingReviews = 0;
    }

    return { ...artistProfile, pendingReviews };
  },
  ["sidebar-data"],
  { revalidate: 30, tags: ["sidebar"] }
);

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const artistProfile = await getSidebarData(session.user.id);

  // If no artist profile OR onboarding not completed, show simple layout (for /onboarding page)
  // Note: also check artistName as fallback — existing users may have completedOnboarding=false
  // because the field was added after they already onboarded
  if (!artistProfile || (!artistProfile.completedOnboarding && !artistProfile.artistName)) {
    return (
      <div className="min-h-screen bg-[#faf8f5]">
        {children}
      </div>
    );
  }

  const artistName = artistProfile.artistName || session.user.name || "Artist";
  const credits: number = artistProfile.reviewCredits ?? 0;

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <Sidebar
        artistName={artistName}
        credits={credits}
        pendingReviews={artistProfile.pendingReviews}
      />

      {/* Main content with sidebar offset */}
      <div className="md:pl-64">
        <main className="pb-24 md:pb-8">{children}</main>
      </div>
    </div>
  );
}
