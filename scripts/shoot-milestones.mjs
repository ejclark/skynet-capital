import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
// Visual harness for the milestones chapters (#1119) from the REAL built shell over stub APIs:
// /app/learn (the table of contents) and /app/playbooks (M·03, WIP). JPEG ≤100KB.
// Usage: npm run build --prefix app && node scripts/shoot-milestones.mjs [outdir]
import { chromium } from "playwright-core";

const OUT = process.argv[2] || join(tmpdir(), "skynet-milestones-shots");
mkdirSync(OUT, { recursive: true });
const DIST = resolve("app/dist");
if (!existsSync(join(DIST, "index.html"))) {
  console.error("shoot-milestones: app/dist missing — run `npm run build --prefix app` first");
  process.exit(1);
}
const EXE = [
  process.env.PW_CHROME,
  "/opt/pw-browsers/chromium/chrome-linux/chrome",
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
]
  .filter(Boolean)
  .find((p) => existsSync(p));
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};
const ms = (id, title, points, earned) => ({
  id,
  title,
  detail: "",
  points,
  ...(earned ? { earned } : { ticket: "/app/trade" }),
});
const learn = {
  linked: true,
  points: 50,
  totalPoints: 200,
  rank: "Trader",
  courses: [
    {
      level: 100,
      title: "Stock basics — own it, book it",
      subtitle: "",
      locked: false,
      done: 2,
      total: 2,
      milestones: [
        ms("first-buy", "Buy your first stock", 25, { on: "2026-09-01", orderId: "o1" }),
        ms("first-sell", "Sell your first stock", 25, { on: "2026-09-01", orderId: "o2" }),
      ],
    },
    {
      level: 200,
      title: "The Wheel — get paid to own good stocks",
      subtitle: "",
      locked: false,
      done: 0,
      total: 2,
      milestones: [
        ms("csp", "Sell your first cash-secured put", 35),
        ms("cc", "Sell your first covered call", 35),
      ],
    },
    {
      level: 300,
      title: "Directional options — buying calls & puts",
      subtitle: "",
      locked: true,
      done: 0,
      total: 2,
      milestones: [],
    },
  ],
  celebrating: [],
  engagementCelebrating: [],
  pendingChecks: 0,
};
const onboarding = {
  linked: true,
  milestone: { id: "onboarding", code: "M·01", title: "Onboarding", desc: "" },
  steps: [],
  done: 3,
  total: 3,
  points: 30,
  totalPoints: 30,
  complete: true,
};
const pb = (
  id,
  glyph,
  title,
  kind,
  detail,
  unlocksAfter,
  unlocksAfterName,
  seasonOneCriteria,
  unlocked,
) => ({
  id,
  glyph,
  title,
  kind,
  detail,
  unlocksAfter,
  unlocksAfterName,
  seasonOneCriteria,
  unlocked,
});
const playbooks = {
  linked: true,
  milestone: { id: "playbooks", code: "M·03", title: "Playbooks", desc: "" },
  arming: "season-1",
  unlocked: 1,
  total: 4,
  playbooks: [
    pb(
      "accumulator",
      "⬒",
      "Blue-chip accumulator",
      "AUTO-DRAFT · BUYS",
      "Drafts a recurring buy of your core holding on a schedule you set, sized to your buying power.",
      "102",
      "Sell stock",
      "buy + sell a stock with a net positive result",
      true,
    ),
    pb(
      "wheel-put",
      "◑",
      "Wheel · put leg",
      "AUTO-DRAFT · CSP",
      "Watches your watchlist for puts at strikes you'd buy, ~30 delta, and drafts the cash-secured ticket.",
      "201",
      "Sell cash-secured put",
      "one cash-secured put filled, premium kept ≥ 1% of secured cash",
      false,
    ),
    pb(
      "wheel-call",
      "◐",
      "Wheel · call leg",
      "AUTO-DRAFT · COVERED CALL",
      "When you hold 100+ shares, drafts a covered call above your cost basis at your target premium.",
      "202",
      "Sell covered call",
      "one covered call filled above cost basis",
      false,
    ),
    pb(
      "hedge",
      "◮",
      "Portfolio hedge",
      "AUTO-DRAFT · LONG PUTS",
      "Drafts a protective put when your portfolio concentration crosses the threshold you set.",
      "302",
      "Buy long call",
      "one long put + one long call filled, ≥ 2% margin on the round trip",
      false,
    ),
  ],
};
const json = (res, body) => {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
};
const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (url.pathname === "/api/learn") return json(res, learn);
  if (url.pathname === "/api/onboarding") return json(res, onboarding);
  if (url.pathname === "/api/playbooks") return json(res, playbooks);
  if (url.pathname.startsWith("/api/")) return json(res, {});
  if (url.pathname === "/events") return;
  const rel = url.pathname.replace(/^\/app\/?/, "");
  const file = resolve(DIST, rel);
  const type = TYPES[extname(file)];
  if (rel && type && file.startsWith(DIST) && existsSync(file)) {
    res.writeHead(200, { "content-type": type });
    return res.end(readFileSync(file));
  }
  res.writeHead(200, { "content-type": TYPES[".html"] });
  res.end(readFileSync(join(DIST, "index.html")));
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: "dark" });
const shoot = async (name) => {
  const path = join(OUT, `${name}.jpg`);
  await page.screenshot({ path, type: "jpeg", quality: 62, fullPage: false });
  console.log(`shot ${path}`);
};
await page.goto(`${origin}/app/learn`);
await page.getByText("Your account's milestones").waitFor();
await shoot("milestones-toc");
await page.goto(`${origin}/app/playbooks`);
await page.getByText("Prove the play by hand, then arm it").waitFor();
await shoot("playbooks");
await page.goto(`${origin}/app/learn/trading`);
await page.getByText("One fill unlocks the next rung").waitFor();
await shoot("trading-ladder");
await browser.close();
server.close();
