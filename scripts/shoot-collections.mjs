import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// Visual harness for the Collections browse surface: render the shelf index and one shelf page
// from the REAL derived collections (the same probes the app runs) and screenshot them with
// Chromium — the surface judged by eye, no server needed.
// Usage: node scripts/shoot-collections.mjs [outdir]
import { chromium } from "playwright-core";
import { browseCollections, unshelved } from "../src/discovery/collections.ts";
import {
  renderCollectionBody,
  renderCollectionsIndexBody,
} from "../src/observatory/collections-view.ts";
import { shellDocument } from "../src/server/page-shell.ts";

const OUT = process.argv[2] || join(tmpdir(), "skynet-collections-shots");
mkdirSync(OUT, { recursive: true });
const CANDIDATES = [
  process.env.PW_CHROME,
  "/opt/pw-browsers/chromium/chrome-linux/chrome",
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
].filter(Boolean);
const EXE = CANDIDATES.find((p) => existsSync(p));

const asOfIso = new Date().toISOString();
const nav = { active: "collections", canAdd: false, authed: true };
const collections = browseCollections();
// A sample desk index, so the "links to the existing desk" state is visible in the shot alongside
// the honest "no desk running this persona" state for the rest.
const desks = new Map([["sauron", { participantId: "sauron", displayName: "Sauron" }]]);

const pages = [
  {
    name: "collections-index",
    body: renderCollectionsIndexBody({
      nav,
      asOfIso,
      collections,
      unshelved: unshelved(collections),
      desks,
    }),
  },
  {
    name: "collections-against-the-crowd",
    body: renderCollectionBody({
      nav,
      asOfIso,
      collection: collections.find((c) => c.id === "against-the-crowd"),
      desks,
    }),
  },
  {
    name: "collections-ahead-of-the-print",
    body: renderCollectionBody({
      nav,
      asOfIso,
      collection: collections.find((c) => c.id === "ahead-of-the-print"),
      desks,
    }),
  },
];

const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});
// The committed shots live under docs/shots/ and `ship.sh` caps those at 100KB, so the harness
// renders at a downscaled device ratio by default — legible, and small enough to commit.
const scale = Number(process.env.SHOT_SCALE ?? "0.62");
const page = await browser.newPage({
  viewport: { width: 1360, height: 940 },
  deviceScaleFactor: scale,
});
for (const { name, body } of pages) {
  const file = join(OUT, `${name}.html`);
  writeFileSync(file, shellDocument(`${name} — shoot`, body));
  await page.goto(`file://${file}`);
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: false });
  console.log(`shot ${join(OUT, `${name}.png`)}`);
}
await browser.close();
