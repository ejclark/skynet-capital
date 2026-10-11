// THE MACHINE CENSUS (#4943) — every control on a world's routes, operated once, framed before and
// after, for the blind expert. "A census done by machine, not chosen": the list is Chromium's own
// accessibility tree, in its order; nothing here picks, skips or ranks a control by what it is.
//
//   npx tsx scripts/study/census.mjs --run <compose dir> --world <name> --viewer <who> \
//     --out <fresh dir> [--viewport phone,desktop] [--cap 60] [--route <path> …] [--clock <zone>,<locale>]
//
// PER ROUTE × VIEWPORT (the routes are the world's surfaces list, for that viewer):
//  1. WALK — open the composed world (session.mjs → `open`), then screen by screen from the top:
//     scroll, read the accessibility tree (CDP), hand each control's element to the page and
//     measure it. A control is LISTED when some part of it is inside the viewport at some screen.
//     One the tree holds but no screen shows is scrolled into view (the page and every box it
//     sits in, sideways too): on screen then — a sideways scroller's far end — it is listed as
//     `reach: "scrolled-into-view"`; kept out of view by a box a member cannot scroll, it is
//     `clipped` (a finding); still nowhere, it is `offscreen` (a skip link placed off the page).
//     The visible text of every screen is kept for harvest.mjs → walk.json.
//  2. OPERATE — each listed control, in tree order, up to the cap (the rest are logged as
//     dropped): a FRESH load (`reopen` — storage cleared), its screen's scroll position (settled,
//     so what the harness scroll set off is not charged to the tap), the same
//     control found again (role + name, nearest where the walk saw it; brought to the middle when
//     that screen leaves its centre covered or off screen), a frame BEFORE, one tap at
//     the centre of its visible part through the recorder's own `act` (so every per-action
//     measurement is session.mjs's, never re-implemented here), and the recorder's frame AFTER. A
//     control whose activation would leave the app's origin is recorded as skipped, with why.
//
// Out: <out>/census.json (one entry per control), <out>/walk.json (harvest.mjs's input), and per
// route × viewport a recorder run dir (<out>/<viewport>/<route slug>/: trace.jsonl + frames/).
// Measures in the browser (the walk: census-walk.mjs); every judgement is census-plan.mjs (specced,
// tests/scripts/).

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import * as page$ from "./census-page.mjs";
import {
  capControls,
  censusArgs,
  censusFindings,
  leaveReason,
  MAX_SCREENS,
  nearest,
  onScreen,
  routeSlug,
  routesFor,
  struckRoutes,
  tapPoint,
} from "./census-plan.mjs";
import { measured, readTree, revealed, SCREEN_MS, walk } from "./census-walk.mjs";
import { parseClock } from "./clock.mjs";
import { act, close, frame, open, settle } from "./session.mjs";
import { remark, reopen } from "./session-fresh.mjs";
import { loadWorld, rerunUnderTsx } from "./session-world.mjs";

/** Where to tap a measured control in this frame, and what a tap there would land on. */
async function aimAt(page, pick, viewport) {
  const point = pick.box && onScreen(pick, viewport) ? tapPoint(pick.box, viewport) : null;
  const cover = point ? await page.evaluate(page$.coverAt, [pick.i, point.x, point.y]) : null;
  return { point, cover };
}

/** The listed shape of a control, for every record that names one. */
const named = (c) => ({
  role: c.role,
  name: c.name,
  screen: c.screen,
  rect: c.box ?? null,
  doc: c.doc ?? null,
  ...(c.reach ? { reach: c.reach } : {}),
});

/** A harness scroll, then the page settled — so what the scroll set off (a lazy section's
 *  paint, a shift) lands before the tap's log is marked, never in its measurements. */
async function harnessScroll(session, fn, arg) {
  const before = await session.page.evaluate(() => Math.round(scrollY));
  const out = await session.page.evaluate(fn, arg);
  await session.page.waitForTimeout(SCREEN_MS);
  const after = await session.page.evaluate(() => Math.round(scrollY));
  if (fn !== page$.scrollPageTo || after !== before) await settle(session);
  return out;
}

