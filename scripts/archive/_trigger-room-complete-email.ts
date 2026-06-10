import "dotenv/config";
import { sendScoreRoomCompleteEmail } from "../../src/lib/email/score";

const REPORT = {
  to: "legendaryknightsoul@gmail.com",
  trackTitle: "Scottsville Road",
  slug: "cmq64wc7x000804jske3vyzf6",
  total: 5,
};

async function main() {
  console.log("Sending room-complete email to", REPORT.to, "...");
  const ok = await sendScoreRoomCompleteEmail(REPORT);
  console.log("sendScoreRoomCompleteEmail ->", ok);
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
