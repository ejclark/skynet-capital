// STEER MODEL — the pure half of the twice-a-day decisions page (#5056 slice 1).
//
// ONE SELECTOR, ONE RANK. The decisions come from `plan().needsYou` in
// scripts/moneypenny/assignments.mjs — the same list `digest-scan --needs-you` prints, and this
// page is its third reader (tests/scripts/moneypenny/needs-you.spec.ts). They are ordered by
// `classOf()` from scripts/rank.mjs, then oldest: no second ordering, no numeric score. Nothing in
// this file decides what needs Eric; it only shapes what the selector already said.
//
// RECORD PATHS. Every saved answer lives under its touch point: `tp/<id>/{decisions,queue,reel}/<key>`,
// and the round's own document `tp/<id>` holds its meta (open time, Done time, the tap log). The
// plan wrote the meta as `tp/<id>/meta`, but the artifact store reads an odd segment count as a
// collection (db.d.ts, PATH GRAMMAR), so the meta sits on the round document itself — which also
// makes a plain list of `tp` the index of every page there has been. Round 1 of the profile
// critique saved to `critique/q<n>` with no round in the path; that is the collision this fixes.
//
// Pure: no network, no clock, no filesystem.
import { classOf } from "../rank.mjs";

export const SECTIONS = ["decisions", "queue", "reel"];
/** Minutes of attention each page is sized to (Eric, 2026-10-10: 15 in the morning, 15–30 at 4pm). */
export const BUDGET_MINUTES = { am: 15, pm: 30 };
/** A gap between taps longer than this counts as this much: a tab left open is not steering. */
export const TAP_GAP_CAP_MS = 3 * 60_000;
/** The plan's estimates: approve 1, fork 3, design 4–5 (5 when there are more than 3 options). */
export const MINUTES = { approve: 1, fork: 3, design: 4 };
export const KINDS = ["design", "fork", "approve"];

const SEGMENT = /^[A-Za-z0-9_\-.~:@+]{1,200}$/;
const REPO = () => process.env.GITHUB_REPOSITORY ?? "ejclark/skynet-capital";

/** A record key the store accepts: the allowed characters only, never `.` or `..` alone. */
export function safeKey(raw) {
  const key = String(raw ?? "")
    .replace(/[^A-Za-z0-9_\-.~:@+]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  if (!key || key === "." || key === "..") throw new Error(`steer: no usable key in "${raw}"`);
  return key;
}

/** The round's own document — its meta. Two segments: a document, by the store's grammar. */
export function roundPath(id) {
  if (!SEGMENT.test(id)) throw new Error(`steer: bad touch point id "${id}"`);
  return `tp/${id}`;
}

/** Where one answer is saved: four segments, so always a document, never a collection. */
export function recordPath(id, section, key) {
  if (!SECTIONS.includes(section)) throw new Error(`steer: unknown section "${section}"`);
  return `${roundPath(id)}/${section}/${safeKey(key)}`;
}

/**
 * Active minutes from a tap log: the sum of the gaps between taps, each gap capped, so a page
 * left open through a meeting doesn't count as steering. One tap alone is zero minutes.
 */
export function activeMinutes(taps = [], capMs = TAP_GAP_CAP_MS) {
  const t = [...taps]
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  let total = 0;
  for (let i = 1; i < t.length; i++) total += Math.min(t[i] - t[i - 1], capMs);
  return Math.round((total / 60_000) * 10) / 10;
}

/** Words that put an ask in the irreversible class: Eric acts on these through GitHub himself. */
const IRREVERSIBLE =
  /\b(merge|merging|surge|envelope|workflow file|credential|secret|token|spend)\b/i;

/** A held PR, or an ask about merging, surge, an envelope path or spend — a link, never a button. */
export const isIrreversible = ({ isPr = false, text = "" } = {}) => isPr || IRREVERSIBLE.test(text);

export function estimateMinutes({ kind, options = [] }) {
  if (kind === "design") return MINUTES.design + (options.length > 3 ? 1 : 0);
  return MINUTES[kind] ?? MINUTES.fork;
}

/** What happens if Eric skips it — shown on the page and applied by the read-back. */
export function skipText(d) {
  if (d.kind === "approve" && !d.irreversible && d.default) {
    return `If you skip: the default applies — ${d.default}. The comment will say it was the default, not your answer.`;
  }
  if (d.isPr) return "If you skip: it stays held and comes back on the next page.";
  if (d.kind === "design")
    return "If you skip: this round stays open and comes back next page. Nothing is built from it.";
  return "If you skip: it waits for the next page. Nothing is built on it.";
}

const names = (labels = []) => labels.map((l) => (typeof l === "string" ? l : l?.name));
const link = (n, isPr) => `https://github.com/${REPO()}/${isPr ? "pull" : "issues"}/${n}`;
/** `(default: …)` inside a stated decision makes it an approval with that default. */
const DEFAULT_RE = /\(default:\s*([^)]+)\)/i;