/** Step 2 for one control: fresh load, its screen, frame, tap, frame. */
async function operate(session, cdp, route, c, viewport, out) {
  const { page } = session;
  const base = { route, ...named(c) };
  const load = await reopen(session, route);
  const loadBlocked = load.blocked.length > 0 ? { loadBlocked: load.blocked } : {};
  await harnessScroll(session, page$.scrollPageTo, c.scrollY);
  const same = (await readTree(cdp)).controls.filter((n) => n.role === c.role && n.name === c.name);
  const candidates = (await measured(session, cdp, same))
    .filter((x) => x.m && !x.m.gone)
    .map((x) => ({ i: x.i, ...x.m }));
  let pick = nearest(candidates, c.doc);
  if (!pick) {
    return {
      ...base,
      ...loadBlocked,
      status: "not-found",
      findings: censusFindings({ ...c, operated: "not-found" }),
    };
  }
  // At its screen's scroll position first, as the walk saw it. A control off screen there (a
  // sideways scroller's far end), or covered at its centre (half under a sticky head), is brought
  // to the middle and aimed at again, so `control-covered` is reported only for something that
  // covers it wherever it sits.
  let aim = await aimAt(page, pick, viewport);
  const atScreen = aim.cover;
  const rescrolled = !(aim.point && aim.cover?.inside);
  if (rescrolled) {
    await harnessScroll(session, page$.centreAdopted, pick.i);
    pick = { i: pick.i, ...(await page.evaluate(page$.measureAdopted))[pick.i] };
    aim = await aimAt(page, pick, viewport);
  }
  const { point, cover } = aim;
  if (!point)
    return {
      ...base,
      ...loadBlocked,
      status: "not-tappable",
      rescrolled,
      findings: censusFindings(c),
    };
  await remark(session);
  const before = await frame(session);
  const record = await act(session, { kind: "tap", ...point });
  if (record.refused)
    return { ...base, ...loadBlocked, status: "refused", why: record.refused, findings: [] };
  const { action: _a, findings, frame: after, seen: _s, ...measurements } = record;
  return {
    ...base,
    ...loadBlocked,
    revealed: record.url.changed ? null : await revealed(session, cdp, viewport),
    status: "operated",
    rescrolled,
    tapAt: point,
    cover,
    ...(rescrolled && atScreen ? { coverAtScreen: atScreen } : {}),
    frames: { before: relative(out, before), after: after ? relative(out, after) : null },
    measurements,
    findings: [...findings, ...censusFindings({ ...c, cover })],
  };
}

/** One route at one viewport: walk, then operate up to the cap. */
async function censusRoute(world, route, viewportName, opts) {
  const runDir = join(opts.out, viewportName, routeSlug(route));
  const session = await open({ world, viewport: viewportName, startPath: route, runDir });
  const viewport = session.frameSize;
  const cdp = await session.page.context().newCDPSession(session.page);
  try {
    const walked = await walk(session, cdp, viewport);
    const { kept, dropped } = capControls(walked.listed, opts.cap);
    const entries = [];
    for (const c of kept) {
      const reason = leaveReason(c.link, session.shell.origin);
      const entry = reason
        ? { route, ...named(c), status: "skipped", reason, findings: [] }
        : await operate(session, cdp, route, c, viewport, opts.out);
      entries.push({ viewport: viewportName, order: entries.length, ...entry });
      process.stderr.write(
        `census ${viewportName} ${route} ${entries.length}/${kept.length} ${entry.status} ${c.role} "${c.name.slice(0, 40)}"\n`,
      );
    }
    // A control only a box a member cannot scroll keeps from view: listed, never operated.
    for (const c of walked.clipped) {
      entries.push({
        viewport: viewportName,
        order: entries.length,
        route,
        ...named(c),
        status: "clipped",
        findings: censusFindings({ ...c, reach: "clipped" }),
      });
    }
    const placedOnly = (n) => ({ role: n.role, name: n.name, rect: n.box, doc: n.doc });
    const walkOut = {
      route,
      viewport: viewportName,
      controls: walked.listed.map(named),
      clipped: walked.clipped.map(placedOnly),
      offscreen: walked.offscreen.map(placedOnly),
      headings: walked.headings,
      treeHeadings: walked.treeHeadings,
      text: walked.text,
      revealed: entries
        .filter((e) => e.revealed)
        .map((e) => ({
          via: `${e.role} "${e.name}"`,
          names: e.revealed.names,
          treeNames: e.revealed.treeNames,
          text: e.revealed.text,
        })),
    };
    // census.json keeps the counts; the words themselves go to walk.json, harvest.mjs's input.
    for (const e of entries) {
      if (e.revealed) e.revealed = { names: e.revealed.names.length, text: e.revealed.text.length };
    }
    return {
      summary: {
        route,
        viewport: viewportName,
        screens: walked.screens,
        screensCut: walked.cut,
        listed: walked.listed.length,
        operated: entries.filter((e) => e.status === "operated").length,
        skipped: entries
          .filter((e) => e.status === "skipped")
          .map((e) => ({ name: e.name, role: e.role, reason: e.reason })),
        unoperated: entries
          .filter((e) => !["operated", "skipped", "clipped"].includes(e.status))
          .map((e) => ({ name: e.name, role: e.role, status: e.status })),
        reached: walked.listed.filter((c) => c.reach).length,
        clipped: walked.clipped.map(placedOnly),
        dropped: dropped.map(named),
        offscreen: walked.offscreen.map(placedOnly),
        world: session.worldLog && {
          unstubbed: [...new Set(session.worldLog.unstubbed)],
          offsite: [...new Set(session.worldLog.offsite)],
          writes: session.worldLog.writes.length,
        },
      },
      entries,
      walk: walkOut,
    };
  } finally {
    await close(session);
  }
}

