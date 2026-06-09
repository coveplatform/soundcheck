import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getRelativeTime, mono } from "../../admin-ui";

export const dynamic = 'force-dynamic';

const STATUS_STYLE: Record<string, string> = {
  COMPLETED: "text-[#7cffc4]",
  ASSIGNED: "text-[#6ee7ff]",
  IN_PROGRESS: "text-[#fbbf24]",
  EXPIRED: "text-[#ff6b6b]",
};

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q: query, status: statusParam } = await searchParams;
  const q = typeof query === "string" ? query.trim() : "";
  const status = typeof statusParam === "string" ? statusParam : "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { TrackScoreReport: { trackTitle: { contains: q, mode: "insensitive" } } },
      { User: { email: { contains: q, mode: "insensitive" } } },
      { User: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const reviews = await prisma.scoreReview.findMany({
    where,
    orderBy: [{ completedAt: "desc" }, { assignedAt: "desc" }],
    take: 100,
    select: {
      id: true,
      rating: true,
      headline: true,
      positive: true,
      status: true,
      assignedAt: true,
      completedAt: true,
      User: { select: { id: true, email: true, name: true } },
      TrackScoreReport: { select: { slug: true, trackTitle: true, email: true } },
    },
  });

  const filterTab = (label: string, key: string) => {
    const url = new URLSearchParams();
    if (q) url.set("q", q);
    if (key) url.set("status", key);
    return (
      <Link
        href={`/admin/reviews${url.toString() ? `?${url.toString()}` : ""}`}
        className={`h-9 px-3 rounded-md text-sm font-medium flex items-center transition-colors ${
          status === key
            ? "bg-white/10 text-[#f4f4ef] border border-white/15"
            : "bg-white/5 text-white/55 hover:bg-white/10 hover:text-[#f4f4ef]"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="space-y-6 text-[#f4f4ef]">
      <div>
        <h1 className="text-2xl font-extrabold lowercase">room reactions</h1>
        <p className="text-white/45 text-sm">
          Human “room of 5” reactions on score reports (most recent {reviews.length})
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <form className="flex gap-2 flex-1 min-w-[200px]" action="/admin/reviews" method="GET">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search track or reviewer"
            className="flex-1 h-9 px-3 bg-[#141414] border border-white/15 rounded-md text-sm text-[#f4f4ef] placeholder:text-white/30 focus:border-[#6ee7ff] focus:outline-none"
          />
          {status && <input type="hidden" name="status" value={status} />}
          <button type="submit" className="h-9 px-4 rounded-md text-sm font-bold bg-[#6ee7ff] text-black hover:bg-white transition-colors">
            Search
          </button>
        </form>
        <div className="flex gap-1 flex-wrap">
          {filterTab("All", "")}
          {filterTab("Completed", "COMPLETED")}
          {filterTab("Assigned", "ASSIGNED")}
          {filterTab("In progress", "IN_PROGRESS")}
          {filterTab("Expired", "EXPIRED")}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0e0e0e] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white/[0.03] text-white/40">
              <tr>
                <th className="text-left font-medium px-4 py-3">Track</th>
                <th className="text-left font-medium px-4 py-3">Reviewer</th>
                <th className="text-right font-medium px-4 py-3">Rating</th>
                <th className="text-left font-medium px-4 py-3">Reaction</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {reviews.map((r) => (
                <tr key={r.id} className="text-white/75 hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    {r.TrackScoreReport ? (
                      <Link href={`/report/${r.TrackScoreReport.slug}`} className="font-medium hover:text-[#6ee7ff] underline decoration-white/20">
                        {r.TrackScoreReport.trackTitle || "Untitled"}
                      </Link>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {r.User ? (
                      <Link href={`/admin/users/${r.User.id}`} className="hover:text-[#6ee7ff]">
                        <div className="font-medium text-[#f4f4ef]">{r.User.name || "—"}</div>
                        <div className={`text-xs text-white/40 ${mono.className}`}>{r.User.email}</div>
                      </Link>
                    ) : <span className="text-white/30">unassigned</span>}
                  </td>
                  <td className={`px-4 py-3 text-right ${mono.className}`}>
                    {r.rating != null ? (
                      <span className={r.positive ? "text-[#7cffc4] font-bold" : "text-[#fbbf24] font-bold"}>{r.rating}/5</span>
                    ) : <span className="text-white/20">—</span>}
                  </td>
                  <td className="px-4 py-3 text-white/55 max-w-[280px] truncate">{r.headline || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`${mono.className} text-xs ${STATUS_STYLE[r.status] ?? "text-white/50"}`}>{r.status.toLowerCase().replace(/_/g, " ")}</span>
                  </td>
                  <td className="px-4 py-3 text-white/45" title={new Date(r.completedAt ?? r.assignedAt).toLocaleString()}>
                    {getRelativeTime(r.completedAt ?? r.assignedAt)}
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/40">No reactions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
