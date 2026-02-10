"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Music, ExternalLink, Play, Users, CheckCircle2, Star, Download } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type PublicTrack = {
  id: string;
  trackShareId: string;
  title: string;
  artworkUrl: string | null;
  sourceUrl: string;
  sourceType: string;
  sharingMode: string;
  salePrice: number | null;
  publicPlayCount: number;
  duration: number | null;
  Genre: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  ArtistProfile: {
    id: string;
    artistName: string;
  };
  reviewStats: {
    averageScores: {
      production: number;
      originality: number;
      vocal: number;
    };
    totalReviews: number;
    wouldListenAgainPercent: number;
    Review: Array<any>;
  } | null;
};

type PlatformStats = {
  activeListeners: number;
  totalReviews: number;
  avgResponseTime: string;
};

export default function PublicTrackPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const trackShareId = params.trackShareId as string;
  const affiliateCode = searchParams.get("ref");

  const [track, setTrack] = useState<PublicTrack | null>(null);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);

  useEffect(() => {
    async function loadTrack() {
      try {
        const url = `/api/t/${trackShareId}${affiliateCode ? `?ref=${affiliateCode}` : ""}`;
        const res = await fetch(url);

        if (!res.ok) {
          if (res.status === 404) {
            setError("Track not found");
          } else if (res.status === 403) {
            setError("This track is not publicly shared");
          } else {
            setError("Failed to load track");
          }
          setLoading(false);
          return;
        }

        const data = await res.json();
        setTrack(data.track);
        setPlatformStats(data.platformStats);
        setLoading(false);
      } catch (err) {
        console.error("Error loading track:", err);
        setError("Failed to load track");
        setLoading(false);
      }
    }

    loadTrack();
  }, [trackShareId, affiliateCode]);

  const handlePlay = () => {
    if (!hasPlayed && track) {
      setHasPlayed(true);
      // Track play event
      fetch(`/api/t/${trackShareId}/play`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliateCode }),
      }).catch((err) => console.error("Failed to track play:", err));
    }
  };

  const handlePurchase = async () => {
    if (!showCheckoutForm) {
      setShowCheckoutForm(true);
      return;
    }

    if (!buyerEmail) {
      alert("Please enter your email address");
      return;
    }

    setPurchasing(true);

    try {
      const res = await fetch(`/api/t/${trackShareId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerEmail,
          buyerName: buyerName || undefined,
          affiliateCode: affiliateCode || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create checkout");
      }

      // Redirect to Stripe checkout
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      alert(err.message || "Failed to start checkout. Please try again.");
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
          <p className="mt-4 text-sm text-black/60">Loading track...</p>
        </div>
      </div>
    );
  }

  if (error || !track) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4">
        <Card variant="soft" elevated className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-bold text-black">{error || "Track not found"}</h2>
            <p className="mt-2 text-sm text-black/60">
              {error === "This track is not publicly shared"
                ? "This track is private and only accessible to the ArtistProfile."
                : "The track you're looking for doesn't exist or has been removed."}
            </p>
            <div className="mt-6">
              <Link href="/">
                <Button variant="airyPrimary">Go to Homepage</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSalesMode = track.sharingMode === "SALES";
  const avgScore = track.reviewStats
    ? ((track.reviewStats.averageScores.production +
        track.reviewStats.averageScores.originality +
        track.reviewStats.averageScores.vocal) / 3).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-[#faf8f5] text-neutral-950">
      {/* Header */}
      <header className="border-b-2 border-black bg-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <Link href="/signup">
            <Button
              size="sm"
              className="bg-purple-600 text-black hover:bg-purple-500 font-bold text-xs border-2 border-black"
            >
              Get Feedback
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Social Proof Banner */}
        {platformStats && (
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 border-2 border-purple-500 text-purple-900 font-bold text-sm">
              <Users className="h-4 w-4" />
              <span>
                Reviewed by {platformStats.activeListeners.toLocaleString()}+ active music listeners
              </span>
            </div>
          </div>
        )}

        {/* Track Card */}
        <Card variant="soft" elevated className="overflow-hidden rounded-3xl">
          <CardContent className="p-0">
            {/* Hero Section */}
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Artwork */}
                <div className="w-full sm:w-48 sm:h-48 h-64 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex-shrink-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] overflow-hidden">
                  {track.artworkUrl ? (
                    <img
                      src={track.artworkUrl}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-20 h-20 text-white/30" />
                    </div>
                  )}
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold font-mono text-black/40 uppercase tracking-widest">
                    Track
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-black mt-2 break-words">
                    {track.title}
                  </h1>
                  <p className="text-lg text-black/60 mt-2">{track.ArtistProfile.artistName}</p>

                  {/* Genre Pills */}
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    {track.Genre.map((genre) => (
                      <span
                        key={genre.id}
                        className="px-3 py-1 bg-white border-2 border-black rounded-full text-sm font-bold text-black"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>

                  {/* Review Stats */}
                  {track.reviewStats && avgScore && (
                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Star className="h-5 w-5 fill-purple-500 text-purple-500" />
                        <span className="text-2xl font-bold">{avgScore}</span>
                        <span className="text-sm text-black/50">/5.0</span>
                      </div>
                      <div className="text-sm text-black/60">
                        {track.reviewStats.totalReviews} {track.reviewStats.totalReviews === 1 ? "review" : "reviews"}
                      </div>
                      {track.reviewStats.wouldListenAgainPercent > 0 && (
                        <div className="flex items-center gap-1 text-sm text-purple-700">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>{track.reviewStats.wouldListenAgainPercent}% would listen again</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-4 mt-6">
                    {isSalesMode && track.salePrice && !showCheckoutForm ? (
                      <Button
                        onClick={handlePurchase}
                        disabled={purchasing}
                        className="bg-purple-500 hover:bg-purple-400 text-black border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Buy & Download - ${(track.salePrice / 100).toFixed(2)}
                      </Button>
                    ) : null}

                    {/* Checkout Form */}
                    {isSalesMode && showCheckoutForm && (
                      <Card variant="soft" className="p-4">
                        <h4 className="font-bold mb-3">Complete your purchase</h4>
                        <div className="space-y-3">
                          <div>
                            <label htmlFor="buyerEmail" className="block text-sm font-bold mb-1">
                              Email Address *
                            </label>
                            <input
                              id="buyerEmail"
                              type="email"
                              value={buyerEmail}
                              onChange={(e) => setBuyerEmail(e.target.value)}
                              placeholder="you@example.com"
                              className="w-full px-3 py-2 border-2 border-black rounded text-sm"
                              required
                            />
                            <p className="text-xs text-black/50 mt-1">
                              We'll send your download link here
                            </p>
                          </div>
                          <div>
                            <label htmlFor="buyerName" className="block text-sm font-bold mb-1">
                              Name (Optional)
                            </label>
                            <input
                              id="buyerName"
                              type="text"
                              value={buyerName}
                              onChange={(e) => setBuyerName(e.target.value)}
                              placeholder="Your name"
                              className="w-full px-3 py-2 border-2 border-black rounded text-sm"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={handlePurchase}
                              disabled={purchasing}
                              className="flex-1 bg-purple-500 hover:bg-purple-400 text-black border-2 border-black font-bold"
                            >
                              {purchasing ? "Processing..." : `Pay $${((track.salePrice ?? 0) / 100).toFixed(2)}`}
                            </Button>
                            <Button
                              onClick={() => setShowCheckoutForm(false)}
                              disabled={purchasing}
                              variant="airy"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )}

                    <div className="flex items-center gap-3">
                      <a
                        href={track.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handlePlay}
                        className="inline-block"
                      >
                        <Button
                          variant={isSalesMode ? "airy" : "default"}
                          className={
                            !isSalesMode
                              ? "bg-purple-500 hover:bg-purple-400 text-black border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                              : ""
                          }
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {track.sourceType === "UPLOAD" ? "Stream" : `Listen on ${track.sourceType}`}
                        </Button>
                      </a>
                    </div>
                  </div>

                  {/* Play Count */}
                  {track.publicPlayCount > 0 && (
                    <div className="mt-4 text-sm text-black/50 font-mono">
                      {track.publicPlayCount.toLocaleString()} plays
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reviews Preview (if enabled) */}
            {track.reviewStats && track.reviewStats.Review.length > 0 && (
              <div className="border-t-2 border-black/10 p-6 sm:p-8 bg-neutral-50">
                <h3 className="text-xs font-bold font-mono text-black/40 uppercase tracking-widest mb-4">
                  What Listeners Are Saying
                </h3>
                <div className="space-y-4">
                  {track.reviewStats.Review.slice(0, 2).map((review) => (
                    <div key={review.id} className="bg-white border-2 border-black/10 p-4 rounded-xl">
                      {review.bestPart && (
                        <p className="text-sm text-black/80 italic">
                          "{review.bestPart.slice(0, 150)}
                          {review.bestPart.length > 150 ? "..." : ""}"
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-black/50">
                        {review.ReviewerProfile.tier === "PRO" && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 font-bold rounded">
                            PRO
                          </span>
                        )}
                        <span>Verified Listener</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card variant="soft" elevated className="mt-8">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold text-black mb-2">Want feedback like this?</h2>
            <p className="text-black/70 max-w-xl mx-auto mb-6">
              Get 5-20 honest reviews from genre-matched listeners before you release. Join{" "}
              {platformStats?.activeListeners.toLocaleString()}+ active music fans.
            </p>
            <Link href="/signup">
              <Button className="bg-purple-500 hover:bg-purple-400 text-black border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                Get Feedback
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-neutral-500 hover:text-black text-sm transition-colors">
            <Logo className="h-5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
