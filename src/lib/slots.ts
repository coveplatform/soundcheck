import { prisma } from "./prisma";

// Slot limits by tier
export const FREE_MAX_SLOTS = 1;
export const PRO_MAX_SLOTS = 3;

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
    },
  });
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
