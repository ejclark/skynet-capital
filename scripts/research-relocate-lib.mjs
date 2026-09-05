// The read/write primitives behind scripts/research-relocate.mjs — the two legacy shared files
// (the MARKET_EVENTS TS literal, the single forward-test register table) on one side, the
// per-event files that replaced them (issue #1449) on the other. Kept apart from the CLI so each
// half stays inside the per-file line budget and so the parsers can be exercised on their own.
//
// Dependency-free (node built-ins + git on PATH), like every script a lane runs without `npm ci`.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

export const ROOT = process.cwd();
export const REGISTER_FILE = join(ROOT, "docs", "research", "forward-tests.md");
export const FRAGMENT_DIR = join(ROOT, "docs", "research", "forward-tests");
export const LEGACY_FRAGMENT = "legacy";
export const LITERAL_FILE = join(ROOT, "src", "domain", "market-events-data.ts");
export const EVENTS_DIR = join(ROOT, "src", "domain", "market-events");
const LEDGER_DIR = join(ROOT, "docs", "research", "events");
const LITERAL_MARKER = "export const MARKET_EVENTS: readonly MarketEvent[] = [";
export const ROW_RE = /^\|\s*(FT-[^|]+?)\s*\|/;
const EVENT_ID_RE = /^[a-z0-9][a-z0-9-]*$/;
/** A namespaced id is FT-<event-id>-<n>; the event id itself carries a YYYY-MM-DD. */
const NAMESPACED_RE = /^FT-(.+-\d{4}-\d{2}-\d{2}(?:-[a-z0-9]+)*)-(\d+)$/;
const KEY_ORDER = ["id", "kind", "title", "date", "status", "source", "impact", "symbols", "notes"];

