/**
 * Canonical production origin — the single source of truth for all SEO signals
 * (sitemap, robots, JSON-LD, canonical tags, Open Graph URLs).
 *
 * The live site serves `www` as canonical (apex 301-redirects to www), so every
 * canonical signal MUST use this value. Do not hardcode the host anywhere else —
 * import SITE_URL instead. This prevents the www/non-www drift that previously
 * split ranking authority across two hosts.
 */
export const SITE_URL = "https://www.mixreflect.com";
