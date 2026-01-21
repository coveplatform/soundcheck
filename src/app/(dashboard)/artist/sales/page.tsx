import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  Music,
  Link as LinkIcon,
  ExternalLink,
  BarChart3,
  Lock,
  Upload,
  Eye,
  ShoppingCart,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SalesHubPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch artist profile
  const artistProfile = await prisma.artistProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!artistProfile) {
    redirect("/artist/onboarding");
  }

  const isPro = artistProfile.subscriptionStatus === "active";

  if (!isPro) {
    return (
      <div className="pt-14 sm:pt-16 px-4 sm:px-6 lg:px-12">
        <Link
          href="/artist/dashboard"
          className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <PageHeader
          title="Sales & Sharing Hub"
          description="Sell your tracks, share links, and track purchases"
        />

        <div className="max-w-4xl mx-auto mt-12">
          <Card variant="soft" elevated className="border-2 border-lime-400 rounded-3xl overflow-hidden">
            <CardContent className="pt-6 text-center py-16">
              <div className="w-16 h-16 rounded-full bg-lime-100 flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="h-8 w-8 text-lime-600" />
              </div>
              <h2 className="text-3xl font-black mb-4">Upgrade to Pro to start selling</h2>
              <p className="text-lg text-black/70 mb-2 max-w-2xl mx-auto">
                Turn your uploaded tracks into a shareable purchase link and track sales, plays, and referrals.
              </p>
              <p className="text-sm text-black/50 mb-8 max-w-xl mx-auto">
                Pro unlocks sales mode, affiliate links, and a clean hub for managing your sharing.
              </p>

              <div className="bg-white/50 rounded-2xl p-8 max-w-2xl mx-auto mb-8">
                <p className="text-xs font-mono text-black/40 uppercase tracking-widest mb-4">What you'll get</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-lime-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-black">✓</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm">Sell your tracks</p>
                      <p className="text-xs text-black/60">Generate a purchase link for any uploaded track</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-lime-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-black">✓</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm">Affiliate links</p>
                      <p className="text-xs text-black/60">Track referrals and reward your community</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-lime-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-black">✓</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm">Sales tracking</p>
                      <p className="text-xs text-black/60">See purchases, plays, and performance per track</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-lime-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-black">✓</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm">Simple sharing hub</p>
                      <p className="text-xs text-black/60">Manage links in one place, no confusion</p>
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href="/artist/submit"
                className="inline-flex items-center gap-2 px-8 py-4 bg-lime-400 hover:bg-lime-300 text-black border-2 border-black font-bold rounded-lg text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
              >
                Upgrade to Pro
                <Sparkles className="h-5 w-5" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Fetch all external purchases for this artist's tracks
  const externalPurchases = await prisma.externalPurchase.findMany({
    where: {
      track: {
        artistId: artistProfile.id,
      },
      status: "COMPLETED",
    },
    include: {
      track: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      completedAt: "desc",
    },
    take: 10,
  });

  // Calculate total earnings from external sales
  const totalExternalEarnings = externalPurchases.reduce(
    (sum, purchase) => sum + purchase.artistAmount,
    0
  );

  // Calculate this month's earnings
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const thisMonthPurchases = externalPurchases.filter(
    (p) => p.completedAt && p.completedAt >= startOfMonth
  );

  const thisMonthEarnings = thisMonthPurchases.reduce(
    (sum, purchase) => sum + purchase.artistAmount,
    0
  );

  // Fetch artist's tracks
  const tracks = await prisma.track.findMany({
    where: {
      artistId: artistProfile.id,
      status: {
        in: ["COMPLETED", "UPLOADED"],
      },
    },
    include: {
      genres: true,
      _count: {
        select: {
          externalPurchases: {
            where: {
              status: "COMPLETED",
            },
          },
        },
      },
      affiliateLinks: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1, // Get most recent link for display
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const uploadedTracks = tracks.filter((t) => t.sourceType === "UPLOAD");
  const linkedTracks = tracks.filter((t) => t.sourceType !== "UPLOAD");

  const tracksForSale = uploadedTracks.filter((t) => t.sharingEnabled && t.sharingMode === "SALES");

  // Fetch all affiliate links for this artist
  const allAffiliateLinks = await prisma.trackAffiliateLink.findMany({
    where: {
      track: {
        artistId: artistProfile.id,
      },
      isActive: true,
    },
    include: {
      track: {
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
    take: 10,
  });

  return (
    <div className="pt-14 sm:pt-16 px-4 sm:px-6 lg:px-12">
      <PageHeader
        title="Sales & Sharing Hub"
        description="Manage your track sharing, affiliate links, and sales"
      />

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card variant="soft" elevated>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-mono text-black/40 uppercase tracking-widest">
                  Total Earnings
                </p>
                <p className="text-3xl font-bold mt-2">
                  ${((artistProfile.totalEarnings + totalExternalEarnings) / 100).toFixed(2)}
                </p>
                <p className="text-xs text-black/50 mt-1">
                  ${(totalExternalEarnings / 100).toFixed(2)} from sales
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-lime-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-lime-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="soft" elevated>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-mono text-black/40 uppercase tracking-widest">
                  This Month
                </p>
                <p className="text-3xl font-bold mt-2">
                  ${(thisMonthEarnings / 100).toFixed(2)}
                </p>
                <p className="text-xs text-black/50 mt-1">
                  {thisMonthPurchases.length} {thisMonthPurchases.length === 1 ? "sale" : "sales"}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="soft" elevated>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-mono text-black/40 uppercase tracking-widest">
                  Active Links
                </p>
                <p className="text-3xl font-bold mt-2">{allAffiliateLinks.length}</p>
                <p className="text-xs text-black/50 mt-1">
                  {tracksForSale.length} {tracksForSale.length === 1 ? "track" : "tracks"} for sale
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <LinkIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Uploaded Tracks Section */}
      <Card variant="soft" elevated className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Uploaded Tracks ({uploadedTracks.length})
              </CardTitle>
              <p className="text-sm text-black/60 mt-1">
                Can enable sharing and sales
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {uploadedTracks.length === 0 ? (
            <div className="text-center py-8">
              <Music className="h-12 w-12 text-black/20 mx-auto mb-3" />
              <p className="text-sm text-black/60">No uploaded tracks yet</p>
              <Link href="/artist/submit">
                <Button size="sm" variant="airyPrimary" className="mt-3">
                  Upload Track
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {uploadedTracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-4 bg-white border-2 border-black/10 rounded-xl hover:border-black/20 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <Music className="h-5 w-5 text-black/40 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/artist/tracks/${track.id}`}
                          className="font-bold hover:underline block truncate"
                        >
                          {track.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1 text-xs text-black/50">
                          {track.sharingEnabled ? (
                            <>
                              {track.sharingMode === "SALES" ? (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 font-bold rounded">
                                  <ShoppingCart className="h-3 w-3" />
                                  For Sale - ${((track.salePrice || 0) / 100).toFixed(2)}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-lime-100 text-lime-700 font-bold rounded">
                                  <Eye className="h-3 w-3" />
                                  Exposure Mode
                                </span>
                              )}
                              <span>•</span>
                              <span>{track._count.externalPurchases} sales</span>
                              <span>•</span>
                              <span>{track.publicPlayCount} plays</span>
                            </>
                          ) : (
                            <span className="text-black/40">Not shared yet</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/artist/tracks/${track.id}`}>
                      <Button size="sm" variant="airy">
                        Manage
                      </Button>
                    </Link>
                    {track.sharingEnabled && track.trackShareId && (
                      <a
                        href={`${process.env.NEXT_PUBLIC_APP_URL}/t/${track.trackShareId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" variant="airy">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Linked Tracks Section */}
      {linkedTracks.length > 0 && (
        <Card variant="soft" elevated className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Linked Tracks ({linkedTracks.length})
                </CardTitle>
                <p className="text-sm text-black/60 mt-1">
                  Exposure tracking only (can't be sold)
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {linkedTracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-4 bg-white border-2 border-black/10 rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <ExternalLink className="h-5 w-5 text-black/40 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/artist/tracks/${track.id}`}
                          className="font-bold hover:underline block truncate"
                        >
                          {track.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1 text-xs text-black/50">
                          <span className="capitalize">{track.sourceType.toLowerCase()}</span>
                          <span>•</span>
                          <span>Exposure only</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Link href={`/artist/tracks/${track.id}`}>
                    <Button size="sm" variant="airy">
                      View
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Affiliate Links */}
      {allAffiliateLinks.length > 0 && (
        <Card variant="soft" elevated className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Active Affiliate Links ({allAffiliateLinks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allAffiliateLinks.map((link) => (
                <div
                  key={link.id}
                  className="p-4 bg-white border-2 border-black/10 rounded-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{link.name}</p>
                      <p className="text-sm text-black/60 mt-1 truncate">
                        {link.track.title}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-xs font-mono text-black/60">
                        <div>
                          <span className="font-bold text-black">{link.clickCount}</span> clicks
                        </div>
                        <div>
                          <span className="font-bold text-black">{link.playCount}</span> plays
                        </div>
                        <div>
                          <span className="font-bold text-black">{link.purchaseCount}</span> sales
                        </div>
                        {link.totalRevenue > 0 && (
                          <div>
                            <span className="font-bold text-lime-600">
                              ${(link.totalRevenue / 100).toFixed(2)}
                            </span>{" "}
                            earned
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="airy"
                      onClick={() => {
                        const url = `${process.env.NEXT_PUBLIC_APP_URL}/t/${link.track.trackShareId}?ref=${link.code}`;
                        navigator.clipboard.writeText(url);
                        alert("Link copied to clipboard!");
                      }}
                    >
                      Copy Link
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Sales */}
      {externalPurchases.length > 0 && (
        <Card variant="soft" elevated>
          <CardHeader>
            <CardTitle>Recent Sales (Last 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {externalPurchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="flex items-center justify-between p-3 bg-white border border-black/10 rounded-lg"
                >
                  <div>
                    <p className="font-bold text-sm">{purchase.track.title}</p>
                    <p className="text-xs text-black/50 mt-1">
                      {purchase.buyerEmail}
                      {purchase.affiliateCode && ` • via ${purchase.affiliateCode}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lime-600">
                      +${(purchase.artistAmount / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-black/50">
                      {purchase.completedAt?.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {uploadedTracks.length === 0 && (
        <Card variant="soft" elevated>
          <CardContent className="pt-6 text-center py-12">
            <Music className="h-16 w-16 text-black/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Start Sharing Your Music</h3>
            <p className="text-black/60 max-w-md mx-auto mb-6">
              Upload tracks to enable sharing and start tracking engagement. {!isPro && "Upgrade to Pro to enable sales."}
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/artist/submit">
                <Button className="bg-lime-400 hover:bg-lime-300 text-black font-bold">
                  Upload Track
                </Button>
              </Link>
              {!isPro && (
                <Link href="/artist/submit">
                  <Button variant="airy">
                    <Lock className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
