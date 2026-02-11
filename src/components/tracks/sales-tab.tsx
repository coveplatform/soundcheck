"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrackSharingButton } from "@/components/artist/track-sharing-button";
import {
  DollarSign,
  TrendingUp,
  LinkIcon,
  BarChart3,
  Music,
  ExternalLink,
  Eye,
  ShoppingCart
} from "lucide-react";
import Link from "next/link";

interface SalesTabProps {
  track: {
    id: string;
    title: string;
    sourceType: string;
    sharingEnabled: boolean;
    sharingMode: string | null;
    salePrice: number | null;
    trackShareId: string | null;
    publicPlayCount: number;
  };
  internalPurchases: Array<{
    id: string;
    amount: number;
    createdAt: Date;
    ReviewerProfile_Purchase_reviewerIdToReviewerProfile: {
      User: {
        name: string | null;
      };
    };
  }>;
  externalPurchases: Array<{
    id: string;
    artistAmount: number;
    completedAt: Date | null;
    buyerEmail: string;
    affiliateCode: string | null;
  }>;
  affiliateLinks: Array<{
    id: string;
    name: string;
    code: string;
    clickCount: number;
    playCount: number;
    purchaseCount: number;
    totalRevenue: number;
  }>;
  totalInternalEarnings: number;
  totalExternalEarnings: number;
}

export function SalesTab({
  track,
  internalPurchases,
  externalPurchases,
  affiliateLinks,
  totalInternalEarnings,
  totalExternalEarnings
}: SalesTabProps) {
  const totalEarnings = totalInternalEarnings + totalExternalEarnings;
  const allSales = [
    ...internalPurchases.map(p => ({
      id: p.id,
      amount: p.amount,
      date: p.createdAt,
      buyer: p.ReviewerProfile_Purchase_reviewerIdToReviewerProfile.User.name || "Anonymous",
      type: "internal" as const,
      affiliateCode: null
    })),
    ...externalPurchases.map(p => ({
      id: p.id,
      amount: p.artistAmount,
      date: p.completedAt || new Date(),
      buyer: p.buyerEmail,
      type: "external" as const,
      affiliateCode: p.affiliateCode
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const isUpload = track.sourceType === "UPLOAD";
  const canEnableSales = isUpload;

  return (
    <div className="space-y-6">
      {/* Earnings Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  from this track
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
                  Sales
                </p>
                <p className="text-3xl font-bold mt-2">
                  {allSales.length}
                </p>
                <p className="text-xs text-black/50 mt-1">
                  {internalPurchases.length} peer + {externalPurchases.length} public
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
                  Plays
                </p>
                <p className="text-3xl font-bold mt-2">
                  {track.publicPlayCount}
                </p>
                <p className="text-xs text-black/50 mt-1">
                  public listens
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sharing Settings */}
      <Card variant="soft" elevated>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Sharing & Sales Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {canEnableSales ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {track.sharingEnabled ? (
                      track.sharingMode === "SALES" ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 font-bold rounded text-sm">
                          <ShoppingCart className="h-3 w-3" />
                          For Sale - ${((track.salePrice || 0) / 100).toFixed(2)}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-teal-100 text-teal-700 font-bold rounded text-sm">
                          <Eye className="h-3 w-3" />
                          Exposure Mode
                        </span>
                      )
                    ) : (
                      <span className="text-black/40 text-sm">Not shared publicly</span>
                    )}
                  </div>
                  <p className="text-sm text-black/60">
                    {track.sharingEnabled
                      ? "Your track is publicly accessible and earning you exposure."
                      : "Enable sharing to let anyone listen and purchase your track."}
                  </p>
                </div>
                <TrackSharingButton
                  trackId={track.id}
                  trackTitle={track.title}
                  sourceType={track.sourceType}
                  sharingEnabled={track.sharingEnabled}
                />
              </div>

            </div>
          ) : (
            <div className="text-center py-6">
              <Music className="h-10 w-10 text-black/20 mx-auto mb-3" />
              <p className="text-sm text-black/60 mb-2">
                Only uploaded tracks can be shared and sold
              </p>
              <p className="text-xs text-black/40">
                Linked tracks (SoundCloud, Bandcamp, etc.) support exposure tracking only
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Affiliate Links */}
      {affiliateLinks.length > 0 && (
        <Card variant="soft" elevated>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Affiliate Links ({affiliateLinks.length})
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

      {/* Sales History */}
      {allSales.length > 0 && (
        <Card variant="soft" elevated>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3 bg-white border border-black/10 rounded-lg"
                >
                  <div>
                    <p className="font-bold text-sm">{sale.buyer}</p>
                    <p className="text-xs text-black/50 mt-1">
                      {sale.type === "internal" ? "Peer Review Purchase" : "Public Purchase"}
                      {sale.affiliateCode && ` · via ${sale.affiliateCode}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-teal-600">
                      +${(sale.amount / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-black/50">
                      {new Date(sale.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {allSales.length === 0 && (
        <Card variant="soft" elevated>
          <CardContent className="pt-6 text-center py-12">
            <Music className="h-16 w-16 text-black/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No sales yet</h3>
            <p className="text-black/60 max-w-md mx-auto">
              {track.sharingEnabled
                ? "Sales from listeners will appear here once they purchase your track."
                : "Enable sharing to start selling your track to listeners."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
