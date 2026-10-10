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

/** lint.mjs's own normalising, so "has no words" means what the lint will see. */
const lintNorm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** A label's words, as lint.mjs matches them; a possessive "'s" is the word it belongs to. */
const wordsOf = (s) =>
  lintNorm(s)
    .split(" ")
    .map((w) => w.replace(/'s$/, "").replace(/^['-]+|['-]+$/g, ""))
    .filter(Boolean);

const isNumber = (w) => /^\d[\d'-]*$/.test(w);

/** A single word this short is ordinary prose ("all", "day"): banning it as a whole word would
 *  fail sentences that never point at the control. */
const SHORT_WORD = 3;

/**
 * The vocabulary a task author is handed: every word of the facts sheet's own labels
 * ("shares of ABC held" → shares, of, abc, held) — never the words of a title the label quotes
 * (`when "Wholesale Trade" is`), which are the world's data, not the sheet's words.
 * @param {{label: string}[]} facts
 */
export function factWords(facts) {
  return [...new Set(facts.flatMap((f) => wordsOf(String(f.label).replace(/"[^"]*"/g, " "))))];
}

/**
 * Why a label is set aside rather than banned, or null when it is banned:
 *  - `no words` — nothing lint.mjs could match (a glyph, a bare number);
 *  - `data` — the world's data, not the interface's words: a data name (an account, a ticker, a
 *    playbook — facts.json `dataNames`), or only single-word data names and numbers;
 *  - `facts sheet` — only words the facts sheet's own labels use, which tasks are built from;
 *  - `short` — one word of SHORT_WORD letters or fewer.
 */
export function setAsideWhy(text, { dataNames = [], vocabulary = [] } = {}) {
  const words = wordsOf(text);
  if (!words.some((w) => /[a-z]/.test(w))) return "no words";
  const whole = new Set(dataNames.map(lintNorm));
  const dataWords = new Set(dataNames.map(lintNorm).filter((n) => n && !n.includes(" ")));
  if (whole.has(lintNorm(text)) || words.every((w) => dataWords.has(w) || isNumber(w)))
    return "data";
  const vocab = new Set(vocabulary);
  if (words.every((w) => vocab.has(w) || dataWords.has(w) || isNumber(w))) return "facts sheet";
  if (words.length === 1 && words[0].length <= SHORT_WORD) return "short";
  return null;
}

/**
 * labels.txt, as sections: `banned` — every control's accessible name and every heading the walk
 * saw on screen, and the names on screen after an operated control revealed them; `unseen` —
 * names the tree holds that no screen showed (still the interface's words, so still banned, but
 * marked); `setAside` — `{text, why}` (setAsideWhy). De-duplicated case- and space-blind, first
 * spelling kept, in walk order. A leading `#` is dropped, or lint.mjs would read the line as a
 * comment and never match it.
 * @param {{controls: {name: string}[], clipped?: {name: string}[], offscreen?: {name: string}[],
 *          headings: string[], treeHeadings?: string[],
 *          revealed?: {names: string[], treeNames?: string[]}[]}[]} walks
 * @param {{dataNames?: string[], vocabulary?: string[]}} [opts]
 */
export function labelSheet(walks, opts = {}) {
  const seen = new Set();
  const out = { banned: [], unseen: [], setAside: [] };
  const add = (raw, shown) => {
    const text = squash(raw).replace(/^#+\s*/, "");
    const key = fold(text);
    if (!key || seen.has(key)) return;
    seen.add(key);
    const why = setAsideWhy(text, opts);
    if (why) out.setAside.push({ text, why });
    else out[shown ? "banned" : "unseen"].push(text);
  };
  // Everything on screen first, so a name both seen and unseen elsewhere counts as seen.
  for (const n of walks.flatMap(shownNames)) add(n, true);
  for (const n of walks.flatMap(unseenNames)) add(n, false);
  return out;
}

/** A walk's names on screen: its controls, its headings, and what operating a control showed. */
const shownNames = (w) => [
  ...w.controls.map((c) => c.name),
  ...w.headings,
  ...(w.revealed ?? []).flatMap((r) => r.names),
];

/** A walk's names the tree held but no screen showed. */
const unseenNames = (w) => [
  ...[...(w.clipped ?? []), ...(w.offscreen ?? [])].map((c) => c.name),
  ...(w.treeHeadings ?? []),
  ...(w.revealed ?? []).flatMap((r) => r.treeNames ?? []),
];

/** labels.txt's text: the banned lines, then the marked sections as lint.mjs comments (unseen
 *  names stay banned under their comment; set-aside names are commented out). */
export function labelsText(sheet) {
  const lines = [...sheet.banned];
  if (sheet.unseen.length > 0)
    lines.push("# — named by the tree, never on screen (still banned) —", ...sheet.unseen);
  if (sheet.setAside.length > 0) {
    lines.push("# — set aside, not banned (why: text) —");
    for (const { text, why } of sheet.setAside) lines.push(`# ${why}: ${text}`);
  }
  return `${lines.join("\n")}\n`;
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
 * page revealed)? Matched as the oracle's page measure matches — case- and whitespace-blind, a
 * substring of ONE element's text: each text unit alone, and the units of each enclosing block
 * (`groups`: a table row, a card) read in order, so a region may span a name and its amount in
 * one row but never bridge two unrelated places on the page.
 * A fact and a walk that both name their world are matched within that world only: one viewer's
 * fact of one world is not proved by a screen of another (a bad-day world prints other amounts).
 * → `{judged, covered, missing, seen}`, `seen` and `missing` as fact keys (`factKey`), so the
 * round can hand the task author only facts a screen showed (#5009).
 * @param {{id: string, viewer: string, world?: string, answerRegion: string[]}[]} facts
 * @param {{viewer: string, world?: string, route: string, text: {text: string, groups?: number[]}[],
 *          revealed?: {text: {text: string, groups?: number[]}[]}[]}[]} walks
 */
export function regionCoverage(facts, walks) {
  const pages = new Map();
  const read = (units) => {
    const blocks = new Map();
    for (const u of units) {
      for (const g of u.groups ?? []) blocks.set(g, (blocks.get(g) ?? "") + blind(u.text));
    }
    return [...units.map((u) => blind(u.text)), ...blocks.values()];
  };
  const worldly = facts.some((f) => f.world) && walks.some((w) => w.world);
  const where = (x) => (worldly ? `${x.world}/${x.viewer}` : x.viewer);
  for (const w of walks) {
    const list = pages.get(where(w)) ?? [];
    list.push(read(w.text));
    for (const r of w.revealed ?? []) list.push(read(r.text));
    pages.set(where(w), list);
  }
  const seenBy = (at, snippet) =>
    (pages.get(at) ?? []).some((units) => units.some((u) => u.includes(blind(snippet))));
  const rows = facts.map((f) => ({
    key: factKey(f),
    at: where(f),
    seen: (f.answerRegion ?? []).filter((s) => seenBy(where(f), s)),
  }));
  const judged = rows.filter((r) => pages.has(r.at));
  return {
    judged: judged.length,
    covered: judged.filter((r) => r.seen.length > 0).length,
    // Ids repeat across viewers and worlds (two viewers can see one account), so a key names both.
    missing: judged.filter((r) => r.seen.length === 0).map((r) => r.key),
    seen: judged.filter((r) => r.seen.length > 0).map((r) => r.key),
  };
}

/** A fact's key in regions.json: `<viewer>:<id>`, led by `<world>/` when the fact names one. */
export const factKey = (f) => `${f.world ? `${f.world}/` : ""}${f.viewer}:${f.id}`;
