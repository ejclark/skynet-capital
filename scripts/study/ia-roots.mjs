// STRUCTURAL FINDINGS BY IA ROOT (#8005) — the readout's grouping, PURE, specced in
// tests/scripts/study-readout-roots.spec.ts.
//
// WHY: a round returns dozens of structural findings (the profile round: 66), and a list of rows
// spends the owner's attention on symptoms. Most share a root no one screen can fix — the rows of
// `docs/IA.md` §10 — so the readout shows ROOTS, each with the findings under it, ranked; the
// owner reads roots, never rows (#8005: "every readout groups by IA root, top ten ranked, the rest
// folded", and slice 6 merges the nine readouts into one IA decision).
//
// WHO PLACES A FINDING: the blind evaluators never see §10, so the placing is an AWARE step after
// grading, like the checker's: `scripts/study/root.mjs` asks a sealed "rooter" (roles/rooter.md)
// to place each counted structural group under a §10 row (`U1`…) or a new root it names in plain
// words (`new: <the root>`), and writes `<round>/roots.json` ({<finding id>: <root>}). It never
// changes what was counted; a group it did not place is shown under "not yet placed", never hidden.

/** A root a finding may be placed under: a §10 row id, or a new root in plain words. */
const LEDGER_ID = /^U\d+$/;
const NEW_ROOT = /^new:\s*(\S.*)$/i;

