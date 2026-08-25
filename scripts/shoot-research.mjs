import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// Visual harness for the research surface: render the shelf (which now carries the event horizon
// too — proximity-banded agenda + month-grid navigator), a living symbol page, and a ledger doc
// from the REAL docs/research shelf, and screenshot them with Chromium — the surface judged by eye
// (CLAUDE.md: every choice becomes something Eric can see) without standing up a server.
// Usage: node scripts/shoot-research.mjs [outdir]
import { chromium } from "playwright-core";
import {
  renderResearchDocBody,
  renderResearchShelfBody,
  renderSymbolResearchBody,
} from "../src/observatory/research-view.ts";
import { shellDocument } from "../src/server/page-shell.ts";
import {
  eventCalls,
  findResearchDoc,
  listResearch,
  researchedEventIds,
  shelfSymbols,
  symbolResearch,
} from "../src/server/research-service.ts";

const OUT = process.argv[2] || join(tmpdir(), "skynet-research-shots");
mkdirSync(OUT, { recursive: true });
const CANDIDATES = [
  process.env.PW_CHROME,
  "/opt/pw-browsers/chromium/chrome-linux/chrome",
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
].filter(Boolean);
const EXE = CANDIDATES.find((p) => existsSync(p));

const asOfIso = new Date().toISOString();
const nav = { active: "research", canAdd: false, authed: true };

const pages = [
  {
    name: "research-shelf",
    body: renderResearchShelfBody({
      nav,
      asOfIso,
      shelf: listResearch(),
      symbols: shelfSymbols(asOfIso),
      researchIds: researchedEventIds(),
      calls: eventCalls(),
    }),
  },
  {
    // The same shelf with a day selected from the month grid — the correlation, by eye.
    name: "research-shelf-day",
    hash: "#day-2026-08-26",
    body: renderResearchShelfBody({
      nav,
      asOfIso,
      shelf: listResearch(),
      symbols: shelfSymbols(asOfIso),
      researchIds: researchedEventIds(),
      calls: eventCalls(),
    }),
  },
  {
    name: "research-sym-nvda",
    body: renderSymbolResearchBody({ nav, asOfIso, data: symbolResearch("NVDA", asOfIso) }),
  },
  {
    name: "research-ledger-nvda",
    body: renderResearchDocBody({
      nav,
      asOfIso,
      doc: findResearchDoc("events/nvda-2026-08-26-print"),
    }),
  },
];

const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});
const page = await browser.newPage({ viewport: { width: 1360, height: 940 } });
for (const { name, body, hash } of pages) {
  const file = join(OUT, `${name}.html`);
  writeFileSync(file, shellDocument(`${name} — shoot`, body));
  await page.goto(`file://${file}${hash ?? ""}`);
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: false });
  console.log(`shot ${join(OUT, `${name}.png`)}`);
}
await browser.close();
