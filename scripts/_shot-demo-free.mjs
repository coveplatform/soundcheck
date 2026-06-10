// Screenshot the demo report pages (teaser + full, demo + real track).
import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const shots = [
  ["http://localhost:3000/report/demo-free?track=cutandrun", "cutandrun-teaser.png"],
  ["http://localhost:3000/report/demo-full?track=cutandrun", "cutandrun-full.png"],
];
for (const [url, name] of shots) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `scripts/_shots/${name}`, fullPage: true });
}
// close-up of the real waveform on the teaser
await page.goto(shots[0][0], { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(2000);
const wave = page.locator("section", { hasText: "we listened to the whole thing" }).first();
await wave.screenshot({ path: "scripts/_shots/cutandrun-wave.png" });

await browser.close();
console.log("done");
