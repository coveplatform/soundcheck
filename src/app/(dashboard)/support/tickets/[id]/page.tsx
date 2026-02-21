import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const statusColor = ticket.status === "OPEN"
    ? "bg-lime-100 text-lime-700 border-lime-200"
    : "bg-neutral-100 text-neutral-600 border-neutral-200";

  return (
    <div className="pt-8 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-start justify-between gap-4 pb-6 border-b border-black/10 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-black">{ticket.subject}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-[10px] font-mono tracking-[0.1em] uppercase px-2 py-0.5 rounded-full border ${statusColor}`}>
                {ticket.status}
              </span>
              <span className="text-xs text-black/30 font-mono">
                Created {new Date(ticket.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <Link href="/support/tickets" className="text-sm font-semibold text-black/40 hover:text-black transition-colors duration-150 ease-out whitespace-nowrap">
            ← Back
          </Link>
        </div>

        <div className="space-y-8">
          <div>
            <p className="text-xs font-mono tracking-[0.15em] uppercase text-black/40 mb-4">Conversation</p>
            <div className="space-y-3">
              {ticket.SupportMessage.map((m) => {
                const isSupport = m.authorType === "ADMIN";
                return (
                  <div
                    key={m.id}
                    className={`rounded-xl border p-4 ${
                      isSupport
                        ? "border-purple-200/60 bg-purple-50/40"
                        : "border-black/8 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-black">
                        {isSupport ? "Support" : "You"}
                      </p>
                      <p className="text-[10px] text-black/30 font-mono">
                        {new Date(m.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-black/70 whitespace-pre-wrap">{m.body}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <Card variant="soft" elevated>
            <CardHeader className="border-b border-black/10">
              <CardTitle className="text-base font-bold">Reply</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <TicketReplyForm ticketId={ticket.id} ticketStatus={ticket.status} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
