#!/usr/bin/env node
// Research lint — the eye behind the research-document contract (docs/process/EVENT-RESEARCH.md,
// docs/research/events/TEMPLATE.md).
//
// WHY THIS EXISTS. docs/ISSUES.md measured the pattern once already: "the PR surface got a
// template, a guide and a gate; the issue surface got none of the three, and the numbers track
// that difference and nothing else." Event ledgers had a template and a guide but no gate — and
// 15 of 52 carried no decision header at all, so the /research page had nothing to promote and a
// reader landed on 8,000 characters of method. This is the missing third thing.
//
// DELIBERATELY LENIENT, on purpose. docs/IDEAS.md banks the caution: measure whether long entries
// actually hurt before gating a capture surface — never tax the habit. So STRUCTURE is gated (does
// the decision header exist, does it carry a call) and PROSE LENGTH is advisory. Problems fail;
// notes inform. The two-tier split is issue-lint.mjs's.
//
//   node scripts/research-lint.mjs             # human report: debt line + the worst offenders
//   node scripts/research-lint.mjs --candidate # name the single highest-leverage target (JSON)
//   node scripts/research-lint.mjs --json      # full findings, machine-readable
//   node scripts/research-lint.mjs --update    # rewrite research-budget.json (ratchet: only lower)
//
// Enforced in CI via tests/arch/research-lint.spec.ts. Dependency-free (node built-ins).
// Loud-failure doctrine: an unreadable input is an error, never "fine".
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const EVENTS_DIR = join(ROOT, "docs", "research", "events");
const WEEKS_DIR = join(ROOT, "docs", "research", "weeks");
const BUDGET_FILE = join(ROOT, "research-budget.json");
const SKIP = new Set(["TEMPLATE.md", "README.md"]);

/** The decision-header headings a research document may use. Ledgers use the first. */
export const DECISION_HEADINGS = ["## At a glance", "## The call"];

/** Horizons a single-event decision header must speak to — nearest first. */
export const REQUIRED_HORIZONS = ["today", "this week", "this month", "this quarter"];

/** Confidence grades. Stated confidence drives size (CLAUDE.md); an ungraded call is not a call. */
export const CONFIDENCE_GRADES = ["high", "medium", "med", "low", "none"];

/** The decision header is the above-the-fold budget. Wider than an issue's — it carries a table. */
export const MAX_HEADER_CHARS = 2400;
/**
 * A weekly study's call sheet carries one row per TRACKED NAME, not four horizon rows (#1716), so
 * its header grows with the roster rather than with an author's prose. Advisory either way — this
 * only stops a structural fact from reading as drift.
 */
export const MAX_WEEK_HEADER_CHARS = 8000;
/** One short line per signal, the same ceiling ship.sh checkbody puts on PR summary bullets. */
export const MAX_BULLET = 160;
/** An append-only ledger row is a note to the next session, not an essay. Advisory only. */
export const MAX_LEDGER_ROW = 1200;

const cellsOf = (line) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

