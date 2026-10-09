// PARITY (#4943 slice 2) — before any member is sent into a study world, prove every surface the
// study may score renders there, IN THE VIEWPORT, on the phone and the desktop frame. Area-agnostic:
// the surfaces are the world's own list (scripts/study/worlds/*.mjs → `surfaces`); this file only
// opens, acts, scrolls and judges.
//
//   npx tsx scripts/study/parity.mjs [world …]          # compose fresh, then check every world
//   npx tsx scripts/study/parity.mjs --run <dir> [world …]   # check an existing compose
//   … --strict                                         # a note or a declared bug fails too
//
// WHY "IN THE VIEWPORT": a surface that exists in the DOM but sits under a sticky header, past a
// container's clipped edge, or behind a popover is a surface a member cannot see. Each expect is
// scrolled to, then measured in the browser (its box, and what `elementFromPoint` hits at its
// centre) and judged by a pure function — the measure-in-browser / judge-in-pure-functions split
// of scripts/crawl/phone.mjs, specced in tests/scripts/study-parity.spec.ts.
//
// A surface a world cannot render is declared `struck: "<reason>"` in its list and printed as
// STRUCK — never silently dropped; one that renders only when the composed build serves it says so
// with `strikeUnless` (parity-judge.mjs → strikeFor), so a pinned run can show it. Any miss, any FAULT (a tap something else took; a surface
// covered at its own position), or any `/api` read no composed answer covered (`unstubbed`), exits
// non-zero. A fault the app is known to have is declared on its act/expect as `knownBug: "#<n>"`
// and printed as `bug` with that issue — passing, but never as `ok`.
//
// A world's `oneTap` list (every destination one tap from the area: app nav, header icons) is
// checked beside its own surfaces, so a page the world cannot render faithfully is a row here
// before a run, never a member's finding after it. Each world's known artifacts — declared, struck,
// unanswered (never a miss: it fails the run) — go to `<run>/<world>-artifacts.json`.

import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expectHolds, locatorFor, VIEWPORTS } from "../crawl/steps.mjs";
import { FALLBACKS, settle } from "./compat.mjs";
import {
  interceptorOf,
  judgeVisible,
  parityArgs,
  parityTable,
  strikeFor,
  worstExit,
} from "./parity-judge.mjs";
import { answerFrom } from "./payloads.mjs";
import { worldArtifacts } from "./world-artifacts.mjs";
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

/**
 * Where an element is and whether a member could see it — measured, never judged, in the browser.
 * The rect is cut to every ancestor that clips overflow (a fixed box escapes them), the browser's
 * own `checkVisibility` answers display/visibility/opacity, and the centre of what is left is hit
 * tested. An ancestor taking the hit counts only when the element itself opts out of hit testing
 * (`pointer-events: none`) — otherwise a clipped or hidden element would pass because the box
 * behind it is its parent.
 */
const measure = (locator) =>
  locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    let [left, top, right, bottom] = [r.left, r.top, r.right, r.bottom];
    for (let a = el; a?.parentElement; a = a.parentElement) {
      if (getComputedStyle(a).position === "fixed") break;
      const p = a.parentElement;
      const cs = getComputedStyle(p);
      const c = p.getBoundingClientRect();
      if (cs.overflowX !== "visible")
        [left, right] = [Math.max(left, c.left), Math.min(right, c.right)];
      if (cs.overflowY !== "visible")
        [top, bottom] = [Math.max(top, c.top), Math.min(bottom, c.bottom)];
    }
    const had = r.width > 0 && r.height > 0;
    const clipped = had && (right <= left || bottom <= top);
    const hit = clipped ? null : document.elementFromPoint((left + right) / 2, (top + bottom) / 2);
    const passThrough = getComputedStyle(el).pointerEvents === "none";
    let inSticky = false;
    for (let a = el; a && !inSticky; a = a.parentElement) {
      inSticky = ["sticky", "fixed"].includes(getComputedStyle(a).position);
    }
    return {
      inSticky,
      box:
        had && !clipped
          ? { left, top, width: right - left, height: bottom - top }
          : { left, top, width: 0, height: 0 },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      shown: el.checkVisibility({
        opacityProperty: true,
        visibilityProperty: true,
        checkOpacity: true,
        checkVisibilityCSS: true,
      }),
      clipped,
      hitInside:
        hit !== null && (el === hit || el.contains(hit) || (passThrough && hit.contains(el))),
    };
  });

