import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getRelativeTime, mono } from "../../admin-ui";
import { RoomToggle } from "./room-toggle";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

const VERDICT_LABEL: Record<string, string> = {
  RELEASE_READY: "release ready",
  ALMOST_THERE: "almost there",
  NEEDS_WORK: "needs work",
  NOT_READY: "not ready",
};

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; filter?: string }>;
}) {
  const { q: query, page: pageParam, filter: filterParam } = await searchParams;
  const q = typeof query === "string" ? query.trim() : "";
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const filter = filterParam || "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { trackTitle: { contains: q, mode: "insensitive" } },
    ];
  }
  if (filter === "paid") where.paidAt = { not: null };
  else if (filter === "unpaid") where.paidAt = null;
  else if (filter === "pending") where.status = { in: ["PENDING", "PAID", "IN_REVIEW"] };
  else if (filter === "completed") where.status = "COMPLETED";

  const [total, paidCount, pendingCount, reports] = await Promise.all([
    prisma.trackScoreReport.count({ where }),
    prisma.trackScoreReport.count({ where: { paidAt: { not: null } } }),
    prisma.trackScoreReport.count({ where: { status: { in: ["PENDING", "PAID", "IN_REVIEW"] } } }),
    prisma.trackScoreReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        email: true,
        trackTitle: true,
        trackUrl: true,
        genre: true,
        score: true,
        verdict: true,
        status: true,
        paidAt: true,
        humanRoomSkipped: true,
        humanReviewsRequested: true,
        createdAt: true,
        ArtistProfile: { select: { artistName: true, userId: true } },
        ScoreReview: { select: { status: true } },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const buildUrl = (params: { page?: number; q?: string; filter?: string }) => {
    const url = new URLSearchParams();
    if (params.q ?? q) url.set("q", params.q ?? q);
    if (params.filter ?? filter) url.set("filter", params.filter ?? filter);
    if ((params.page ?? page) > 1) url.set("page", String(params.page ?? page));
    return `/admin/reports${url.toString() ? `?${url.toString()}` : ""}`;
  };

  const filterTab = (label: string, key: string) => (
    <Link
      href={buildUrl({ filter: key, page: 1 })}
      className={`h-9 px-3 rounded-md text-sm font-medium flex items-center transition-colors ${
        filter === key
          ? "bg-white/10 text-[#f4f4ef] border border-white/15"
          : "bg-white/5 text-white/55 hover:bg-white/10 hover:text-[#f4f4ef]"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="space-y-6 text-[#f4f4ef]">
      <div>
        <h1 className="text-2xl font-extrabold lowercase">score reports</h1>
        <p className="text-white/45 text-sm">
          {total} reports {q && `matching "${q}"`} · {paidCount} paid · {pendingCount} pending
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <form className="flex gap-2 flex-1 min-w-[200px]" action="/admin/reports" method="GET">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search email or track title"
            className="flex-1 h-9 px-3 bg-[#141414] border border-white/15 rounded-md text-sm text-[#f4f4ef] placeholder:text-white/30 focus:border-[#6ee7ff] focus:outline-none"
          />
          {filter && <input type="hidden" name="filter" value={filter} />}
          <button type="submit" className="h-9 px-3 rounded-md text-sm font-bold bg-[#6ee7ff] text-black hover:bg-white transition-colors">
            Search
          </button>
        </form>
        <div className="flex gap-1 flex-wrap">
          {filterTab("All", "")}
          {filterTab("Pending", "pending")}
          {filterTab("Completed", "completed")}
          {filterTab("Paid", "paid")}
          {filterTab("Unpaid", "unpaid")}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0e0e0e] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-white/[0.03] text-white/40">
              <tr>
                <th className="text-left font-medium px-4 py-2">Track</th>
                <th className="text-left font-medium px-3 py-2">Artist / Email</th>
                <th className="text-left font-medium px-3 py-2">Genre</th>
                <th className="text-right font-medium px-3 py-2">Score</th>
                <th className="text-left font-medium px-3 py-2">Verdict</th>
                <th className="text-left font-medium px-3 py-2">Room</th>
                <th className="text-left font-medium px-3 py-2">Status</th>
                <th className="text-left font-medium px-3 py-2">Paid</th>
                <th className="text-left font-medium px-3 py-2">Submitted</th>
                <th className="text-right font-medium px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {reports.map((r) => {
                const done = r.ScoreReview.filter((sr) => sr.status === "COMPLETED").length;
                return (
                  <tr key={r.id} className="text-white/75 hover:bg-white/[0.03]">
                    <td className="px-4 py-2">
                      <Link href={`/report/${r.slug}`} className="underline decoration-white/20 hover:text-[#6ee7ff] font-medium">
                        {r.trackTitle || "Untitled"}
                      </Link>
                      {r.trackUrl && (
                        <a href={r.trackUrl} target="_blank" rel="noreferrer" className="ml-1.5 text-white/30 hover:text-[#6ee7ff]" title="Open track source">↗</a>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {r.ArtistProfile ? (
                        <Link href={`/admin/users/${r.ArtistProfile.userId}`} className="text-[#6ee7ff]/90 hover:text-[#6ee7ff]">
                          {r.ArtistProfile.artistName}
                        </Link>
                      ) : (
                        <span className={`text-white/45 ${mono.className}`}>{r.email}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-white/45">{r.genre || "—"}</td>
                    <td className={`px-3 py-2 text-right ${mono.className} ${r.score != null ? "text-[#6ee7ff] font-medium" : "text-white/20"}`}>
                      {r.score ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-white/55 lowercase">{r.verdict ? VERDICT_LABEL[r.verdict] ?? r.verdict : "—"}</td>
                    <td className={`px-3 py-2 ${mono.className} text-white/55`}>
                      {r.humanRoomSkipped ? (
                        <span className="text-[#fbbf24]" title="Over monthly room cap — AI read only">skipped</span>
                      ) : r.ScoreReview.length > 0 ? (
                        `${done}/${r.humanReviewsRequested}`
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2 text-white/55 lowercase">{r.status.toLowerCase().replace(/_/g, " ")}</td>
                    <td className="px-3 py-2">
                      {r.paidAt ? <span className="text-[#7cffc4]">✓</span> : <span className="text-white/25">locked</span>}
                    </td>
                    <td className="px-3 py-2 text-white/45" title={new Date(r.createdAt).toLocaleString()}>
                      {getRelativeTime(r.createdAt)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <RoomToggle id={r.id} skipped={r.humanRoomSkipped} />
                    </td>
                  </tr>
                );
              })}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-white/40">No reports found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/45">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-1">
            {page > 1 && (
              <Link href={buildUrl({ page: page - 1 })} className="h-9 px-3 rounded-md text-sm font-medium bg-white/5 text-white/70 hover:bg-white/10 flex items-center">
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={buildUrl({ page: page + 1 })} className="h-9 px-3 rounded-md text-sm font-medium bg-white/5 text-white/70 hover:bg-white/10 flex items-center">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
