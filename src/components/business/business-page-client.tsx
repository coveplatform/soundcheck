"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  Music,
  LinkIcon,
  BarChart3,
  Upload,
  Eye,
  ShoppingCart,
  Sparkles,
  Wallet
} from "lucide-react";

interface Transaction {
  id: string;
  trackId: string;
  trackTitle: string;
  amount: number;
  createdAt: string;
  buyerName: string;
  type: "internal";
}

interface ExternalTransaction {
  id: string;
  trackId: string;
  trackTitle: string;
  amount: number;
  completedAt: string;
  buyerEmail: string;
  affiliateCode: string | null;
  type: "external";
}

interface Track {
  id: string;
  title: string;
  sourceType: string;
  sharingEnabled: boolean;
  sharingMode: string | null;
  salePrice: number | null;
  publicPlayCount: number;
  externalPurchasesCount: number;
}

interface AffiliateLink {
  id: string;
  name: string;
  code: string;
  clickCount: number;
  playCount: number;
  purchaseCount: number;
  totalRevenue: number;
  trackId: string;
  trackTitle: string;
  trackShareId: string | null;
}

interface BusinessPageClientProps {
  isPro: boolean;
  totalEarnings: number;
  totalInternalEarnings: number;
  totalExternalEarnings: number;
  pendingBalance: number;
  hasStripeAccount: boolean;
  tracksForSale: Track[];
  uploadedTracks: Track[];
  affiliateLinks: AffiliateLink[];
  internalPurchases: Transaction[];
  externalPurchases: ExternalTransaction[];
}