/** One §10 table cell, its bold markers and trailing punctuation gone. */
const plain = (cell) =>
  String(cell ?? "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .trim();

/**
 * The §10 ledger rows of `docs/IA.md`: `[{id, root, status}]`, `root` being the row's bold lead
 * (the part before " — "). Reads only the table under the "## 10." heading.
 */
export function ledgerRows(markdown) {
  const at = String(markdown).search(/^## 10\./m);
  if (at < 0) return [];
  const section = String(markdown).slice(at);
  const end = section.slice(1).search(/^## /m);
  const body = end < 0 ? section : section.slice(0, end + 1);
  const rows = [];
  for (const line of body.split("\n")) {
    const cells = line.split("|").map((c) => c.trim());
    if (!LEDGER_ID.test(cells[1] ?? "")) continue;
    const lead = /\*\*(.+?)\*\*/.exec(cells[2] ?? "");
    rows.push({
      id: cells[1],
      root: plain(lead ? lead[1] : (cells[2] ?? "").split(" — ")[0]),
      status: plain(cells.at(-2)),
    });
  }
  return rows;
}

/** A placing read: `{kind: "ledger", id}` · `{kind: "new", name}` · null when unreadable. */
export function parseRoot(raw) {
  const s = String(raw ?? "").trim();
  if (LEDGER_ID.test(s)) return { kind: "ledger", id: s };
  const m = NEW_ROOT.exec(s);
  return m ? { kind: "new", name: m[1].trim() } : null;
}

/** The one key a root groups under: the row id, or the new root's name folded to lower case. */
export const rootKey = (r) => (r.kind === "ledger" ? r.id : `new:${r.name.toLowerCase()}`);

/**
 * Problems with a roots.json against the rows and the findings it places; [] when it keeps the
 * contract: every key a known finding, every value a §10 row that exists or a named new root.
 */
export function rootsProblems(roots, { rows, ids }) {
  const known = new Set(rows.map((r) => r.id));
  const out = [];
  for (const [id, raw] of Object.entries(roots ?? {})) {
    if (!ids.has(id)) out.push(`roots.json places ${id}, which is not a finding of this round`);
    const r = parseRoot(raw);
    if (!r) out.push(`${id}: "${raw}" is neither a §10 row id (U1…) nor "new: <the root>"`);
    else if (r.kind === "ledger" && !known.has(r.id)) out.push(`${id}: ${r.id} is not a §10 row`);
  }
  return out;
}

/**
 * The root of a structural group: the placing of any of its findings (the lead's first), or null.
 * @param {string[]} ids  the group's finding ids, lead first
 */
export function groupRoot(ids, roots) {
  for (const id of ids) {
    const r = parseRoot(roots?.[id]);
    if (r) return r;
  }
  return null;
}

/** A root's group before any problem is gathered under it. */
function emptyGroup(key, r, byId) {
  const row = r?.kind === "ledger" ? byId.get(r.id) : null;
  return {
    key,
    kind: r ? r.kind : "unplaced",
    title: r?.kind === "ledger" ? `${r.id} — ${row?.root ?? "a §10 row"}` : (r?.name ?? ""),
    status: row?.status ?? null,
    items: [],
    reports: 0,
    members: 0,
  };
}

/** How many new roots or rows get shown in full; the rest sit in one fold. */
export const ROOTS_TOP = 10;

/**
 * Structural items (readout.mjs's ranked groups, each with `ids`) gathered under their roots.
 * A root ranks by its worst finding, then by how many reports it gathered, then by members reached
 * (`rank` is readout-core.mjs's severityRank); its findings keep their own ranked order. Items with
 * no placing gather under one "not yet placed" root, always last.
 * @returns {{key: string, kind: "ledger"|"new"|"unplaced", title: string, status: string|null,
 *            items: object[], reports: number, members: number}[]}
 */
export function groupByRoot(items, { roots, rows, rank }) {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const groups = new Map();
  for (const item of items) {
    const r = groupRoot(item.ids ?? [item.finding?.id], roots);
    const key = r ? rootKey(r) : "unplaced";
    if (!groups.has(key)) groups.set(key, emptyGroup(key, r, byId));
    const g = groups.get(key);
    g.items.push(item);
    g.reports += 1 + (item.also ?? 0);
    g.members += item.members ?? 0;
  }
  const worst = (g) => Math.max(...g.items.map((s) => rank(s.severity ?? s.finding?.severity)));
  const placed = [...groups.values()].filter((g) => g.kind !== "unplaced");
  const ranked = placed
    .map((g, i) => ({ g, i, w: worst(g) }))
    .sort(
      (a, b) => b.w - a.w || b.g.reports - a.g.reports || b.g.members - a.g.members || a.i - b.i,
    )
    .map(({ g }) => g);
  const unplaced = groups.get("unplaced");
  return unplaced ? [...ranked, unplaced] : ranked;
}

/**
 * The rooter's message: the §10 rows, the new roots already named (so one root is named once
 * across chunks), and the structural findings to place — id, what and where only.
 */
export function rooterText({ rows, named, findings }) {
  return [
    "The ledger of upstream problems (docs/IA.md §10), one per line: id — root — status.",
    ...rows.map((r) => `${r.id} — ${r.root} — ${r.status}`),
    "",
    named.length > 0
      ? `New roots already named in this round (reuse a name, word for word, when it is the same root): ${named.map((n) => `"new: ${n}"`).join(", ")}.`
      : "No new roots have been named in this round yet.",
    "",
    "The structural findings to place, one per line: id — where — what.",
    ...findings.map(
      (f) => `${f.id} — ${f.surface?.route ?? "?"} @${f.surface?.viewport ?? "?"} — ${f.what}`,
    ),
  ].join("\n");
}

/**
 * A rooter's answer read against the findings it was asked about: the placings it made
 * (`{id: root}`), and the ids it skipped or placed unreadably (to ask again).
 */
export function readPlacings(answer, { asked, rows }) {
  const known = new Set(rows.map((r) => r.id));
  const placed = {};
  for (const p of answer?.placings ?? []) {
    if (!asked.has(p?.finding)) continue;
    const r = parseRoot(p.root);
    if (!r || (r.kind === "ledger" && !known.has(r.id))) continue;
    placed[p.finding] = r.kind === "ledger" ? r.id : `new: ${r.name}`;
  }
  return { placed, skipped: [...asked].filter((id) => !(id in placed)) };
}
