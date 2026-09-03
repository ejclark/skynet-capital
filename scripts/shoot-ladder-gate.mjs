import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
// Visual harness for the feedback gate (#1119) from the REAL built shell over stub APIs: the trade
// desk and the milestones table of contents as a brand-new member sees them — training wheels on,
// nothing filed, every rung shut for the one stated reason. JPEG ≤100KB (docs/PICTURES.md).
// Usage: npm run build --prefix app && node scripts/shoot-ladder-gate.mjs [outdir]
import { chromium } from "playwright-core";

const OUT = process.argv[2] || join(tmpdir(), "skynet-ladder-gate-shots");
mkdirSync(OUT, { recursive: true });
const DIST = resolve("app/dist");
if (!existsSync(join(DIST, "index.html"))) {
  console.error("shoot-ladder-gate: app/dist missing — run `npm run build --prefix app` first");
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
const NOTE =
  "The ladder opens the moment you say hello to Moneypenny — trading starts with a conversation.";
const gate = { reason: "first-message", note: NOTE };
const play = (code, name, tldr, kind, side, optionType) => ({
  code,
  id: code,
  name,
  tldr,
  kind,
  side,
  ...(optionType ? { optionType } : {}),
  gloss: "",
  locked: true,
});
const plays = {
  linked: true,
  wheels: true,
  gate,
  plays: [
    play("101", "Buy stock", "Own shares of a company you'd hold.", "stock", "buy"),
    play("102", "Sell stock", "Book a result, green or red.", "stock", "sell"),
    play("201", "Sell cash-secured put", "Get paid to buy lower.", "option", "sell", "put"),
    play("202", "Sell covered call", "Get paid to cap your upside.", "option", "sell", "call"),
    play("301", "Buy long put", "A defined-risk bet down.", "option", "buy", "put"),
    play("302", "Buy long call", "A defined-risk bet up.", "option", "buy", "call"),
  ],
};
const settings = {
  authConfigured: true,
  adminWired: false,
  fleetSuspended: false,
  timezones: [],
  accounts: [
    { id: "human-joe", name: "Uncle Joe", kind: "human", hostConfigured: false, profile: null },
  ],
};
const desk = {
  generatedAt: "2026-09-02T00:00:00Z",
  desk: {
    id: "human-joe",
    name: "Uncle Joe",
    kind: "human",
    positions: [],
    tiles: {
      openPositions: 0,
      invested: "$0.00",
      dayPl: "$0.00",
      dayTone: "flat",
      unrealized: "$0.00",
      unrealizedNote: "no positions",
      unrealizedTone: "flat",
      cash: "$1,000,000.00",
    },
  },
};
const course = (level, title, done, total) => ({
  level,
  title,
  subtitle: "",
  locked: level !== 100,
  done,
  total,
  milestones: [],
});
const learn = {
  linked: true,
  points: 0,
  totalPoints: 200,
  rank: "Observer",
  gate,
  courses: [
    course(100, "Stock basics — own it, book it", 0, 2),
    course(200, "The Wheel — get paid to own good stocks", 0, 2),
    course(300, "Directional options — buying calls & puts", 0, 2),
  ],
  celebrating: [],
  engagementCelebrating: [],
  pendingChecks: 0,
};
const onboarding = {
  linked: true,
  milestone: { id: "onboarding", code: "M·01", title: "Onboarding", desc: "" },
  steps: [],
  done: 1,
  total: 3,
  points: 10,
  totalPoints: 30,
  complete: false,
};
const playbooks = {
  linked: true,
  milestone: { id: "playbooks", code: "M·03", title: "Playbooks", desc: "" },
  arming: "season-1",
  unlocked: 0,
  total: 4,
  playbooks: [],
};

const json = (res, body) => {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
};
const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (url.pathname === "/api/trade/plays") return json(res, plays);
  if (url.pathname === "/api/settings") return json(res, settings);
  if (url.pathname.startsWith("/api/desk/")) return json(res, desk);
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
await page.goto(`${origin}/app/trade`);
await page.getByText("The ladder is waiting on you").waitFor();
await shoot("desk-gated");
await page.goto(`${origin}/app/learn`);
await page.getByText("Your account's milestones").waitFor();
await shoot("toc-gated");
await browser.close();
server.close();
