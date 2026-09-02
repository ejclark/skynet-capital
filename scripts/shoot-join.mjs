import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
// Visual harness for /app/join — the Alpaca connect step of onboarding, served from the REAL built
// shell (app/dist) over a stub `/api/join`, so the frame Eric judges is the frame a member gets
// (CLAUDE.md: every choice becomes something he can see). Two frames: the fresh page (the five
// flat guide steps + the form, as an owner sees it) and the balance-check stop a $100,000 default
// paper account lands on. JPEG ≤100KB each (docs/PICTURES.md) — fix weight HERE, not by hand.
// Usage: npm run build --prefix app && node scripts/shoot-join.mjs [outdir]
import { chromium } from "playwright-core";

const OUT = process.argv[2] || join(tmpdir(), "skynet-join-shots");
mkdirSync(OUT, { recursive: true });
const DIST = resolve("app/dist");
if (!existsSync(join(DIST, "index.html"))) {
  console.error("shoot-join: app/dist missing — run `npm run build --prefix app` first");
  process.exit(1);
}
const CANDIDATES = [
  process.env.PW_CHROME,
  "/opt/pw-browsers/chromium/chrome-linux/chrome",
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
].filter(Boolean);
const EXE = CANDIDATES.find((p) => existsSync(p));

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};
const joinIndex = {
  wired: true,
  canAddBots: true,
  classes: [
    { id: "sauron", name: "Sauron", thesis: "Sells premium into fear; the Eye sees every strike." },
  ],
  timezones: [{ value: "America/New_York", label: "Eastern (New York)" }],
};
const balanceStop = {
  ok: false,
  reason: "balance",
  found: 100000,
  error:
    "Balance check failed. Your paper account reports $100,000.00 — the league requires exactly $1,000,000.00 so everyone starts from the same capital.",
};
const json = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
};
const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (url.pathname === "/api/join")
    return json(res, 200, req.method === "POST" ? balanceStop : joinIndex);
  if (url.pathname.startsWith("/api/")) return json(res, 200, {});
  if (url.pathname === "/events") return; // the SSE stream: hold the request open, send nothing
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
  viewport: { width: 1280, height: 1180 },
  colorScheme: "dark",
});
await page.goto(`${origin}/app/join`);
await page.getByLabel("Display name").waitFor();
const shoot = async (name) => {
  const path = join(OUT, `${name}.jpg`);
  await page.screenshot({ path, type: "jpeg", quality: 62, fullPage: false });
  console.log(`shot ${path}`);
};
await shoot("join-guide");

await page.getByLabel("Display name").fill("Uncle Joe");
await page.getByLabel("Alpaca paper API key").fill("PKEXAMPLEKEYID0000");
await page.getByLabel("Alpaca paper API secret").fill("not-a-real-secret-just-long-enough");
await page.getByRole("button", { name: "Add my account" }).click();
await page.getByRole("alert").waitFor();
await page.getByRole("alert").scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollBy(0, 120));
await shoot("join-balance-stop");

await browser.close();
server.close();
