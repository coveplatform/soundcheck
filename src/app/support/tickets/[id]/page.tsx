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
  messages: Array<{
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

  const prismaAny = prisma as any;

  const ticket: TicketDetail | null = await prismaAny.supportTicket.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      subject: true,
      status: true,
      createdAt: true,
      updatedAt: true,
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">{ticket.subject}</h1>
          <p className="text-neutral-600 mt-1 font-mono text-xs">
            {ticket.status} • Created {new Date(ticket.createdAt).toLocaleString()} • Ticket {ticket.id}
          </p>
        </div>
        <Link href="/support/tickets" className="text-sm font-bold text-neutral-600 hover:text-black">
          Back
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ticket.messages.map((m) => (
            <div key={m.id} className="border-2 border-black bg-white p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm font-bold">
                  {m.authorType === "ADMIN" ? "Support" : "You"}
                </div>
                <div className="text-xs text-neutral-600 font-mono">
                  {new Date(m.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="mt-2 text-sm text-neutral-800 whitespace-pre-wrap">{m.body}</div>
              {m.authorEmail ? (
                <div className="mt-2 text-xs text-neutral-600 font-mono">{m.authorEmail}</div>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reply</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketReplyForm ticketId={ticket.id} ticketStatus={ticket.status} />
        </CardContent>
      </Card>
    </div>
  );
}
