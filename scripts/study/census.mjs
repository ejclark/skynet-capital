// THE MACHINE CENSUS (#4943) — every control on a world's routes, operated once, framed before and
// after, for the blind expert. "A census done by machine, not chosen": the list is Chromium's own
// accessibility tree, in its order; nothing here picks, skips or ranks a control by what it is.
//
//   npx tsx scripts/study/census.mjs --run <compose dir> --world <name> --viewer <who> \
//     --out <fresh dir> [--viewport phone,desktop] [--cap 60] [--route <path> …]
//
// PER ROUTE × VIEWPORT (the routes are the world's surfaces list, for that viewer):
//  1. WALK — open the composed world (session.mjs → `open`), then screen by screen from the top:
//     scroll, read the accessibility tree (CDP), hand each control's element to the page and
//     measure it. A control is LISTED when some part of it is inside the viewport at some screen;
//     one the tree holds but no screen shows is kept as `offscreen` (a horizontal scroller's far
//     end, a clipped box). The visible text of every screen is kept for harvest.mjs → walk.json.
//  2. OPERATE — each listed control, in tree order, up to the cap (the rest are logged as
//     dropped): a FRESH load (`reopen` — storage cleared), its screen's scroll position, the same
//     control found again (role + name, nearest where the walk saw it), a frame BEFORE, one tap at
//     the centre of its visible part through the recorder's own `act` (so every per-action
//     measurement is session.mjs's, never re-implemented here), and the recorder's frame AFTER. A
//     control whose activation would leave the app's origin is recorded as skipped, with why.
//
// Out: <out>/census.json (one entry per control), <out>/walk.json (harvest.mjs's input), and per
// route × viewport a recorder run dir (<out>/<viewport>/<route slug>/: trace.jsonl + frames/).
// Measures in the browser; every judgement is census-plan.mjs (specced, tests/scripts/).

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import * as page$ from "./census-page.mjs";
import {
  axPick,
  capControls,
  censusArgs,
  censusFindings,
  keyed,
  leaveReason,
  MAX_SCREENS,
  nearest,
  nextScreen,
  onScreen,
  routeSlug,
  routesFor,
  tapPoint,
  treeOrder,
  walkOrder,
} from "./census-plan.mjs";
import { act, close, frame, open } from "./session.mjs";
import { remark, reopen } from "./session-fresh.mjs";
import { loadWorld, rerunUnderTsx } from "./session-world.mjs";

/** After a harness scroll: long enough for a lazy section to paint before it is read. */
const SCREEN_MS = 300;

/** The accessibility tree's controls and headings, in tree order. */
async function readTree(cdp) {
  const { nodes } = await cdp.send("Accessibility.getFullAXTree");
  return axPick(treeOrder(nodes));
}

/** Hand each node's element to the page (`adoptSelf`); its index there, or null if unresolved. */
async function adopt(session, cdp, nodes) {
  await session.page.evaluate(page$.resetAdopted);
  const out = [];
  for (const n of nodes) {
    try {
      const { object } = await cdp.send("DOM.resolveNode", { backendNodeId: n.backendId });
      const { result } = await cdp.send("Runtime.callFunctionOn", {
        objectId: object.objectId,
        functionDeclaration: page$.adoptSelf.toString(),
        returnByValue: true,
      });
      out.push(result.value);
      await cdp.send("Runtime.releaseObject", { objectId: object.objectId });
    } catch {
      out.push(null);
    }
  }
  return out;
}

/** The tree's controls measured at this scroll position: `[{node, m}]`. */
async function measured(session, cdp, nodes) {
  const idx = await adopt(session, cdp, nodes);
  const ms = await session.page.evaluate(page$.measureAdopted);
  return nodes.map((node, i) => ({ node, i: idx[i], m: idx[i] === null ? null : ms[idx[i]] }));
}

/** Step 1: walk the page from the top, screen by screen. */
async function walk(session, cdp, viewport) {
  const found = new Map();
  const tree = new Map();
  const headings = new Set();
  const units = new Map();
  let lastRead = [];
  let y = 0;
  let screen = 0;
  let cut = false;
  for (;;) {
    const at = await session.page.evaluate(page$.scrollPageTo, y);
    await session.page.waitForTimeout(SCREEN_MS);
    const read = await readTree(cdp);
    for (const h of read.headings) headings.add(h.name);
    lastRead = read.controls.map((n) => n.backendId);
    for (const { node, m } of await measured(session, cdp, read.controls)) {
      tree.set(node.backendId, node);
      if (found.has(node.backendId) || !onScreen(m, viewport)) continue;
      found.set(node.backendId, {
        ...node,
        screen,
        scrollY: at,
        box: m.box,
        doc: m.doc,
        link: m.link,
        pinned: m.pinned,
      });
    }
    for (const u of await session.page.evaluate(page$.visibleTextUnits)) {
      if (!units.has(u.id)) units.set(u.id, { kind: u.kind, text: u.text, screen });
    }
    const next = nextScreen(at, await session.page.evaluate(page$.pageExtent));
    if (next === null) break;
    if (++screen >= MAX_SCREENS) {
      cut = true;
      break;
    }
    y = next;
  }
  const listed = keyed(walkOrder([...found.values()], lastRead));
  const offscreen = [...tree.values()].filter((n) => !found.has(n.backendId));
  return {
    screens: screen + 1,
    cut,
    listed,
    offscreen,
    headings: [...headings],
    text: [...units.values()],
  };
}