/** A fault a surface declared with its issue (`knownBug`) is listed as known, never as a pass. */
const fault = (result, entry, said) =>
  entry.knownBug ? result.known.push(`${entry.knownBug}: ${said}`) : result.faults.push(said);

/**
 * Does one expect hold at this frame? Never throws: a miss is returned as a detail string, a
 * reachability fault is pushed onto `result`. Scrolled to the element's middle first; if it is
 * then outside the viewport — it lives in a sticky block, which no scroll moves — the top of the
 * page is tried too, as a member scrolling back up would, and that is kept as a note — as is one
 * inside a sticky or fixed block that the page's bar covers while scrolled. Covered or clipped at
 * its own position, in flow, and only seen from the top is a FAULT: a member who scrolls to it
 * cannot read it.
 */
async function check(page, expect, result, frameName) {
  if (expect.url) {
    const held = await expectHolds(page, expect);
    return held.ok ? null : held.detail;
  }
  const all = locatorFor(page, expect);
  if (expect.absent) {
    // Every match, not the first, and given the same moment to appear as a present expect.
    const shown = await all
      .filter({ visible: true })
      .first()
      .waitFor({ state: "visible", timeout: 1500 })
      .then(
        () => true,
        () => false,
      );
    if (!shown) return null;
    if (!expect.knownBug) return `${describe(expect)} is shown`;
    fault(result, expect, `${describe(expect)} is shown at ${frameName}`);
    return null;
  }
  const target = all.first();
  try {
    await target.waitFor({ state: "attached", timeout: 8000 });
  } catch {
    return `${describe(expect)} not found`;
  }
  try {
    await centre(target);
    const mid = await measure(target);
    const verdict = judgeVisible(mid);
    if (verdict.ok) return null;
    await page.evaluate(() => window.scrollTo(0, 0));
    if (!judgeVisible(await measure(target)).ok) return `${describe(expect)} ${verdict.why}`;
    const where = mid.inSticky ? " (it rides a sticky block)" : "";
    const said = `${describe(expect)}: ${verdict.why}${where} at ${frameName}, seen at the top of the page`;
    // A sticky block is where the page puts it while scrolled (tucked under the bar by design);
    // anything else covered or clipped where it sits is a member who cannot read it.
    if (verdict.why === OUT_OF_VIEW || mid.inSticky) result.notes.push(said);
    else fault(result, expect, said);
    return null;
  } catch (err) {
    return `${describe(expect)} could not be measured (${String(err).split("\n")[0]})`;
  }
}

const OUT_OF_VIEW = "is outside the viewport after scrolling to it";

const describe = (e) =>
  e.url ? `url ${e.url}` : e.text ? `text "${e.text}"` : `${e.role}${e.name ? ` "${e.name}"` : ""}`;

/**
 * Click an act's target the way a member taps it. When the page lets something else take the tap
 * (an overlay over the control), the surface is still reached by keyboard so its expects can be
 * checked, and the blocked tap is a FAULT (the frame fails) unless the act declares its issue.
 */
async function act(page, a, frameName, result) {
  const target = locatorFor(page, a.click).first();
  await centre(target);
  try {
    await target.click({ timeout: 2500 });
  } catch (err) {
    const by = interceptorOf(String(err));
    if (!by) throw err;
    await target.focus();
    await page.keyboard.press("Enter");
    fault(
      result,
      a,
      `${describe(a.click)}: tap taken by ${by} at ${frameName}, reached by keyboard`,
    );
  }
  await page.waitForTimeout(a.wait ?? 600);
}

/** One surface at one frame → `{miss, faults, known, notes}`; `miss` is null when it rendered. */
async function surfaceAt(world, surface, frameName) {
  const result = { miss: null, faults: [], known: [], notes: [] };
  await world.page.goto(`${world.origin}${surface.route}`);
  await settle(world.page);
  await world.page.waitForTimeout(SETTLE_MS);
  for (const a of surface.act ?? []) {
    if (a.only && a.only !== frameName) continue;
    try {
      await act(world.page, a, frameName, result);
    } catch {
      return { ...result, miss: `could not act: click ${describe(a.click)}` };
    }
  }
  for (const expect of surface.expect) {
    if (expect.only && expect.only !== frameName) continue;
    const miss = await check(world.page, expect, result, frameName);
    if (miss) return { ...result, miss };
  }
  return result;
}

