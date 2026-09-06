// Visual harness for a weekly study page (#1716): `/research/weeks/<ISO-week>` served by the REAL
// production handler (`serveResearchDoc`) against the REAL docs tree — no fixtures, because the
// whole point of this genre is that the document is composed from the corpus, not authored.
//
// Usage: npm run shoot:research-week [outdir] [-- --week 2026-W37]
import { createServer } from "node:http";
import { chromium } from "playwright-core";
import { isResearchDocPath, serveResearchDoc } from "../../src/server/research-page-routes.ts";
import { outputDir, resolveChromium, shooter } from "./lib.mjs";

const weekArg = process.argv.includes("--week")
  ? process.argv[process.argv.indexOf("--week") + 1]
  : undefined;

const server = createServer((req, res) => {
  const path = new URL(req.url ?? "/", "http://127.0.0.1").pathname;
  if (isResearchDocPath(path)) return serveResearchDoc(res, path);
  res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  res.end("not a research document");
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const origin = `http://127.0.0.1:${server.address().port}`;

const out = outputDir("research-week");
const exe = resolveChromium();
const browser = await chromium.launch(exe ? { executablePath: exe } : {});

// Phone first (docs/PICTURES.md — the trading surfaces' first frame is 390px), then desktop. The
// taller/wider frame carries a lower JPEG quality so both clear the ~100KB commit ceiling.
for (const [tag, viewport, quality] of [
  ["phone", { width: 390, height: 1400 }, 66],
  ["desktop", { width: 1280, height: 1200 }, 52],
]) {
  const page = await browser.newPage({ viewport, colorScheme: "dark" });
  const week = weekArg ?? (await pickWeek());
  const response = await page.goto(`${origin}/research/weeks/${week}`, {
    waitUntil: "domcontentloaded",
  });
  if (!response?.ok()) {
    console.error(`shoot/research-week: /research/weeks/${week} returned ${response?.status()}`);
    process.exit(1);
  }
  console.log(await shooter(page, out, { quality })(`week-${tag}`));
  await page.close();
}

await browser.close();
server.close();

/** The newest composed week on the shelf — so the shot never depends on a hand-typed label. */
async function pickWeek() {
  const { readdirSync } = await import("node:fs");
  const weeks = readdirSync("docs/research/weeks")
    .filter((f) => /^\d{4}-W\d{2}\.md$/.test(f))
    .sort();
  const latest = weeks.at(-1);
  if (!latest) {
    console.error("shoot/research-week: no week composed — run `npm run research:week` first");
    process.exit(1);
  }
  return latest.replace(/\.md$/, "");
}
