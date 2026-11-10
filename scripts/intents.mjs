#!/usr/bin/env node
// Declared intents — the one reader of docs/intents/*.md (the format and its rules live in that
// folder's README).
//
// WHY THIS EXISTS. Eight dated intents in Eric's words in the 30 days to 2026-11-01 each found a
// home within hours (a research doc, a plan issue, a comment on the dial), but no reader of the
// autonomous system could see one, and only the three dial moves carried a lapse date. This file is
// the read side: pure, no API call, the same shape as scripts/conviction-proposals.mjs (a folder of
// records, one token per record) with the dial's lapse rule (`until` holds through the end of that
// day in UTC, scripts/moneypenny/work-mode.mjs).
//
//   node scripts/intents.mjs [--today=YYYY-MM-DD]        → table: slug · kind · until · state · steers
//   node scripts/intents.mjs --json [--today]            → every record with its state
//   node scripts/intents.mjs --event=<event-id> [--today] → active slugs naming this event ([] = none)
//   node scripts/intents.mjs --issue=<n> [--today]       → active slugs naming this issue
//   node scripts/intents.mjs --reserve [--today]         → weekly points held back today, or null
//
// LOUD ON A BAD RECORD. A record with no Until, an unknown kind, an unreadable steer or unsourced
// words throws, because a reader that took "malformed" for "none" would silently drop a date he
// named. tests/scripts/intents.spec.ts parses the real folder, so it goes red on the PR first.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

export const INTENTS_DIR = process.env.INTENTS_DIR ?? join(process.cwd(), "docs", "intents");
const KINDS = ["study", "reservation", "objective"];

const field = (text, name) =>
  (new RegExp(`\\*\\*${name}:\\*\\*\\s*([^·\\n]*)`).exec(text)?.[1] ?? "").trim();
const cell = (text, name) =>
  (
    new RegExp(`^\\|\\s*\\*\\*${name}\\*\\*\\s*\\|\\s*(.+?)\\s*\\|\\s*$`, "m").exec(text)?.[1] ?? ""
  ).trim();

/** The first instant AFTER the named day, in UTC ms (the dial's rule), or null when it is not a
 *  real date: `2026-02-31` would otherwise roll into March and lapse on the wrong day. */
export function endOfDayUtc(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? "");
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
  const start = new Date(Date.UTC(y, mo, d));
  if (start.getUTCMonth() !== mo || start.getUTCDate() !== d) return null;
  return Date.UTC(y, mo, d + 1);
}

