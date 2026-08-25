import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// Visual harness for Standings — the merged Board + Leaderboard + Bots vs Humans page — rendered
// from a realistic mixed fixture and screenshot with Chromium, so the surface can be judged by eye
// (CLAUDE.md: every choice becomes something Eric can see) without standing up a server.
// Usage: node scripts/shoot-standings.mjs [outdir]
import { chromium } from "playwright-core";
import { sampleDashboardData } from "../src/observatory/sample-dashboard-data.ts";
import { renderStandingsBody } from "../src/observatory/standings-view.ts";
import { shellDocument } from "../src/server/page-shell.ts";

const OUT = process.argv[2] || join(tmpdir(), "skynet-standings-shots");
mkdirSync(OUT, { recursive: true });
const CANDIDATES = [
  process.env.PW_CHROME,
  "/opt/pw-browsers/chromium/chrome-linux/chrome",
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
].filter(Boolean);
const EXE = CANDIDATES.find((p) => existsSync(p));

const nav = { active: "board", canAdd: true, authed: true };
const data = sampleDashboardData();

const pages = [
  { name: "standings-equity", body: renderStandingsBody(data, { nav }) },
  { name: "standings-return", body: renderStandingsBody(data, { nav, metric: "return" }) },
];

const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});
const page = await browser.newPage({ viewport: { width: 1360, height: 1400 } });
for (const { name, body } of pages) {
  const file = join(OUT, `${name}.html`);
  writeFileSync(file, shellDocument(`${name} — shoot`, body));
  await page.goto(`file://${file}`);
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: false });
  console.log(`shot ${join(OUT, `${name}.png`)}`);
}
await browser.close();
