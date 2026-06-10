import "dotenv/config";
import { sendAdminNewScoreSubmissionEmail } from "../../src/lib/email/admin";

async function main() {
  console.log("Sending test admin upload notification...");
  await sendAdminNewScoreSubmissionEmail({
    trackTitle: "Scottsville Road (TEST notification)",
    artistEmail: "legendaryknightsoul@gmail.com",
    genre: "Country",
    reportSlug: "cmq64wc7x000804jske3vyzf6",
    unlocked: true,
  });
  console.log("Done — check kris.engelhardt4@gmail.com inbox.");
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
