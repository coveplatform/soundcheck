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
  messages: Array<{
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

  const prismaAny = prisma as any;

  const ticket: AdminTicketDetail | null = await prismaAny.supportTicket.findUnique({
    where: { id },
    select: {
      id: true,
      subject: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      User: { select: { id: true, email: true, name: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, authorType: true, authorEmail: true, body: true, createdAt: true },
      },
    },
  });

  if (!ticket) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Support ticket</h1>
          <p className="text-neutral-500">{ticket.subject}</p>
          <div className="text-xs text-neutral-500 font-mono mt-1">
            {ticket.status} • {ticket.id}
          </div>
        </div>
        <Link className="text-sm text-neutral-600 hover:text-neutral-900 underline" href="/admin/support">
          Back to support
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4">
          <div className="font-medium">User</div>
          <div className="mt-2 text-sm">
            <div className="text-neutral-500">Email</div>
            <div className="font-medium">
              <Link className="underline" href={`/admin/users/${ticket.User.id}`}>
                {ticket.User.email}
              </Link>
            </div>
          </div>
          <div className="mt-3 text-sm">
            <div className="text-neutral-500">Name</div>
            <div className="font-medium">{ticket.User.name ?? ""}</div>
          </div>
          <div className="mt-3 text-sm">
            <div className="text-neutral-500">Created</div>
            <div className="font-medium">{new Date(ticket.createdAt).toLocaleString()}</div>
          </div>
          <div className="mt-3 text-sm">
            <div className="text-neutral-500">Updated</div>
            <div className="font-medium">{new Date(ticket.updatedAt).toLocaleString()}</div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4">
          <SupportTicketActions ticketId={ticket.id} initialStatus={ticket.status} />
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-200 font-medium">Conversation</div>
        <div className="p-4 space-y-3">
          {ticket.messages.map((m) => (
            <div key={m.id} className="border border-neutral-200 rounded-md p-3">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm font-medium">
                  {m.authorType === "ADMIN" ? "Admin" : "User"}
                </div>
                <div className="text-xs text-neutral-500 font-mono">
                  {new Date(m.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="mt-2 text-sm text-neutral-800 whitespace-pre-wrap">{m.body}</div>
              {m.authorEmail ? (
                <div className="mt-2 text-xs text-neutral-500 font-mono">{m.authorEmail}</div>
              ) : null}
            </div>
          ))}
          {ticket.messages.length === 0 ? (
            <div className="text-sm text-neutral-500">No messages</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
