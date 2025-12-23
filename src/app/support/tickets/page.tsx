import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateTicketForm } from "@/components/support/create-ticket-form";

type TicketListItem = {
  id: string;
  subject: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Array<{ body: string; createdAt: Date; authorType: string }>;
  _count: { messages: number };
};

export const dynamic = "force-dynamic";

export default async function SupportTicketsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const prismaAny = prisma as any;

  const tickets: TicketListItem[] = await prismaAny.supportTicket.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      subject: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true, authorType: true },
      },
      _count: { select: { messages: true } },
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Support tickets</h1>
          <p className="text-neutral-600 mt-1">Create a ticket and keep the conversation in one place.</p>
        </div>
        <Link href="/support" className="text-sm font-bold text-neutral-600 hover:text-black">
          Back to Support
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Create a ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateTicketForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your tickets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tickets.length === 0 ? (
            <div className="text-sm text-neutral-600">No tickets yet.</div>
          ) : (
            tickets.map((t) => {
              const last = t.messages[0];
              return (
                <Link
                  key={t.id}
                  href={`/support/tickets/${t.id}`}
                  className="block border-2 border-black bg-white p-4 hover:bg-neutral-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-bold">{t.subject}</div>
                      <div className="text-xs text-neutral-600 font-mono mt-1">
                        {t.status} • {t._count.messages} messages • Updated {new Date(t.updatedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-xs text-neutral-600 font-mono">{t.id}</div>
                  </div>
                  {last ? (
                    <div className="text-sm text-neutral-700 mt-3 line-clamp-2">
                      {last.authorType}: {last.body}
                    </div>
                  ) : null}
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
