export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;

  const configured = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL;
  if (!configured) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "Admin is not configured (set ADMIN_EMAILS or ADMIN_EMAIL). Admin routes will be inaccessible."
      );
    }
    return false;
  }

  const allowed = configured
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return allowed.includes(email.toLowerCase());
}
