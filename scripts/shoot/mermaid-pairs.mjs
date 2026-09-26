#!/usr/bin/env node
// Before/after pairs of Mermaid diagrams (or markdown tables), photographed side by side on
// GitHub's own canvas in its light and dark modes — the shoot script for showcase contenders.
//
//   npm run shoot:mermaid-pairs -- <pairs.json> <outdir> [--scale N] [--quality Q]
//                                  [--mode light|dark|both] [--layout auto|side|stacked] [--budget KB]
//
// WHY THIS EXISTS. The Mermaid grammar work (2026-09-25/26, #3747/#3760) was argued in pairs — the
// diagram a PR drew vs the one the grammar prescribes — and each round hand-ran a scratchpad
// renderer. Its frames went to colleagues, so the bar is "shareable outside the team" (Eric,
// 2026-09-26: "extreme levels of polish when you are working on contenders to share… higher quality
// scripts that provide top tier outcomes while remaining cost efficient"). Three files, one job
// each: the input contract (./mermaid-pairs-input.mjs), the look (./mermaid-pairs-frame.mjs), and
// this pipeline — validate → lint → render → crop → encode under budget → sidecar.
//
// THE RULES IT HOLDS:
//  - **The pinned Mermaid, offline.** node_modules/mermaid is pinned to github.com's version
//    (scripts/mermaid-lint.mjs → GITHUB_MERMAID_VERSION); no CDN, so a frame shows what GitHub
//    draws. The version is printed on the frame and in the sidecar, and a drift is warned about.
//  - **Degrade honestly.** A bad pairs file is a named error per field and no frames at all. A
//    diagram that fails `lintMermaid` (or throws while drawing) gets an explicit "Did not render:
//    <reason>" panel — never an empty box — and its sidecar says so.
//  - **≤100KB at scale 1** (docs/PICTURES.md): quality steps down until the JPEG fits; a frame that
//    cannot fit at the floor is written anyway and flagged. Scale > 1 is the shareable set for an
//    issue comment, not the tree, so it has no budget unless `--budget` sets one.
//  - **Sidecar per pair** (`<id>.json`: title, caption, alt text, layout, and per mode the file,
//    bytes, dimensions and quality; per side the lint result) — a gallery comment is generated from
//    it, never retyped.
//
// A pairs file for a showcase lives on its issue, not in the tree; the only committed one is the
// spec fixture, tests/fixtures/mermaid-pairs/example.json (docs/PICTURES.md → Screenshots).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import { GITHUB_MERMAID_VERSION, lintMermaid } from "../mermaid-lint.mjs";
import { resolveChromium } from "./lib.mjs";
import {
  columnHtml,
  failPanel,
  frameHtml,
  layoutInPage,
  PALETTE,
  shellHtml,
  WIDTHS,
} from "./mermaid-pairs-frame.mjs";
import { MODES, parseArgs, validatePairs } from "./mermaid-pairs-input.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const MERMAID_DIR = join(ROOT, "node_modules/mermaid");
/** The lowest JPEG quality the budget loop steps down to before it flags a frame as over. */
const QUALITY_FLOOR = 40;
/** Exit codes: 2 = bad input (file or flags), 4 = no browser to render with. */
const EXIT_INPUT = 2;
const EXIT_BROWSER = 4;

/** Width and height from a JPEG's start-of-frame marker — the sidecar reports the file, not a guess. */
function jpegDimensions(buf) {
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) return null;
    const m = buf[i + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc)
      return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

/** One side's lint verdict. Markdown sides are not diagrams, so they pass by construction. */
async function lintSide(side) {
  if (side.kind === "markdown") return { kind: "markdown", ok: true, problems: [], notes: [] };
  const r = await lintMermaid(`\`\`\`mermaid\n${side.source}\n\`\`\``);
  const strip = (m) => m.replace(/^line \d+: /, "");
  const problems = r.diagrams.length ? r.problems.map(strip) : ["no diagram found in the source"];
  return {
    kind: "mermaid",
    type: r.diagrams[0]?.type,
    ok: !problems.length,
    problems,
    notes: r.notes.map(strip),
  };
}