// Words from a private chat are paraphrased with their date; verbatim only from a public surface
// (docs/intents/README.md). The source is stated in the record so a bare quote cannot pass as either.
const SAID = /^\*\*Said:\*\*\s*((?:paraphrased \d{4}-\d{2}-\d{2}|verbatim from #\d+):\s*\S.*)$/m;

/** Parse one record. Pure. Throws on anything a reader could otherwise mistake for "no intent". */
export function parseIntent(slug, text) {
  const until = field(text, "Until");
  const untilEndMs = endOfDayUtc(until);
  if (untilEndMs === null) throw new Error(`intents: ${slug} has no readable **Until:** date`);
  // A reader counts ledger rows from this date; an empty one would count the whole history.
  const stated = field(text, "Stated");
  if (endOfDayUtc(stated) === null) {
    throw new Error(`intents: ${slug} has no readable **Stated:** date`);
  }
  const kind = field(text, "Kind").toLowerCase();
  if (!KINDS.includes(kind)) {
    throw new Error(`intents: ${slug} **Kind:** must be one of ${KINDS.join(" | ")}`);
  }
  const said = SAID.exec(text)?.[1];
  if (!said) {
    throw new Error(
      `intents: ${slug} **Said:** must open "paraphrased YYYY-MM-DD:" or "verbatim from #<n>:"`,
    );
  }
  const steers = cell(text, "Steers")
    .split("·")
    .map((s) => s.replace(/`/g, "").trim())
    .filter(Boolean);
  if (steers.length === 0) throw new Error(`intents: ${slug} has no **Steers** row to read`);
  const events = [];
  const issues = [];
  let reserve = null;
  for (const steer of steers) {
    const points = /^reserve:(\d+)$/.exec(steer);
    if (points) reserve = Number(points[1]);
    else if (/^#\d+$/.test(steer)) issues.push(Number(steer.slice(1)));
    else if (/^[a-z0-9-]+$/.test(steer)) events.push(steer);
    else throw new Error(`intents: ${slug} has a steer it cannot read: "${steer}"`);
  }
  return {
    slug,
    kind,
    stated,
    until,
    untilEndMs,
    said,
    outcome: cell(text, "Outcome"),
    check: cell(text, "Check"),
    steers,
    events,
    issues,
    reserve,
    closed: /^## Outcome\s*\n\s*\S/m.test(text),
  };
}

// The hard line on a public repo: a study names symbols and events, never what he holds. These are
// the shapes that line gets crossed in; the spec runs them over every record on disk.
export const POSITION_SHAPES = [
  [/\bprimary position\b/i, "a position"],
  [/\bpositions?\s+in\b/i, "a position"],
  [/\b(?:holds?|holding|owns?|long|short)\s+\d/i, "a position"],
  [/\b(?:he|eric|i)\s+(?:holds?|owns?|sold|bought|(?:is|am)\s+(?:long|short))\b/i, "a position"],
  [/\b\d[\d,]*\s*(?:shares?|contracts?|lots?)\b/i, "a size"],
  [/\bstrikes?\b/i, "a strike"],
  [/\b\d+(?:\.\d+)?\s?[CP]\b/, "a strike"],
  [/\$\s?\d/, "a dollar amount"],
];
const PRIVATE_SHAPES = [
  [/\bmy\b/i, "first-person words (his words are paraphrased)"],
  ...POSITION_SHAPES,
  [/\baccounts?\b/i, "an account"],
];

/** What in this record's text must not be public, by name; [] when it is clean. */
export function publicHalfProblems(text) {
  return PRIVATE_SHAPES.filter(([shape]) => shape.test(text)).map(([, what]) => what);
}

/** active | lapsed | closed, at `now`. A written Outcome is final, whatever the date. */
export function stateOf(intent, now = Date.now()) {
  if (intent.closed) return "closed";
  return now >= intent.untilEndMs ? "lapsed" : "active";
}

/** Every record in the folder. A missing folder is no records, not an error. */
export function loadIntents(dir = INTENTS_DIR) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .sort()
    .map((f) => parseIntent(basename(f, ".md"), readFileSync(join(dir, f), "utf8")));
}

export const activeIntents = (intents, now) => intents.filter((i) => stateOf(i, now) === "active");
export const forEvent = (intents, id, now) =>
  activeIntents(intents, now).filter((i) => i.events.includes(id));
export const forIssue = (intents, n, now) =>
  activeIntents(intents, now).filter((i) => i.issues.includes(n));

/** The most any active record holds back today; null when none does. */
export function reserveToday(intents, now) {
  const held = activeIntents(intents, now)
    .map((i) => i.reserve)
    .filter((r) => r !== null);
  return held.length ? Math.max(...held) : null;
}

function main() {
  const arg = (name) => {
    const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
    return hit ? hit.slice(name.length + 3) : undefined;
  };
  const has = (name) => process.argv.includes(`--${name}`);
  const today = arg("today");
  // A named day reads as its last instant, so --today=<Until> is still active. A bad date must
  // throw: a null end minus one is a time before every lapse and would read each record as active.
  const end = today === undefined ? null : endOfDayUtc(today);
  if (today !== undefined && end === null) {
    throw new Error(`intents: --today=${today} is not a real date`);
  }
  const now = end === null ? Date.now() : end - 1;
  const all = loadIntents();
  const print = (value, indent) => console.log(JSON.stringify(value, null, indent));
  // A flag with an unreadable value must throw: [] would answer "no intent names this".
  const event = arg("event");
  if (event !== undefined) {
    if (!event) throw new Error("intents: --event= needs an event id");
    return print(forEvent(all, event, now).map((i) => i.slug));
  }
  const issue = arg("issue");
  if (issue !== undefined) {
    if (!/^\d+$/.test(issue)) throw new Error(`intents: --issue=${issue} is not an issue number`);
    return print(forIssue(all, Number(issue), now).map((i) => i.slug));
  }
  if (has("reserve")) return print(reserveToday(all, now));
  const rows = all.map((i) => ({ ...i, state: stateOf(i, now) }));
  if (has("json")) return print(rows, 2);
  console.log("| intent | kind | until | state | steers |\n|---|---|---|---|---|");
  for (const r of rows) {
    console.log(`| ${r.slug} | ${r.kind} | ${r.until} | ${r.state} | ${r.steers.join(" · ")} |`);
  }
}

if (process.argv[1]?.endsWith("intents.mjs")) {
  try {
    main();
  } catch (err) {
    // No stack, no stdout: a caller reading stdout must see nothing rather than a false answer.
    console.error(err.message);
    process.exit(1);
  }
}
