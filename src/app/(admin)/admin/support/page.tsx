import Link from "next/link";

import { prisma } from "@/lib/prisma";

type AdminTicketListItem = {
  id: string;
  subject: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  user: { email: string };
  messages: Array<{ body: string; createdAt: Date; authorType: string }>;
  _count: { messages: number };
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

  const prismaAny = prisma as any;

  const tickets: AdminTicketListItem[] = await prismaAny.supportTicket.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(q
        ? {
            OR: [
              { id: { contains: q, mode: "insensitive" } },
              { subject: { contains: q, mode: "insensitive" } },
              { user: { email: { contains: q, mode: "insensitive" } } },
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
      user: { select: { email: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true, authorType: true },
      },
      _count: { select: { messages: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Support</h1>
        <p className="text-neutral-500">Most recent tickets (up to 50)</p>
      </div>

      <form className="flex flex-col sm:flex-row gap-2" action="/admin/support" method="GET">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search ticket id, subject, or user email"
          className="flex-1 h-9 px-3 border border-neutral-200 rounded-md text-sm"
        />
        <select
          name="status"
          defaultValue={status}
          className="h-9 px-3 border border-neutral-200 rounded-md text-sm"
        >
          <option value="">All statuses</option>
          <option value="OPEN">OPEN</option>
          <option value="NEEDS_INFO">NEEDS_INFO</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
        <button type="submit" className="h-9 px-3 rounded-md text-sm font-medium bg-neutral-900 text-white">
          Apply
        </button>
      </form>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="text-left font-medium px-4 py-3">Subject</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3">User</th>
                <th className="text-left font-medium px-4 py-3">Updated</th>
                <th className="text-left font-medium px-4 py-3">Messages</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {tickets.map((t) => (
                <tr key={t.id} className="text-neutral-700">
                  <td className="px-4 py-3">
                    <Link className="underline" href={`/admin/support/${t.id}`}>
                      {t.subject}
                    </Link>
                    <div className="text-xs text-neutral-500 font-mono mt-1">{t.id}</div>
                  </td>
                  <td className="px-4 py-3">{t.status}</td>
                  <td className="px-4 py-3">{t.user.email}</td>
                  <td className="px-4 py-3">{new Date(t.updatedAt).toLocaleString()}</td>
                  <td className="px-4 py-3">{t._count.messages}</td>
                </tr>
              ))}
              {tickets.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-neutral-500" colSpan={5}>
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
