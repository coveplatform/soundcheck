import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { RefundButton } from "@/components/admin/refund-button";
import { CancelTrackButton } from "@/components/admin/cancel-track-button";
import { GrantFreeButton } from "@/components/admin/grant-free-button";
import { DeleteTrackButton } from "@/components/admin/delete-track-button";
import { DebugAssignButton } from "@/components/admin/debug-assign-button";
import { NotifyInvalidLinkButton } from "@/components/admin/notify-invalid-link-button";
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
      artist: { include: { user: { select: { id: true, email: true } } } },
      genres: true,
      payment: true,
      queueEntries: {
        include: { reviewer: { include: { user: { select: { email: true } } } } },
        orderBy: { assignedAt: "asc" },
      },
      reviews: {
        include: {
          reviewer: { include: { user: { select: { email: true } } } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!track) {
    notFound();
  }

  const hasStartedReviews = track.reviews.some(
    (r) => r.status === "IN_PROGRESS" || r.status === "COMPLETED"
  );

  const canRefund =
    track.payment?.status === "COMPLETED" &&
    track.status !== "CANCELLED" &&
    !!track.payment.stripePaymentId &&
    !hasStartedReviews;

  const canCancel =
    track.status !== "CANCELLED" &&
    (track.status === "PENDING_PAYMENT" || track.status === "QUEUED");

  const canGrantFree =
    track.status === "PENDING_PAYMENT" &&
    (!track.payment || track.payment.status === "PENDING");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Track</h1>
          <p className="text-neutral-500">{track.title}</p>
        </div>
        <div className="flex items-center gap-2">
          {canGrantFree ? <GrantFreeButton trackId={track.id} /> : null}
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

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4">
          <div className="text-sm text-neutral-500">Status</div>
          <div className="font-medium">{track.status}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4">
          <div className="text-sm text-neutral-500">Payment</div>
          <div className="font-medium">{track.payment?.status ?? "None"}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4">
          <div className="text-sm text-neutral-500">Artist</div>
          <div className="font-medium">
            <Link className="underline" href={`/admin/users/${track.artist.user.id}`}>
              {track.artist.user.email}
            </Link>
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
              ) : (
                track.packageType
              )}
            </div>
          </div>
          <div>
            <div className="text-neutral-500">Reviews</div>
            <div className="font-medium">
              {track.reviewsCompleted} / {track.reviewsRequested}
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
                {track.reviews.map((r) => (
                  <tr key={r.id} className="text-neutral-700">
                    <td className="px-4 py-3">{r.reviewer.user.email}</td>
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
                {track.reviews.length === 0 ? (
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
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {track.queueEntries.map((q) => (
                  <tr key={q.id} className="text-neutral-700">
                    <td className="px-4 py-3">{q.reviewer.user.email}</td>
                    <td className="px-4 py-3">{new Date(q.assignedAt).toLocaleString()}</td>
                    <td className="px-4 py-3">{new Date(q.expiresAt).toLocaleString()}</td>
                  </tr>
                ))}
                {track.queueEntries.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-neutral-500" colSpan={3}>
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
