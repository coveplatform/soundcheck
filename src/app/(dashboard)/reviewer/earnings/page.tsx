import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PayoutActions } from "@/components/reviewer/payout-actions";

export default async function EarningsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const reviewerProfile = await prisma.reviewerProfile.findUnique({
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
    redirect("/reviewer/onboarding");
  }

  // Calculate stats
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  const monthlyReviews = reviewerProfile.reviews.filter(
    (r) => new Date(r.createdAt) >= thisMonth
  );
  const monthlyEarnings = monthlyReviews.reduce((sum, r) => sum + r.paidAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="text-neutral-500">Track your earnings and payouts</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Available Balance</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(reviewerProfile.pendingBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">This Month</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(monthlyEarnings)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Total Earned</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(reviewerProfile.totalEarnings)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Reviews This Month</p>
                <p className="text-2xl font-bold">{monthlyReviews.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Info */}
      <Card>
        <CardHeader>
          <CardTitle>Payouts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-neutral-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-neutral-600">
              Minimum payout: <strong>$10.00</strong>
            </p>
            <p className="text-sm text-neutral-500 mt-1">
              Connect Stripe to receive automated payouts.
            </p>
          </div>

          <div className="mb-6">
            <PayoutActions
              pendingBalance={reviewerProfile.pendingBalance}
              stripeAccountId={reviewerProfile.stripeAccountId ?? null}
            />
          </div>

          {reviewerProfile.payouts.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-8">
              No payouts yet
            </p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {reviewerProfile.payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{formatCurrency(payout.amount)}</p>
                    <p className="text-sm text-neutral-500">
                      {new Date(payout.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      payout.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : payout.status === "PROCESSING"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-neutral-100 text-neutral-700"
                    }`}
                  >
                    {payout.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          {reviewerProfile.reviews.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-8">
              No reviews completed yet
            </p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {reviewerProfile.reviews.map((review) => (
                <div
                  key={review.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{review.track.title}</p>
                    <p className="text-sm text-neutral-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-green-600 font-medium">
                    +{formatCurrency(review.paidAmount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