export function BusinessPageClient({
  isPro,
  totalEarnings,
  totalInternalEarnings,
  totalExternalEarnings,
  pendingBalance,
  hasStripeAccount,
  tracksForSale,
  uploadedTracks,
  affiliateLinks,
  internalPurchases,
  externalPurchases,
}: BusinessPageClientProps) {
  // Combine and sort all transactions
  const allTransactions = [
    ...internalPurchases.map(p => ({
      id: p.id,
      trackId: p.trackId,
      trackTitle: p.trackTitle,
      amount: p.amount,
      date: p.createdAt,
      buyer: p.buyerName,
      type: "peer" as const,
      affiliateCode: null,
    })),
    ...externalPurchases.map(p => ({
      id: p.id,
      trackId: p.trackId,
      trackTitle: p.trackTitle,
      amount: p.amount,
      date: p.completedAt,
      buyer: p.buyerEmail,
      type: "public" as const,
      affiliateCode: p.affiliateCode,
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate this month's earnings
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const thisMonthTransactions = allTransactions.filter(
    (t) => new Date(t.date) >= startOfMonth
  );
  const thisMonthEarnings = thisMonthTransactions.reduce(
    (sum, t) => sum + t.amount,
    0
  );

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-black/10">
          <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-black/40 mb-2">
            Business
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-black">
            Sales & Earnings
          </h1>
          <div className="flex items-center gap-4 text-sm mt-2">
            <span className="text-black/60">
              {tracksForSale.length} track{tracksForSale.length !== 1 ? 's' : ''} for sale
            </span>
            <span className="text-black/20">&bull;</span>
            <span className="text-black/60">
              {affiliateLinks.length} affiliate link{affiliateLinks.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {!isPro ? (
          <div className="relative">
            <div className="pointer-events-none select-none blur-sm opacity-60">
              {/* Demo content */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card variant="soft" elevated>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold font-mono text-black/40 uppercase tracking-widest">
                          Total Earned
                        </p>
                        <p className="text-3xl font-bold mt-2">$245.50</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-teal-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="absolute inset-0 flex items-start justify-center pt-10">
              <Card variant="soft" elevated className="border-2 border-purple-400 rounded-3xl overflow-hidden w-full max-w-2xl">
                <CardContent className="pt-6 text-center py-10">
                  <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-5">
                    <ShoppingCart className="h-7 w-7 text-teal-600" />
                  </div>
                  <h2 className="text-2xl font-black mb-2">Upload Tracks to Unlock Sales</h2>
                  <p className="text-sm text-black/70 max-w-lg mx-auto mb-6">
                    Upload your tracks (MP3/WAV) to enable public sharing, sell downloads, track affiliate campaigns, and manage all your earnings in one place.
                  </p>
                  <Link href="/submit">
                    <Button variant="primary" size="lg">
                      Upload a Track
                      <Sparkles className="h-5 w-5 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card variant="soft" elevated>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold font-mono text-black/40 uppercase tracking-widest">
                        Total Earned
                      </p>
                      <p className="text-3xl font-bold mt-2">
                        ${(totalEarnings / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-black/50 mt-1">
                        all time
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-teal-600" />
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
                        {thisMonthTransactions.length} sale{thisMonthTransactions.length !== 1 ? 's' : ''}
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
                        Available
                      </p>
                      <p className="text-3xl font-bold mt-2 text-emerald-600">
                        ${(pendingBalance / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-black/50 mt-1">
                        to withdraw
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Wallet className="h-6 w-6 text-emerald-600" />
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
                      <p className="text-3xl font-bold mt-2">{affiliateLinks.length}</p>
                      <p className="text-xs text-black/50 mt-1">
                        affiliate campaigns
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <LinkIcon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Earnings Breakdown */}
            <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] mb-8">
              <div className="space-y-6">
                {/* All Transactions */}
                <Card variant="soft" elevated>
                  <CardHeader>
                    <CardTitle>All Transactions ({allTransactions.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {allTransactions.length === 0 ? (
                      <div className="text-center py-12 text-black/40">
                        <Music className="h-10 w-10 mx-auto mb-4 text-black/20" />
                        <p>No sales yet</p>
                        <p className="text-sm mt-1">
                          Enable sharing on your tracks to start earning
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {allTransactions.slice(0, 20).map((transaction) => (
                          <Link
                            key={transaction.id}
                            href={`/artist/tracks/${transaction.trackId}`}
                            className="flex items-center justify-between gap-3 rounded-xl bg-white/60 border border-black/10 px-4 py-3 hover:bg-white transition-colors duration-150 ease-out"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                <Music className="h-5 w-5 text-emerald-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-black truncate">
                                  {transaction.trackTitle}
                                </p>
                                <p className="text-xs text-black/40">
                                  {transaction.buyer} &middot;{" "}
                                  {transaction.type === "peer" ? "Peer Purchase" : "Public Sale"}
                                  {transaction.affiliateCode && ` via ${transaction.affiliateCode}`}
                                  {" "}&middot; {formatDate(transaction.date)}
                                </p>
                              </div>
                            </div>
                            <span className="text-emerald-600 font-medium text-sm flex-shrink-0">
                              +${(transaction.amount / 100).toFixed(2)}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tracks For Sale */}
                {uploadedTracks.length > 0 && (
                  <Card variant="soft" elevated>
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
                                          <span className="flex items-center gap-1 px-2 py-0.5 bg-teal-100 text-teal-700 font-bold rounded">
                                            <Eye className="h-3 w-3" />
                                            Exposure Mode
                                          </span>
                                        )}
                                        <span>&bull;</span>
                                        <span>{track.externalPurchasesCount} sales</span>
                                        <span>&bull;</span>
                                        <span>{track.publicPlayCount} plays</span>
                                      </>
                                    ) : (
                                      <span className="text-black/40">Not shared yet</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Link href={`/artist/tracks/${track.id}`}>
                              <Button size="sm" variant="airy">
                                Manage
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Affiliate Links */}
                {affiliateLinks.length > 0 && (
                  <Card variant="soft" elevated>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Affiliate Campaigns ({affiliateLinks.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {affiliateLinks.map((link) => (
                          <div
                            key={link.id}
                            className="p-4 bg-white border-2 border-black/10 rounded-xl"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="font-bold truncate">{link.name}</p>
                                <p className="text-sm text-black/60 mt-1 truncate">
                                  {link.trackTitle}
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
                                      <span className="font-bold text-teal-600">
                                        ${(link.totalRevenue / 100).toFixed(2)}
                                      </span>{" "}
                                      earned
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs text-black/40 font-mono">{link.code}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Payout Card */}
                <Card variant="soft" elevated>
                  <CardContent className="pt-6">
                    <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-4">
                      Payouts
                    </p>
                    <div>
                      {pendingBalance > 0 ? (
                        <>
                          <p className="text-sm text-black/60 mb-4">
                            You have{" "}
                            <span className="font-medium text-emerald-600">
                              ${(pendingBalance / 100).toFixed(2)}
                            </span>{" "}
                            available to withdraw.
                          </p>
                          {hasStripeAccount ? (
                            <Link href="/artist/account">
                              <Button variant="airyOutline" className="w-full">
                                Manage payouts
                              </Button>
                            </Link>
                          ) : (
                            <Link href="/artist/account">
                              <Button variant="airyPrimary" className="w-full">
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

                {/* Earnings Breakdown */}
                <Card variant="soft" elevated>
                  <CardContent className="pt-6">
                    <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-4">
                      Earnings Breakdown
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-black/60">Peer Reviews</span>
                        <span className="font-bold">
                          ${(totalInternalEarnings / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-black/60">Public Sales</span>
                        <span className="font-bold">
                          ${(totalExternalEarnings / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="pt-3 border-t border-black/10">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold">Total</span>
                          <span className="font-bold text-lg">
                            ${(totalEarnings / 100).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* How it works */}
                <Card variant="soft">
                  <CardContent className="pt-6">
                    <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-3">
                      How it works
                    </p>
                    <div className="space-y-2 text-sm text-black/60">
                      <p>1. Upload tracks and enable sharing</p>
                      <p>2. Listeners can purchase after reviewing</p>
                      <p>3. Create affiliate links for campaigns</p>
                      <p>4. Withdraw earnings via Stripe</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function formatDate(date: string): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