/**
 * What operating a control put on screen without leaving the page — an opened sheet, an expanded
 * row: its controls' and headings' names (still the interface's words) and its visible text.
 */
async function revealed(session, cdp) {
  const read = await readTree(cdp);
  return {
    names: [...new Set([...read.controls, ...read.headings].map((n) => n.name).filter(Boolean))],
    text: (await session.page.evaluate(page$.visibleTextUnits)).map(({ kind, text }) => ({
      kind,
      text,
    })),
  };
}

/** Step 2 for one control: fresh load, its screen, frame, tap, frame. */
async function operate(session, cdp, route, c, viewport, out) {
  const { page } = session;
  const base = { route, name: c.name, role: c.role, screen: c.screen };
  await reopen(session, route);
  await page.evaluate(page$.scrollPageTo, c.scrollY);
  await page.waitForTimeout(SCREEN_MS);
  const same = (await readTree(cdp)).controls.filter((n) => n.role === c.role && n.name === c.name);
  const candidates = (await measured(session, cdp, same))
    .filter((x) => x.m && !x.m.gone)
    .map((x) => ({ i: x.i, ...x.m }));
  let pick = nearest(candidates, c.doc);
  if (!pick) {
    return {
      ...base,
      status: "not-found",
      findings: censusFindings({ ...c, operated: "not-found" }),
    };
  }
  let rescrolled = false;
  if (!(onScreen(pick, viewport) && tapPoint(pick.box, viewport))) {
    await page.evaluate(page$.centreAdopted, pick.i);
    await page.waitForTimeout(SCREEN_MS);
    pick = { i: pick.i, ...(await page.evaluate(page$.measureAdopted))[pick.i] };
    rescrolled = true;
  }
  const point = pick.box && onScreen(pick, viewport) ? tapPoint(pick.box, viewport) : null;
  if (!point) return { ...base, status: "not-tappable", rescrolled, findings: censusFindings(c) };
  const cover = await page.evaluate(page$.coverAt, [pick.i, point.x, point.y]);
  await remark(session);
  const before = await frame(session);
  const record = await act(session, { kind: "tap", ...point });
  if (record.refused) return { ...base, status: "refused", why: record.refused, findings: [] };
  const { action: _a, findings, frame: after, seen: _s, ...measurements } = record;
  return {
    ...base,
    revealed: record.url.changed ? null : await revealed(session, cdp),
    status: "operated",
    rescrolled,
    tapAt: point,
    cover,
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
        ? {
            route,
            name: c.name,
            role: c.role,
            screen: c.screen,
            status: "skipped",
            reason,
            findings: [],
          }
        : await operate(session, cdp, route, c, viewport, opts.out);
      entries.push({ viewport: viewportName, order: entries.length, ...entry });
      process.stderr.write(
        `census ${viewportName} ${route} ${entries.length}/${kept.length} ${entry.status} ${c.role} "${c.name.slice(0, 40)}"\n`,
      );
    }
    const name = (c) => ({ role: c.role, name: c.name, screen: c.screen });
    const walkOut = {
      route,
      viewport: viewportName,
      controls: walked.listed.map(name),
      offscreen: walked.offscreen.map((n) => ({ role: n.role, name: n.name })),
      headings: walked.headings,
      text: walked.text,
      revealed: entries
        .filter((e) => e.revealed)
        .map((e) => ({
          via: `${e.role} "${e.name}"`,
          names: e.revealed.names,
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
          .filter((e) => !["operated", "skipped"].includes(e.status))
          .map((e) => ({ name: e.name, role: e.role, status: e.status })),
        dropped: dropped.map(name),
        offscreen: walked.offscreen.map((n) => ({ role: n.role, name: n.name })),
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

async function main(argv) {
  const opts = censusArgs(argv);
  opts.out = resolve(opts.out);
  if (existsSync(join(opts.out, "census.json")))
    throw new Error(`${opts.out} already holds a census`);
  mkdirSync(opts.out, { recursive: true });
  const world = await loadWorld(opts.world, { run: opts.run, viewer: opts.viewer });
  if (!world.run)
    throw new Error(`census runs over a composed world (--run); ${opts.world} is scripted`);
  const { WORLDS } = await import("./worlds/index.mjs");
  const def = WORLDS.find((w) => w.name === opts.world);
  const routes =
    opts.routes.length > 0 ? opts.routes : routesFor(def?.surfaces ?? [], world.viewer);
  if (routes.length === 0)
    throw new Error(`world ${opts.world} names no routes for ${world.viewer}`);
  const summaries = [];
  const controls = [];
  const walks = [];
  for (const viewportName of opts.viewports) {
    for (const route of routes) {
      const r = await censusRoute(world, route, viewportName, opts);
      summaries.push(r.summary);
      controls.push(...r.entries);
      walks.push(r.walk);
      const s = r.summary;
      console.log(
        `census: ${viewportName} ${route} — ${s.listed} listed · ${s.operated} operated · ${s.skipped.length} skipped · ${s.dropped.length} dropped by the cap · ${s.offscreen.length} never on screen`,
      );
      for (const d of s.dropped) console.log(`  dropped (cap ${opts.cap}): ${d.role} "${d.name}"`);
      for (const k of s.skipped) console.log(`  skipped: ${k.role} "${k.name}" — ${k.reason}`);
    }
  }
  const head = {
    world: opts.world,
    viewer: world.viewer,
    run: world.run,
    instant: world.pinnedInstant,
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
