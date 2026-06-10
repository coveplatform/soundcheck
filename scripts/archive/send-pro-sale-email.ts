/**
 * One-shot script — send the Pro 50% off promo email.
 * Usage: npx tsx scripts/send-pro-sale-email.ts [email]
 * Defaults to kris.engelhardt4@gmail.com if no arg provided.
 */

import "dotenv/config";
import { sendProSaleEmail } from "../../src/lib/email/announcements";

const to = process.argv[2] || "kris.engelhardt4@gmail.com";

async function main() {
  console.log(`Sending Pro sale email to: ${to}`);
  const ok = await sendProSaleEmail({ to, userName: undefined });
  if (ok) {
    console.log("Email sent successfully.");
  } else {
    console.error("Failed to send email — check RESEND_API_KEY and RESEND_FROM_EMAIL env vars.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
