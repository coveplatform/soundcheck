import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateTicketForm } from "@/components/support/create-ticket-form";

type TicketListItem = {
  id: string;
  subject: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  SupportMessage: Array<{ body: string; createdAt: Date; authorType: string }>;
  _count: { SupportMessage: number };
};

export const dynamic = "force-dynamic";

export default async function SupportTicketsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const tickets: TicketListItem[] = await prisma.supportTicket.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      subject: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      SupportMessage: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true, authorType: true },
      },
      _count: { select: { SupportMessage: true } },
    },
  });

  return (
    <div className="min-h-screen bg-[#f7f5f2] pb-24 overflow-x-hidden">

      {/* ── HERO ───────────────────────────────────────────────── */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <Link
            href="/support"
            className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-black/30 hover:text-black transition-colors mb-3"
          >
            <ArrowLeft className="h-3 w-3" />
            Support
          </Link>
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-black leading-[0.95]">
                Tickets.
              </h1>
              <p className="text-sm text-black/40 font-medium mt-3">
                Create a ticket and keep the conversation in one place.
              </p>
            </div>
            <div className="flex-shrink-0 text-right pl-5 sm:pl-8 border-l-2 border-black/10">
              <p className="text-5xl sm:text-6xl font-black text-black leading-none tabular-nums">
                {tickets.length}
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/35 mt-1.5">
                {tickets.length === 1 ? "ticket" : "tickets"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── CREATE FORM ─────────────────────────────────────────── */}
      <div className="bg-neutral-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-1">
            New ticket
          </p>
          <h2 className="text-2xl font-black text-white tracking-tight leading-none mb-6">
            What do you need help with?
          </h2>
          <CreateTicketForm />
        </div>
      </div>

      {/* ── TICKET LIST ─────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30">Your tickets</p>
            <h2 className="text-2xl font-black text-black tracking-tight mt-0.5 leading-none">
              {tickets.length === 0 ? "No tickets yet" : `${tickets.length} ticket${tickets.length === 1 ? "" : "s"}`}
            </h2>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="border-2 border-black/8 rounded-2xl px-6 py-12 text-center bg-white/40">
            <MessageSquare className="h-10 w-10 text-black/15 mx-auto mb-3" />
            <p className="text-base font-bold text-black/40">No tickets yet.</p>
            <p className="text-sm text-black/25 mt-1">Create one above to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => {
              const last = t.SupportMessage[0];
              const isOpen = t.status === "OPEN";
              return (
                <Link
                  key={t.id}
                  href={`/support/tickets/${t.id}`}
                  className="block rounded-2xl border-2 border-black/8 bg-white p-5 hover:border-black/20 hover:-translate-y-[1px] hover:shadow-[0_3px_12px_rgba(0,0,0,0.07)] active:translate-y-0 active:shadow-none transition-all duration-150 group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-black truncate">{t.subject}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isOpen
                            ? "bg-lime-100 text-lime-700"
                            : "bg-neutral-100 text-neutral-500"
                        }`}>
                          {t.status}
                        </span>
                        <span className="text-xs text-black/30 font-medium">
                          {t._count.SupportMessage} {t._count.SupportMessage === 1 ? "message" : "messages"}
                        </span>
                        <span className="text-xs text-black/25 font-medium">
                          Updated {new Date(t.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {last && (
                    <p className="text-sm text-black/40 mt-3 line-clamp-2 font-medium">
                      <span className="font-black text-black/50">{last.authorType === "ADMIN" ? "Support" : "You"}:</span>{" "}
                      {last.body}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
