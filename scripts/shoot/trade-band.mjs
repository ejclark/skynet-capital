// Visual harness + the falsifier's number for the market calendar's head on /app/trade (#3807 slice
// 3b-2). PHONE FIRST (docs/PICTURES.md): 390 with the head's events line (no tower on phones), then
// 1280 under `?shell=watchtower` with the tower at the head's right cap. JPEG ≤100KB.
//
// THE NUMBER. The plan put the tower top-right on the bet that the head is a ROW, never a column,
// so the docked Bench keeps its width at 1280 with Moneypenny's rail open. Every run prints the
// Bench's docked width there, with and without the flag — run it on main and on the branch, and the
// two lines are the before/after the PR quotes. A Bench that folds (`docked: false`) is the failure.
//
// It serves the REAL offline dashboard signed in as the crawl member (scripts/crawl/server.mjs +
// mint-session.ts — the same boot the persona crawl uses), so the events line reads the real
// research corpus and the Bench the real frozen book: stubs could not falsify a layout claim.
//
// Usage: npm run build --prefix app && npm run build:scene &&
//        npx tsx scripts/shoot/trade-band.mjs [outdir] [--measure-only]
import { chromium } from "playwright-core";
import { mintSession } from "../crawl/mint-session.ts";
import { bootServer, CRAWL_EMAIL, CRAWL_SECRET } from "../crawl/server.mjs";
import { sessionCookie } from "../crawl/steps.mjs";
import { outputDir, resolveChromium, shooter } from "./lib.mjs";

const measureOnly = process.argv.includes("--measure-only");
const out = outputDir(
  "trade-band",
  process.argv.filter((a) => !a.startsWith("--")),
);
// The week of META's Oct 28 print (src/domain/earnings-calendar.ts) and the Fed's Oct 28 decision,
// so one frame shows both tiers; the measurement reads the plain route.
const PICTURE = "/app/trade?desk=human-eric&symbol=META&on=2026-10-26";
const PLAIN = "/app/trade?desk=human-eric&symbol=META";

const server = await bootServer({ mode: "session", port: 8851, bridgePort: 8852 });
const exe = resolveChromium();
const browser = await chromium.launch({
  ...(exe ? { executablePath: exe } : {}),
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});

/** A fresh signed-in page (the shell flag is a stored pref — a new context starts without it). */
async function open(viewport) {
  const context = await browser.newContext({ viewport, colorScheme: "dark" });
  await context.addCookies([sessionCookie(mintSession(CRAWL_EMAIL, CRAWL_SECRET), server.origin)]);
  return context.newPage();
}

async function settle(page, path) {
  await page.goto(`${server.origin}${path}`);
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(900);
}

try {
  const rows = [];
  for (const flag of [false, true]) {
    const page = await open({ width: 1280, height: 900 });
    await settle(page, flag ? `${PLAIN}&shell=watchtower` : PLAIN);
    await page.getByRole("button", { name: /Moneypenny/ }).click();
    await page.waitForTimeout(600);
    rows.push({
      flag: flag ? "watchtower" : "off",
      ...(await page.evaluate(() => {
        const px = (el) => (el ? Math.round(el.getBoundingClientRect().width) : null);
        const head = document.querySelector("main .cal-head");
        return {
          rail: px(document.querySelector(".mp-rail")),
          stage: px(document.querySelector("main.stage")),
          bench: px(document.querySelector(".bench")),
          docked: document.querySelector(".bench-docked") !== null,
          head: head ? Math.round(head.getBoundingClientRect().height) : null,
        };
      })),
    });
    await page.context().close();
  }
  console.log(`bench at 1280, Moneypenny open: ${JSON.stringify(rows)}`);

  if (!measureOnly) {
    const phone = await open({ width: 390, height: 844 });
    await settle(phone, PICTURE);
    await shooter(phone, out, { quality: 58 })("trade-band-phone");
    await phone.context().close();
    const desk = await open({ width: 1280, height: 800 });
    await settle(desk, `${PICTURE}&shell=watchtower`);
    await desk.waitForTimeout(2500); // the tower's first frames
    await shooter(desk, out, { quality: 50 })("trade-band-desktop");
    await desk.context().close();
  }
} finally {
  await browser.close();
  await server.close();
}
