// The member study's judgements — PURE functions over the trace `session.mjs` writes, one JSON line
// per action. Nothing here touches a browser, which is the split scripts/crawl/phone.mjs set: the
// page side only measures (`measure.mjs`), every call about what a measurement means lives here and
// is specced without a browser (tests/scripts/study-metrics.spec.ts).
//
// WHY THIS EXISTS: a presence check ("the control exists") passes on a screen a person cannot use.
// The failures a person actually feels happen BETWEEN frames — the page scrolls on its own after a
// tap, the control you aimed at slides away, a table hides its first column off the edge of a box,
// a control changes nothing you can see, you land a screen away from what you asked for. A recorder
// that keeps one page alive across actions can see those; these functions name them.
//
// Two outputs, both area-agnostic (no route, label or fixture lives here):
//  - `actionFindings(record)` — findings on the probe contract (scripts/crawl/probes.mjs):
//    {kind, what, snippet, severity, fix}, `snippet` being visible text locate.mjs can grep.
//  - `taskMetrics(trace, opts)` — one task's numbers: steps, backtracks, views, lostness (Smith
//    1996), voluntary vs involuntary scroll, navigations away, first-tap correctness, dead taps.

import { dedupe } from "../crawl/phone.mjs";

/** Scroll movement under this many px is jitter, not a jump. */
export const SCROLL_TOL = 4;
/** A tapped control that moves more than this (layout, not scroll) slid out from under the thumb. */
export const DISPLACE_TOL = 8;
/** Layout-shift total (CLS units) above which a shift is reported. */
export const SHIFT_TOL = 0.05;
/** A tap within this many px of a control's box is a near miss; further is a dead tap. */
export const NEAR_PX = 12;
/** Head height / first-content top moving more than this between sections is a frame shift. */
export const FRAME_TOL = 8;

const KINDS = ["tap", "scroll", "type", "key", "back", "hover", "done", "give_up"];
const KEYS = ["Enter", "Escape"];
const TERMINAL = new Set(["done", "give_up"]);
const FIELD_ROLES = new Set(["textbox", "searchbox", "combobox", "spinbutton"]);

const clip = (s, n = 60) => (s && s.length > n ? `${s.slice(0, n - 1)}…` : (s ?? ""));
const round = (n, d = 3) => Math.round(n * 10 ** d) / 10 ** d;

/** A pointer action must land inside the frame the member can see. */
function pointRefusal({ kind, x, y }, { width, height, hasTouch }) {
  if (!(Number.isFinite(x) && Number.isFinite(y))) return `${kind} needs numeric x and y`;
  if (x < 0 || y < 0 || x >= width || y >= height)
    return `${kind} (${x}, ${y}) is outside the ${width}×${height} frame`;
  if (kind === "hover" && hasTouch) return "hover needs a pointer — a touch screen has none";
  return null;
}

/** The argument vocabulary each non-pointer action allows. */
const ARG_RULES = {
  scroll: (a) =>
    (a.dir !== "up" && a.dir !== "down" && "scroll dir must be up or down") ||
    (a.screens !== 0.5 && a.screens !== 1 && "scroll screens must be 0.5 or 1") ||
    null,
  key: (a) => (KEYS.includes(a.key) ? null : `key must be one of ${KEYS.join(", ")}`),
  type: (a) => (typeof a.text === "string" && a.text.length > 0 ? null : "type needs text"),
};

/** Why an action cannot be performed in this frame, or null when it can. */
export function actionRefusal(action, frame) {
  if (!(action && KINDS.includes(action.kind))) return `unknown action ${action?.kind ?? "(none)"}`;
  if (action.kind === "tap" || action.kind === "hover") return pointRefusal(action, frame);
  return ARG_RULES[action.kind]?.(action) ?? null;
}

/** Where the member is: path + the `section` search param + which screen (scrollY ÷ height). */
export function viewKey({ pathname, section, scrollY, innerHeight }) {
  const screen = Math.floor(Math.max(0, scrollY) / Math.max(1, innerHeight));
  return `${pathname}${section ? `?section=${section}` : ""}#${screen}`;
}

/** Total distance travelled (px) from `start` through every sample, whatever the direction. */
export function scrollPath(start, samples) {
  let at = start;
  let travelled = 0;
  for (const s of samples) {
    travelled += Math.abs(s.y - at);
    at = s.y;
  }
  return travelled;
}

/**
 * Split an action's scroll movement into what the member asked for and what the page did on its
 * own. A scroll action owns up to the distance it intended (clamped to the page); anything beyond
 * is involuntary. `back` is excluded — restoring the old position is the browser's job, not a jump.
 */
export function scrollSplit(rec) {
  const { before, after, samples = [], intended = null } = rec.scroll;
  const path = scrollPath(before, [...samples, { y: after }]);
  const kind = rec.action.kind;
  if (kind === "scroll") {
    const wanted = Math.abs((intended ?? before) - before);
    return { voluntary: Math.min(path, wanted), involuntary: Math.max(0, path - wanted) };
  }
  if (kind === "back" || TERMINAL.has(kind)) return { voluntary: 0, involuntary: 0 };
  return { voluntary: 0, involuntary: path };
}

