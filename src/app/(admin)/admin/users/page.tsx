import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 100;

function getRelativeTime(date: Date | null): string {
  if (!date) return '—';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; filter?: string; demo?: string }>;
}) {
  const { q: query, page: pageParam, filter: filterParam, demo: demoParam } = await searchParams;
  const q = typeof query === "string" ? query.trim() : "";
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const filter = filterParam || "";
  const showDemo = demoParam === "show";

  // Patterns for seed/demo/test/internal accounts
  const DEMO_EMAIL_PATTERNS = [
    "@seed.mixreflect.com",
    "@mixreflect.com",
    "@example.com",
    "@soundcheck.com",
  ];
  const DEMO_EMAIL_EXACT = [
    "testlink@gmail.com",
    "testlink2@gmail.com",
    "testyjoe@gmail.com",
    "steveking1@gmail.com",
    "bobthewizard1@gmail.com",
    "bigdog1@bigdogco.com",
    "bigdogman2@gmail.com",
    "gogo45@gmail.com",
    "bogushogus@gmail.com",
    "hot23@gmail.com",
    "bigbadbozo@gmail.com",
    // Seed / fake reviewer accounts used for review injection
    "marcus.chen.music@gmail.com",
    "sarahbeatsldn@hotmail.com",
    "djmikewilliams@yahoo.com",
    "emilysounddesign@gmail.com",
    "olivia.musichead@icloud.com",
    "ryan.audioeng@gmail.com",
    "natasha.beats@hotmail.com",
    "chris.soundwave@gmail.com",
    "jessica.melodic@yahoo.com",
    "sophie.synths@outlook.com",
    "kevin.grooves@gmail.com",
    "amanda.vibes@icloud.com",
    "tyler.mixmaster@gmail.com",
    "rachel.audiophile@hotmail.com",
    "brandon.lowend@gmail.com",
    "megan.frequencies@yahoo.com",
    "david.waveform@gmail.com",
    "natasha.beats@hotmail.com",
    "chris.soundwave@gmail.com",
    // Additional test / friends / family accounts
    "daniel.basshead@gmail.com",
    "alexkimbeats@gmail.com",
    "poopdogwe@google.com",
    "poopdogger@poop.com",
    "soord@fksss.com",
    "soord@fk.com",
    "kris@kris.com",
    "poop@poop.com",
    "steve2@steve.com",
    "stevejob@job.com",
    "cove.platform@proton.me",
    "test@test.com",
    "tether.platform@proton.me",
    "jones@jones.com",
    "steveo23@gmail.com",
    "james.producer.uk@outlook.com",
    "sean@spdafy.com",
    // Family / friends
    "qairulothman@gmail.com",
    "imogengravina@gmail.com",
    "bjorn@bjornengelhardt.com",
    "a.engelhardt101@gmail.com",
    "simlimsd3@gmail.com",
    "kris.engelhardt4@gmail.com",
    "millersport98@gmail.com",
    "illy81095@gmail.com",
    "poop1@poop.com",
    "testthedog23@pooper.com",
    "testman1@testman1.com",
    "bigman1@poop.com",
    "bigdog1@gmail.com",
    "pash.tzaikos@gmail.com",
    "steve@steve.com",
  ];

  // Build where clause
  const whereClause: any = {};

  if (q) {
    whereClause.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
    ];
  }

  if (filter === "tracks") {
    whereClause.isArtist = true;
  } else if (filter === "reviews") {
    whereClause.isReviewer = true;
  } else if (filter === "inactive") {
    whereClause.isArtist = false;
    whereClause.isReviewer = false;
  }

  if (!showDemo) {
    whereClause.AND = [
      ...DEMO_EMAIL_PATTERNS.map((pattern) => ({
        email: { not: { contains: pattern } },
      })),
      { email: { notIn: DEMO_EMAIL_EXACT } },
    ];
  }

  // Get total count
  const totalUsers = await prisma.user.count({ where: whereClause });
  const totalPages = Math.ceil(totalUsers / PAGE_SIZE);

  const users = await prisma.user.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      email: true,
      name: true,
      isArtist: true,
      isReviewer: true,
      createdAt: true,
      lastActiveAt: true,
      referredByCode: true,
      totalReferrals: true,
      ArtistProfile: {
        select: {
          artistName: true,
          completedOnboarding: true,
          totalPeerReviews: true,
          reviewCredits: true,
          totalTracks: true,
          Track: {
            select: {
              reviewsRequested: true,
              status: true,
            },
          },
        },
      },
      ReviewerProfile: {
        select: {
          completedOnboarding: true,
          onboardingQuizPassed: true,
          totalReviews: true,
        },
      },
    },
  });

  // Build URL helper
  const buildUrl = (params: { page?: number; q?: string; filter?: string; demo?: string }) => {
    const url = new URLSearchParams();
    if (params.q ?? q) url.set("q", params.q ?? q);
    if (params.filter ?? filter) url.set("filter", params.filter ?? filter);
    if ((params.page ?? page) > 1) url.set("page", String(params.page ?? page));
    const demoVal = params.demo ?? (showDemo ? "show" : "");
    if (demoVal === "show") url.set("demo", "show");
    return `/admin/users${url.toString() ? `?${url.toString()}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-neutral-500">
          {totalUsers} total users {q && `matching "${q}"`}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <form className="flex gap-2 flex-1 min-w-[200px]" action="/admin/users" method="GET">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search email or name"
            className="flex-1 h-9 px-3 border border-neutral-200 rounded-md text-sm"
          />
          {filter && <input type="hidden" name="filter" value={filter} />}
          {showDemo && <input type="hidden" name="demo" value="show" />}
          <button
            type="submit"
            className="h-9 px-3 rounded-md text-sm font-medium bg-neutral-900 text-white"
          >
            Search
          </button>
        </form>

        <div className="flex gap-1">
          <Link
            href={buildUrl({ filter: "", page: 1 })}
            className={`h-9 px-3 rounded-md text-sm font-medium flex items-center ${
              !filter ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            All
          </Link>
          <Link
            href={buildUrl({ filter: "tracks", page: 1 })}
            className={`h-9 px-3 rounded-md text-sm font-medium flex items-center ${
              filter === "tracks" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            Has Tracks
          </Link>
          <Link
            href={buildUrl({ filter: "reviews", page: 1 })}
            className={`h-9 px-3 rounded-md text-sm font-medium flex items-center ${
              filter === "reviews" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            Has Reviews
          </Link>
          <Link
            href={buildUrl({ filter: "inactive", page: 1 })}
            className={`h-9 px-3 rounded-md text-sm font-medium flex items-center ${
              filter === "inactive" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            Inactive
          </Link>
          <span className="w-px h-6 bg-neutral-200 mx-1" />
          <Link
            href={buildUrl({ demo: showDemo ? "" : "show", page: 1 })}
            className={`h-9 px-3 rounded-md text-sm font-medium flex items-center ${
              showDemo ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            {showDemo ? "Demo" : "Demo"}
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="text-left font-medium px-3 py-2">Email</th>
                <th className="text-left font-medium px-3 py-2">Artist Name</th>
                <th className="text-right font-medium px-3 py-2">Uploaded</th>
                <th className="text-right font-medium px-3 py-2">In Queue</th>
                <th className="text-right font-medium px-3 py-2">Reviews</th>
                <th className="text-right font-medium px-3 py-2">Credits</th>
                <th className="text-right font-medium px-3 py-2">Refs</th>
                <th className="text-left font-medium px-3 py-2">Ref By</th>
                <th className="text-left font-medium px-3 py-2">Active</th>
                <th className="text-left font-medium px-3 py-2">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users.map((u) => {
                const tracksPosted = u.ArtistProfile?.totalTracks ?? 0;
                const tracksInQueue = u.ArtistProfile?.Track?.filter(t =>
                  t.status === "QUEUED" || t.status === "IN_PROGRESS" || t.status === "PENDING_PAYMENT"
                ).length ?? 0;
                const peerReviewsDone = u.ArtistProfile?.totalPeerReviews ?? 0;
                const proReviewsDone = u.ReviewerProfile?.totalReviews ?? 0;
                const reviewsDone = peerReviewsDone + proReviewsDone;

                return (
                <tr key={u.id} className="text-neutral-700 hover:bg-neutral-50">
                  <td className="px-3 py-2">
                    <Link className="underline hover:text-purple-600" href={`/admin/users/${u.id}`}>
                      {u.email}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-neutral-500">{u.ArtistProfile?.artistName ?? u.name ?? ""}</td>
                  <td className="px-3 py-2 text-right">
                    {tracksPosted > 0 ? (
                      <span className={`font-medium tabular-nums ${tracksPosted >= 5 ? 'text-green-600' : tracksPosted >= 3 ? 'text-blue-600' : ''}`}>
                        {tracksPosted}
                      </span>
                    ) : (
                      <span className="text-neutral-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {tracksInQueue > 0 ? (
                      <span className="font-medium tabular-nums text-purple-600">{tracksInQueue}</span>
                    ) : (
                      <span className="text-neutral-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {reviewsDone > 0 ? (
                      <span className={`font-medium tabular-nums ${reviewsDone >= 25 ? 'text-purple-600' : reviewsDone >= 5 ? 'text-blue-600' : ''}`}>
                        {reviewsDone}
                      </span>
                    ) : (
                      <span className="text-neutral-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {u.ArtistProfile ? (
                      <span className="font-medium tabular-nums">{u.ArtistProfile.reviewCredits ?? 0}</span>
                    ) : (
                      <span className="text-neutral-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {(u.totalReferrals ?? 0) > 0 ? (
                      <span className="font-medium tabular-nums text-green-600">{u.totalReferrals}</span>
                    ) : (
                      <span className="text-neutral-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {u.referredByCode ? (
                      <span className="inline-flex items-center font-mono font-medium px-1 py-0.5 rounded bg-green-50 text-green-700">{u.referredByCode}</span>
                    ) : (
                      <span className="text-neutral-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {u.lastActiveAt ? (
                      <span className={
                        new Date().getTime() - new Date(u.lastActiveAt).getTime() < 86400000
                          ? 'text-green-600 font-medium'
                          : new Date().getTime() - new Date(u.lastActiveAt).getTime() < 604800000
                          ? 'text-blue-600'
                          : 'text-neutral-500'
                      } title={new Date(u.lastActiveAt).toLocaleString()}>
                        {getRelativeTime(u.lastActiveAt)}
                      </span>
                    ) : (
                      <span className="text-neutral-300">Never</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-neutral-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-neutral-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalUsers)} of {totalUsers}
          </p>
          <div className="flex gap-1">
            {page > 1 && (
              <Link
                href={buildUrl({ page: page - 1 })}
                className="h-9 px-3 rounded-md text-sm font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200 flex items-center"
              >
                Previous
              </Link>
            )}

            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <Link
                  key={pageNum}
                  href={buildUrl({ page: pageNum })}
                  className={`h-9 w-9 rounded-md text-sm font-medium flex items-center justify-center ${
                    pageNum === page
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`}
                >
                  {pageNum}
                </Link>
              );
            })}

            {page < totalPages && (
              <Link
                href={buildUrl({ page: page + 1 })}
                className="h-9 px-3 rounded-md text-sm font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200 flex items-center"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
