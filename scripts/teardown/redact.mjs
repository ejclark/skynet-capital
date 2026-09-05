#!/usr/bin/env node
/**
 * teardown/redact — paint over the account line in reference screenshots and downscale them for a
 * private study page, before anyone looks at them twice (`.claude/skills/teardown/SKILL.md` → drill
 * step 2, hard rule 1).
 *
 * Why a browser and not an image library: this environment ships no PIL, sharp, or ImageMagick, but
 * it does ship Chromium for the shoot harness (`scripts/shoot/lib.mjs`). A canvas pass is exact,
 * dependency-free, and the same tool the harness already trusts. The 2026-09-05 Fidelity study did
 * this by hand twice — fifteen frames, two account numbers, three balances — which is what makes it
 * a tool and not a one-off.
 *
 * Usage:
 *   node scripts/teardown/redact.mjs --out <dir> [--band top-bottom[@left-right]]... [--width 600]
 *        [--label "account line redacted"] <image>...
 *
 *   --band  a fraction-of-image rectangle to paint, e.g. `0.195-0.245` (full width) or
 *           `0.895-0.965@0-0.58` (left 58% only). Repeat for more than one. No band = downscale only.
 *   --width output width in px (default 600). Output is JPEG at quality 0.82, one file per input,
 *           named by the input's basename.
 *
 * The bands are fractions so one call covers every frame of the same screen geometry; check the
 * output with your eyes — a band that misses by a line is a leak, and the script cannot know.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { chromium } from "playwright-core";

function parseArgs(argv) {
  const opts = {
    out: undefined,
    bands: [],
    width: 600,
    label: "account line redacted",
    files: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") opts.out = argv[++i];
    else if (a === "--band") opts.bands.push(parseBand(argv[++i]));
    else if (a === "--width") opts.width = Number(argv[++i]);
    else if (a === "--label") opts.label = argv[++i];
    else if (a.startsWith("--")) throw new Error(`unknown flag ${a}`);
    else opts.files.push(a);
  }
  if (!opts.out) throw new Error("--out <dir> is required");
  if (opts.files.length === 0) throw new Error("no input images");
  return opts;
}

/** `top-bottom[@left-right]` → fractions; throws on anything outside [0,1] or inverted. */
function parseBand(spec) {
  const [y, x = "0-1"] = spec.split("@");
  const [top, bottom] = y.split("-").map(Number);
  const [left, right] = x.split("-").map(Number);
  const band = { top, bottom, left, right };
  for (const [k, v] of Object.entries(band)) {
    if (!Number.isFinite(v) || v < 0 || v > 1)
      throw new Error(`band ${spec}: ${k} must be in [0,1]`);
  }
  if (top >= bottom || left >= right) throw new Error(`band ${spec}: inverted`);
  return band;
}

/** Same resolution order as the shoot harness: an explicit path, the pre-installed browser, else Playwright's own. */
function resolveChromium() {
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM,
    "/opt/pw-browsers/chromium/chrome",
    "/opt/pw-browsers/chromium",
  ].filter(Boolean);
  return candidates.find((p) => existsSync(p));
}

const MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  mkdirSync(opts.out, { recursive: true });
  const exe = resolveChromium();
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  try {
    const page = await browser.newPage();
    for (const file of opts.files) {
      const mime = MIME[extname(file).toLowerCase()];
      if (!mime) throw new Error(`${file}: not an image I know how to read`);
      const src = `data:${mime};base64,${readFileSync(file).toString("base64")}`;
      const result = await page.evaluate(
        ([src, bands, width, label]) =>
          new Promise((resolve, reject) => {
            const im = new Image();
            im.onerror = () => reject(new Error("image failed to decode"));
            im.onload = () => {
              const W = width;
              const H = Math.round((im.naturalHeight * W) / im.naturalWidth);
              const c = document.createElement("canvas");
              c.width = W;
              c.height = H;
              const x = c.getContext("2d");
              x.drawImage(im, 0, 0, W, H);
              for (const b of bands) {
                const bx = Math.round(W * b.left);
                const by = Math.round(H * b.top);
                const bw = Math.round(W * (b.right - b.left));
                const bh = Math.round(H * (b.bottom - b.top));
                x.fillStyle = "#1c1c1e";
                x.fillRect(bx, by, bw, bh);
                x.fillStyle = "#8b8b8f";
                x.font = "20px sans-serif";
                x.fillText(label, bx + 18, by + Math.min(42, bh - 8));
              }
              resolve({
                w: im.naturalWidth,
                h: im.naturalHeight,
                data: c.toDataURL("image/jpeg", 0.82),
              });
            };
            im.src = src;
          }),
        [src, opts.bands, opts.width, opts.label],
      );
      const out = join(opts.out, `${basename(file, extname(file))}.jpg`);
      writeFileSync(out, Buffer.from(result.data.split(",")[1], "base64"));
      console.log(
        `${basename(file)} ${result.w}x${result.h} → ${out} (${Math.round((result.data.length * 0.75) / 1024)}KB)`,
      );
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(`redact: ${error.message}`);
  process.exit(1);
});
