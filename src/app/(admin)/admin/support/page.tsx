import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { mono } from "../../admin-ui";

type AdminTicketListItem = {
  id: string;
  subject: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  User: { email: string };
  SupportMessage: Array<{ body: string; createdAt: Date; authorType: string }>;
  _count: { SupportMessage: number };
};

export const dynamic = "force-dynamic";

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status: statusParam, q: query } = await searchParams;
  const status = typeof statusParam === "string" ? statusParam : "";
  const q = typeof query === "string" ? query.trim() : "";

  const tickets: AdminTicketListItem[] = await prisma.supportTicket.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(q
        ? {
            OR: [
              { id: { contains: q, mode: "insensitive" } },
              { subject: { contains: q, mode: "insensitive" } },
              { User: { email: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      subject: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      User: { select: { email: true } },
      SupportMessage: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true, authorType: true },
      },
      _count: { select: { SupportMessage: true } },
    },
  });

  return (
    <div className="space-y-6 text-[#f4f4ef]">
      <div>
        <h1 className="text-2xl font-extrabold lowercase">support</h1>
        <p className="text-white/45 text-sm">Most recent tickets (up to 50)</p>
      </div>

      <form className="flex flex-col sm:flex-row gap-2" action="/admin/support" method="GET">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search ticket id, subject, or user email"
          className="flex-1 h-9 px-3 bg-[#141414] border border-white/15 rounded-md text-sm text-[#f4f4ef] placeholder:text-white/30 focus:border-[#6ee7ff] focus:outline-none"
        />
        <select
          name="status"
          defaultValue={status}
          className="h-9 px-3 bg-[#141414] border border-white/15 rounded-md text-sm text-[#f4f4ef] focus:border-[#6ee7ff] focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="OPEN">OPEN</option>
          <option value="NEEDS_INFO">NEEDS_INFO</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
        <button type="submit" className="h-9 px-4 rounded-md text-sm font-bold bg-[#6ee7ff] text-black hover:bg-white transition-colors">
          Apply
        </button>
      </form>

      <div className="rounded-xl border border-white/10 bg-[#0e0e0e] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white/[0.03] text-white/40">
              <tr>
                <th className="text-left font-medium px-4 py-3">Subject</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3">User</th>
                <th className="text-left font-medium px-4 py-3">Updated</th>
                <th className="text-right font-medium px-4 py-3">Messages</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {tickets.map((t) => (
                <tr key={t.id} className="text-white/75 hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <Link className="underline decoration-white/20 hover:text-[#6ee7ff]" href={`/admin/support/${t.id}`}>
                      {t.subject}
                    </Link>
                    <div className={`text-xs text-white/35 ${mono.className} mt-1`}>{t.id}</div>
                  </td>
                  <td className="px-4 py-3 text-white/60 lowercase">{t.status.toLowerCase().replace(/_/g, " ")}</td>
                  <td className={`px-4 py-3 text-white/60 ${mono.className} text-xs`}>{t.User.email}</td>
                  <td className="px-4 py-3 text-white/45">{new Date(t.updatedAt).toLocaleString()}</td>
                  <td className={`px-4 py-3 text-right text-white/55 ${mono.className}`}>{t._count.SupportMessage}</td>
                </tr>
              ))}
              {tickets.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-white/40" colSpan={5}>
                    No tickets
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
