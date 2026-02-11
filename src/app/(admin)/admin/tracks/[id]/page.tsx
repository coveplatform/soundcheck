import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { PACKAGES } from "@/lib/metadata";
import { RefundButton } from "@/components/admin/refund-button";
import { CancelTrackButton } from "@/components/admin/cancel-track-button";
import { DeleteTrackButton } from "@/components/admin/delete-track-button";
import { DebugAssignButton } from "@/components/admin/debug-assign-button";
import { NotifyInvalidLinkButton } from "@/components/admin/notify-invalid-link-button";
import { ReassignReviewerButton } from "@/components/admin/reassign-reviewer-button";
import { AudioPlayer } from "@/components/audio/audio-player";

export const dynamic = 'force-dynamic';

export default async function AdminTrackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const track = await prisma.track.findUnique({
    where: { id },
    include: {
      ArtistProfile: {
        include: { User: { select: { id: true, email: true } } },
      },
      Genre: true,
      Payment: true,
      ReviewQueue: {
        include: { ReviewerProfile: { include: { User: { select: { email: true } } } } },
        orderBy: { assignedAt: "asc" },
      },
      Review: {
        include: {
          ReviewerProfile: { include: { User: { select: { email: true } } } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!track) {
    notFound();
  }

  const countedCompletedReviews = track.Review.filter(
    (r) => r.status === "COMPLETED" && r.countsTowardCompletion !== false
  ).length;

  const hasStartedReviews = track.Review.some(
    (r) => r.status === "IN_PROGRESS" || r.status === "COMPLETED"
  );

  const canRefund =
    track.Payment?.status === "COMPLETED" &&
    track.status !== "CANCELLED" &&
    !!track.Payment.stripePaymentId &&
    !hasStartedReviews;

  const canCancel =
    track.status !== "CANCELLED" &&
    (track.status === "PENDING_PAYMENT" || track.status === "QUEUED");


  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Track</h1>
          <p className="text-neutral-500">{track.title}</p>
        </div>
        <div className="flex items-center gap-2">
          {canRefund ? <RefundButton trackId={track.id} /> : null}
          {canCancel ? <CancelTrackButton trackId={track.id} /> : null}
          <DeleteTrackButton trackId={track.id} />
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4">
        <div className="text-sm text-neutral-500">Listen</div>
        <div className="mt-3">
          <AudioPlayer
            sourceUrl={track.sourceUrl}
            sourceType={track.sourceType}
            showListenTracker={false}
            showWaveform={track.sourceType === "UPLOAD"}
          />
        </div>
        <div className="mt-3 pt-3 border-t border-neutral-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs text-neutral-400">Source URL ({track.sourceType})</div>
              <a
                href={track.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
              >
                {track.sourceUrl}
              </a>
            </div>
            {track.sourceType !== "UPLOAD" && (
              <div className="flex-shrink-0">
                {track.linkIssueNotifiedAt ? (
                  <span className="text-xs text-orange-600 font-medium">
                    Notified {new Date(track.linkIssueNotifiedAt).toLocaleDateString()}
                  </span>
                ) : (
                  <NotifyInvalidLinkButton trackId={track.id} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4">
          <div className="text-sm text-neutral-500">Status</div>
          <div className="font-medium">{track.status}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4">
          <div className="text-sm text-neutral-500">Payment</div>
          <div className="font-medium">
            {track.Payment?.status ? (
              track.Payment.status
            ) : track.status !== "PENDING_PAYMENT" ? (
              <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-700 rounded">
                REVIEW CREDITS
              </span>
            ) : (
              "Pending"
            )}
          </div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4">
          <div className="text-sm text-neutral-500">Artist</div>
          <div className="font-medium">
            <Link className="underline" href={`/admin/users/${track.ArtistProfile.User.id}`}>
              {track.ArtistProfile.User.email}
            </Link>
          </div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4">
          <div className="text-sm text-neutral-500">Subscription</div>
          <div className="font-medium">
            {track.ArtistProfile.subscriptionStatus === "active" ? (
              <span className="px-2 py-0.5 text-xs font-bold bg-purple-100 text-purple-700 rounded">
                PRO
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-bold bg-neutral-100 text-neutral-500 rounded">
                FREE TIER
              </span>
            )}
            <span className="ml-2 text-sm text-neutral-400">
              {track.ArtistProfile.reviewCredits} credits remaining
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4">
        <div className="text-sm text-neutral-500">Details</div>
        <div className="mt-2 grid md:grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-neutral-500">Package</div>
            <div className="font-medium">
              {track.promoCode ? (
                <span className="inline-flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-bold bg-purple-100 text-purple-700 rounded">
                    PROMO: {track.promoCode}
                  </span>
                </span>
              ) : track.packageType ? (
                <span>
                  {(PACKAGES as Record<string, { name: string }>)[track.packageType]?.name || track.packageType}
                  <span className="ml-1 text-xs text-neutral-400">({track.packageType})</span>
                </span>
              ) : (
                <span className="text-neutral-400">—</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-neutral-500">Reviews</div>
            <div className="font-medium">
              {countedCompletedReviews} / {track.reviewsRequested}
            </div>
          </div>
          <div>
            <div className="text-neutral-500">Created</div>
            <div className="font-medium">{new Date(track.createdAt).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200 font-medium">Reviews</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Reviewer</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3">Flagged</th>
                  <th className="text-left font-medium px-4 py-3">Created</th>
                  <th className="text-left font-medium px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {track.Review.map((r) => (
                  <tr key={r.id} className="text-neutral-700">
                    <td className="px-4 py-3">{r.ReviewerProfile.User.email}</td>
                    <td className="px-4 py-3">{r.status}</td>
                    <td className="px-4 py-3">{r.wasFlagged ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {r.status === "COMPLETED" ? (
                        <Link
                          href={`/admin/reviews/${r.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          View
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {track.Review.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-neutral-500" colSpan={5}>
                      No reviews yet
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200 font-medium">Queue</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Reviewer</th>
                  <th className="text-left font-medium px-4 py-3">Assigned</th>
                  <th className="text-left font-medium px-4 py-3">Expires</th>
                  <th className="text-left font-medium px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {track.ReviewQueue.map((q) => (
                  <tr key={q.id} className="text-neutral-700">
                    <td className="px-4 py-3">{q.ReviewerProfile.User.email}</td>
                    <td className="px-4 py-3">{new Date(q.assignedAt).toLocaleString()}</td>
                    <td className="px-4 py-3">{new Date(q.expiresAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <ReassignReviewerButton
                        trackId={track.id}
                        currentReviewerId={q.reviewerId}
                        currentReviewerEmail={q.ReviewerProfile.User.email}
                      />
                    </td>
                  </tr>
                ))}
                {track.ReviewQueue.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-neutral-500" colSpan={4}>
                      Queue is empty
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Debug Assignment */}
      {track.status === "QUEUED" || track.status === "IN_PROGRESS" ? (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4">
          <div className="text-sm text-neutral-500 mb-3">Debug</div>
          <DebugAssignButton trackId={track.id} />
        </div>
      ) : null}

      <div>
        <Link className="text-sm text-neutral-600 hover:text-neutral-900 underline" href="/admin/tracks">
          Back to tracks
        </Link>
      </div>
    </div>
  );
}
