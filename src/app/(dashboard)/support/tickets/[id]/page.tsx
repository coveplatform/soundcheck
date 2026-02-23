import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TicketReplyForm } from "@/components/support/ticket-reply-form";

type TicketDetail = {
  id: string;
  subject: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  SupportMessage: Array<{
    id: string;
    authorType: string;
    authorEmail: string | null;
    body: string;
    createdAt: Date;
  }>;
};

export const dynamic = "force-dynamic";

export default async function SupportTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  const ticket: TicketDetail | null = await prisma.supportTicket.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      subject: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      SupportMessage: {
        orderBy: { createdAt: "asc" },
        select: { id: true, authorType: true, authorEmail: true, body: true, createdAt: true },
      },
    },
  });

  if (!ticket) {
    notFound();
  }

  const isOpen = ticket.status === "OPEN";

  return (
    <div className="min-h-screen bg-[#f7f5f2] pb-24 overflow-x-hidden">

      {/* ── HERO ───────────────────────────────────────────────── */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <Link
            href="/support/tickets"
            className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-black/30 hover:text-black transition-colors mb-3"
          >
            <ArrowLeft className="h-3 w-3" />
            Tickets
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-black leading-tight">
                {ticket.subject}
              </h1>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  isOpen
                    ? "bg-lime-100 text-lime-700"
                    : "bg-neutral-100 text-neutral-500"
                }`}>
                  {ticket.status}
                </span>
                <span className="text-xs text-black/30 font-medium">
                  Opened {new Date(ticket.createdAt).toLocaleDateString()}
                </span>
                <span className="text-xs text-black/25 font-medium">
                  {ticket.SupportMessage.length} {ticket.SupportMessage.length === 1 ? "message" : "messages"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONVERSATION ─────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {ticket.SupportMessage.length === 0 ? (
          <div className="border-2 border-black/8 rounded-2xl px-6 py-10 text-center bg-white/40">
            <p className="text-base font-bold text-black/40">No messages yet.</p>
            <p className="text-sm text-black/25 mt-1">Use the form below to send your first message.</p>
          </div>
        ) : (
          <div className="space-y-3 mb-10">
            <div className="flex items-end justify-between mb-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30">Conversation</p>
                <h2 className="text-2xl font-black text-black tracking-tight mt-0.5 leading-none">
                  {ticket.SupportMessage.length} {ticket.SupportMessage.length === 1 ? "message" : "messages"}
                </h2>
              </div>
            </div>
            {ticket.SupportMessage.map((m) => {
              const isSupport = m.authorType === "ADMIN";
              return (
                <div
                  key={m.id}
                  className={`rounded-2xl border-2 p-5 ${
                    isSupport
                      ? "border-purple-200 bg-purple-50"
                      : "border-black/8 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      isSupport
                        ? "bg-purple-600 text-white"
                        : "bg-black text-white"
                    }`}>
                      {isSupport ? "Support" : "You"}
                    </span>
                    <p className="text-[10px] text-black/30 font-medium">
                      {new Date(m.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm text-black/70 whitespace-pre-wrap leading-relaxed">{m.body}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Reply form — dark section */}
        <div className="bg-neutral-900 rounded-2xl px-6 py-8">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-1">
            {isOpen ? "Reply" : "Ticket closed"}
          </p>
          <h2 className="text-2xl font-black text-white tracking-tight leading-none mb-6">
            {isOpen ? "Add a message" : "This ticket is closed"}
          </h2>
          <TicketReplyForm ticketId={ticket.id} ticketStatus={ticket.status} />
        </div>
      </div>
    </div>
  );
}
