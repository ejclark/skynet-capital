import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
// Visual harness for /app/onboarding — milestone M·01 from the REAL built shell (app/dist) over a
// stub API, two frames: a brand-new member (nothing done, the connect form embedded) and a
// connected member (step 1 done, tiles live, steps 2–3 waiting). JPEG ≤100KB (docs/PICTURES.md).
// Usage: npm run build --prefix app && node scripts/shoot-onboarding.mjs [outdir]
import { chromium } from "playwright-core";

const OUT = process.argv[2] || join(tmpdir(), "skynet-onboarding-shots");
mkdirSync(OUT, { recursive: true });
const DIST = resolve("app/dist");
if (!existsSync(join(DIST, "index.html"))) {
  console.error("shoot-onboarding: app/dist missing — run `npm run build --prefix app` first");
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
const step = (id, title, detail, points, route, done) => ({
  id,
  title,
  detail,
  points,
  route,
  done,
});
const steps = (connected) => [
  step("connect", "Connect your Alpaca paper account", "", 10, "/app/join", connected),
  step(
    "first-feedback",
    "Meet Moneypenny — file your first feedback",
    "Moneypenny is our AI agent — she facilitates your learning and orchestrates much of the communication behind the scenes, including feedback. Tell her one thing that's on your mind and watch it get answered.",
    10,
    "/app/feedback?starter=onboarding",
    false,
  ),
  step(
    "first-trade",
    "Make your first trade",
    "Open the Trading Desk and buy a stock — rung 101. Orders fill while the market is open, 9:30 AM to 4:00 PM ET, Monday through Friday.",
    10,
    "/app/trade?play=101",
    false,
  ),
];
const milestone = { id: "onboarding", code: "M·01", title: "Onboarding", desc: "" };
const fresh = {
  linked: true,
  milestone,
  steps: steps(false),
  done: 0,
  total: 3,
  points: 0,
  totalPoints: 30,
  complete: false,
};
const connected = {
  ...fresh,
  steps: steps(true),
  done: 1,
  points: 10,
  account: {
    id: "human-joe",
    displayName: "Uncle Joe",
    equity: 1_000_000,
    cash: 1_000_000,
    stale: false,
    rungsEarned: 0,
    rungsTotal: 6,
    nextUp: { code: "101", title: "Buy stock" },
  },
};
const joinIndex = {
  wired: true,
  canAddBots: false,
  classes: [],
  timezones: [{ value: "America/New_York", label: "Eastern (New York)" }],
};

let state = fresh;
const json = (res, body) => {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
};
const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (url.pathname === "/api/onboarding") return json(res, state);
  if (url.pathname === "/api/join") return json(res, joinIndex);
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
const page = await browser.newPage({
  viewport: { width: 1280, height: 1100 },
  colorScheme: "dark",
});
const shoot = async (name) => {
  const path = join(OUT, `${name}.jpg`);
  await page.screenshot({ path, type: "jpeg", quality: 62, fullPage: false });
  console.log(`shot ${path}`);
};
await page.goto(`${origin}/app/onboarding`);
await page.getByLabel("Display name").waitFor();
await shoot("onboarding-fresh");

state = connected;
await page.goto(`${origin}/app/onboarding`);
await page.getByText("PAPER · LIVE").waitFor();
await shoot("onboarding-connected");

await browser.close();
server.close();
