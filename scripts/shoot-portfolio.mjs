import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// Visual harness for the Portfolio index (/u) — the member's accounts home — rendered from the
// sample fixture as though the viewer owned every account, so the multi-account design (combined
// hero + ladder) can be judged by eye without standing up a server.
// Usage: npm run shoot:portfolio [-- outdir]
import { chromium } from "playwright-core";
import { renderPortfolioIndexBody } from "../src/observatory/render-dashboard.ts";
import { sampleDashboardData } from "../src/observatory/sample-dashboard-data.ts";
import { shellDocument } from "../src/server/page-shell.ts";

const OUT = process.argv[2] || join(tmpdir(), "skynet-portfolio-shots");
mkdirSync(OUT, { recursive: true });
const CANDIDATES = [
  process.env.PW_CHROME,
  "/opt/pw-browsers/chromium/chrome-linux/chrome",
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
].filter(Boolean);
const EXE = CANDIDATES.find((p) => existsSync(p));

const nav = { active: "you", canAdd: true, authed: true, currentId: "eric" };
const data = sampleDashboardData();

const pages = [
  { name: "portfolio-index", body: renderPortfolioIndexBody(data.participants, { nav }) },
  { name: "portfolio-empty", body: renderPortfolioIndexBody([], { nav }) },
];

const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});
const page = await browser.newPage({ viewport: { width: 1360, height: 1000 } });
for (const { name, body } of pages) {
  const file = join(OUT, `${name}.html`);
  writeFileSync(file, shellDocument(`${name} — shoot`, body));
  await page.goto(`file://${file}`);
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: false });
  console.log(`shot ${join(OUT, `${name}.png`)}`);
}
await browser.close();