/** A caption's words with the markdown marks taken off, for alt text. */
const plain = (md) =>
  md
    .replace(/[`*]/g, "")
    .replace(/(^|\s)_+|_+(?=\s|$|[.,;:])/g, "$1")
    .trim();

/** Alt text for one frame (with its mode) or for the pair as a whole (without). */
function altText(pair, mode) {
  const side = (w) => `${w}${pair[w].label ? ` (${pair[w].label})` : ""}`;
  const where = mode ? `, GitHub ${mode} mode` : "";
  return `${pair.title} — ${side("before")} vs ${side("after")}${where}. ${plain(pair.caption)}`;
}

function sideBody(which, side, lint) {
  if (!lint.ok) return failPanel(lint.problems.join(" · "));
  if (side.kind === "markdown") return `<div class="md">${marked.parse(side.source)}</div>`;
  return `<div class="diagram" data-side="${which}"></div>`;
}

/** Screenshot the frame, stepping quality down until it fits the budget (0 = no budget). */
async function encode(page, quality, budgetKB) {
  let q = quality;
  for (;;) {
    const buf = await page.locator("#frame").screenshot({ type: "jpeg", quality: q });
    const over = budgetKB > 0 && buf.length > budgetKB * 1024;
    if (!over || q <= QUALITY_FLOOR) return { buf, quality: q, overBudget: over };
    q = Math.max(QUALITY_FLOOR, q - 6);
  }
}

async function openPage(browser, mode, scale) {
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1000 },
    deviceScaleFactor: scale,
    colorScheme: mode,
  });
  await page.setContent(shellHtml(mode));
  await page.addScriptTag({ path: join(MERMAID_DIR, "dist/mermaid.min.js") });
  await page.evaluate((theme) => {
    window.mermaid.initialize({
      startOnLoad: false,
      theme,
      securityLevel: "strict",
      suppressErrorRendering: true,
    });
  }, PALETTE[mode].mermaidTheme);
  return page;
}

async function shootPair(page, pair, lint, mode, opts, mermaidVersion) {
  const html = frameHtml({
    title: pair.title,
    captionHtml: marked.parseInline(pair.caption),
    mode,
    mermaidVersion,
    before: columnHtml("before", pair.before.label, sideBody("before", pair.before, lint.before)),
    after: columnHtml("after", pair.after.label, sideBody("after", pair.after, lint.after)),
  });
  const sources = { before: pair.before.source, after: pair.after.source };
  const layout = opts.layout === "auto" ? (pair.layout ?? "auto") : opts.layout;
  const key = `${pair.id}-${mode}`.replace(/[^A-Za-z0-9-]/g, "-");
  const laid = await page.evaluate(layoutInPage, { html, sources, layout, widths: WIDTHS, key });
  await page.setViewportSize({ width: Math.max(laid.width, 320), height: laid.height });
  const shot = await encode(page, opts.quality, opts.budget);
  const file = `${pair.id}-${mode}.jpg`;
  writeFileSync(join(opts.outDir, file), shot.buf);
  const dims = jpegDimensions(shot.buf);
  return {
    laid,
    image: {
      mode,
      file,
      bytes: shot.buf.length,
      ...dims,
      quality: shot.quality,
      overBudget: shot.overBudget,
      alt: altText(pair, mode),
    },
  };
}

async function launch() {
  const { chromium } = await import("playwright-core");
  const exe = resolveChromium();
  try {
    return await chromium.launch(exe ? { executablePath: exe } : {});
  } catch (error) {
    console.error(
      `mermaid-pairs: no Chromium to render with — set PW_CHROME or run \`npx playwright install chromium\`\n  ${String(error?.message ?? error).split("\n")[0]}`,
    );
    process.exit(EXIT_BROWSER);
  }
}

function readPairs(file) {
  let data;
  try {
    data = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    return { errors: [`${file}: cannot read as JSON — ${error.message}`] };
  }
  return { data, errors: validatePairs(data).map((e) => `${file}: ${e}`) };
}

/** The per-pair record a gallery comment is generated from; images and layout fill in per mode. */
function sidecarFor(pair, lint, opts, mermaidVersion) {
  return {
    id: pair.id,
    title: pair.title,
    caption: pair.caption,
    alt: altText(pair),
    layout: null,
    natural: null,
    scale: opts.scale,
    mermaidVersion,
    githubMermaidVersion: GITHUB_MERMAID_VERSION,
    lint,
    images: [],
  };
}

/** Rule 13's number (docs/PICTURES.md): text on a phone is 390 ÷ drawing width × font, the font
 * being the `classDef default font-size` the diagram sets (Mermaid's own default is 16px). Under
 * PHONE_FLOOR the second look costs the first read; the shot line flags it. */
