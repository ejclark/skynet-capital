// One page, the phone checks, ~10 seconds — the check a session runs after touching a surface,
// without walking every member journey (that is `npm run crawl -- --phone-audit`). Mobile-first
// is the house discipline on every information surface (CLAUDE.md); this makes asking "does it
// hold at 390px?" cheap enough to ask every time.
//
//   npm run phone -- /app/trade                 # open boot: an anonymous viewer
//   npm run phone -- /app/accounts --session    # signed in as the crawl member (human-eric)
//   npm run phone -- /app/trade --strict        # exit 1 on any high or medium finding
//   npm run phone -- /app/trade --all           # list the advisory (low) rows too, not just a count
//   npm run phone -- /app/wire --click .status  # open something first (a popover), then measure
//   npm run phone -- /app/wire --at 2026-09-26T15:00:00Z   # pin the clock (the market clock's state)
//
// Boots the offline dashboard exactly as the crawl does (server.mjs: frozen fixtures, no feedback
// token) while Chromium launches, opens the path at the crawl's phone viewport in dark mode, runs
// phone.mjs's checks and prints them. Needs a built app (`npm run build --prefix app`). Runs
// under tsx because `--session` mints the cookie with mint-session.ts.

import { chromium } from "playwright-core";
import { resolveChromium } from "../shoot/lib.mjs";
import { locate } from "./locate.mjs";
import { mintSession } from "./mint-session.ts";
import { phoneArgs, probePhone } from "./phone.mjs";
import { bootServer, CRAWL_EMAIL, CRAWL_SECRET } from "./server.mjs";
import { sessionCookie, VIEWPORTS } from "./steps.mjs";

/** Enough to render the route; a page holding an SSE open never idles, so idle is best-effort. */
async function settle(page) {
  await page.waitForLoadState("load");
  await page.waitForLoadState("networkidle", { timeout: 1500 }).catch(() => {
    /* a held-open stream — the short wait below is the fallback */
  });
  await page.waitForTimeout(300);
}

const pad = (s, n) => (s.length >= n ? s : s + " ".repeat(n - s.length));

const RANK = { high: 0, medium: 1, low: 2 };

/** High and medium in full, worst first; the advisory rows fold to a count unless `--all`. */
function print(path, findings, ms, all) {
  const counts = ["high", "medium", "low"].map(
    (s) => `${s} ${findings.filter((f) => f.severity === s).length}`,
  );
  console.log(`phone: ${path} @390×844 — ${findings.length} findings (${counts.join(" · ")})`);
  const listed = findings
    .filter((f) => all || f.severity !== "low")
    .sort((a, b) => RANK[a.severity] - RANK[b.severity]);
  const kindWidth = Math.max(4, ...listed.map((f) => f.kind.length));
  for (const f of listed) {
    const where = locate(f.snippet);
    console.log(
      `  ${pad(f.severity, 6)} ${pad(f.kind, kindWidth)}  ${f.what}${where === "—" ? "" : `  [${where}]`}`,
    );
  }
  const folded = findings.length - listed.length;
  if (folded > 0)
    console.log(
      `  low    ${folded} advisory row(s), e.g. SC 2.5.5's 44×44 (AAA) — --all lists them`,
    );
  console.log(`phone: ${(ms / 1000).toFixed(1)}s`);
}

async function main() {
  const t0 = Date.now();
  const opts = phoneArgs(process.argv.slice(2));
  const exe = resolveChromium();
  const [server, browser] = await Promise.all([
    bootServer({
      mode: opts.session ? "session" : "open",
      port: opts.port,
      bridgePort: opts.bridgePort,
    }),
    chromium.launch({
      ...(exe ? { executablePath: exe } : {}),
      args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
    }),
  ]);
  let findings = [];
  try {
    const context = await browser.newContext({
      ...VIEWPORTS.phone,
      colorScheme: "dark",
      baseURL: server.origin,
    });
    if (opts.session) {
      await context.addCookies([
        sessionCookie(mintSession(CRAWL_EMAIL, CRAWL_SECRET), server.origin),
      ]);
    }
    const page = await context.newPage();
    if (opts.at) await page.clock.setFixedTime(new Date(opts.at));
    await page.goto(opts.path, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await settle(page);
    if (opts.click) {
      await page.locator(opts.click).first().click();
      await settle(page);
    }
    const landed = new URL(page.url()).pathname;
    findings = await probePhone(page);
    const where = landed === opts.path ? opts.path : `${opts.path} → ${landed}`;
    const after = [opts.at && `at ${opts.at}`, opts.click && `after clicking ${opts.click}`];
    print([where, ...after].filter(Boolean).join(" · "), findings, Date.now() - t0, opts.all);
  } finally {
    await browser.close();
    await server.close();
  }
  const blocking = findings.filter((f) => f.severity !== "low").length;
  if (opts.strict && blocking > 0) {
    console.error(`phone: --strict — ${blocking} high/medium finding(s)`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
