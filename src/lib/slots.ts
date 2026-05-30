import { prisma } from "./prisma";

// Slot limits by tier
export const FREE_MAX_SLOTS = 1;
export const PRO_MAX_SLOTS = 3;

// Upload cap — tracks in library (any real status, excluding pre-payment/cancelled)
export const FREE_MAX_UPLOADS = 1;
export const COUNTED_UPLOAD_STATUSES = ["UPLOADED", "QUEUED", "IN_PROGRESS", "COMPLETED"] as const;

// Statuses that occupy a slot
export const ACTIVE_TRACK_STATUSES = ["QUEUED", "IN_PROGRESS", "PENDING_PAYMENT"] as const;

export function getMaxSlots(isPro: boolean): number {
  return isPro ? PRO_MAX_SLOTS : FREE_MAX_SLOTS;
}

export async function getActiveTrackCount(artistProfileId: string): Promise<number> {
  return prisma.track.count({
    where: {
      artistId: artistProfileId,
      status: { in: [...ACTIVE_TRACK_STATUSES] },
      // Track B in an A/B pair shares its primary's slot — don't double-count
      abTestPrimaryTrackId: null,
    },
  });
}

export async function getTotalUploadCount(artistProfileId: string): Promise<number> {
  return prisma.track.count({
    where: {
      artistId: artistProfileId,
      status: { in: [...COUNTED_UPLOAD_STATUSES] },
      abTestPrimaryTrackId: null,
    },
  });
}

export async function hasAvailableUpload(
  artistProfileId: string,
  isPro: boolean
): Promise<{ available: boolean; uploadCount: number; maxUploads: number | null }> {
  if (isPro) return { available: true, uploadCount: 0, maxUploads: null };
  const uploadCount = await getTotalUploadCount(artistProfileId);
  return {
    available: uploadCount < FREE_MAX_UPLOADS,
    uploadCount,
    maxUploads: FREE_MAX_UPLOADS,
  };
}

export async function hasAvailableSlot(
  artistProfileId: string,
  isPro: boolean
): Promise<{ available: boolean; activeCount: number; maxSlots: number }> {
  const maxSlots = getMaxSlots(isPro);
  const activeCount = await getActiveTrackCount(artistProfileId);
  return {
    available: activeCount < maxSlots,
    activeCount,
    maxSlots,
  };
}
