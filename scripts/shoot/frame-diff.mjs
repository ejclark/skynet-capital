#!/usr/bin/env node
// Compares two shoot passes frame by frame: same bytes first, then for the frames whose bytes differ,
// decodes both in Chromium and counts the pixels that differ, so a JPEG's encoder can't pass for a
// real change.
//
//   npm run shoot:diff -- <before> <after> [--baseline <before-again>]...
//
// --baseline names another pass of the BEFORE build, and may repeat. A frame that differs between
// passes of one build moves with nothing changed, so it says nothing about the after build; it is
// reported as unstable and left out of the verdict. Without it, every frame counts. One baseline is
// often too few: some frames flip between two images, and three clean passes can agree by chance.
//
// Exit 0: the frames match. 1: a frame differs or is missing. 2: nothing could be compared, which is
// never a pass, since an empty folder would otherwise read as "no pixels changed". Pure core with the
// pixel count injected, so the spec needs no browser.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { resolveChromium } from "./lib.mjs";

const framesIn = (dir) =>
  readdirSync(dir)
    .filter((f) => /\.(jpe?g|png)$/.test(f))
    .sort();
const hash = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

/** One pair of passes: which frames are missing, and each byte-different frame's pixel count. */
async function comparePasses(a, b, pixelDiff) {
  const [inA, inB] = [framesIn(a), framesIn(b)];
  const shared = inA.filter((f) => inB.includes(f));
  const missing = [...inA.filter((f) => !inB.includes(f)), ...inB.filter((f) => !inA.includes(f))];
  const byteDiffers = shared.filter((f) => hash(join(a, f)) !== hash(join(b, f)));
  const pixels = [];
  for (const frame of byteDiffers) {
    const read = await pixelDiff(join(a, frame), join(b, frame));
    pixels.push({ frame, ...read });
  }
  return { shared, missing, pixels };
}

/**
 * The verdict over two passes, with any baselines naming the frames that move on their own. A frame
 * moved on its own only if its pixels differ: a re-encode with the same pixels is not motion.
 *
 * @param {(pathA: string, pathB: string) => Promise<{ n: number, total?: number, size?: string }>} pixelDiff
 */
export async function compareFrames({ before, after, baselines = [], pixelDiff }) {
  const unstable = [];
  for (const baseline of baselines) {
    const { pixels } = await comparePasses(before, baseline, pixelDiff);
    for (const p of pixels) if (p.n !== 0 && !unstable.includes(p.frame)) unstable.push(p.frame);
  }
  unstable.sort();
  const { shared, missing, pixels } = await comparePasses(before, after, pixelDiff);
  const moved = pixels.filter((p) => p.n !== 0);
  const counted = moved.filter((p) => !unstable.includes(p.frame));
  const judged = shared.filter((f) => !unstable.includes(f)).length;
  const bytes = shared.reduce((n, f) => n + statSync(join(before, f)).size, 0);
  let exit = 0;
  if (judged === 0) exit = 2;
  else if (counted.length > 0 || missing.length > 0) exit = 1;
  return {
    exit,
    framesCompared: shared.length,
    framesJudged: judged,
    unstable,
    missing,
    framesThatMoved: counted.length,
    pixelDiffs: counted,
    meanFrameKb: Math.round(bytes / Math.max(shared.length, 1) / 1024),
  };
}

/** The real pixel count, in Chromium so one decoder reads both files whatever their format. */
async function chromiumPixelDiff() {
  const { chromium } = await import("playwright-core");
  const exe = resolveChromium();
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const page = await browser.newPage();
  const uri = (path) => `data:image/png;base64,${readFileSync(path).toString("base64")}`;
  const count = ([ua, ub]) => {
    const load = async (url) => {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      const data = context.getImageData(0, 0, image.width, image.height).data;
      return { w: image.width, h: image.height, data };
    };
    return Promise.all([load(ua), load(ub)]).then(([p, q]) => {
      if (p.w !== q.w || p.h !== q.h) return { size: `${p.w}x${p.h} vs ${q.w}x${q.h}`, n: -1 };
      let n = 0;
      for (let k = 0; k < p.data.length; k += 4) {
        if (p.data[k] !== q.data[k] || p.data[k + 1] !== q.data[k + 1]) n++;
        else if (p.data[k + 2] !== q.data[k + 2]) n++;
      }
      return { n, total: p.w * p.h };
    });
  };
  return {
    pixelDiff: (pathA, pathB) => page.evaluate(count, [uri(pathA), uri(pathB)]),
    close: () => browser.close(),
  };
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { baseline: { type: "string", multiple: true } },
  });
  const [before, after] = positionals.map((d) => resolve(d));
  const baselines = (values.baseline ?? []).map((d) => resolve(d));
  if (!(before && after) || [before, after, ...baselines].some((d) => !existsSync(d))) {
    console.error("usage: npm run shoot:diff -- <before> <after> [--baseline <before-again>]...");
    return 2;
  }
  const { pixelDiff, close } = await chromiumPixelDiff();
  try {
    const { exit, ...report } = await compareFrames({ before, after, baselines, pixelDiff });
    console.log(JSON.stringify(report, null, 1));
    return exit;
  } finally {
    await close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exitCode = await main();
