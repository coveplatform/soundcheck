/**
 * Free-tier model — the three-rung ladder:
 *   1. Your FIRST full report is free (one per email, lifetime).
 *   2. Every track after that generates normally but renders SEALED (the
 *      legacy teaser report) — the existing $6.95 unlock opens it + the room.
 *   3. Unlimited ($19.95/mo): every report opens instantly, room on 3/month.
 *
 * Kept free of server-only imports so client code can read the flag too.
 *
 * FREE_FULL_READ false = legacy model everywhere (every report sealed until
 * unlocked). Flip to true to launch: report openness, the submit-flow upsell
 * and all pricing copy key off this one constant.
 */
export const FREE_FULL_READ = false;

/** Free full reads per email, lifetime. */
export const FREE_READS_LIFETIME = 1;
