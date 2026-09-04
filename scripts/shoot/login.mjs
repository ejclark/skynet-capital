// Visual harness: render the real loginPage() and screenshot its states with Chromium — so the
// animation (idle hero, a live play, the revealed form) can be reviewed without spinning up the
// full server. Usage: npm run shoot:login [outdir]
// Needs a Chromium: either set PW_CHROME to a binary, or run `npx playwright install chromium`.
//
// This one keeps its own page loop rather than using `shootHtml`: its frames are a TIMED SEQUENCE
// through one document (plays fire on a cooldown, the reveal is a three-stage animation), not a
// list of independent pages. That is a real difference, unlike the Chromium resolver and output
// directory it used to hand-roll.
import { writeFileSync } from "node:fs";
import { chromium } from "playwright-core";
import { resolveAuth } from "../../src/server/auth/resolve-auth.ts";
import { outputDir, resolveChromium } from "./lib.mjs";

const OUT = outputDir("login");

const auth = resolveAuth({
  SKYNET_SESSION_SECRET: "dev",
  SKYNET_GOOGLE_CLIENT_ID: "x",
  SKYNET_GOOGLE_CLIENT_SECRET: "y",
  SKYNET_GITHUB_CLIENT_ID: "a",
  SKYNET_GITHUB_CLIENT_SECRET: "b",
});
writeFileSync(`${OUT}/idle.html`, auth.loginPage());
writeFileSync(
  `${OUT}/error.html`,
  auth.loginPage("stranger@gmail.com isn't on the guest list. Ask Eric to add you."),
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shootAt(page, w, h, tag) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(`file://${OUT}/idle.html`);
  await sleep(1400);
  await page.screenshot({ path: `${OUT}/${tag}-idle.png` });
  // Catch a live play: sample a few frames a couple seconds apart (plays fire on a cooldown).
  await sleep(3200);
  await page.screenshot({ path: `${OUT}/${tag}-play1.png` });
  await sleep(2600);
  await page.screenshot({ path: `${OUT}/${tag}-play2.png` });
  await sleep(2600);
  await page.screenshot({ path: `${OUT}/${tag}-play3.png` });
  // Reveal sequence: title flight -> land+sweep -> form falls in.
  await page.click("#beacon");
  await sleep(320);
  await page.screenshot({ path: `${OUT}/${tag}-reveal-1flight.png` });
  await sleep(420);
  await page.screenshot({ path: `${OUT}/${tag}-reveal-2sweep.png` });
  await sleep(500);
  await page.screenshot({ path: `${OUT}/${tag}-reveal-3formin.png` });
  await sleep(800);
  await page.screenshot({ path: `${OUT}/${tag}-reveal.png` });
}

const exe = resolveChromium();
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage({ deviceScaleFactor: 1, colorScheme: "dark" });
await shootAt(page, 1440, 900, "desktop");
await shootAt(page, 900, 620, "short"); // short viewport: does the toggle clear the form?
await shootAt(page, 400, 820, "mobile"); // narrow: stacked play, evidence column dropped
await browser.close();
console.log("shots written to", OUT);
