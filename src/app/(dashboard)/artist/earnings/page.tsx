import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Music } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function ArtistEarningsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const artistProfile = await prisma.artistProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      tracks: {
        include: {
          purchases: {
            include: {
              reviewer: {
                include: {
                  user: {
                    select: { name: true },
                  },
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!artistProfile) {
    redirect("/artist/onboarding");
  }

  const totalEarnings = artistProfile.totalEarnings / 100;
  const pendingBalance = artistProfile.pendingBalance / 100;

  // Flatten all purchases across tracks
  const allPurchases = artistProfile.tracks.flatMap((track) =>
    track.purchases.map((purchase) => ({
      ...purchase,
      trackTitle: track.title,
      trackId: track.id,
    }))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="pt-14 sm:pt-16 px-6 sm:px-8 lg:px-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight">Earnings</h1>
        <p className="mt-2 text-sm text-black/40">Track purchases from listeners who loved your music</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card variant="soft">
              <CardContent className="pt-6">
                <p className="text-xs font-mono tracking-widest text-black/40 uppercase">total earned</p>
                <p className="mt-2 text-3xl font-light tracking-tight">${totalEarnings.toFixed(2)}</p>
                <p className="mt-1 text-sm text-black/40">all time</p>
              </CardContent>
            </Card>

            <Card variant="soft" elevated>
              <CardContent className="pt-6">
                <p className="text-xs font-mono tracking-widest text-black/40 uppercase">available</p>
                <p className="mt-2 text-3xl font-light tracking-tight text-emerald-600">${pendingBalance.toFixed(2)}</p>
                <p className="mt-1 text-sm text-black/40">to withdraw</p>
              </CardContent>
            </Card>
          </div>

          {/* Sales list */}
          <Card variant="soft" elevated>
            <CardContent className="pt-6">
              <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-4">recent sales</p>

              {allPurchases.length === 0 ? (
                <div className="text-center py-12 text-black/40">
                  <Music className="h-10 w-10 mx-auto mb-4 text-black/20" />
                  <p>No sales yet</p>
                  <p className="text-sm mt-1">When listeners purchase your tracks, they&apos;ll appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allPurchases.map((purchase) => (
                    <Link
                      key={purchase.id}
                      href={`/artist/tracks/${purchase.trackId}`}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-white/60 border border-black/10 px-4 py-3 hover:bg-white transition-colors duration-150 ease-out"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <Music className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-black truncate">{purchase.trackTitle}</p>
                          <p className="text-xs text-black/40">
                            {purchase.reviewer.user.name || "Anonymous"} · {formatDate(purchase.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span className="text-emerald-600 font-medium text-sm flex-shrink-0">
                        +${(purchase.amount / 100).toFixed(2)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-4">
          {/* Payout Card */}
          <Card variant="soft" elevated>
            <CardContent className="pt-6">
              <p className="text-xs font-mono tracking-widest text-black/40 uppercase">payouts</p>
              <div className="mt-4">
                {pendingBalance > 0 ? (
                  <>
                    <p className="text-sm text-black/60 mb-4">
                      You have <span className="font-medium text-emerald-600">${pendingBalance.toFixed(2)}</span> available to withdraw.
                    </p>
                    {artistProfile.stripeAccountId ? (
                      <Link href="/artist/account">
                        <Button variant="airyOutline" className="h-10 px-4">
                          Manage payouts
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/artist/account">
                        <Button variant="airyPrimary" className="h-10 px-4">
                          Connect Stripe to withdraw
                        </Button>
                      </Link>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-black/40">
                    No balance available. Earnings from track purchases will appear here.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* How it works */}
          <Card variant="soft">
            <CardContent className="pt-6">
              <p className="text-xs font-mono tracking-widest text-black/40 uppercase">how it works</p>
              <div className="mt-3 space-y-2 text-sm text-black/60">
                <p>1. Listeners review your track</p>
                <p>2. If they love it, they can purchase</p>
                <p>3. You earn from each purchase</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
