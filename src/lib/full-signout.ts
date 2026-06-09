/**
 * Client-side logout helper. Use instead of next-auth's `signOut`.
 *
 * Hits /api/auth/full-logout (which deletes the DB session(s) and expires every
 * session-cookie variant — including the legacy .mixreflect.com cross-subdomain
 * cookie that next-auth's own signOut leaves behind), then hard-navigates so
 * server components re-render with no session.
 */
export async function fullSignOut(callbackUrl = "/"): Promise<void> {
  try {
    await fetch("/api/auth/full-logout", { method: "POST" });
  } catch {
    // Network hiccup — fall through to the redirect; the worst case is the user
    // retries. We deliberately don't swallow this silently in the UI.
  }
  // Full navigation (not router.push) so the server re-reads the now-absent
  // session and the nav flips back to logged-out state.
  window.location.href = callbackUrl;
}
