import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getScoreStatsForEmails, type ScoreStats } from "@/lib/admin-score-stats";
import { TierBadge, SortHeader, getRelativeTime, mono } from "../../admin-ui";

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 100;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; filter?: string; demo?: string; sort?: string; dir?: string }>;
}) {
  const { q: query, page: pageParam, filter: filterParam, demo: demoParam, sort: sortParam, dir: dirParam } = await searchParams;
  const q = typeof query === "string" ? query.trim() : "";
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const filter = filterParam || "";
  const showDemo = demoParam === "show";
  const sort = sortParam || "";
  const dir = (dirParam === "asc" ? "asc" : "desc") as "asc" | "desc";

  // Patterns for seed/demo/test/internal accounts
  const DEMO_EMAIL_PATTERNS = [
    "@seed.mixreflect.com",
    "@mixreflect.com",
    "@example.com",
    "@soundcheck.com",
    "@soundcheck.internal",
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
    // inject-the-pattern
    "jake.soundcheck@gmail.com",
    "carlos.wav@hotmail.com",
    "tanya.mixhead@gmail.com",
    // inject-blackout
    "sarah.vibecheck@gmail.com",
    "marcus.alt.ears@hotmail.com",
    "donna.listens22@gmail.com",
    // inject-king-rolly
    "wavtek23@gmail.com",
    // inject-grit-it-takes
    "marcus.hardriff@gmail.com",
    "jenny.rawmix@gmail.com",
    // inject-if-this-is-it
    "lisa.popwave@gmail.com",
    "dan.retropop@gmail.com",
    // inject-grudge
    "alex.rawcuts@gmail.com",
    // inject-heart (<3 by darnellsimon)
    "omar.wavehead@gmail.com",
    "sophie.digitalmix@gmail.com",
    "jamal.beatcrave@gmail.com",
    // inject-lead-me
    "kezia.vibes@gmail.com",
    "ray.trackhead@gmail.com",
    "leon.freshear@gmail.com",
    // inject-ahora-si
    "felix.techsound@gmail.com",
    "nina.rave3am@gmail.com",
    // inject-misery
    "tyler.heavyriff@gmail.com",
    "ash.metalcraft@gmail.com",
    "cass.loudpunk@gmail.com",
    // inject-with-me
    "maya.hiphophead@gmail.com",
    "dre.trackfan@gmail.com",
    // inject-skyscraper
    "marcus.breakhead@gmail.com",
    "zara.crate@gmail.com",
    "joel.beatcraft@gmail.com",
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
    // seed real accounts (injected test users)
    "cloudnyne@gmail.com",
    "lowkeybeats@gmail.com",
    "solarframe@gmail.com",
    "prodbyflux@gmail.com",
    "mrkrxn@gmail.com",
    "lucidwavs@gmail.com",
    "beatsbykova@gmail.com",
    "djstonez@gmail.com",
    "dsa@asdas.com",
  ];

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const whereClause: any = {};

  if (q) {
    whereClause.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
    ];
  }

  // DB-level filter (the rest are computed from score stats below).
  if (filter === "reviewers") {
    whereClause.isScoreReviewer = true;
  } else if (filter === "inactive") {
    whereClause.lastActiveAt = null;
  }

  if (!showDemo) {
    whereClause.AND = [
      ...DEMO_EMAIL_PATTERNS.map((pattern) => ({
        email: { not: { contains: pattern } },
      })),
      { email: { notIn: DEMO_EMAIL_EXACT } },
    ];
  }

  const userSelect = {
    id: true,
    email: true,
    name: true,
    isScoreReviewer: true,
    createdAt: true,
    lastActiveAt: true,
    referredByCode: true,
    totalReferrals: true,
    ArtistProfile: { select: { artistName: true } },
    Account: { select: { provider: true }, take: 1 },
  };

  // Tier filters + report/spend sorts are computed from email-keyed score stats,
  // so they need every matching user enriched before we can filter/sort/paginate.
  const isTierFilter = ["unlimited", "onetime", "free"].includes(filter);
  const isComputedSort = ["reports", "spend"].includes(sort);
  const needsAllUsers = isTierFilter || isComputedSort;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Row = any & { _stats: ScoreStats };
  let users: Row[];
  let totalUsers: number;

  const attachStats = async (rows: { email: string }[]): Promise<Map<string, ScoreStats>> => {
    return getScoreStatsForEmails(rows.map((r) => r.email));
  };

  if (needsAllUsers) {
    const allRaw = await prisma.user.findMany({ where: whereClause, select: userSelect });
    const stats = await attachStats(allRaw);
    let enriched: Row[] = allRaw.map((u) => ({
      ...u,
      _stats: stats.get(u.email.trim().toLowerCase()) ?? {
        tier: "Free", subStatus: null, subActive: false, renewsAt: null,
        reports: 0, paidReports: 0, lastReportAt: null, spendCents: 0,
      },
    }));

    if (filter === "unlimited") enriched = enriched.filter((u) => u._stats.tier === "Unlimited");
    else if (filter === "onetime") enriched = enriched.filter((u) => u._stats.tier === "One-time");
    else if (filter === "free") enriched = enriched.filter((u) => u._stats.tier === "Free");

    if (isComputedSort) {
      enriched.sort((a, b) => {
        const va = sort === "reports" ? a._stats.reports : a._stats.spendCents;
        const vb = sort === "reports" ? b._stats.reports : b._stats.spendCents;
        return dir === "desc" ? vb - va : va - vb;
      });
    } else {
      enriched.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    totalUsers = enriched.length;
    users = enriched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = { createdAt: "desc" };
    if (sort === "active") orderBy = { lastActiveAt: dir };
    else if (sort === "joined") orderBy = { createdAt: dir };
    const [count, rawPage] = await Promise.all([
      prisma.user.count({ where: whereClause }),
      prisma.user.findMany({
        where: whereClause,
        orderBy,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: userSelect,
      }),
    ]);
    totalUsers = count;
    const stats = await attachStats(rawPage);
    users = rawPage.map((u) => ({
      ...u,
      _stats: stats.get(u.email.trim().toLowerCase()) ?? {
        tier: "Free", subStatus: null, subActive: false, renewsAt: null,
        reports: 0, paidReports: 0, lastReportAt: null, spendCents: 0,
      },
    }));
  }

  const totalPages = Math.ceil(totalUsers / PAGE_SIZE);

  // Build URL helper
  const buildUrl = (params: { page?: number; q?: string; filter?: string; demo?: string; sort?: string; dir?: string }) => {
    const url = new URLSearchParams();
    if (params.q ?? q) url.set("q", params.q ?? q);
    if (params.filter ?? filter) url.set("filter", params.filter ?? filter);
    if ((params.page ?? page) > 1) url.set("page", String(params.page ?? page));
    const demoVal = params.demo ?? (showDemo ? "show" : "");
    if (demoVal === "show") url.set("demo", "show");
    const sortVal = "sort" in params ? params.sort : sort;
    const dirVal = "dir" in params ? params.dir : String(dir);
    if (sortVal) { url.set("sort", sortVal); url.set("dir", dirVal || "desc"); }
    return `/admin/users${url.toString() ? `?${url.toString()}` : ""}`;
  };

  const sortHeader = (label: string, key: string, align: "left" | "right" = "right") => {
    const isActive = sort === key;
    const nextDir: "asc" | "desc" = isActive && dir === "desc" ? "asc" : "desc";
    return (
      <SortHeader label={label} href={buildUrl({ sort: key, dir: nextDir, page: 1 })} active={isActive} dir={dir} align={align} />
    );
  };

  const filterTab = (label: string, key: string, accent = false) => (
    <Link
      href={buildUrl({ filter: key, page: 1 })}
      className={`h-9 px-3 rounded-md text-sm font-medium flex items-center transition-colors ${
        filter === key
          ? accent
            ? "bg-[#6ee7ff] text-black"
            : "bg-white/10 text-[#f4f4ef] border border-white/15"
          : "bg-white/5 text-white/55 hover:bg-white/10 hover:text-[#f4f4ef]"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#f4f4ef] lowercase">users</h1>
        <p className="text-white/45 text-sm">
          {totalUsers} total users {q && `matching "${q}"`}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <form className="flex gap-2 flex-1 min-w-[200px]" action="/admin/users" method="GET">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search email or name"
            className="flex-1 h-9 px-3 bg-[#141414] border border-white/15 rounded-md text-sm text-[#f4f4ef] placeholder:text-white/30 focus:border-[#6ee7ff] focus:outline-none"
          />
          {filter && <input type="hidden" name="filter" value={filter} />}
          {showDemo && <input type="hidden" name="demo" value="show" />}
          <button
            type="submit"
            className="h-9 px-3 rounded-md text-sm font-bold bg-[#6ee7ff] text-black hover:bg-white transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex gap-1 flex-wrap">
          {filterTab("All", "")}
          {filterTab("Unlimited", "unlimited", true)}
          {filterTab("One-time", "onetime")}
          {filterTab("Free", "free")}
          {filterTab("Reviewers", "reviewers")}
          {filterTab("Inactive", "inactive")}
          <span className="w-px h-6 bg-white/10 mx-1" />
          <Link
            href={buildUrl({ demo: showDemo ? "" : "show", page: 1 })}
            className={`h-9 px-3 rounded-md text-sm font-medium flex items-center transition-colors ${
              showDemo ? "bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/30" : "bg-white/5 text-white/55 hover:bg-white/10"
            }`}
          >
            Demo
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0e0e0e] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-white/[0.03] text-white/40">
              <tr>
                <th className="text-left font-medium px-3 py-2">Email</th>
                <th className="text-left font-medium px-3 py-2">Artist Name</th>
                <th className="text-left font-medium px-3 py-2">Tier</th>
                {sortHeader("Reports", "reports")}
                {sortHeader("Spend", "spend")}
                <th className="text-left font-medium px-3 py-2">Renews</th>
                <th className="text-right font-medium px-3 py-2">Refs</th>
                <th className="text-left font-medium px-3 py-2">Ref By</th>
                {sortHeader("Active", "active", "left")}
                {sortHeader("Joined", "joined", "left")}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {users.map((u) => {
                const s: ScoreStats = u._stats;
                return (
                <tr key={u.id} className="text-white/75 hover:bg-white/[0.03]">
                  <td className="px-3 py-2">
                    <Link className="underline decoration-white/20 hover:text-[#6ee7ff]" href={`/admin/users/${u.id}`}>
                      {u.email}
                    </Link>
                    {u.Account?.[0]?.provider === "google" && (
                      <span className="ml-1.5 inline-block text-[9px] font-bold uppercase tracking-wide text-[#6ee7ff] bg-[#6ee7ff]/10 px-1 py-0.5 rounded">G</span>
                    )}
                    {u.isScoreReviewer && (
                      <span className="ml-1.5 inline-block text-[9px] font-bold uppercase tracking-wide text-[#7cffc4] bg-[#7cffc4]/10 px-1 py-0.5 rounded">Reviewer</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-white/45">{u.ArtistProfile?.artistName ?? u.name ?? ""}</td>
                  <td className="px-3 py-2"><TierBadge tier={s.tier} subStatus={s.subStatus} /></td>
                  <td className={`px-3 py-2 text-right ${mono.className}`}>
                    {s.reports > 0 ? (
                      <span className="tabular-nums">
                        <span className="text-[#6ee7ff] font-medium">{s.paidReports}</span>
                        <span className="text-white/25">/{s.reports}</span>
                      </span>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                  <td className={`px-3 py-2 text-right ${mono.className}`}>
                    {s.spendCents > 0 ? (
                      <span className="tabular-nums text-[#7cffc4] font-medium">${(s.spendCents / 100).toFixed(2)}</span>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {s.subActive && s.renewsAt ? (
                      <span className={`${mono.className} text-white/55`} title={new Date(s.renewsAt).toLocaleString()}>
                        {new Date(s.renewsAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                  <td className={`px-3 py-2 text-right ${mono.className}`}>
                    {(u.totalReferrals ?? 0) > 0 ? (
                      <span className="tabular-nums text-[#7cffc4] font-medium">{u.totalReferrals}</span>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {u.referredByCode ? (
                      <span className={`inline-flex items-center ${mono.className} px-1 py-0.5 rounded bg-[#7cffc4]/10 text-[#7cffc4]`}>{u.referredByCode}</span>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {u.lastActiveAt ? (
                      <span className={
                        new Date().getTime() - new Date(u.lastActiveAt).getTime() < 86400000
                          ? 'text-[#7cffc4] font-medium'
                          : new Date().getTime() - new Date(u.lastActiveAt).getTime() < 604800000
                          ? 'text-[#6ee7ff]'
                          : 'text-white/45'
                      } title={new Date(u.lastActiveAt).toLocaleString()}>
                        {getRelativeTime(u.lastActiveAt)}
                      </span>
                    ) : (
                      <span className="text-white/20">Never</span>
                    )}
                  </td>
                  <td className={`px-3 py-2 text-white/45 ${mono.className}`}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-white/40">
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
          <p className="text-sm text-white/45">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalUsers)} of {totalUsers}
          </p>
          <div className="flex gap-1">
            {page > 1 && (
              <Link
                href={buildUrl({ page: page - 1 })}
                className="h-9 px-3 rounded-md text-sm font-medium bg-white/5 text-white/70 hover:bg-white/10 flex items-center"
              >
                Previous
              </Link>
            )}

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
                      ? "bg-[#6ee7ff] text-black"
                      : "bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {pageNum}
                </Link>
              );
            })}

            {page < totalPages && (
              <Link
                href={buildUrl({ page: page + 1 })}
                className="h-9 px-3 rounded-md text-sm font-medium bg-white/5 text-white/70 hover:bg-white/10 flex items-center"
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