/**
 * hit · covered (inside a control's box, but something else — a sticky head — is on top of it) ·
 * near-miss (within NEAR_PX of a control) · dead (nothing operable near the thumb).
 */
export function tapOutcome(tap) {
  if (!tap) return null;
  if (tap.hit) return "hit";
  if (!tap.nearest) return "dead";
  if (tap.nearest.distance === 0) return "covered";
  return tap.nearest.distance <= NEAR_PX ? "near-miss" : "dead";
}

/**
 * How far the tapped control moved in the frame, in px — and whether the page scrolled meanwhile.
 * Only an unscrolled move is a reflow: once the page scrolls, a sticky control and a flowing one
 * move by different rules, and the scroll is already its own finding. Null when the control left
 * the document or the member left the path.
 */
export function displacement(rec) {
  const t = rec.tap;
  if (!(t?.rectBefore && t.rectAfter)) return null;
  if (rec.before.pathname !== rec.after.pathname) return null;
  const dx = t.rectAfter.x - t.rectBefore.x;
  const dy = t.rectAfter.y - t.rectBefore.y;
  return {
    px: Math.round(Math.hypot(dx, dy)),
    scrolled: Math.abs(rec.after.scrollY - rec.before.scrollY) > SCROLL_TOL,
  };
}

/** Layout-shift entries totalled, split by whether they came within 500ms of the input. */
export function shiftTotals(shifts = []) {
  let input = 0;
  let other = 0;
  for (const s of shifts) {
    if (s.hadRecentInput) input += s.value;
    else other += s.value;
  }
  return { input: round(input), other: round(other), total: round(input + other) };
}

/** Screens between where the member landed and the matching heading (0 = on screen). */
export function landingScreens(top, scrollY, innerHeight) {
  if (top === null || top === undefined) return null;
  const offset = (top - scrollY) / Math.max(1, innerHeight);
  return offset >= 0 && offset < 1 ? 0 : round(offset, 1);
}

const actionLabel = (rec) => {
  const a = rec.action;
  if (a.kind === "tap")
    return `tapping ${rec.tap?.hit?.name ? `"${clip(rec.tap.hit.name, 40)}"` : `(${a.x}, ${a.y})`}`;
  if (a.kind === "key") return `pressing ${a.key}`;
  if (a.kind === "type") return "typing";
  return a.kind;
};

const finding = (kind, what, snippet, severity, fix = "S") => ({
  kind,
  what,
  snippet: snippet ?? "",
  severity,
  fix,
});

function overflowFindings(overflow) {
  if (!overflow) return [];
  const out = [];
  const { page, containers = [] } = overflow;
  if (page && page.scrollWidth > page.innerWidth + SCROLL_TOL) {
    out.push(
      finding(
        "page-sideways-scroll",
        `the page is ${page.scrollWidth}px wide in a ${page.innerWidth}px window — it scrolls sideways`,
        "",
        "high",
        "M",
      ),
    );
  }
  for (const c of containers) {
    const hidden = c.scrollWidth - c.clientWidth;
    if (!c.inView || hidden <= SCROLL_TOL) continue;
    if (c.table?.clipped) {
      out.push(
        finding(
          "clipped-identity-column",
          `the first column of the table in ${c.name} is cut off at its box's edge${c.table.label ? ` ("${clip(c.table.label, 40)}")` : ""}`,
          c.table.label || c.text,
          "high",
        ),
      );
    }
    const away = c.table && !c.table.sticky ? " — its first column scrolls away with the rest" : "";
    out.push(
      finding(
        "container-overflow",
        `${c.name} scrolls sideways inside its box (${hidden}px out of view)${away}`,
        c.text,
        c.table ? "medium" : "low",
      ),
    );
  }
  return out;
}

/** True when an operated control changed nothing visible: same text, same URL, same scroll. */
export function noVisibleEffect(rec) {
  // Taps on a control only: a key with nothing open, or a text field taking focus, is no control.
  if (rec.action.kind !== "tap") return false;
  if (tapOutcome(rec.tap) !== "hit" || FIELD_ROLES.has(rec.tap.hit.role)) return false;
  return (
    rec.before.textHash === rec.after.textHash &&
    rec.before.href === rec.after.href &&
    Math.abs(rec.after.scrollY - rec.before.scrollY) <= SCROLL_TOL
  );
}