export function git(...argv) {
  const r = spawnSync("git", argv, { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${argv.join(" ")} failed: ${r.stderr.trim()}`);
  return r.stdout;
}

/** `git show <ref>:<path>`, or null when the path does not exist at that ref. */
export function showAt(ref, relPath) {
  const r = spawnSync("git", ["show", `${ref}:${relPath}`], { cwd: ROOT, encoding: "utf8" });
  return r.status === 0 ? r.stdout : null;
}

// ── the legacy calendar literal ────────────────────────────────────────────────────────────────

/** Split the array's inner text into top-level, bracket-balanced object-literal substrings. */
function splitEntries(inner) {
  const texts = [];
  let i = 0;
  while (i < inner.length) {
    const brace = inner.indexOf("{", i);
    if (brace === -1) break;
    let depth = 0;
    let j = brace;
    for (; j < inner.length; j++) {
      if (inner[j] === "{") depth++;
      else if (inner[j] === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    if (depth !== 0) throw new Error("research-relocate: unbalanced object literal");
    texts.push(inner.slice(brace, j + 1));
    i = j + 1;
  }
  return texts;
}

/** Map<id, event object> from the legacy TS literal's source text. Empty map for a source that no
 *  longer carries the marker (a post-split checkout), so `branch` mode can diff across the split. */
export function parseLiteral(source) {
  const entries = new Map();
  if (source == null) return entries;
  const at = source.indexOf(LITERAL_MARKER);
  if (at === -1) return entries;
  const open = at + LITERAL_MARKER.length - 1;
  let depth = 0;
  let close = -1;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "[" || source[i] === "{") depth++;
    else if (source[i] === "]" || source[i] === "}") {
      depth--;
      if (depth === 0) {
        close = i;
        break;
      }
    }
  }
  if (close === -1) throw new Error("research-relocate: unbalanced MARKET_EVENTS literal");
  for (const text of splitEntries(source.slice(open + 1, close))) {
    // new Function is contained to checked-in, reviewed table literals — never remote input.
    const entry = new Function(`return (${text});`)();
    if (typeof entry?.id !== "string") throw new Error("research-relocate: entry with no id");
    entries.set(entry.id, entry);
  }
  return entries;
}

/** Canonical JSON for one event: fixed key order, 2-space indent, trailing newline. */
export function eventJson(event) {
  const ordered = {};
  for (const k of KEY_ORDER) if (event[k] !== undefined) ordered[k] = event[k];
  for (const k of Object.keys(event)) if (!(k in ordered)) ordered[k] = event[k];
  return `${JSON.stringify(ordered, null, 2)}\n`;
}

export const eventFile = (id) => join(EVENTS_DIR, `${id}.json`);

export function readEventFile(id) {
  const f = eventFile(id);
  return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : null;
}

export const sameJson = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export function writeEvent(event) {
  if (!EVENT_ID_RE.test(event.id))
    throw new Error(`research-relocate: "${event.id}" is not a lowercase slug`);
  mkdirSync(EVENTS_DIR, { recursive: true });
  writeFileSync(eventFile(event.id), eventJson(event));
}

/** Biome-format freshly written JSON so the lane's own `npm run lint` never disagrees. */
export function formatJson(files) {
  if (files.length === 0) return;
  const biome = join(ROOT, "node_modules", ".bin", "biome");
  if (!existsSync(biome)) return;
  spawnSync(biome, ["format", "--write", ...files], { cwd: ROOT, stdio: "ignore" });
}

// ── the legacy register table ──────────────────────────────────────────────────────────────────

/** Every `| FT-… |` row in file order as {id, line} — an ARRAY, never a map keyed by id: the
 *  legacy register carries ten duplicated ids (docs/COACHES.md's forward-test-id budget), and a
 *  relocation that silently dropped one of each pair would be data loss dressed as tidiness. */
export function parseRows(md) {
  const rows = [];
  if (md == null) return rows;
  for (const line of md.split("\n")) {
    const m = line.match(ROW_RE);
    if (m) rows.push({ id: m[1], line });
  }
  return rows;
}

const FRAGMENT_TABLE_HEADER =
  "| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |\n|---|---|---|---|---|---|";

function fragmentHeader(eventId) {
  if (eventId === LEGACY_FRAGMENT)
    return (
      "# Forward tests — legacy register (bare-number ids)\n\n" +
      "<!-- The rows that pre-date per-event ids: FT-1 … FT-N from the multi-symbol sweep and the\n" +
      "     first weeks of event research, plus the hybrid ids that never fit the scheme. Frozen\n" +
      "     except for scoring: the close-out lane of whichever event a row belongs to fills its\n" +
      "     Outcome cell here. Never register a new row in this file — a new hypothesis is\n" +
      "     FT-<event-id>-<n> in docs/research/forward-tests/<event-id>.md. -->\n\n" +
      "| # | Hypothesis | Prediction (registered 2026-08-12) | Kill switch | Score by | Outcome |\n" +
      "|---|---|---|---|---|---|"
    );
  return (
    `# Forward tests — ${eventId}\n\n` +
    "<!-- One event's pre-registered hypotheses, written ONLY by the lane that owns\n" +
    `     docs/research/events/${eventId}.md — never by a sibling lane, which is what lets every\n` +
    "     research PR merge without touching a shared file (issue #1449). The register at\n" +
    "     ../forward-tests.md is composed from these files; never add a row there. Ids are\n" +
    `     FT-${eventId}-<n>, <n> counting up within this file. Rows append only; the Outcome\n` +
    "     column is the one cell the close-out fills. -->\n\n" +
    FRAGMENT_TABLE_HEADER
  );
}

const fragmentFile = (eventId) => join(FRAGMENT_DIR, `${eventId}.md`);

/** A row written for docs/research/ now lives one directory down: re-anchor its relative links
 *  (`events/x.md` → `../events/x.md`, `multi-symbol-sweep.md` → `../multi-symbol-sweep.md`). The
 *  one mechanical edit a relocation makes to a registered row — a path, never a prediction. */
export function relinkRow(line) {
  return line.replace(/\]\((?!https?:|\.\.\/|#)([^)\s]+\.md(?:#[^)]*)?)\)/g, "](../$1)");
}

/** Rewrite one fragment so it carries exactly `rows` ([{id, line}]), in order. */
export function writeFragment(eventId, rows) {
  mkdirSync(FRAGMENT_DIR, { recursive: true });
  const lines = rows.map((r) => relinkRow(r.line));
  writeFileSync(fragmentFile(eventId), `${fragmentHeader(eventId)}\n${lines.join("\n")}\n`);
}

/** Every fragment on disk: Map<eventId, [{id, line}]>. */
export function readFragments() {
  const out = new Map();
  if (!existsSync(FRAGMENT_DIR)) return out;
  for (const f of readdirSync(FRAGMENT_DIR)) {
    if (!f.endsWith(".md")) continue;
    out.set(basename(f, ".md"), parseRows(readFileSync(join(FRAGMENT_DIR, f), "utf8")));
  }
  return out;
}

/** Which fragment a row belongs in. Namespaced ids go to their event; everything else is legacy.
 *  `knownEvents` widens the match to event ids that exist as ledgers or calendar entries, so an
 *  event id without a trailing date-shaped tail still resolves. */
export function fragmentFor(id, knownEvents) {
  const m = id.match(/^FT-(.+)-(\d+)$/);
  if (m && (knownEvents.has(m[1]) || NAMESPACED_RE.test(id))) return m[1];
  return LEGACY_FRAGMENT;
}

export function knownEventIds(extraSources = []) {
  const ids = new Set();
  if (existsSync(LEDGER_DIR))
    for (const f of readdirSync(LEDGER_DIR)) if (f.endsWith(".md")) ids.add(basename(f, ".md"));
  if (existsSync(EVENTS_DIR))
    for (const f of readdirSync(EVENTS_DIR)) if (f.endsWith(".json")) ids.add(basename(f, ".json"));
  for (const src of extraSources) for (const id of parseLiteral(src).keys()) ids.add(id);
  return ids;
}
