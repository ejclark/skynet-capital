// PARITY (#4943 slice 2) — before any member is sent into a study world, prove every surface the
// study may score renders there, IN THE VIEWPORT, on the phone and the desktop frame. Area-agnostic:
// the surfaces are the world's own list (scripts/study/worlds/*.mjs → `surfaces`); this file only
// opens, acts, scrolls and judges.
//
//   npx tsx scripts/study/parity.mjs [world …]          # compose fresh, then check every world
//   npx tsx scripts/study/parity.mjs --run <dir> [world …]   # check an existing compose
//
// WHY "IN THE VIEWPORT": a surface that exists in the DOM but sits under a sticky header, past a
// container's clipped edge, or behind a popover is a surface a member cannot see. Each expect is
// scrolled to, then measured in the browser (its box, and what `elementFromPoint` hits at its
// centre) and judged by a pure function — the measure-in-browser / judge-in-pure-functions split
// of scripts/crawl/phone.mjs, specced in tests/scripts/study-parity.spec.ts.
//
// A surface a world cannot render is declared `struck: "<reason>"` in its list and printed as
// STRUCK — never silently dropped. Any miss, or any `/api` read no composed answer covered
// (`unstubbed`), exits non-zero.

import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { locatorFor, settle, VIEWPORTS } from "../crawl/steps.mjs";
import { interceptorOf, judgeVisible, parityTable, worstExit } from "./parity-judge.mjs";
import { answerFrom } from "./payloads.mjs";
import { openWorld } from "./world-route.mjs";
import { WORLDS } from "./worlds/index.mjs";
import { INSTANT } from "./worlds/instant.mjs";

/** After `settle`: long enough for a chart's first paint and a lazy section's second read. */
const SETTLE_MS = 1200;

/** Scroll a locator to the middle of the viewport, as a member would before reading or tapping it
 *  — never to an edge, where the page's own sticky head can sit on top of it. */
const centre = (locator) =>
  locator.evaluate((el) => el.scrollIntoView({ block: "center", inline: "center" }), undefined, {
    timeout: 3000,
  });

/** Where an element is and whether its centre hits it — measured, never judged, in the browser. */
const measure = (locator) =>
  locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return {
      box: { left: r.left, top: r.top, width: r.width, height: r.height },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      hitInside: hit !== null && (el === hit || el.contains(hit) || hit.contains(el)),
    };
  });

/**
 * Does one expect hold at this frame? Never throws: a failure is a detail string. Scrolled to the
 * element's middle first; if it still is not seen there — it lives in a sticky block, which no
 * scroll moves — the top of the page is tried too, as a member scrolling back up would, and that
 * is kept as a note (the page had landed scrolled past it).
 */
async function check(page, expect, notes, frameName) {
  const target = locatorFor(page, expect).first();
  if (expect.absent) {
    const shown = await target.isVisible().catch(() => false);
    return shown ? `${describe(expect)} is shown` : null;
  }
  try {
    await target.waitFor({ state: "attached", timeout: 8000 });
  } catch {
    return `${describe(expect)} not found`;
  }
  try {
    await centre(target);
    const verdict = judgeVisible(await measure(target));
    if (verdict.ok) return null;
    await page.evaluate(() => window.scrollTo(0, 0));
    if (judgeVisible(await measure(target)).ok) {
      notes.push(
        `${describe(expect)}: ${verdict.why} at ${frameName}, seen at the top of the page`,
      );
      return null;
    }
    return `${describe(expect)} ${verdict.why}`;
  } catch (err) {
    return `${describe(expect)} could not be measured (${String(err).split("\n")[0]})`;
  }
}

const describe = (e) => (e.text ? `text "${e.text}"` : `${e.role}${e.name ? ` "${e.name}"` : ""}`);

/**
 * Click an act's target the way a member taps it. When the page lets something else take the tap
 * (an overlay over the control), the surface may still render: reach it by keyboard instead and
 * keep a note, so the table says the surface exists AND that a tap could not reach it.
 */
