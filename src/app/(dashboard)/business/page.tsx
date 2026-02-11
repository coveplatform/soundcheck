import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BusinessPageClient } from "@/components/business/business-page-client";

export const dynamic = "force-dynamic";

export default async function BusinessPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // First, get basic artist profile to check Pro status
  const artistProfile = await prisma.artistProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      subscriptionStatus: true,
      pendingBalance: true,
      stripeAccountId: true,
    },
  });

  if (!artistProfile) {
    redirect("/onboarding");
  }

  const isPro = artistProfile.subscriptionStatus === "active";

  // SECURITY: Only fetch full data (with sensitive earnings/purchases) for Pro users
  const artistProfileWithData = isPro
    ? await prisma.artistProfile.findUnique({
        where: { userId: session.user.id },
        include: {
          Track: {
            include: {
              Purchase: {
                include: {
                  ReviewerProfile_Purchase_reviewerIdToReviewerProfile: {
                    include: {
                      User: { select: { name: true } },
                    },
                  },
                },
                orderBy: { createdAt: "desc" },
              },
              ExternalPurchase: {
                where: { status: "COMPLETED" },
                orderBy: { completedAt: "desc" },
              },
              Genre: true,
              _count: {
                select: {
                  ExternalPurchase: {
                    where: { status: "COMPLETED" },
                  },
                },
              },
              TrackAffiliateLink: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
            where: {
              status: {
                in: ["COMPLETED", "UPLOADED"],
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      })
    : null;

  // SECURITY: Only fetch sensitive data for Pro users
  // Non-Pro users should not receive earnings, transactions, or affiliate data
  let allInternalPurchases: any[] = [];
  let totalInternalEarnings = 0;
  let allExternalPurchases: any[] = [];
  let totalExternalEarnings = 0;
  let uploadedTracks: any[] = [];
  let tracksForSale: any[] = [];
  let serializedAffiliateLinks: any[] = [];
  let totalEarnings = 0;
  let pendingBalance = 0;
  let hasStripeAccount = false;

  if (isPro && artistProfileWithData) {
    // Calculate internal earnings (from peer reviewers)
    allInternalPurchases = artistProfileWithData.Track.flatMap((track) =>
      track.Purchase.map((purchase) => ({
        id: purchase.id,
        trackTitle: track.title,
        trackId: track.id,
        amount: purchase.amount,
        createdAt: purchase.createdAt.toISOString(),
        buyerName: purchase.ReviewerProfile_Purchase_reviewerIdToReviewerProfile.User.name || "Anonymous",
        type: "internal" as const,
      }))
    );
    totalInternalEarnings = allInternalPurchases.reduce(
      (sum, p) => sum + p.amount,
      0
    );

    // Calculate external earnings (from public sales)
    allExternalPurchases = artistProfileWithData.Track.flatMap((track) =>
      track.ExternalPurchase.map((purchase) => ({
        id: purchase.id,
        trackTitle: track.title,
        trackId: track.id,
        amount: purchase.artistAmount,
        completedAt: purchase.completedAt?.toISOString() || new Date().toISOString(),
        buyerEmail: purchase.buyerEmail,
        affiliateCode: purchase.affiliateCode,
        type: "external" as const,
      }))
    );
    totalExternalEarnings = allExternalPurchases.reduce(
      (sum, p) => sum + p.amount,
      0
    );

    // Get tracks data
    uploadedTracks = artistProfileWithData.Track.map((track) => ({
      id: track.id,
      title: track.title,
      sourceType: track.sourceType,
      sharingEnabled: track.sharingEnabled,
      sharingMode: track.sharingMode,
      salePrice: track.salePrice,
      publicPlayCount: track.publicPlayCount,
      externalPurchasesCount: track._count.ExternalPurchase,
    })).filter((t) => t.sourceType === "UPLOAD");

    tracksForSale = uploadedTracks.filter((t) => t.sharingEnabled && t.sharingMode === "SALES");

    // Fetch all affiliate links
    const allAffiliateLinks = await prisma.trackAffiliateLink.findMany({
      where: {
        Track: {
          artistId: artistProfile.id,
        },
        isActive: true,
      },
      include: {
        Track: {
          select: {
            id: true,
            title: true,
            trackShareId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    serializedAffiliateLinks = allAffiliateLinks.map(link => ({
      id: link.id,
      name: link.name,
      code: link.code,
      clickCount: link.clickCount,
      playCount: link.playCount,
      purchaseCount: link.purchaseCount,
      totalRevenue: link.totalRevenue,
      trackId: link.Track.id,
      trackTitle: link.Track.title,
      trackShareId: link.Track.trackShareId,
    }));

    totalEarnings = totalInternalEarnings + totalExternalEarnings;
    pendingBalance = artistProfile.pendingBalance;
    hasStripeAccount = !!artistProfile.stripeAccountId;
  }

  return (
    <BusinessPageClient
      isPro={isPro}
      totalEarnings={totalEarnings}
      totalInternalEarnings={totalInternalEarnings}
      totalExternalEarnings={totalExternalEarnings}
      pendingBalance={pendingBalance}
      hasStripeAccount={hasStripeAccount}
      tracksForSale={tracksForSale}
      uploadedTracks={uploadedTracks}
      affiliateLinks={serializedAffiliateLinks}
      internalPurchases={allInternalPurchases}
      externalPurchases={allExternalPurchases}
    />
  );
}