/**
 * The decisions, in the rank's order. `needsYou` is `plan().needsYou`; `issues`/`prs` are the same
 * REST rows `gather()` read (for labels and age); `blocks` maps an issue to the open issues it
 * blocks (the rank's "unblocks #N" is P0); `design` maps an issue number to the design round that
 * stands in for its one generic row. Returns every decision — `fitBudget` decides what shows.
 */
export function decisionsFrom({
  needsYou = [],
  issues = [],
  prs = [],
  blocks = {},
  design = {},
  now,
}) {
  const byNumber = new Map();
  for (const i of issues) byNumber.set(i.number, { ...i, isPr: Boolean(i.pull_request) });
  for (const p of prs) byNumber.set(p.number, { ...byNumber.get(p.number), ...p, isPr: true });
  const rows = needsYou.map((row) => {
    const src = byNumber.get(row.number) ?? {};
    const labels = names(src.labels);
    const { cls, why } = classOf({ labels, blocks: blocks[row.number] ?? [] });
    const createdAt = src.created_at ?? null;
    return { row, src, labels, cls, why, createdAt };
  });
  rows.sort(
    (a, b) =>
      a.cls.localeCompare(b.cls) ||
      (Date.parse(a.createdAt ?? "") || Infinity) - (Date.parse(b.createdAt ?? "") || Infinity) ||
      a.row.number - b.row.number,
  );
  const out = [];
  for (const r of rows) {
    const base = shape(r, now);
    const round = design[r.row.number];
    if (round?.length)
      out.push(...round.map((q) => ({ ...base, ...q, cls: base.cls, why: base.why })));
    else out.push(base);
  }
  return out.map((d) => ({ ...d, minutes: estimateMinutes(d), skip: skipText(d) }));
}

function shape({ row, src, labels, cls, why, createdAt }, now) {
  const isPr = row.criterion === 4 || Boolean(src.isPr);
  const ask = row.decision ?? row.why;
  const dflt = isPr ? null : (DEFAULT_RE.exec(ask ?? "")?.[1]?.trim() ?? null);
  const kind = isPr || dflt ? "approve" : "fork";
  return {
    key: safeKey(row.number),
    kind,
    issue: row.number,
    isPr,
    title: row.title ?? src.title ?? `#${row.number}`,
    ask: ask ?? "",
    labels,
    cls,
    why,
    plan: labels.includes("plan"),
    createdAt,
    ageDays: createdAt
      ? Math.floor(
          ((typeof now === "number" ? now : Date.parse(now)) - Date.parse(createdAt)) / 864e5,
        )
      : null,
    irreversible: isIrreversible({ isPr, text: ask ?? "" }),
    default: dflt,
    link: link(row.number, isPr),
    recommendation: null,
    today: null,
    options: [],
  };
}

/** What fits the page's minutes, in order; the rest is a count that rolls to the next page. */
export function fitBudget(decisions, minutes) {
  const shown = [];
  const deferred = [];
  let used = 0;
  for (const d of decisions) {
    if (used + d.minutes <= minutes || shown.length === 0) {
      shown.push(d);
      used += d.minutes;
    } else deferred.push({ key: d.key, issue: d.issue, title: d.title, minutes: d.minutes });
  }
  return { shown, deferred, used, minutes };
}

/** Records keyed by path → the round's answers, grouped. Accepts ArtifactData's `{data}` wrap. */
export function roundRecords(records, id) {
  const unwrap = (doc) =>
    doc && typeof doc.data === "object" && doc.data && ("version" in doc || "id" in doc)
      ? doc.data
      : doc;
  const out = { meta: unwrap(records[roundPath(id)]) ?? null, decisions: {}, queue: {}, reel: {} };
  const prefix = `${roundPath(id)}/`;
  for (const [path, doc] of Object.entries(records)) {
    if (!path.startsWith(prefix)) continue;
    const [section, key, ...rest] = path.slice(prefix.length).split("/");
    if (rest.length || !SECTIONS.includes(section) || !key) continue;
    out[section][key] = unwrap(doc);
  }
  return out;
}

/** The hidden line an issue filed by the read-back carries, so a later reel can say "because you
 *  said …" when the work it asked for merges. `parseSteerMarker` is its only reader. */
export const steerMarker = (id, key) => `<!-- steer:from ${id} ${safeKey(key)} -->`;

/** `{ round, key, note }` from an issue body the read-back filed, or null. The note is the first
 *  quoted line — the read-back quotes Eric's words before anything else it quotes. */
export function parseSteerMarker(body = "") {
  const m = /<!-- steer:from (\S+) (\S+) -->/.exec(body ?? "");
  if (!m) return null;
  return { round: m[1], key: m[2], note: /^> (.+)$/m.exec(body)?.[1]?.trim() ?? null };
}

/** Did Eric leave anything on this record — a pick, a verdict, a reaction or a note? */
export const isAnswered = (rec) =>
  Boolean(
    rec &&
      (rec.pick ||
        rec.verdict ||
        Object.keys(rec.react ?? {}).length ||
        String(rec.note ?? "").trim()),
  );
