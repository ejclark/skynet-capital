import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// Visual harness: render the real loginPage() and screenshot its states with Chromium — so the
// animation (idle hero, a live play, the revealed form) can be reviewed without spinning up the
// full server. Usage: npm run shoot:login [outdir]
// Needs a Chromium: either set PW_CHROME to a binary, or run `npx playwright install chromium`.
import { chromium } from "playwright-core";
import { resolveAuth } from "../src/server/auth/authenticator.ts";

const OUT = process.argv[2] || join(tmpdir(), "skynet-login-shots");
mkdirSync(OUT, { recursive: true });
// Prefer an explicit binary (this repo's cloud env pre-installs one); else let Playwright resolve.
const CANDIDATES = [
  process.env.PW_CHROME,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
].filter(Boolean);
const EXE = CANDIDATES.find((p) => existsSync(p));

const auth = resolveAuth({
  SKYNET_SESSION_SECRET: "dev",
  SKYNET_GOOGLE_CLIENT_ID: "x",
  SKYNET_GOOGLE_CLIENT_SECRET: "y",
  SKYNET_GITHUB_CLIENT_ID: "a",
  SKYNET_GITHUB_CLIENT_SECRET: "b",
});
const idle = auth.loginPage();
writeFileSync(`${OUT}/idle.html`, idle);
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

const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});
const page = await browser.newPage({ deviceScaleFactor: 1, colorScheme: "dark" });
await shootAt(page, 1440, 900, "desktop");
await shootAt(page, 900, 620, "short"); // short viewport: does the toggle clear the form?
await browser.close();
console.log("shots written to", OUT);
