// The pure half of the harvest (#4943) — from a census walk (census.mjs → walk.json), the interface
// labels the leak check bans from task text (lint.mjs --labels) and the visible words the words
// pass reads. Specced in tests/scripts/study-harvest.spec.ts. Area-agnostic: text in, text out.

/** Visible text shorter than this is a short status ("96.5% of your account"); longer is prose. */
export const LONG_AT = 60;

/** The strings.json kinds, in the order the words pass reads them. */
export const KINDS = ["heading", "buttonOrLink", "label", "shortStatus", "longText"];

const squash = (s) =>
  String(s ?? "")
    .replace(/\s+/g, " ")
    .trim();
const fold = (s) => squash(s).toLowerCase();

/**
 * labels.txt's lines: every control's accessible name (on screen or not — a label the tree holds
 * is still the interface's word), every heading, and the names an operated control revealed, de-duplicated case- and space-blind, first
 * spelling kept, in walk order. A leading `#` is dropped, or lint.mjs would read the line as a
 * comment and never match it.
 * @param {{controls: {name: string}[], offscreen?: {name: string}[], headings: string[],
 *          revealed?: {names: string[]}[]}[]} walks
 */
export function labelLines(walks) {
  const seen = new Set();
  const out = [];
  for (const w of walks) {
    const names = [...w.controls, ...(w.offscreen ?? [])].map((c) => c.name);
    const opened = (w.revealed ?? []).flatMap((r) => r.names);
    for (const raw of [...names, ...w.headings, ...opened]) {
      const text = squash(raw).replace(/^#+\s*/, "");
      const key = fold(text);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(text);
    }
  }
  return out;
}

/** A visible text unit's strings.json kind. */
export function stringKind({ kind, text }) {
  if (kind === "heading") return "heading";
  if (kind === "control") return "buttonOrLink";
  if (kind === "label") return "label";
  return squash(text).length < LONG_AT ? "shortStatus" : "longText";
}

/**
 * strings.json: visible text by route and by kind — what the walk saw plus what operating a
 * control revealed on the same page — each string once per route and kind with the viewports it
 * was seen at; plus a count per kind (distinct strings, all routes).
 * @param {{route: string, viewport: string, text: {kind: string, text: string}[],
 *          revealed?: {text: {kind: string, text: string}[]}[]}[]} walks
 */
export function groupStrings(walks) {
  const routes = {};
  const distinct = Object.fromEntries(KINDS.map((k) => [k, new Set()]));
  for (const w of walks) {
    if (!routes[w.route]) routes[w.route] = Object.fromEntries(KINDS.map((k) => [k, []]));
    const r = routes[w.route];
    const opened = (w.revealed ?? []).flatMap((r) => r.text);
    for (const unit of [...w.text, ...opened]) {
      const text = squash(unit.text);
      if (!text) continue;
      const kind = stringKind(unit);
      const hit = r[kind].find((s) => s.text === text);
      if (hit) {
        if (!hit.viewports.includes(w.viewport)) hit.viewports.push(w.viewport);
      } else r[kind].push({ text, viewports: [w.viewport] });
      distinct[kind].add(text);
    }
  }
  const counts = Object.fromEntries(KINDS.map((k) => [k, distinct[k].size]));
  return { counts, routes };
}

const blind = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/\s+/g, "");

/**
 * Does each fact's answer region appear in the visible text the walk saw (or a control on the
 * page revealed)? Matched as the oracle's
 * page measure matches (case- and whitespace-blind, a substring), against each text unit and
 * against each route's units read in order (a region may span two units, a name and its amount).
 * @param {{id: string, viewer: string, answerRegion: string[]}[]} facts
 * @param {{viewer: string, route: string, text: {text: string}[]}[]} walks
 */
export function regionCoverage(facts, walks) {
  const pages = new Map();
  for (const w of walks) {
    const list = pages.get(w.viewer) ?? [];
    const page = w.text.map((u) => blind(u.text));
    list.push(page, [page.join("")]);
    for (const r of w.revealed ?? []) {
      const opened = r.text.map((u) => blind(u.text));
      list.push(opened, [opened.join("")]);
    }
    pages.set(w.viewer, list);
  }
  const seenBy = (viewer, snippet) =>
    (pages.get(viewer) ?? []).some((units) => units.some((u) => u.includes(blind(snippet))));
  const rows = facts.map((f) => ({
    id: f.id,
    viewer: f.viewer,
    seen: (f.answerRegion ?? []).filter((s) => seenBy(f.viewer, s)),
  }));
  const judged = rows.filter((r) => pages.has(r.viewer));
  return {
    judged: judged.length,
    covered: judged.filter((r) => r.seen.length > 0).length,
    missing: judged.filter((r) => r.seen.length === 0).map((r) => r.id),
  };
}
