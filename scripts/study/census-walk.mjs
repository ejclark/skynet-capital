// The census's walk (#4943) — split from census.mjs so that file holds the per-control operation.
// Reads Chromium's accessibility tree over CDP, hands each control's element to the page
// (census-page.mjs) and measures it, screen by screen; then scrolls into view what no screen showed
// and sorts it (census-plan.mjs → reachVerdict). Every judgement is census-plan.mjs.

import * as page$ from "./census-page.mjs";
import {
  axPick,
  keyed,
  MAX_SCREENS,
  nextScreen,
  onScreen,
  reachVerdict,
  screenFor,
  treeOrder,
  walkOrder,
} from "./census-plan.mjs";

/** After a harness scroll: long enough for a lazy section to paint before it is read. */
export const SCREEN_MS = 300;

/** The accessibility tree's controls and headings, in tree order. */
export async function readTree(cdp) {
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
export async function measured(session, cdp, nodes) {
  const idx = await adopt(session, cdp, nodes);
  const ms = await session.page.evaluate(page$.measureAdopted);
  return nodes.map((node, i) => ({ node, i: idx[i], m: idx[i] === null ? null : ms[idx[i]] }));
}

/** Keep each visible text unit once, at the first screen that showed it. */
function keepUnits(units, list, screen) {
  for (const u of list) {
    if (!units.has(u.id)) units.set(u.id, { kind: u.kind, text: u.text, groups: u.groups, screen });
  }
}

/** One screen of the walk: its headings, its controls (listed when on screen), its text. */
async function readScreen(session, cdp, viewport, w, screen, at) {
  const read = await readTree(cdp);
  for (const { node, m } of await measured(session, cdp, read.headings)) {
    w.headings[onScreen(m, viewport) ? "shown" : "tree"].add(node.name);
  }
  for (const { node, m } of await measured(session, cdp, read.controls)) {
    w.tree.set(node.backendId, node);
    if (m && !m.gone) w.seenAt.set(node.backendId, m);
    if (w.found.has(node.backendId) || !onScreen(m, viewport)) continue;
    w.found.set(node.backendId, { ...node, screen, scrollY: at, ...placed(m) });
  }
  keepUnits(w.units, await session.page.evaluate(page$.visibleTextUnits), screen);
  return read.controls.map((n) => n.backendId);
}

/** A control no screen showed, scrolled into view as a member's swipe would: the verdict
 *  (census-plan.mjs → reachVerdict), the page's scroll then, and its measure there. */
async function reachOne(session, cdp, node, viewport) {
  const [i] = await adopt(session, cdp, [node]);
  if (i === null || i === undefined) return { verdict: "offscreen", m: null };
  const { scrollY: at, forced } = await session.page.evaluate(page$.centreAdopted, i);
  await session.page.waitForTimeout(SCREEN_MS);
  const m = (await session.page.evaluate(page$.measureAdopted))[i];
  return { verdict: reachVerdict(m, viewport, forced), at, m };
}

/** After the screens: reach every control the tree held that no screen showed. A reached one is
 *  listed (found again later from where the walk measured it, `doc`); the rest are sorted into
 *  clipped and offscreen. */
async function reachUnseen(session, cdp, viewport, w) {
  const out = { clipped: [], offscreen: [] };
  for (const node of w.tree.values()) {
    if (w.found.has(node.backendId)) continue;
    const walked = w.seenAt.get(node.backendId);
    const { verdict, at, m } = await reachOne(session, cdp, node, viewport);
    if (verdict !== "reached") {
      out[verdict].push({ ...node, ...placed(m ?? walked) });
      continue;
    }
    const doc = walked?.doc ?? m.doc;
    const screen = screenFor(doc.y, w.starts, viewport.height);
    w.found.set(node.backendId, {
      ...node,
      screen,
      scrollY: at,
      ...placed(m),
      doc,
      reach: "scrolled-into-view",
    });
    keepUnits(w.units, await session.page.evaluate(page$.visibleTextUnits), screen);
  }
  return out;
}

/** Step 1: walk the page from the top, screen by screen, then reach what no screen showed. */
export async function walk(session, cdp, viewport) {
  const w = {
    found: new Map(),
    tree: new Map(),
    seenAt: new Map(),
    headings: { shown: new Set(), tree: new Set() },
    units: new Map(),
    starts: [],
  };
  let lastRead = [];
  let y = 0;
  let screen = 0;
  let cut = false;
  for (;;) {
    const at = await session.page.evaluate(page$.scrollPageTo, y);
    w.starts.push(at);
    await session.page.waitForTimeout(SCREEN_MS);
    lastRead = await readScreen(session, cdp, viewport, w, screen, at);
    const next = nextScreen(at, await session.page.evaluate(page$.pageExtent));
    if (next === null) break;
    if (++screen >= MAX_SCREENS) {
      cut = true;
      break;
    }
    y = next;
  }
  const { clipped, offscreen } = await reachUnseen(session, cdp, viewport, w);
  return {
    screens: screen + 1,
    cut,
    listed: keyed(walkOrder([...w.found.values()], lastRead)),
    clipped,
    offscreen,
    headings: [...w.headings.shown],
    treeHeadings: [...w.headings.tree].filter((h) => !w.headings.shown.has(h)),
    text: [...w.units.values()],
  };
}

/** Where a measured control sat: its rect as listed (viewport, cut to its clips), its place in
 *  the document, its link and whether it is pinned. */
function placed(m) {
  if (!m || m.gone) return { box: null, doc: null, link: null, pinned: false };
  return { box: m.box, doc: m.doc, link: m.link, pinned: m.pinned };
}

/**
 * What operating a control put on screen without leaving the page — an opened sheet, an expanded
 * row: the names of the controls and headings on screen after it (still the interface's words),
 * apart from those the tree holds but no part of which is on screen, and its visible text.
 */
export async function revealed(session, cdp, viewport) {
  const read = await readTree(cdp);
  const named = [...read.controls, ...read.headings].filter((n) => n.name);
  const shown = new Set();
  const held = new Set();
  for (const { node, m } of await measured(session, cdp, named)) {
    (onScreen(m, viewport) ? shown : held).add(node.name);
  }
  return {
    names: [...shown],
    treeNames: [...held].filter((n) => !shown.has(n)),
    text: (await session.page.evaluate(page$.visibleTextUnits)).map(({ kind, text, groups }) => ({
      kind,
      text,
      groups,
    })),
  };
}
