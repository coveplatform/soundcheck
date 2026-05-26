import { ArrowLeft, Star, Gem, Music } from "lucide-react";
import Link from "next/link";

const DEMO_REVIEWERS = [
  {
    initial: "J",
    firstName: "Jamie",
    title: "Top Reviewer",
    specialty: "Mixing",
    genres: ["Hip-Hop", "R&B"],
    totalReviews: 34,
    averageRating: 4.7,
    gemCount: 6,
    featuredTrack: {
      title: "After Midnight",
      artistName: "Jamie Carter",
      artworkUrl: null,
    },
  },
  {
    initial: "S",
    firstName: "Sofia",
    title: "Industry Expert",
    specialty: "Songwriting",
    genres: ["Pop", "Indie"],
    totalReviews: 81,
    averageRating: 4.9,
    gemCount: 22,
    featuredTrack: null,
  },
  {
    initial: "M",
    firstName: "Marcus",
    title: "Trusted Ear",
    specialty: "Arrangement",
    genres: ["Electronic", "House"],
    totalReviews: 19,
    averageRating: 4.2,
    gemCount: 3,
    featuredTrack: {
      title: "Grid Lock",
      artistName: "M. Webb",
      artworkUrl: null,
    },
  },
];

function ReviewerCard({ reviewer }: { reviewer: (typeof DEMO_REVIEWERS)[0] }) {
  const ratingStars = Math.round(reviewer.averageRating);

  return (
    <div className="space-y-3">
      {/* Identity card */}
      <div className="bg-white rounded-2xl border border-black/8 shadow-sm overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-purple-600 to-purple-800" />
        <div className="px-6 pb-6">
          <div className="-mt-8 mb-4 flex items-end justify-between">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 border-4 border-white flex items-center justify-center text-2xl font-black text-white shadow-md">
              {reviewer.initial}
            </div>
            {reviewer.title && (
              <span className="text-[11px] font-black px-3 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                {reviewer.title}
              </span>
            )}
          </div>

          <h3 className="text-2xl font-black text-black tracking-tight">{reviewer.firstName}</h3>

          {reviewer.specialty && (
            <p className="text-sm font-semibold text-neutral-500 mt-0.5">
              Focuses on <span className="text-purple-700">{reviewer.specialty}</span>
            </p>
          )}

          {reviewer.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {reviewer.genres.map((g) => (
                <span key={g} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/5 text-neutral-600">
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-black/8 p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-black">{reviewer.totalReviews}</p>
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mt-0.5">Reviews</p>
        </div>
        <div className="bg-white rounded-xl border border-black/8 p-4 text-center shadow-sm">
          <div className="flex items-center justify-center gap-0.5 mb-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${i < ratingStars ? "text-amber-400 fill-amber-400" : "text-black/10 fill-black/10"}`}
              />
            ))}
          </div>
          <p className="text-2xl font-black text-black leading-none">{reviewer.averageRating.toFixed(1)}</p>
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mt-0.5">Rating</p>
        </div>
        <div className="bg-white rounded-xl border border-black/8 p-4 text-center shadow-sm">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Gem className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-black leading-none">{reviewer.gemCount}</p>
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mt-0.5">Gems</p>
        </div>
      </div>

      {/* Their own track */}
      {reviewer.featuredTrack && (
        <div className="bg-white rounded-2xl border border-black/8 shadow-sm p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-3">
            Also an artist
          </p>
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-purple-100 flex items-center justify-center">
              <Music className="h-6 w-6 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm text-black truncate">{reviewer.featuredTrack.title}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{reviewer.featuredTrack.artistName}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReviewerProfileDemoPage() {
  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-black transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Admin
        </Link>
        <h1 className="text-2xl font-black text-neutral-950">Reviewer Profile — Demo</h1>
        <p className="text-sm text-neutral-500 mt-1">
          What artists see when they click "View reviewer" on a review card. Max width is 576px (xl:max-w-xl on the live page).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {DEMO_REVIEWERS.map((reviewer) => (
          <div key={reviewer.firstName} className="max-w-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-3">
              {reviewer.title}
            </p>
            <ReviewerCard reviewer={reviewer} />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
        <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">How titles are earned</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          {[
            { title: "Industry Expert", rule: "Manually flagged by admin" },
            { title: "Gem Listener", rule: "10+ gems awarded" },
            { title: "Top Reviewer", rule: "4.5+ rating & 30+ reviews" },
            { title: "Trusted Ear", rule: "4.0+ rating & 15+ reviews" },
            { title: "Veteran Listener", rule: "50+ reviews" },
            { title: "Active Reviewer", rule: "20+ reviews" },
          ].map(({ title, rule }) => (
            <div key={title} className="bg-white rounded-lg border border-neutral-200 p-3">
              <p className="font-bold text-neutral-800">{title}</p>
              <p className="text-neutral-500 mt-0.5">{rule}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
