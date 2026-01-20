/**
 * Desktop app authentication helpers
 */

export function parseDesktopApiKey(apiKey: string): { userId: string } | null {
  try {
    // Format: userId.randomKey
    const parts = apiKey.split(".");
    if (parts.length !== 2) {
      return null;
    }

    const [userId] = parts;

    if (!userId) {
      return null;
    }

    return { userId };
  } catch {
    return null;
  }
}

export function isDesktopApiKey(authHeader: string | null): boolean {
  if (!authHeader) return false;

  const token = authHeader.replace("Bearer ", "");

  // Desktop API keys have format: userId.randomKey (32 hex chars)
  // NextAuth session tokens are JWTs (much longer and have 3 parts separated by dots)
  return token.split(".").length === 2 && token.split(".")[1].length === 64;
}
