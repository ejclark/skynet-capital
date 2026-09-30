#!/usr/bin/env node
// research-scorecard.mjs — were our research calls right? (#4061, slice 3 of #3955)
//
// The research lane records outcomes and never grades them: ~1,850 forward-test rows sit in
// docs/research/forward-tests/, a few dozen scored, and nothing asks whether a HIGH-confidence call
// earns its size more often than a MEDIUM one. This counts pass / kill / void / unscoreable / open
// by stated confidence and by horizon, so the "Research scorecard" loop in
// docs/process/LEARNING-LOOP.md has a number to check. Its prediction: high-confidence calls pass
// more often than medium ones — if they don't, confidence is not telling us anything about size.
//
// WHERE CONFIDENCE AND HORIZON COME FROM. A forward-test row carries neither: its columns are
// hypothesis · prediction · kill switch · score by · outcome. The confidence and horizon live on
// the event ledger's call sheet (`| Horizon | Call | Confidence | Why | Proves it wrong |`), and a
// call whose falsifier was registered as a forward test NAMES the id in that row ("registered as
// FT-adp-employment-2026-09-30-1"). That mention is the join. A test no call-sheet row names is
// counted, but under `unlinked` — it was registered from the body of a study, not as a call's
// falsifier, and inventing a grade for it would be the exact dishonesty this card exists to catch.
// Measured 2026-09-30: 472 of 1,840 ids are named by a call-sheet row.
//
// A test named by more than one row is attributed to the FIRST (the nearest horizon — call sheets
// run today → this quarter) and counted in `multiLinked`, so the double-attribution is visible
// rather than silently doubling the n.
//
// PURE TEXT, like forward-test-pending.mjs: no network, no token, no `npm ci`. Grades calls; never
// changes sizing (#3955 constraint — paper-only, educational).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Table cells, split on UNESCAPED pipes only (`\|` is literal text in the fragments). */
const cells = (line) =>
  line
    .split(/(?<!\\)\|/)
    .slice(1, -1)
    .map((c) => c.trim());