/** The decision-header section of a document, or null. */
function decisionHeaderOf(md) {
  for (const heading of DECISION_HEADINGS) {
    const at = md.indexOf(heading);
    if (at === -1) continue;
    const lineEnd = md.indexOf("\n", at);
    const rest = lineEnd === -1 ? "" : md.slice(lineEnd + 1);
    const nextRel = rest.search(/^##\s/m);
    const body = (nextRel === -1 ? rest : rest.slice(0, nextRel)).trim();
    if (body) return body;
  }
  return null;
}

/** A section's body by heading, or null. */
function sectionOf(md, heading) {
  const at = md.indexOf(`## ${heading}`);
  if (at === -1) return null;
  const rest = md.slice(at + heading.length + 3);
  const next = rest.search(/^##\s/m);
  return rest.slice(0, next === -1 ? undefined : next).trim() || null;
}

/**
 * Lint one research document. Returns { problems, notes } — problems fail the gate (the structure
 * a reader and the /research page both depend on), notes inform (prose that has drifted long).
 */
/** The machine-contract lines every research document carries. */
function checkHeaderLines(md, problems) {
  if (!/^#\s+.+/m.test(md)) problems.push("no `# ` title — the document has no name");
  if (!/^\*\*Kind:\*\*/m.test(md)) problems.push("no `**Kind:** … **Date:** … **Impact:**` line");
  if (!/^\*\*Last assessed:\*\*\s*\S/m.test(md))
    problems.push("no `**Last assessed:**` line — the scanner's machine contract");
}

/** The five columns a call sheet must offer. Absent ones are the whole finding. */
function checkColumns(cols, problems) {
  const callAt = cols.includes("call") ? cols.indexOf("call") : cols.indexOf("the call");
  const confAt = cols.indexOf("confidence");
  const wrongAt = cols.findIndex((c) => c.includes("proves") || c.includes("wrong"));
  if (callAt === -1) problems.push("horizon table has no `Call` column — the whole point of it");
  if (confAt === -1)
    problems.push(
      "horizon table has no `Confidence` column — stated confidence drives size (CLAUDE.md)",
    );
  if (wrongAt === -1)
    problems.push(
      "horizon table has no `Proves it wrong` column — every call carries a dated falsifier",
    );
  return { callAt, confAt, wrongAt };
}

/** Strip authoring emphasis — a cell carries text, not markup. */
const plain = (cell) => (cell ?? "").replace(/\*\*/g, "").trim();

/** Every horizon gets an honest answer — but only single-event tables key by horizon. */
function checkHorizons(horizons, problems) {
  if (!horizons.some((h) => h.startsWith("today"))) return;
  for (const want of REQUIRED_HORIZONS) {
    if (!horizons.some((h) => h.startsWith(want)))
      problems.push(`horizon table has no \`${want}\` row`);
  }
}

/** One row: a non-empty call, a stated confidence grade, a falsifier the tape can adjudicate. */
function checkRow(cells, { callAt, confAt, wrongAt }, problems, notes) {
  const label = plain(cells[0]) || "?";
  if (callAt !== -1 && !plain(cells[callAt])) problems.push(`\`${label}\` row states no call`);
  if (confAt !== -1) {
    const grade = plain(cells[confAt]).toLowerCase();
    if (!CONFIDENCE_GRADES.some((g) => grade.includes(g)))
      problems.push(`\`${label}\` row has no stated confidence (${CONFIDENCE_GRADES.join(" · ")})`);
  }
  if (wrongAt !== -1 && !/\d/.test(cells[wrongAt] ?? ""))
    notes.push(`\`${label}\` falsifier names no date or number — the tape cannot adjudicate it`);
}

/** Every horizon answered, every call graded, every falsifier dated. */
function checkRows(data, at, problems, notes) {
  // Multi-name studies key by name, not horizon; the horizon contract applies only to the former.
  checkHorizons(
    data.map((c) => plain(c[0]).toLowerCase()),
    problems,
  );
  for (const cells of data) checkRow(cells, at, problems, notes);
}

/**
 * Blocked-source visibility (#1711). A non-empty `probe-ref.blocked` array is surfaced as an
 * ADVISORY note — never a failure, same doctrine as the rest of this file: the structural fact
 * (a blocked source was recorded) is worth flagging, but recording one is never itself a problem.
 * The prefix downgrade it implies is the author's job (EVENT-RESEARCH.md's Honesty rules), not
 * this gate's to enforce — there is no reliable way to check a prose prefix mechanically.
 */
function checkBlockedSources(md, notes) {
  const match = /<!--\s*probe-ref:\s*(\{[\s\S]*?\})\s*-->/.exec(md);
  if (!match) return;
  let ref;
  try {
    ref = JSON.parse(match[1]);
  } catch {
    return; // malformed probe-ref is event-material-scan's problem, not this gate's
  }
  if (Array.isArray(ref.blocked) && ref.blocked.length > 0) {
    notes.push(
      `note: ${ref.blocked.length} blocked source(s) recorded — prefix must be the secondary's`,
    );
  }
}

/** Prose that has drifted long. Advisory ONLY — never tax the capture habit. */
function collectNotes(md, header, notes, maxHeader = MAX_HEADER_CHARS) {
  if (header.length > maxHeader)
    notes.push(
      `decision header is ${header.length} chars (soft max ${maxHeader}) — the weeds belong in the body`,
    );
  for (const line of header.split("\n")) {
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet && line.trim().length > MAX_BULLET)
      notes.push(`signal over ${MAX_BULLET} chars: "${(bullet[1] ?? "").slice(0, 50)}…"`);
  }
  const ledger = sectionOf(md, "Assessment ledger");
  for (const line of (ledger ?? "").split("\n")) {
    if (line.trim().startsWith("|") && line.length > MAX_LEDGER_ROW)
      notes.push(`assessment row is ${line.length} chars (soft max ${MAX_LEDGER_ROW})`);
  }
}

/**
 * Lint one research document. Returns { problems, notes } — problems fail the gate (the structure
 * a reader and the /research page both depend on), notes inform (prose that has drifted long).
 */
export function lintResearchDoc(md, { name = "doc", maxHeaderChars = MAX_HEADER_CHARS } = {}) {
  const problems = [];
  const notes = [];
  checkHeaderLines(md, problems);
  checkBlockedSources(md, notes);

  const header = decisionHeaderOf(md);
  if (!header) {
    problems.push(
      "no decision header — add `## At a glance` (TL;DR + horizon table + signals). Without it " +
        "the /research page has nothing to promote and a reader lands on the method wall",
    );
    return { name, problems, notes };
  }

  if (!/\*\*TL;DR\.?\*\*/i.test(header))
    problems.push("decision header has no **TL;DR.** — the plain-language verdict comes first");

  const rows = header.split("\n").filter((l) => l.trim().startsWith("|"));
  if (rows.length < 3) {
    problems.push("decision header has no horizon table — a table is scanned, prose is skipped");
  } else {
    const cols = cellsOf(rows[0]).map((c) => c.toLowerCase());
    checkRows(rows.slice(2).map(cellsOf), checkColumns(cols, problems), problems, notes);
  }

  if (!/signals?\s*&(amp;)?\s*conditions/i.test(header))
    problems.push("decision header has no **Signals & conditions** — the buy/sell/hold triggers");

  collectNotes(md, header, notes, maxHeaderChars);
  return { name, problems, notes };
}

function mdFilesIn(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md") && !SKIP.has(f))
    .sort();
}

/**
 * Every gated research document: the event ledgers, plus the weekly studies under
 * `docs/research/weeks/` (#1716 — same `## The call` contract, so the same eye reads both). Each
 * result carries its own path so `--candidate` can point at a real file in either directory.
 */
function auditAll() {
  const dirs = [
    { dir: EVENTS_DIR, prefix: "", maxHeaderChars: MAX_HEADER_CHARS },
    { dir: WEEKS_DIR, prefix: "weeks/", maxHeaderChars: MAX_WEEK_HEADER_CHARS },
  ];
  return dirs.flatMap(({ dir, prefix, maxHeaderChars }) =>
    mdFilesIn(dir).map((f) => ({
      path: join(dir, f),
      ...lintResearchDoc(readFileSync(join(dir, f), "utf8"), {
        name: `${prefix}${f}`,
        maxHeaderChars,
      }),
    })),
  );
}

/**
 * Emit machine-readable output and exit. `console.log` on a PIPE is asynchronous, so a payload past
 * the pipe buffer (~64KB — this audit's `--json` is well past it) is truncated mid-string when
 * `process.exit` follows it. Writing fd 1 synchronously is the fix; the truncation was silent, and
 * every consumer saw it as malformed JSON rather than as a short write.
 */
function emitJson(payload, code) {
  writeFileSync(1, `${JSON.stringify(payload, null, 2)}\n`);
  process.exit(code);
}

if (process.argv.includes("--stdin")) {
  const md = readFileSync(0, "utf8");
  const { problems, notes } = lintResearchDoc(md, { name: "stdin" });
  emitJson({ problems, notes }, problems.length ? 1 : 0);
}

const results = auditAll();
const failing = results.filter((r) => r.problems.length > 0);
const debt = failing.length;

if (process.argv.includes("--json")) {
  emitJson({ debt, results }, 0);
}

if (process.argv.includes("--candidate")) {
  // Worst first: most problems, then the largest document — the highest-leverage single target.
  const ranked = [...failing].sort(
    (a, b) =>
      b.problems.length - a.problems.length ||
      readFileSync(b.path, "utf8").length - readFileSync(a.path, "utf8").length,
  );
  const top = ranked[0];
  emitJson(top ? { target: top.name, problems: top.problems, remaining: debt } : {}, 0);
}

const budget = existsSync(BUDGET_FILE) ? JSON.parse(readFileSync(BUDGET_FILE, "utf8")) : {};

if (process.argv.includes("--update")) {
  const prev = Number.isFinite(budget.uncalledLedgers) ? budget.uncalledLedgers : debt;
  const next = { uncalledLedgers: Math.min(prev, debt) };
  writeFileSync(BUDGET_FILE, `${JSON.stringify(next, null, 2)}\n`);
  console.log(
    `research-budget.json updated — uncalledLedgers=${next.uncalledLedgers} (only lowers).`,
  );
  process.exit(0);
}

console.log("🔬 Research lint — the decision-header contract on ledgers and weekly studies\n");
console.log(`  documents: ${results.length} · without a usable call sheet: ${debt}`);
const noted = results.filter((r) => r.notes.length > 0).length;
console.log(`  advisory notes on ${noted} document(s)\n`);
for (const r of failing.slice(0, 8)) {
  console.log(`  ✗ ${r.name}`);
  for (const p of r.problems.slice(0, 3)) console.log(`      ${p}`);
}
if (failing.length > 8) console.log(`    … and ${failing.length - 8} more.`);

const cap = Number.isFinite(budget.uncalledLedgers) ? budget.uncalledLedgers : debt;
if (debt > cap) {
  console.error(`\n✗ research debt grew: ${debt} > budget ${cap}.`);
  console.error(
    "Fix: give the ledger a decision header per docs/research/events/TEMPLATE.md — a faithful\n" +
      "surfacing of its own stance, never a new claim. Then `node scripts/research-lint.mjs --update`.",
  );
  process.exit(1);
}
console.log(`\n✓ research debt within budget (${debt} ≤ ${cap}).`);
