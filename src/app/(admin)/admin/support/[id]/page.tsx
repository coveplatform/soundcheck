import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { SupportTicketActions } from "@/components/admin/support-ticket-actions";

type AdminTicketDetail = {
  id: string;
  subject: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  User: { id: string; email: string; name: string | null };
  SupportMessage: Array<{
    id: string;
    authorType: string;
    authorEmail: string | null;
    body: string;
    createdAt: Date;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminSupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const ticket: AdminTicketDetail | null = await prisma.supportTicket.findUnique({
    where: { id },
    select: {
      id: true,
      subject: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      User: { select: { id: true, email: true, name: true } },
      SupportMessage: {
        orderBy: { createdAt: "asc" },
        select: { id: true, authorType: true, authorEmail: true, body: true, createdAt: true },
      },
    },
  });

  if (!ticket) {
    notFound();
  }

  return (
    <div className="space-y-6 text-[#f4f4ef]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold lowercase">support ticket</h1>
          <p className="text-white/50">{ticket.subject}</p>
          <div className="text-xs text-white/35 font-mono mt-1">
            {ticket.status} • {ticket.id}
          </div>
        </div>
        <Link className="text-sm text-white/50 hover:text-[#6ee7ff] underline decoration-white/20" href="/admin/support">
          Back to support
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 bg-[#0e0e0e] p-4">
          <div className="font-bold lowercase">user</div>
          <div className="mt-2 text-sm">
            <div className="text-white/40">Email</div>
            <div className="font-medium">
              <Link className="underline decoration-white/20 hover:text-[#6ee7ff]" href={`/admin/users/${ticket.User.id}`}>
                {ticket.User.email}
              </Link>
            </div>
          </div>
          <div className="mt-3 text-sm">
            <div className="text-white/40">Name</div>
            <div className="font-medium">{ticket.User.name ?? ""}</div>
          </div>
          <div className="mt-3 text-sm">
            <div className="text-white/40">Created</div>
            <div className="font-medium">{new Date(ticket.createdAt).toLocaleString()}</div>
          </div>
          <div className="mt-3 text-sm">
            <div className="text-white/40">Updated</div>
            <div className="font-medium">{new Date(ticket.updatedAt).toLocaleString()}</div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0e0e0e] p-4">
          <SupportTicketActions ticketId={ticket.id} initialStatus={ticket.status} />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0e0e0e] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 font-bold lowercase">conversation</div>
        <div className="p-4 space-y-3">
          {ticket.SupportMessage.map((m) => (
            <div key={m.id} className="border border-white/10 rounded-md p-3 bg-white/[0.02]">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm font-medium text-[#6ee7ff]">
                  {m.authorType === "ADMIN" ? "Admin" : "User"}
                </div>
                <div className="text-xs text-white/40 font-mono">
                  {new Date(m.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="mt-2 text-sm text-white/80 whitespace-pre-wrap">{m.body}</div>
              {m.authorEmail ? (
                <div className="mt-2 text-xs text-white/40 font-mono">{m.authorEmail}</div>
              ) : null}
            </div>
          ))}
          {ticket.SupportMessage.length === 0 ? (
            <div className="text-sm text-white/40">No messages</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
