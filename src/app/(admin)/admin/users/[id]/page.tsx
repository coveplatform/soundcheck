import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { ReviewerRestrictionToggle } from "@/components/admin/reviewer-restriction-toggle";
import { EnableReviewerButton } from "@/components/admin/enable-reviewer-button";
import { ActivateProButton } from "@/components/admin/activate-pro-button";

export const dynamic = 'force-dynamic';

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      artistProfile: {
        select: {
          id: true,
          artistName: true,
          subscriptionStatus: true,
          subscriptionTier: true,
          reviewCredits: true,
          stripeCustomerId: true,
          tracks: { select: { id: true } },
        },
      },
      reviewerProfile: {
        select: {
          id: true,
          tier: true,
          isRestricted: true,
          completedOnboarding: true,
          onboardingQuizPassed: true,
          stripeAccountId: true,
          pendingBalance: true,
          totalReviews: true,
          averageRating: true,
          flagCount: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">User</h1>
          <p className="text-neutral-500">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {!user.reviewerProfile ? <EnableReviewerButton userId={user.id} /> : null}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4">
          <div className="text-sm text-neutral-500">Email verified</div>
          <div className="font-medium">{user.emailVerified ? "Yes" : "No"}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4">
          <div className="text-sm text-neutral-500">Roles</div>
          <div className="font-medium">
            {user.isArtist && user.isReviewer
              ? "Artist, Reviewer"
              : user.isArtist
              ? "Artist"
              : user.isReviewer
              ? "Reviewer"
              : ""}
          </div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4">
          <div className="text-sm text-neutral-500">Created</div>
          <div className="font-medium">{new Date(user.createdAt).toLocaleString()}</div>
        </div>
      </div>

      {user.artistProfile ? (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4">
          <div className="font-medium">Artist profile</div>
          <div className="mt-3 grid md:grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-neutral-500">Name</div>
              <div className="font-medium">{user.artistProfile.artistName}</div>
            </div>
            <div>
              <div className="text-neutral-500">Subscription</div>
              <div className="font-medium">
                {user.artistProfile.subscriptionStatus === "active" ? (
                  <span className="text-green-600">Pro (Active)</span>
                ) : user.artistProfile.subscriptionStatus ? (
                  <span className="text-amber-600">{user.artistProfile.subscriptionStatus}</span>
                ) : (
                  <span className="text-neutral-400">Free</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-neutral-500">Review Credits</div>
              <div className="font-medium">{user.artistProfile.reviewCredits ?? 0}</div>
            </div>
          </div>

          {/* Activate Pro Button */}
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <div className="text-sm text-neutral-500 mb-2">Subscription Actions</div>
            <ActivateProButton
              userId={user.id}
              currentStatus={user.artistProfile.subscriptionStatus}
            />
          </div>
        </div>
      ) : null}

      {user.reviewerProfile ? (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="font-medium">Reviewer profile</div>
            <ReviewerRestrictionToggle
              reviewerId={user.reviewerProfile.id}
              isRestricted={user.reviewerProfile.isRestricted}
            />
          </div>
          <div className="mt-3 grid md:grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-neutral-500">Tier</div>
              <div className="font-medium">{user.reviewerProfile.tier}</div>
            </div>
            <div>
              <div className="text-neutral-500">Onboarding</div>
              <div className="font-medium">
                {user.reviewerProfile.completedOnboarding && user.reviewerProfile.onboardingQuizPassed
                  ? "Complete"
                  : "Incomplete"}
              </div>
            </div>
            <div>
              <div className="text-neutral-500">Stripe</div>
              <div className="font-medium">
                {user.reviewerProfile.stripeAccountId ? "Connected" : "Not connected"}
              </div>
            </div>
            <div>
              <div className="text-neutral-500">Total reviews</div>
              <div className="font-medium">{user.reviewerProfile.totalReviews}</div>
            </div>
            <div>
              <div className="text-neutral-500">Avg rating</div>
              <div className="font-medium">{user.reviewerProfile.averageRating.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-neutral-500">Flags</div>
              <div className="font-medium">{user.reviewerProfile.flagCount}</div>
            </div>
          </div>
        </div>
      ) : null}

      <div>
        <Link className="text-sm text-neutral-600 hover:text-neutral-900 underline" href="/admin/users">
          Back to users
        </Link>
      </div>

      {user.artistProfile ? (
        <div className="text-sm text-neutral-500">
          <span className="font-medium text-neutral-800">Track count:</span> {user.artistProfile.tracks.length}
        </div>
      ) : null}
    </div>
  );
}
