// Throwaway: mint a NextAuth JWT session for a test account, force dark mode,
// and screenshot the key dashboard pages so we can review the dark theme.
// The account signs in with Google (no password), so instead of the login form
// we forge a valid session cookie using NEXTAUTH_SECRET — non-destructive.
// Usage: MR_TEST_EMAIL=... node scripts/_darkmode-shots.mjs
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";
import { encode } from "next-auth/jwt";

const BASE = process.env.MR_BASE_URL || "http://127.0.0.1:3000";
const EMAIL = process.env.MR_TEST_EMAIL;
const OUT = "scripts/_shots";

if (!EMAIL) {
  console.error("Set MR_TEST_EMAIL env var.");
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

// --- Read NEXTAUTH_SECRET from env files ---
function readEnv(key) {
  for (const f of [".env.local", ".env"]) {
    try {
      const line = readFileSync(f, "utf8")
        .split(/\r?\n/)
        .find((l) => l.startsWith(`${key}=`));
      if (line) return line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "");
    } catch {}
  }
  return undefined;
}
const secret = readEnv("NEXTAUTH_SECRET");
if (!secret) {
  console.error("NEXTAUTH_SECRET not found in .env.local/.env");
  process.exit(1);
}

// --- Mint a session token. The jwt callback hydrates id/roles from the DB by
// email on the first request, so we only need a valid email here. ---
const token = await encode({
  token: { name: "Kris", email: EMAIL },
  secret,
  maxAge: 60 * 60,
});

const THEME = process.env.MR_THEME === "light" ? "light" : "dark";
const pages = [
  [`tracks-stats-${THEME}`, "/tracks?view=stats"],
  [`tracks-picker-${THEME}`, "/tracks"],
];

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1100, height: 750 },
  deviceScaleFactor: 1,
});

await context.addCookies([
  // Forged NextAuth session (http dev cookie name).
  { name: "next-auth.session-token", value: token, url: BASE, httpOnly: true, sameSite: "Lax" },
  // Dashboard theme (SSR reads this). Skip entirely when MR_THEME=none to test
  // the server default.
  ...(process.env.MR_THEME === "none"
    ? []
    : [{ name: "mr-theme", value: THEME, url: BASE }]),
]);

const page = await context.newPage();
page.setDefaultTimeout(90000);
page.setDefaultNavigationTimeout(90000);

// Sanity check: land on dashboard and confirm we're not bounced to /login.
await page.goto(`${BASE}/dashboard`, { waitUntil: "commit" });
await page.waitForTimeout(3000);
if (page.url().includes("/login")) {
  console.error("Session not accepted — still redirected to /login.");
  await page.screenshot({ path: `${OUT}/_auth-failed.png`, fullPage: true });
  await browser.close();
  process.exit(1);
}
console.log("authenticated, at:", page.url());

// --- Capture each page ---
for (const [name, path] of pages) {
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: "commit", timeout: 90000 });
    // Wait for the page to fully render past the loading skeleton
    await page.waitForSelector("h1", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);
    const addBtn = page.getByRole("button", { name: /add track/i }).first();
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(1200);
      // Navigate into the review-count screen by clicking the first track
      const firstTrack = page.locator("[data-dialog-content] button, [role=dialog] button").first();
      if (await firstTrack.isVisible().catch(() => false)) {
        await firstTrack.click();
        await page.waitForTimeout(800);
      }
    }
    await page.screenshot({ path: `${OUT}/${name}.png` });
    console.log(`✓ ${name}`);
  } catch (e) {
    console.log(`✗ ${name}: ${e.message}`);
  }
}

await browser.close();
console.log(`\nDone → ${OUT}/`);