async function act(page, a, frameName, notes) {
  const target = locatorFor(page, a.click).first();
  await centre(target);
  try {
    await target.click({ timeout: 2500 });
  } catch (err) {
    const by = interceptorOf(String(err));
    if (!by) throw err;
    await target.focus();
    await page.keyboard.press("Enter");
    notes.push(`${describe(a.click)}: tap taken by ${by} at ${frameName}, reached by keyboard`);
  }
  await page.waitForTimeout(a.wait ?? 600);
}

/** One surface at one frame → `{miss, notes}`: the first miss (null when it rendered) and notes. */
async function surfaceAt(world, surface, frameName) {
  const notes = [];
  await world.page.goto(`${world.origin}${surface.route}`);
  await settle(world.page);
  await world.page.waitForTimeout(SETTLE_MS);
  for (const a of surface.act ?? []) {
    if (a.only && a.only !== frameName) continue;
    try {
      await act(world.page, a, frameName, notes);
    } catch {
      return { miss: `could not act: click ${describe(a.click)}`, notes };
    }
  }
  for (const expect of surface.expect) {
    if (expect.only && expect.only !== frameName) continue;
    const miss = await check(world.page, expect, notes, frameName);
    if (miss) return { miss, notes };
  }
  return { miss: null, notes };
}

/** One frame's pass over one viewer's surfaces. A miss or a note keeps its frame on disk, so the
 *  table's word can be checked by eye. */
async function frameAt(open, surfaces, frameName, results, framesDir) {
  await open.reframe(VIEWPORTS[frameName]);
  for (const s of surfaces) {
    if (s.struck || (s.only && s.only !== frameName)) continue;
    const result = await surfaceAt(open, s, frameName);
    results.get(s.id)[frameName] = result;
    if (result.miss || result.notes.length > 0) {
      mkdirSync(framesDir, { recursive: true });
      const path = join(framesDir, `${s.id}-${frameName}.jpg`);
      await open.page.screenshot({ path, type: "jpeg", quality: 55 });
    }
  }
}

/** Every surface of one world, phone then desktop, one browser per viewer. */
async function checkWorld(world, runDir) {
  const rows = [];
  const unstubbed = [];
  for (const viewer of new Set(world.surfaces.map((s) => s.viewer))) {
    const mine = world.surfaces.filter((s) => s.viewer === viewer);
    const open = await openWorld({
      answer: answerFrom(join(runDir, world.name), viewer),
      at: INSTANT,
      frame: VIEWPORTS.phone,
    });
    const results = new Map(mine.map((s) => [s.id, {}]));
    const framesDir = join(runDir, "frames", world.name);
    try {
      for (const frameName of ["phone", "desktop"]) {
        await frameAt(open, mine, frameName, results, framesDir);
      }
    } finally {
      unstubbed.push(...new Set(open.session.unstubbed).values().map((u) => `${viewer}: ${u}`));
      await open.close();
    }
    for (const s of mine) rows.push({ world: world.name, surface: s, ...results.get(s.id) });
  }
  return { rows, unstubbed };
}

function compose(runDir, names) {
  const out = spawnSync("npx", ["tsx", "scripts/study/worlds/compose.mjs", runDir, ...names], {
    stdio: "inherit",
  });
  if (out.status !== 0) throw new Error(`parity: compose exited ${out.status}`);
}

async function main() {
  const args = process.argv.slice(2);
  const runAt = args.indexOf("--run");
  const names = args.filter((a, i) => a !== "--run" && i !== runAt + 1);
  const runDir = runAt >= 0 ? args[runAt + 1] : mkdtempSync(join(tmpdir(), "study-run-"));
  if (runAt < 0) compose(runDir, names);
  const chosen = names.length > 0 ? WORLDS.filter((w) => names.includes(w.name)) : WORLDS;
  const rows = [];
  const unstubbed = [];
  for (const world of chosen) {
    const result = await checkWorld(world, runDir);
    rows.push(...result.rows);
    unstubbed.push(...result.unstubbed.map((u) => `${world.name} ${u}`));
  }
  console.log(parityTable(rows));
  if (unstubbed.length > 0) console.log(`\nunstubbed /api reads:\n  ${unstubbed.join("\n  ")}`);
  console.log(`\nrun dir: ${runDir}`);
  process.exitCode = worstExit(rows, unstubbed);
}

await main();
