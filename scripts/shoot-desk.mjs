import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// Visual harness for the player desk: render the four tabs + the review screen from real sample
// data and screenshot them with Chromium, so the surface can be judged by eye (docs/CLAUDE.md —
// every choice becomes something Eric can see) without standing up a server or a broker.
// Usage: node scripts/shoot-desk.mjs [outdir]
import { chromium } from "playwright-core";
import { renderAnalysisBody } from "../src/observatory/analysis-view.ts";
import { renderHistoryBody } from "../src/observatory/history-view.ts";
import { renderMetricsBody } from "../src/observatory/metrics-view.ts";
import { renderPositionsBody } from "../src/observatory/positions-view.ts";
import { renderTradeReviewBody } from "../src/observatory/trade-review-view.ts";
import { previewOrder } from "../src/trading/order-ticket.ts";

const OUT = process.argv[2] || join(tmpdir(), "skynet-desk-shots");
mkdirSync(OUT, { recursive: true });
const CANDIDATES = [
  process.env.PW_CHROME,
  "/opt/pw-browsers/chromium/chrome-linux/chrome",
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
].filter(Boolean);
const EXE = CANDIDATES.find((p) => existsSync(p));

const day = (n) => new Date(Date.UTC(2026, 6, n, 14, 0, 0)).toISOString();

const fill = (symbol, side, quantity, price, at) => ({
  symbol,
  side,
  quantity,
  filledQuantity: quantity,
  price,
  status: "filled",
  at,
});

const snapshot = {
  id: "eric",
  displayName: "Eric",
  kind: "human",
  timezone: "America/New_York",
  cash: 18_420,
  equity: 63_180,
  positions: [
    { symbol: "NVDA", quantity: 40, avgPrice: 118.4, marketValue: 5_720 },
    { symbol: "AAPL", quantity: 120, avgPrice: 212.6, marketValue: 24_180 },
    { symbol: "KO", quantity: 200, avgPrice: 71.2, marketValue: 13_860 },
    { symbol: "TSLA", quantity: 15, avgPrice: 288.0, marketValue: 3_990 },
  ],
  activity: [
    fill("KO", "buy", 200, 69.4, day(2)),
    fill("AAPL", "buy", 120, 212.6, day(3)),
    fill("MSFT", "buy", 30, 402.1, day(6)),
    fill("MSFT", "sell", 30, 431.5, day(9)),
    fill("NVDA", "buy", 40, 118.4, day(10)),
    fill("SHOP", "buy", 60, 74.2, day(13)),
    fill("SHOP", "sell", 60, 68.9, day(15)),
    fill("TSLA", "buy", 15, 288.0, day(17)),
    fill("PLTR", "buy", 90, 31.5, day(20)),
    fill("PLTR", "sell", 90, 36.2, day(23)),
    fill("ARM", "buy", 25, 142.0, day(24)),
    fill("ARM", "sell", 25, 138.4, day(27)),
  ],
};

const history = Array.from({ length: 24 }, (_, i) => ({
  at: new Date(Date.UTC(2026, 6, i + 2, 20, 0, 0)).toISOString(),
  participantId: "eric",
  equity: 50_000 + i * 520 + Math.round(Math.sin(i / 2) * 2_400),
  cash: 18_420,
  realizedPl: i * 90,
}));

const options = { isSelf: true, tradingEnabled: true, generatedAt: day(28) };
const review = previewOrder(
  { symbol: "AAPL", quantity: 120, action: "sell" },
  { cash: snapshot.cash, positions: snapshot.positions, tradingEnabled: true, isSelf: true },
);

const pages = {
  positions: renderPositionsBody(snapshot, options),
  history: renderHistoryBody(snapshot, options),
  analysis: renderAnalysisBody(snapshot, options),
  metrics: renderMetricsBody(snapshot, { ...options, history }),
  review: renderTradeReviewBody(snapshot, review, options),
};

const doc = (body) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>desk</title>
<style>*{margin:0;padding:0;box-sizing:border-box}html{color-scheme:dark}body{margin:0;background:#0B0F14}</style>
</head><body>${body}</body></html>`;

for (const [name, body] of Object.entries(pages)) {
  writeFileSync(join(OUT, `${name}.html`), doc(body));
}

if (!(EXE || process.env.PW_CHROME)) {
  console.log(`Rendered HTML only (no Chromium found): ${OUT}`);
  process.exit(0);
}

const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});
const page = await browser.newPage({ deviceScaleFactor: 2 });
for (const name of Object.keys(pages)) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`file://${join(OUT, `${name}.html`)}`);
  await page.screenshot({ path: join(OUT, `desk-${name}.png`), fullPage: true });
}
await page.setViewportSize({ width: 420, height: 900 });
await page.goto(`file://${join(OUT, "positions.html")}`);
await page.screenshot({ path: join(OUT, "desk-positions-mobile.png"), fullPage: true });
await browser.close();
console.log(`Desk shots → ${OUT}`);
