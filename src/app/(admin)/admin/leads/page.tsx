import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type LeadCaptureRow = {
  id: string;
  email: string;
  source: string;
  reminded: boolean;
  converted: boolean;
  createdAt: Date;
};

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; source?: string }>;
}) {
  const { q: query, source } = await searchParams;

  const q = typeof query === "string" ? query.trim() : "";
  const sourceFilter = typeof source === "string" ? source.trim() : "";

  const conditions: Prisma.Sql[] = [];
  if (q) {
    conditions.push(Prisma.sql`email ILIKE ${`%${q}%`}`);
  }
  if (sourceFilter) {
    conditions.push(Prisma.sql`source ILIKE ${`%${sourceFilter}%`}`);
  }

  const whereSql =
    conditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
      : Prisma.empty;

  const leads = await prisma.$queryRaw<LeadCaptureRow[]>(
    Prisma.sql`
      SELECT id, email, source, reminded, converted, "createdAt"
      FROM "LeadCapture"
      ${whereSql}
      ORDER BY "createdAt" DESC
      LIMIT 200
    `
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leads</h1>
        <p className="text-neutral-500">Captured emails from get-feedback (up to 200)</p>
      </div>

      <form className="flex flex-col sm:flex-row gap-2" action="/admin/leads" method="GET">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search email"
          className="flex-1 h-9 px-3 border border-neutral-200 rounded-md text-sm"
        />
        <input
          name="source"
          defaultValue={sourceFilter}
          placeholder="Source (optional)"
          className="flex-1 h-9 px-3 border border-neutral-200 rounded-md text-sm"
        />
        <button
          type="submit"
          className="h-9 px-3 rounded-md text-sm font-medium bg-neutral-900 text-white"
        >
          Filter
        </button>
      </form>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="text-left font-medium px-4 py-3">Email</th>
                <th className="text-left font-medium px-4 py-3">Source</th>
                <th className="text-left font-medium px-4 py-3">Reminded</th>
                <th className="text-left font-medium px-4 py-3">Converted</th>
                <th className="text-left font-medium px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {leads.map((l) => (
                <tr key={l.id} className="text-neutral-700">
                  <td className="px-4 py-3 font-mono text-xs sm:text-sm">{l.email}</td>
                  <td className="px-4 py-3">{l.source}</td>
                  <td className="px-4 py-3">{l.reminded ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">{l.converted ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}

              {leads.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-neutral-500" colSpan={5}>
                    No leads found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
