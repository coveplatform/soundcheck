import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Music } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PayoutActions } from "@/components/reviewer/payout-actions";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = 'force-dynamic';

export default async function EarningsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true, email: true },
  });

  if (!user?.emailVerified) {
    const email = user?.email ? `?email=${encodeURIComponent(user.email)}` : "";
    redirect(`/verify-email${email}`);
  }

  const reviewerProfile = await prisma.listenerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      reviews: {
        where: { status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          track: {
            select: { title: true },
          },
        },
      },
      payouts: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!reviewerProfile) {
    redirect("/listener/onboarding");
  }

  if (reviewerProfile.isRestricted) {
    redirect("/listener/dashboard");
  }

  if (!reviewerProfile.completedOnboarding || !reviewerProfile.onboardingQuizPassed) {
    redirect("/listener/onboarding");
  }

  // Calculate stats
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  const monthlyReviews = reviewerProfile.reviews.filter(
    (r) => new Date(r.createdAt) >= thisMonth
  );
  const monthlyEarnings = monthlyReviews.reduce(
    (sum, r) => sum + r.paidAmount,
    0
  );

  return (
    <div className="pt-14 sm:pt-16 px-6 sm:px-8 lg:px-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight">Earnings</h1>
        <p className="mt-2 text-sm text-black/40">Track your earnings and payouts</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card variant="soft" elevated>
              <CardContent className="pt-6">
                <p className="text-xs font-mono tracking-widest text-black/40 uppercase">available</p>
                <p className="mt-2 text-3xl font-light tracking-tight text-emerald-600">{formatCurrency(reviewerProfile.pendingBalance)}</p>
                <p className="mt-1 text-sm text-black/40">ready to withdraw</p>
              </CardContent>
            </Card>

            <Card variant="soft">
              <CardContent className="pt-6">
                <p className="text-xs font-mono tracking-widest text-black/40 uppercase">total earned</p>
                <p className="mt-2 text-3xl font-light tracking-tight">{formatCurrency(reviewerProfile.totalEarnings)}</p>
                <p className="mt-1 text-sm text-black/40">all time</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card variant="soft">
              <CardContent className="pt-6">
                <p className="text-xs font-mono tracking-widest text-black/40 uppercase">this month</p>
                <p className="mt-2 text-3xl font-light tracking-tight">{formatCurrency(monthlyEarnings)}</p>
                <p className="mt-1 text-sm text-black/40">{monthlyReviews.length} reviews</p>
              </CardContent>
            </Card>

            <Card variant="soft">
              <CardContent className="pt-6">
                <p className="text-xs font-mono tracking-widest text-black/40 uppercase">reviews</p>
                <p className="mt-2 text-3xl font-light tracking-tight">{monthlyReviews.length}</p>
                <p className="mt-1 text-sm text-black/40">this month</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Earnings */}
          <Card variant="soft" elevated>
            <CardContent className="pt-6">
              <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-4">recent earnings</p>
              
              {reviewerProfile.reviews.length === 0 ? (
                <EmptyState
                  title="No reviews completed yet"
                  description="Your review earnings will show up here."
                  className="py-8"
                />
              ) : (
                <div className="space-y-2">
                  {reviewerProfile.reviews.map((review: any) => (
                    <div
                      key={review.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-white/60 border border-black/10 px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <Music className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-black truncate">{review.track.title}</p>
                          <p className="text-xs text-black/40">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="text-emerald-600 font-medium text-sm">
                        +{formatCurrency(review.paidAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-4">
          {/* Payout Card */}
          <Card variant="soft" elevated>
            <CardContent className="pt-6">
              <p className="text-xs font-mono tracking-widest text-black/40 uppercase">payouts</p>
              <div className="mt-4 p-4 rounded-xl bg-black/5">
                <p className="text-sm text-black/60">
                  Minimum payout: <span className="font-medium text-black">$10.00</span>
                </p>
                <p className="text-sm text-black/40 mt-1">
                  Connect Stripe to receive automated payouts.
                </p>
              </div>

              <div className="mt-4">
                <PayoutActions
                  pendingBalance={reviewerProfile.pendingBalance}
                  stripeAccountId={reviewerProfile.stripeAccountId ?? null}
                  country={reviewerProfile.country ?? null}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payout History */}
          <Card variant="soft">
            <CardContent className="pt-6">
              <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-4">payout history</p>
              
              {reviewerProfile.payouts.length === 0 ? (
                <p className="text-sm text-black/40">No payouts yet</p>
              ) : (
                <div className="space-y-2">
                  {reviewerProfile.payouts.map((payout: any) => (
                    <div
                      key={payout.id}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{formatCurrency(payout.amount)}</p>
                        <p className="text-xs text-black/40">
                          {new Date(payout.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          payout.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-700"
                            : payout.status === "PROCESSING"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-black/5 text-black/50"
                        }`}
                      >
                        {payout.status.toLowerCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