const plain = (s) => (s ?? "").replace(/[*_`]/g, "").trim();
const LEADING_DATE = /^(\d{4}-\d{2}-\d{2})\b/;
const FT_ROW = /^\|\s*FT-/;
const FT_ID = /^(FT-\S+)/;
const OUTCOME_AT = 5;
const FT_MENTION = /FT-[\w.-]*\w/g;

export const VERDICTS = ["pass", "kill", "void", "unscoreable", "open", "unread"];
export const HORIZONS = ["today", "this week", "this month", "this quarter", "other"];
export const GRADES = ["high", "medium-high", "medium", "low", "none", "ungraded"];

/** One Outcome cell → a verdict. The spellings in use (counted 2026-09-30): `—`, `_open_`, empty,
 *  `**pass** — …`, `PASSED.`, `CONFIRMED 2026-…`, `SCORED 2026-09-10 — FAIL`, `killed`, `VOID`,
 *  `unscoreable — …`, `not scoreable`, `unscored — fill at close-out…`. Earliest keyword wins,
 *  so "SCORED … — PASS" reads as a pass and "pass … the kill switch did not fire" stays one.
 *  A cell that says something but matches nothing is `unread` — shown, never guessed. */
export function verdictOf(outcome) {
  const text = plain(outcome)
    .replace(/^[—\-\s(]+/, "")
    .toLowerCase();
  if (text === "") return "open";
  if (/^(unscoreable|not scoreable)/.test(text)) return "unscoreable";
  if (/^(open|unscored)/.test(text)) return "open";
  // A kill by retirement ("killed — this id superseded by …") or an UNTESTED miss says nothing
  // about whether the call was right; counting it as a kill would charge the grade for paperwork.
  if (/^untested/.test(text) || /\bsuperseded\b/.test(text.slice(0, 80))) return "void";
  const words = [
    [/\b(pass|passed|passes|confirmed)\b/, "pass"],
    [/\b(kill|killed|fail|failed)\b/, "kill"],
    [/\bvoid\b/, "void"],
    [/\b(unscoreable|not scoreable)\b/, "unscoreable"],
  ];
  let best = null;
  for (const [re, verdict] of words) {
    const at = text.search(re);
    if (at !== -1 && (best === null || at < best.at)) best = { at, verdict };
  }
  return best?.verdict ?? "unread";
}

/** Every forward-test row in one fragment, as `{ id, verdict }`. Same row rule as
 *  forward-test-pending.mjs: the LAST cell leading with a date is the score-by, and everything
 *  after it is the outcome. A score-by that doesn't lead with a date (`~2026-08-28`, `2027-10`,
 *  `4 weeks after P1 merges`) falls back to the header's position — every fragment carries
 *  `| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |`, so the outcome is cell 5
 *  onward (joined: a long outcome can carry an unescaped pipe). Never dropped: the total must
 *  match the register. */
export function parseForwardTests(md) {
  const rows = [];
  for (const line of md.split("\n")) {
    if (!FT_ROW.test(line)) continue;
    const row = cells(line);
    const id = row[0].match(FT_ID)?.[1] ?? row[0];
    let at = -1;
    for (let i = row.length - 1; i >= 0; i--)
      if (LEADING_DATE.test(row[i])) {
        at = i;
        break;
      }
    const outcome = at === -1 ? row.slice(OUTCOME_AT).join(" ") : row.slice(at + 1).join(" ");
    rows.push({ id, verdict: verdictOf(outcome) });
  }
  return rows;
}

export function horizonOf(cell) {
  const h = plain(cell).toLowerCase();
  return HORIZONS.find((want) => want !== "other" && h.startsWith(want)) ?? "other";
}

/** "High (was Medium)" is high; "Medium-high" is its own grade — merging it either way would
 *  move the one boundary this card exists to test. */
export function gradeOf(cell) {
  const g = plain(cell).toLowerCase();
  if (/^med(ium)?[- ]high/.test(g)) return "medium-high";
  if (/^high/.test(g)) return "high";
  if (/^med(ium)?\b/.test(g)) return "medium";
  if (/^low/.test(g)) return "low";
  if (/^none/.test(g)) return "none";
  return "ungraded";
}

/** Every forward-test id a ledger's call sheet names, as `{ id, horizon, grade }` in document
 *  order. A call sheet is any table whose header has both a `Horizon` and a `Confidence` column;
 *  columns are found by header name, never by index. */
export function parseCallLinks(md) {
  const links = [];
  let cols = null;
  for (const line of md.split("\n")) {
    if (!line.startsWith("|")) {
      cols = null;
      continue;
    }
    const row = cells(line);
    if (!cols) {
      const names = row.map((c) => plain(c).toLowerCase());
      const horizon = names.indexOf("horizon");
      const confidence = names.indexOf("confidence");
      cols = horizon !== -1 && confidence !== -1 ? { horizon, confidence } : { skip: true };
      continue;
    }
    if (cols.skip || /^\|[\s:|-]+\|?$/.test(line.trim())) continue;
    for (const id of new Set(line.match(FT_MENTION) ?? []))
      links.push({
        id,
        horizon: horizonOf(row[cols.horizon]),
        grade: gradeOf(row[cols.confidence]),
      });
  }
  return links;
}

const emptyCounts = () => Object.fromEntries(VERDICTS.map((v) => [v, 0]));

/** Fold tests + call links into the card. Pure: the CLI reads files, this only counts. */
export function scorecard({ tests, links }) {
  const known = new Set(tests.map((t) => t.id));
  const first = new Map();
  const seen = new Map();
  for (const link of links) {
    if (!known.has(link.id)) continue;
    seen.set(link.id, (seen.get(link.id) ?? 0) + 1);
    if (!first.has(link.id)) first.set(link.id, link);
  }
  const byGrade = Object.fromEntries(GRADES.map((g) => [g, emptyCounts()]));
  const byHorizon = Object.fromEntries(HORIZONS.map((h) => [h, emptyCounts()]));
  const unlinked = emptyCounts();
  const all = emptyCounts();
  let linked = 0;
  for (const t of tests) {
    all[t.verdict]++;
    const link = first.get(t.id);
    if (!link) {
      unlinked[t.verdict]++;
      continue;
    }
    linked++;
    byGrade[link.grade][t.verdict]++;
    byHorizon[link.horizon][t.verdict]++;
  }
  const multiLinked = [...seen.values()].filter((n) => n > 1).length;
  const duplicateIds = tests.length - known.size;
  return {
    total: tests.length,
    linked,
    multiLinked,
    duplicateIds,
    all,
    unlinked,
    byGrade,
    byHorizon,
  };
}

/** pass ÷ (pass + kill) — void, unscoreable and open rows test nothing, so they never dilute it. */
export function passRate(c) {
  const decided = c.pass + c.kill;
  return decided === 0 ? null : c.pass / decided;
}

const pct = (r) => (r === null ? "—" : `${Math.round(r * 100)}%`);
const sum = (c) => VERDICTS.reduce((n, v) => n + c[v], 0);

function table(title, groups) {
  const lines = [
    `| ${title} | Pass | Kill | Pass rate | Void | Unscoreable | Open | Unread | n |`,
    "|---|---|---|---|---|---|---|---|---|",
  ];
  for (const [name, c] of groups) {
    if (sum(c) === 0) continue;
    lines.push(
      `| ${name} | ${c.pass} | ${c.kill} | ${pct(passRate(c))} | ${c.void} | ${c.unscoreable} | ${c.open} | ${c.unread} | ${sum(c)} |`,
    );
  }
  return lines.join("\n");
}

export function renderMarkdown(card, today) {
  return [
    `**Research scorecard — ${today}.** ${card.total} forward tests; ${card.linked} are a call's registered falsifier (graded by that call's confidence and horizon), ${card.total - card.linked} unlinked. Pass rate = pass ÷ (pass + kill).`,
    "",
    table(
      "Confidence",
      GRADES.map((g) => [g, card.byGrade[g]]),
    ),
    "",
    table(
      "Horizon",
      HORIZONS.map((h) => [h, card.byHorizon[h]]),
    ),
    "",
    table("All", [
      ["linked", Object.fromEntries(VERDICTS.map((v) => [v, card.all[v] - card.unlinked[v]]))],
      ["unlinked", card.unlinked],
      ["all", card.all],
    ]),
    "",
    `${card.multiLinked} test(s) are named by more than one call row; each counts once, under the first (nearest) horizon. ${card.duplicateIds} row(s) reuse an id already in the register (legacy); each row counts.`,
  ].join("\n");
}

/** Read the committed register + ledgers. A missing directory is loud, never "no calls". */
export function readCorpus(root = ROOT) {
  const ftDir = join(root, "docs", "research", "forward-tests");
  const evDir = join(root, "docs", "research", "events");
  for (const dir of [ftDir, evDir])
    if (!existsSync(dir))
      throw new Error(`research-scorecard: cannot read ${dir} — refusing to guess.`);
  const md = (dir) =>
    readdirSync(dir)
      .filter((f) => f.endsWith(".md"))
      .sort()
      .map((f) => readFileSync(join(dir, f), "utf8"));
  return {
    tests: md(ftDir).flatMap(parseForwardTests),
    links: md(evDir).flatMap(parseCallLinks),
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const card = scorecard(readCorpus());
  if (process.argv.includes("--json")) console.log(JSON.stringify(card, null, 2));
  else console.log(renderMarkdown(card, new Date().toISOString().slice(0, 10)));
}
