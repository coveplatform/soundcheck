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
        include: {
          ReviewerProfile: { include: { User: { select: { email: true } } } },
          ArtistProfile: { include: { User: { select: { email: true } } } },
        },
        orderBy: { assignedAt: "asc" },
      },
      Review: {
        include: {
          ReviewerProfile: { include: { User: { select: { email: true } } } },
          ArtistProfile: { include: { User: { select: { email: true } } } },
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
    <div className="space-y-6 text-[#f4f4ef]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold lowercase">track</h1>
          <p className="text-white/50">{track.title}</p>
        </div>
        <div className="flex items-center gap-2">
          {canRefund ? <RefundButton trackId={track.id} /> : null}
          {canCancel ? <CancelTrackButton trackId={track.id} /> : null}
          <DeleteTrackButton trackId={track.id} />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0e0e0e] p-4">
        <div className="text-sm text-white/40">Listen</div>
        <div className="mt-3">
          <AudioPlayer
            sourceUrl={track.sourceUrl}
            sourceType={track.sourceType}
            showListenTracker={false}
            showWaveform={track.sourceType === "UPLOAD"}
          />
        </div>
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs text-white/35">Source URL ({track.sourceType})</div>
              <a
                href={track.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#6ee7ff] hover:text-white underline break-all"
              >
                {track.sourceUrl}
              </a>
            </div>
            {track.sourceType !== "UPLOAD" && (
              <div className="flex-shrink-0">
                {track.linkIssueNotifiedAt ? (
                  <span className="text-xs text-[#fbbf24] font-medium">
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
        <div className="rounded-xl border border-white/10 bg-[#0e0e0e] p-4">
          <div className="text-sm text-white/40">Status</div>
          <div className="font-medium">{track.status}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0e0e0e] p-4">
          <div className="text-sm text-white/40">Payment</div>
          <div className="font-medium">
            {track.Payment?.status ? (
              track.Payment.status
            ) : track.status !== "PENDING_PAYMENT" ? (
              <span className="px-2 py-0.5 text-xs font-bold bg-[#6ee7ff]/10 text-[#6ee7ff] rounded">
                REVIEW CREDITS
              </span>
            ) : (
              "Pending"
            )}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0e0e0e] p-4">
          <div className="text-sm text-white/40">Artist</div>
          <div className="font-medium">
            <Link className="underline decoration-white/20 hover:text-[#6ee7ff]" href={`/admin/users/${track.ArtistProfile.User.id}`}>
              {track.ArtistProfile.User.email}
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0e0e0e] p-4">
        <div className="text-sm text-white/40">Details</div>
        <div className="mt-2 grid md:grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-white/40">Package</div>
            <div className="font-medium">
              {track.promoCode ? (
                <span className="inline-flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-bold bg-[#6ee7ff]/10 text-[#6ee7ff] rounded">
                    PROMO: {track.promoCode}
                  </span>
                </span>
              ) : track.packageType ? (
                <span>
                  {(PACKAGES as Record<string, { name: string }>)[track.packageType]?.name || track.packageType}
                  <span className="ml-1 text-xs text-white/40">({track.packageType})</span>
                </span>
              ) : (
                <span className="text-white/30">—</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-white/40">Reviews</div>
            <div className="font-medium">
              {countedCompletedReviews} / {track.reviewsRequested}
            </div>
          </div>
          <div>
            <div className="text-white/40">Created</div>
            <div className="font-medium">{new Date(track.createdAt).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 bg-[#0e0e0e] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 font-bold lowercase">reviews</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/[0.03] text-white/40">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Reviewer</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3">Flagged</th>
                  <th className="text-left font-medium px-4 py-3">Created</th>
                  <th className="text-left font-medium px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {track.Review.map((r) => (
                  <tr key={r.id} className="text-white/75">
                    <td className="px-4 py-3">{r.ReviewerProfile?.User.email || r.ArtistProfile?.User?.email || "Peer"}</td>
                    <td className="px-4 py-3">{r.status}</td>
                    <td className="px-4 py-3">{r.wasFlagged ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {r.status === "COMPLETED" ? (
                        <Link
                          href={`/admin/reviews/${r.id}`}
                          className="text-sm text-[#6ee7ff] hover:text-white underline"
                        >
                          View
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {track.Review.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-white/40" colSpan={5}>
                      No reviews yet
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0e0e0e] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 font-bold lowercase">queue</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/[0.03] text-white/40">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Reviewer</th>
                  <th className="text-left font-medium px-4 py-3">Assigned</th>
                  <th className="text-left font-medium px-4 py-3">Expires</th>
                  <th className="text-left font-medium px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {track.ReviewQueue.map((q) => (
                  <tr key={q.id} className="text-white/75">
                    <td className="px-4 py-3">{q.ReviewerProfile?.User.email || q.ArtistProfile?.User?.email || "Peer"}</td>
                    <td className="px-4 py-3">{new Date(q.assignedAt).toLocaleString()}</td>
                    <td className="px-4 py-3">{new Date(q.expiresAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {q.reviewerId && q.ReviewerProfile ? (
                        <ReassignReviewerButton
                          trackId={track.id}
                          currentReviewerId={q.reviewerId}
                          currentReviewerEmail={q.ReviewerProfile.User.email}
                        />
                      ) : null}
                    </td>
                  </tr>
                ))}
                {track.ReviewQueue.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-white/40" colSpan={4}>
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
        <div className="rounded-xl border border-white/10 bg-[#0e0e0e] p-4">
          <div className="text-sm text-white/40 mb-3">Debug</div>
          <DebugAssignButton trackId={track.id} />
        </div>
      ) : null}

      <div>
        <Link className="text-sm text-white/50 hover:text-[#6ee7ff] underline decoration-white/20" href="/admin/tracks">
          Back to tracks
        </Link>
      </div>
    </div>
  );
}
