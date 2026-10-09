// The harness's seam onto code it does not own (#4943) — what scripts/study/pin.mjs needs so
// today's harness runs inside a worktree of an OLDER commit, where everything outside
// scripts/study/ is that commit's.
//
// RULE: a helper the harness imports from outside its folder, and that a pinned commit may lack,
// is imported here as a namespace (which never fails on a missing name) and feature-detected. When
// the pin lacks it, the fallback below is used and named in `FALLBACKS`, which parity prints — so
// a pinned table says which of its instruments were not the pin's own. Never a fix to the pin's
// src/: the build under test stays exactly the commit it claims to be.
//
// Each fallback is a verbatim copy of the helper as it first landed, with the commit that moved
// it, so it can be deleted once no pin worth running predates that commit.

import * as steps from "../crawl/steps.mjs";

/** Fallbacks in use in this process, `name: why` — printed under a pinned parity table. */
export const FALLBACKS = [];

const pick = (mod, name, fallback, why) => {
  if (typeof mod[name] === "function") return mod[name];
  FALLBACKS.push(`${name}: ${why}`);
  return fallback;
};

/** Enough to render a route; a page holding an SSE open never idles, so idle is best-effort.
 *  Exported from scripts/crawl/steps.mjs by #4973; before it, a private helper of phone-one.mjs. */
async function settleFallback(page) {
  await page.waitForLoadState("load");
  await page.waitForLoadState("networkidle", { timeout: 1500 }).catch(() => {
    /* a held-open stream — the short wait below is the fallback */
  });
  await page.waitForTimeout(300);
}

export const settle = pick(
  steps,
  "settle",
  settleFallback,
  "scripts/crawl/steps.mjs has no `settle` here (exported by #4973); the harness's copy is used",
);