/** Every finding one recorded action produces. */
export function actionFindings(rec) {
  if (rec.refused || TERMINAL.has(rec.action.kind)) return [];
  const out = [];
  const name = rec.tap?.hit?.name ?? "";
  const { involuntary } = scrollSplit(rec);
  if (involuntary > SCROLL_TOL && rec.before.pathname === rec.after.pathname) {
    out.push(
      finding(
        "involuntary-scroll",
        `${actionLabel(rec)} scrolled the page ${Math.round(involuntary)}px on its own (${rec.before.scrollY} → ${rec.after.scrollY})`,
        name,
        "high",
      ),
    );
  }
  const moved = displacement(rec);
  if (moved && !moved.scrolled && moved.px > DISPLACE_TOL) {
    out.push(
      finding(
        "tap-displacement",
        `the control under the tap moved ${moved.px}px after ${actionLabel(rec)}`,
        name,
        "medium",
      ),
    );
  }
  const shifts = shiftTotals(rec.shifts);
  if (shifts.total > SHIFT_TOL) {
    out.push(
      finding(
        "layout-shift",
        `the layout shifted ${shifts.total} (${shifts.input} within 500ms of the input) after ${actionLabel(rec)}`,
        name,
        "medium",
      ),
    );
  }
  if (noVisibleEffect(rec)) {
    out.push(
      finding(
        "no-visible-effect",
        `${actionLabel(rec)} changed nothing visible in the frame`,
        name,
        "medium",
      ),
    );
  }
  const b = rec.before;
  const a = rec.after;
  if (b.pathname === a.pathname && b.section !== a.section) {
    const dHead = Math.abs((a.head ?? 0) - (b.head ?? 0));
    const dTop = Math.abs((a.contentTop ?? 0) - (b.contentTop ?? 0));
    if (dHead > FRAME_TOL || dTop > FRAME_TOL) {
      out.push(
        finding(
          "section-frame-shift",
          `switching section ${b.section ?? "(none)"} → ${a.section ?? "(none)"} moves the first content ${b.contentTop} → ${a.contentTop}px (sticky head ${b.head} → ${a.head}px)`,
          name,
          "low",
        ),
      );
    }
  }
  out.push(...overflowFindings(rec.overflow));
  return out;
}

/** Smith (1996): sqrt((N/S − 1)² + (R/N − 1)²); 0 is a perfect path. Null without R or views. */
export function lostness({ unique, total, optimal }) {
  if (!(optimal > 0 && unique > 0 && total > 0)) return null;
  return round(Math.sqrt((unique / total - 1) ** 2 + (optimal / unique - 1) ** 2));
}

const norm = (s) => (s ?? "").toLowerCase().replace(/\s+/g, " ").trim();

/** Did a tap hit the expected target? `expect` names a role and/or a (case-blind, contained) name. */
export function matchesTarget(hit, expect) {
  if (!(hit && expect)) return false;
  if (expect.role && hit.role !== expect.role) return false;
  return expect.name ? norm(hit.name).includes(norm(expect.name)) : true;
}

/** One task's numbers from its trace. `optimal` = the minimal view count; `expectFirst` a target. */
export function taskMetrics(trace, { startPath, optimal, expectFirst } = {}) {
  const recs = trace.filter((r) => !r.refused);
  const start = startPath ?? recs[0]?.before.pathname;
  const views = [];
  const push = (v) => views.at(-1) !== v && views.push(v);
  if (recs[0]) push(recs[0].before.view);
  const seen = new Set(views);
  let backtracks = 0;
  let navigationsAway = 0;
  let voluntaryScroll = 0;
  let involuntaryScroll = 0;
  for (const r of recs) {
    const moved = r.after.view !== r.before.view;
    if (r.action.kind === "back" || (moved && seen.has(r.after.view))) backtracks += 1;
    push(r.after.view);
    seen.add(r.after.view);
    if (r.before.pathname === start && r.after.pathname !== start) navigationsAway += 1;
    const split = scrollSplit(r);
    voluntaryScroll += split.voluntary;
    involuntaryScroll += split.involuntary;
  }
  const taps = recs.filter((r) => r.action.kind === "tap");
  const outcomes = taps.map((r) => tapOutcome(r.tap));
  const end = recs.findLast((r) => TERMINAL.has(r.action.kind));
  const uniqueViews = new Set(views).size;
  return {
    steps: recs.filter((r) => !TERMINAL.has(r.action.kind)).length,
    backtracks,
    uniqueViews,
    totalViews: views.length,
    lostness: lostness({ unique: uniqueViews, total: views.length, optimal }),
    voluntaryScroll: Math.round(voluntaryScroll),
    involuntaryScroll: Math.round(involuntaryScroll),
    navigationsAway,
    firstTapCorrect: expectFirst && taps[0] ? matchesTarget(taps[0].tap?.hit, expectFirst) : null,
    // A covered tap reaches nothing operable either: the member tapped what was on top.
    deadTaps: outcomes.filter((o) => o === "dead" || o === "covered").length,
    nearMisses: outcomes.filter((o) => o === "near-miss").length,
    gaveUp: end?.action.kind === "give_up",
    answer: end?.action.kind === "done" ? (end.action.answer ?? "") : null,
    findings: dedupe(recs.flatMap((r) => actionFindings(r))),
  };
}
