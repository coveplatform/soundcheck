import { prisma } from "@/lib/prisma";

/**
 * Ensure the user has an ArtistProfile and return its id. Idempotent and
 * race-safe (upsert on the unique userId).
 *
 * WHY THIS EXISTS: score reports link to an ArtistProfile via `artistId` for
 * attribution, but Google OAuth sign-up creates only a `User` row — no profile.
 * The submit/claim paths used to look the profile up and silently accept null
 * when it was missing, so authenticated submissions from OAuth users landed
 * unattributed (artistId = NULL). Callers that need an artistId must ensure the
 * profile exists rather than tolerate null.
 *
 * For the Score product a profile is purely the identity link — the legacy
 * credit/economy fields keep their schema defaults and are irrelevant here.
 */
export async function ensureArtistProfile(userId: string): Promise<string> {
  const existing = await prisma.artistProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (existing) return existing.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  const artistName =
    user?.name?.trim() || user?.email?.split("@")[0]?.trim() || "Artist";

  // upsert (not create) so two concurrent submits can't collide on the unique userId.
  const profile = await prisma.artistProfile.upsert({
    where: { userId },
    update: {},
    create: { userId, artistName },
    select: { id: true },
  });

  // Mirror POST /api/profile: a user with a profile is an artist.
  await prisma.user
    .update({ where: { id: userId }, data: { isArtist: true } })
    .catch(() => {});

  return profile.id;
}
