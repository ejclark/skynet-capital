// The screenshot harness's shared floor (#1327) — the pieces every `scripts/shoot/*` script needs
// before it can take a single frame, written once instead of pasted per surface.
//
// WHY THIS EXISTS: six shoot scripts (843 lines) each hand-rolled the same Chromium resolver, output
// directory, and JPEG ceiling, and the three app-shell ones shared 63–84 byte-identical lines apiece.
// The copies had already drifted three days after they were written. CLAUDE.md's "pictures first"
// rule guarantees more surfaces, so the per-surface cost was recurring — and measurably being paid
// by NOT taking the picture (#1308 and #1312 both waived their fridge shot for want of a script).
// A shoot script should be its fixtures and its frames; everything else lives here.
//
// This module is deliberately dependency-light (node + playwright-core only), so `tower.mjs` — which
// serves its own static root and needs no TypeScript import — can run under plain `node`. The
// app-shell half, which imports the server's real `serveAppShell`, lives in `./shell.mjs` and needs
// `tsx`.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * The one copy of the Chromium fallback list.
 *
 * `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` is set in this repo's cloud environment but has held a
 * revision behind `playwright-core`'s pin more than once — a bare `chromium.launch()` then fails with
 * "Executable doesn't exist at …chromium_headless_shell-<pinned>". Hence the explicit candidates,
 * newest-first, with `undefined` (let Playwright resolve) as the honest last resort. Five scripts
 * carried their own copy of this list and two of them had already diverged; now the env image or the
 * pin moving changes exactly one file.
 *
 * @returns {string | undefined} an executable path, or undefined to let Playwright resolve its own.
 */
export function resolveChromium() {
  return [
    process.env.PW_CHROME,
    "/opt/pw-browsers/chromium/chrome-linux/chrome",
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  ]
    .filter(Boolean)
    .find((p) => existsSync(p));
}

/**
 * Where a run writes its frames: `argv[2]` when given (how every caller has always taken it), else a
 * named temp directory. Created if missing, so no script repeats the mkdir.
 */
export function outputDir(name, argv = process.argv) {
  const out = argv[2] || join(tmpdir(), `skynet-${name}-shots`);
  mkdirSync(out, { recursive: true });
  return out;
}

/**
 * A `shoot(tag)` bound to one page and one output directory.
 *
 * The JPEG ceiling lives HERE rather than in each script, because it is a contract, not a preference:
 * `docs/PICTURES.md` caps a committed screenshot at ~100KB. `quality` stays a parameter because the
 * taller viewports genuinely need a lower one to clear that cap — that is a real per-surface
 * difference, unlike the four things above it.
 */
export function shooter(page, out, { type = "jpeg", quality = 62, fullPage = false } = {}) {
  return async (tag) => {
    const path = join(out, `${tag}.${type === "png" ? "png" : "jpg"}`);
    await page.screenshot({ path, type, fullPage, ...(type === "jpeg" ? { quality } : {}) });
    console.log(`shot ${path}`);
    return path;
  };
}

/**
 * Pick the stub body for one request pathname (used by `./shell.mjs` to answer `/api/**`).
 *
 * Keys are pathnames, matched most-specific-first: an exact `/api/learn` beats a `/api/desk/*`
 * prefix, and a longer prefix beats a shorter one. A value may be a function so a script can swap
 * what an endpoint returns mid-run (the onboarding shoot photographs the same page fresh and then
 * connected). Anything unmatched answers `{}` — what the hand-rolled servers' `startsWith("/api/")`
 * catch-all did, so a surface that fetches something the script didn't think about still renders
 * instead of erroring.
 */
export function stubBody(stubs, path) {
  const exact = stubs[path];
  if (exact !== undefined) return typeof exact === "function" ? exact(path) : exact;
  const prefix = Object.keys(stubs)
    .filter((k) => k.endsWith("*") && path.startsWith(k.slice(0, -1)))
    .sort((a, b) => b.length - a.length)[0];
  if (prefix === undefined) return {};
  const value = stubs[prefix];
  return typeof value === "function" ? value(path) : value;
}

/**
 * The rendered-string family: surfaces whose markup a module in `src/` produces directly (the login
 * page, Standings), with no server and no app shell in the loop. Each page is written to a real file
 * and opened over `file://` — the same thing the two scripts did by hand.
 *
 * @param {object} opts
 * @param {string} opts.name        used for the default output directory
 * @param {{tag: string, html: string}[]} opts.pages
 */
export async function shootHtml({
  name,
  pages,
  viewport = { width: 1360, height: 1400 },
  colorScheme,
  type = "png",
  quality = 62,
  out = outputDir(name),
}) {
  const { chromium } = await import("playwright-core");
  const exe = resolveChromium();
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const page = await browser.newPage({ viewport, ...(colorScheme ? { colorScheme } : {}) });
  const shoot = shooter(page, out, { type, quality });
  try {
    for (const { tag, html } of pages) {
      const file = join(out, `${tag}.html`);
      writeFileSync(file, html);
      await page.goto(`file://${file}`);
      await shoot(tag);
    }
  } finally {
    await browser.close();
  }
  return out;
}