const PHONE_WIDTH = 390;
const PHONE_FLOOR = 12;
function phoneFont(side, natural) {
  if (side?.kind !== "mermaid" || !natural) return null;
  const font = Number(
    /classDef default[^\n]*font-size:\s*(\d+(?:\.\d+)?)px/.exec(side.source)?.[1] ?? 16,
  );
  // GitHub never scales a drawing up, only down to the column.
  return Math.round(Math.min(1, PHONE_WIDTH / natural) * font * 10) / 10;
}
function phoneLine(pair, natural) {
  const parts = [];
  for (const side of ["before", "after"]) {
    const px = phoneFont(pair[side], natural?.[side]);
    if (px == null) continue;
    parts.push(`${side} ${px}px${px < PHONE_FLOOR ? " ⚠ under rule 13's floor" : ""}`);
  }
  return parts.length ? ` · phone ${parts.join(", ")}` : "";
}

/** Every pair in every requested mode — one page per mode, one frame per pair. */
async function renderAll(browser, pairs, sidecars, opts, mermaidVersion) {
  for (const mode of MODES[opts.mode]) {
    const page = await openPage(browser, mode, opts.scale);
    for (const [i, pair] of pairs.entries()) {
      const car = sidecars[i];
      const { laid, image } = await shootPair(page, pair, car.lint, mode, opts, mermaidVersion);
      Object.assign(car, {
        layout: laid.layout,
        natural: laid.natural,
        phone: {
          before: phoneFont(pair.before, laid.natural?.before),
          after: phoneFont(pair.after, laid.natural?.after),
        },
      });
      car.images.push(image);
      for (const [side, why] of Object.entries(laid.renderErrors))
        car.lint[side] = { ...car.lint[side], ok: false, renderError: why };
      const kb = (image.bytes / 1024).toFixed(1);
      const flag = image.overBudget ? ` ⚠ over ${opts.budget}KB at the quality floor` : "";
      console.log(
        `shot ${join(opts.outDir, image.file)} ${image.width}×${image.height} ${kb}KB q${image.quality} ${laid.layout}${flag}${phoneLine(pair, laid.natural)}`,
      );
    }
    await page.close();
  }
}

/** Write the sidecars and say — loudly, on stderr — which sides show a did-not-render panel. */
function report(sidecars, opts) {
  let failed = 0;
  for (const car of sidecars) {
    writeFileSync(join(opts.outDir, `${car.id}.json`), `${JSON.stringify(car, null, 2)}\n`);
    for (const side of ["before", "after"]) {
      const l = car.lint[side];
      if (l.ok) continue;
      failed++;
      const why = l.renderError ?? l.problems.join(" · ");
      console.error(`⚠ ${car.id}.${side} did not render — its frame says so: ${why}`);
    }
  }
  const panels = failed ? ` (${failed} side(s) show a did-not-render panel)` : "";
  const modes = MODES[opts.mode].length;
  console.log(
    `mermaid-pairs: ${sidecars.length} pair(s) × ${modes} mode(s) → ${opts.outDir}${panels}`,
  );
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    const usage = readFileSync(fileURLToPath(import.meta.url), "utf8")
      .split("\n")
      .slice(1, 6);
    console.log(usage.join("\n"));
    return;
  }
  const { data, errors } = opts.errors.length ? { errors: opts.errors } : readPairs(opts.pairsFile);
  if (errors.length) {
    for (const e of errors) console.error(`✗ ${e}`);
    console.error(`mermaid-pairs: ${errors.length} problem(s) — nothing rendered.`);
    process.exit(EXIT_INPUT);
  }
  const pkg = JSON.parse(readFileSync(join(MERMAID_DIR, "package.json"), "utf8"));
  if (pkg.version !== GITHUB_MERMAID_VERSION)
    console.error(
      `⚠ node_modules/mermaid is ${pkg.version}; github.com renders ${GITHUB_MERMAID_VERSION}`,
    );

  // Lint everything before the browser opens: lintMermaid parses in jsdom, off the render path.
  const sidecars = [];
  for (const pair of data.pairs) {
    const lint = { before: await lintSide(pair.before), after: await lintSide(pair.after) };
    sidecars.push(sidecarFor(pair, lint, opts, pkg.version));
  }
  mkdirSync(opts.outDir, { recursive: true });
  const browser = await launch();
  try {
    await renderAll(browser, data.pairs, sidecars, opts, pkg.version);
  } finally {
    await browser.close();
  }
  report(sidecars, opts);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