/** One frame's pass over one viewer's surfaces. A miss or a note keeps its frame on disk, so the
 *  table's word can be checked by eye. */
async function frameAt(open, surfaces, frameName, results, framesDir) {
  await open.reframe(VIEWPORTS[frameName]);
  for (const s of surfaces) {
    if (s.struck || (s.only && s.only !== frameName)) continue;
    const result = await surfaceAt(open, s, frameName);
    results.get(s.id)[frameName] = result;
    if (result.miss || result.faults.length + result.known.length + result.notes.length > 0) {
      mkdirSync(framesDir, { recursive: true });
      const path = join(framesDir, `${s.id}-${frameName}.jpg`);
      await open.page.screenshot({ path, type: "jpeg", quality: 55 });
    }
  }
}

/** Every surface of one world (its own, then one tap away), phone then desktop, one browser per
 *  viewer. */
async function checkWorld(world, runDir) {
  const rows = [];
  const unstubbed = [];
  const offsite = [];
  const writes = [];
  const surfaces = [...world.surfaces, ...(world.oneTap ?? [])];
  for (const viewer of new Set(surfaces.map((s) => s.viewer))) {
    const answer = answerFrom(join(runDir, world.name), viewer);
    const bodyOf = (read) => answer({ method: "GET", url: read })?.body;
    const mine = surfaces.filter((s) => s.viewer === viewer).map((s) => strikeFor(s, bodyOf));
    const open = await openWorld({
      answer,
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
      const tag = (u) => `${viewer}: ${u}`;
      unstubbed.push(...[...new Set(open.session.unstubbed)].map(tag));
      offsite.push(...[...new Set(open.session.offsite)].map(tag));
      writes.push(...open.session.writes.map((w) => tag(`${w.method} ${w.url}`)));
      await open.close();
    }
    for (const s of mine) rows.push({ world: world.name, surface: s, ...results.get(s.id) });
  }
  return { rows, unstubbed, offsite, writes };
}

function compose(runDir, names) {
  const out = spawnSync("npx", ["tsx", "scripts/study/worlds/compose.mjs", runDir, ...names], {
    stdio: "inherit",
  });
  if (out.status !== 0) throw new Error(`parity: compose exited ${out.status}`);
}

async function main() {
  const { runDir: given, strict, names } = parityArgs(process.argv.slice(2));
  const runDir = given ?? mkdtempSync(join(tmpdir(), "study-run-"));
  if (!given) compose(runDir, names);
  const chosen = names.length > 0 ? WORLDS.filter((w) => names.includes(w.name)) : WORLDS;
  const rows = [];
  const unstubbed = [];
  const offsite = [];
  const writes = [];
  const { payloads } = JSON.parse(readFileSync(join(runDir, "manifest.json"), "utf8"));
  for (const world of chosen) {
    const result = await checkWorld(world, runDir);
    const known = worldArtifacts({
      declared: world.artifacts,
      payloads: payloads.filter((p) => p.world === world.name),
      rows: result.rows,
      unstubbed: result.unstubbed,
    });
    writeFileSync(
      join(runDir, `${world.name}-artifacts.json`),
      `${JSON.stringify(known, null, 1)}\n`,
    );
    rows.push(...result.rows);
    unstubbed.push(...result.unstubbed.map((u) => `${world.name} ${u}`));
    offsite.push(...result.offsite.map((u) => `${world.name} ${u}`));
    writes.push(...result.writes.map((u) => `${world.name} ${u}`));
  }
  console.log(parityTable(rows));
  if (unstubbed.length > 0) console.log(`\nunstubbed /api reads:\n  ${unstubbed.join("\n  ")}`);
  if (offsite.length > 0) console.log(`\nblocked off-origin requests:\n  ${offsite.join("\n  ")}`);
  if (writes.length > 0) console.log(`\nwrites recorded (never sent):\n  ${writes.join("\n  ")}`);
  if (FALLBACKS.length > 0)
    console.log(`\nharness fallbacks (compat.mjs):\n  ${FALLBACKS.join("\n  ")}`);
  console.log(`\nrun dir: ${runDir}`);
  process.exitCode = worstExit(rows, unstubbed, { strict });
}

await main();
