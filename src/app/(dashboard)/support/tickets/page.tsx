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
  SupportMessage: Array<{ body: string; createdAt: Date; authorType: string }>;
  _count: { SupportMessage: number };
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
      SupportMessage: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true, authorType: true },
      },
      _count: { select: { SupportMessage: true } },
    },
  });

  return (
    <div className="pt-8 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-start justify-between gap-4 pb-6 border-b border-black/10 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-black">Support tickets</h1>
            <p className="text-sm text-black/40 mt-2">Create a ticket and keep the conversation in one place.</p>
          </div>
          <Link href="/support" className="text-sm font-semibold text-black/40 hover:text-black transition-colors duration-150 ease-out whitespace-nowrap">
            ← Back
          </Link>
        </div>

        <div className="space-y-8">
          <Card variant="soft" elevated>
            <CardHeader className="border-b border-black/10">
              <CardTitle className="text-base font-bold">Create a ticket</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <CreateTicketForm />
            </CardContent>
          </Card>

          <div>
            <p className="text-xs font-mono tracking-[0.15em] uppercase text-black/40 mb-4">Your tickets</p>
            {tickets.length === 0 ? (
              <div className="rounded-2xl border border-black/8 bg-white p-8 text-center">
                <p className="text-sm text-black/40">No tickets yet. Create one above to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((t) => {
                  const last = t.SupportMessage[0];
                  const statusColor = t.status === "OPEN"
                    ? "bg-lime-100 text-lime-700 border-lime-200"
                    : "bg-neutral-100 text-neutral-600 border-neutral-200";
                  return (
                    <Link
                      key={t.id}
                      href={`/support/tickets/${t.id}`}
                      className="block rounded-xl border border-black/8 bg-white p-4 transition-colors duration-150 ease-out hover:border-black/12 hover:bg-white/80"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-black truncate">{t.subject}</p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className={`text-[10px] font-mono tracking-[0.1em] uppercase px-2 py-0.5 rounded-full border ${statusColor}`}>
                              {t.status}
                            </span>
                            <span className="text-xs text-black/30 font-mono">
                              {t._count.SupportMessage} messages
                            </span>
                            <span className="text-xs text-black/30 font-mono">
                              Updated {new Date(t.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      {last ? (
                        <p className="text-sm text-black/50 mt-3 line-clamp-2">
                          <span className="font-medium text-black/60">{last.authorType === "ADMIN" ? "Support" : "You"}:</span> {last.body}
                        </p>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