/** The routes to census: `--route`s as given, else the world's list for this viewer — saying
 *  out loud what each choice leaves out or adds. */
async function censusRoutes(opts, viewer) {
  const { WORLDS } = await import("./worlds/index.mjs");
  const surfaces = WORLDS.find((w) => w.name === opts.world)?.surfaces ?? [];
  const listed = routesFor(surfaces, viewer);
  const routes = opts.routes.length > 0 ? opts.routes : listed;
  if (routes.length === 0) throw new Error(`world ${opts.world} names no routes for ${viewer}`);
  for (const r of opts.routes.filter((r) => !listed.includes(r)))
    console.log(`census: --route ${r} is not one of ${opts.world}'s routes for ${viewer}`);
  if (opts.routes.length === 0) {
    for (const s of struckRoutes(surfaces, viewer))
      console.log(`census: left out ${s.route} — its only surfaces are struck: ${s.why}`);
  }
  return routes;
}

/** One route's line, then everything it did not operate — never silently. */
function logRoute(s, cap) {
  console.log(
    `census: ${s.viewport} ${s.route} — ${s.listed} listed (${s.reached} scrolled into view) · ${s.operated} operated · ${s.skipped.length} skipped · ${s.dropped.length} dropped by the cap · ${s.clipped.length} clipped · ${s.offscreen.length} never on screen`,
  );
  if (s.screensCut)
    console.log(
      `  cut: the walk stopped at ${MAX_SCREENS} screens — controls below were never listed`,
    );
  for (const c of s.clipped) console.log(`  clipped (finding): ${c.role} "${c.name}"`);
  for (const d of s.dropped) console.log(`  dropped (cap ${cap}): ${d.role} "${d.name}"`);
  for (const k of s.skipped) console.log(`  skipped: ${k.role} "${k.name}" — ${k.reason}`);
}

async function main(argv) {
  const opts = censusArgs(argv);
  opts.out = resolve(opts.out);
  if (existsSync(join(opts.out, "census.json")))
    throw new Error(`${opts.out} already holds a census`);
  mkdirSync(opts.out, { recursive: true });
  // The member's clock (./clock.mjs): the page's own times read as the members' sessions read them,
  // so harvest.mjs can check the facts sheet's regions against this walk's text.
  const clock = parseClock(opts.clock);
  const world = await loadWorld(opts.world, { run: opts.run, viewer: opts.viewer, clock });
  if (!world.run)
    throw new Error(`census runs over a composed world (--run); ${opts.world} is scripted`);
  const routes = await censusRoutes(opts, world.viewer);
  const summaries = [];
  const controls = [];
  const walks = [];
  for (const viewportName of opts.viewports) {
    for (const route of routes) {
      const r = await censusRoute(world, route, viewportName, opts);
      summaries.push(r.summary);
      controls.push(...r.entries);
      walks.push(r.walk);
      logRoute(r.summary, opts.cap);
    }
  }
  const head = {
    world: opts.world,
    viewer: world.viewer,
    run: world.run,
    instant: world.pinnedInstant,
    clock,
    cap: opts.cap,
  };
  writeFileSync(
    join(opts.out, "census.json"),
    `${JSON.stringify({ ...head, routes: summaries, controls }, null, 1)}\n`,
  );
  writeFileSync(join(opts.out, "walk.json"), `${JSON.stringify({ ...head, walks }, null, 1)}\n`);
  console.log(`census: ${controls.length} control entries → ${join(opts.out, "census.json")}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const argv = process.argv.slice(2);
  const rerun = rerunUnderTsx(import.meta.url, argv);
  if (rerun !== null) process.exitCode = rerun;
  else
    main(argv).catch((err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    });
}
