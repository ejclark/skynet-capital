// Loop freshness — check ⑤ of scripts/config-audit.mjs. Every browser loop over the member
// journeys (the crawl, the judge pass over its frames, the coverage join) and the market-scenario
// headline runs only when someone remembers to run it (the loop census, 2026-10-18), so the daily
// digest reads what each one last WROTE and says how old it is. File reads only: no browser, no
// subprocess, no crawl re-run. Each finding names the command that clears it, and all of it is
// lane work: the digest folds this section into Noise absorbed, never Needs you.
//
// Honest degradation (docs/grind/honest-degradation.instructions.md): an absent input is a named
// skip (`·`), the same as check ③'s missing duel-log; an input that is present but unreadable is
// UNKNOWN and counts toward config-audit's exit 2 — never a finding the parse manufactured.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const STALE_AFTER_DAYS = 14;
const LEDGER = "docs/members/friction-ledger.md"; // scripts/crawl/ledger.mjs writes its header
const COVERAGE = "docs/members/coverage.md"; // scripts/crawl/coverage.mjs renderMarkdown
const BUDGET = "journey-coverage-budget.json"; // the file scripts/crawl/coverage-budget.mjs gates on
const JOURNEYS = "e2e/journeys";
const SCENARIOS_DOC = "docs/members/scenarios.md";
const SCENARIOS_DIR = "tests/scenarios";
const JUDGE = "`/grind` over docs/grind/journey-judge.instructions.md (one item per member)";
const DAY_MS = 86_400_000;

/** The ledger header's run date and walked members, and the rows the judge has not graded. */
export function parseLedger(text) {
  const head = text.match(/^_Run (\d{4}-\d{2}-\d{2})\b.*Members: ([^_]*?)\.?_\s*$/m);
  if (!head) return null;
  const members = head[2].split("·").map((m) => m.trim());
  const pending = text
    .split("\n")
    .filter((l) => l.startsWith("| ") && /\|\s*pending \(grind\)\s*\|\s*$/.test(l)).length;
  return { date: head[1], members: members.filter(Boolean), pending };
}

/** coverage.md's headline gap count and its unjudged · stale line (printed only when non-zero). */
export function parseCoverage(text) {
  const head = text.match(/^\*\*\d+ of \d+ living rows covered at phone · (\d+) gaps · /m);
  if (!head) return null;
  const off = text.match(/^> \*\*(\d+) unjudged · (\d+) stale\*\*/m);
  return { gaps: Number(head[1]), unjudged: Number(off?.[1] ?? 0), stale: Number(off?.[2] ?? 0) };
}

/** scenarios.md's "**N acceptance lines, M of them known gaps**" — M is the `it.fails` count. */
export function parseScenarioHeadline(text) {
  const m = text.match(/\*\*(\d+) acceptance lines?, (\d+) of them known gaps?\*\*/);
  return m ? { lines: Number(m[1]), gaps: Number(m[2]) } : null;
}

export const countItFails = (src) => (src.match(/\bit\.fails\(/g) ?? []).length;

function journeyMembers(root) {
  const dir = join(root, JOURNEYS);
  if (!existsSync(dir)) return null;
  return readdirSync(dir)
    .filter((f) => f.endsWith(".journey.json"))
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")).member);
}

/** The report a check writes into: findings (`•`), named skips (`·`), UNKNOWNs counted for exit 2. */
function report(root) {
  const r = { root, lines: [], unknown: 0 };
  r.read = (rel) => (existsSync(join(root, rel)) ? readFileSync(join(root, rel), "utf8") : null);
  r.say = (line) => r.lines.push(`  ${line}`);
  r.skip = (rel, what) => r.say(`· ${rel} absent — ${what} skipped.`);
  r.cannot = (rel, why) => {
    r.unknown++;
    r.say(`• UNKNOWN — ${rel} ${why}; cannot tell a fresh loop from a stale one.`);
  };
  return r;
}

/** The crawl: how old its ledger is, which journey members it never walked, what the judge left. */
function crawlLoop(r, today) {
  const text = r.read(LEDGER);
  if (text === null) return r.skip(LEDGER, "the crawl's age, member and judge checks");
  const ledger = parseLedger(text);
  if (!ledger) return r.cannot(LEDGER, "has no `_Run <date> … Members: …_` header");
  const age = Math.floor((Date.parse(today) - Date.parse(ledger.date)) / DAY_MS);
  r.say(
    age > STALE_AFTER_DAYS
      ? `• the crawl last ran ${ledger.date}, ${age} days ago (over ${STALE_AFTER_DAYS}). Clear: \`npm run crawl\` (rewrites ${LEDGER}).`
      : `· the crawl last ran ${ledger.date}, ${age} days ago.`,
  );
  let members = [];
  try {
    members = journeyMembers(r.root);
  } catch (err) {
    r.cannot(JOURNEYS, `holds a journey file that does not parse (${err.message})`);
  }
  if (members === null) r.skip(JOURNEYS, "the crawl-entry check");
  const unwalked = (members ?? []).filter((m) => !ledger.members.includes(m));
  if (unwalked.length) {
    r.say(
      `• ${unwalked.length} journey member(s) with no crawl entry: ${unwalked.join(" · ")}. Clear: \`npm run crawl\`.`,
    );
  }
  if (ledger.pending) {
    r.say(
      `• ${ledger.pending} ledger row(s) the judge never graded ("pending (grind)"). Clear: ${JUDGE}.`,
    );
  }
}

const budgetOf = (text) => {
  try {
    return JSON.parse(text).gaps;
  } catch {
    return undefined;
  }
};

/** The coverage join, as `npm run crawl:coverage` last wrote it, against the gate's budget. */
function coverageLoop(r) {
  const text = r.read(COVERAGE);
  const budgetText = r.read(BUDGET);
  if (text === null || budgetText === null) {
    return r.skip(text === null ? COVERAGE : BUDGET, "the coverage gap and stale-triage checks");
  }
  const cov = parseCoverage(text);
  const budget = budgetOf(budgetText);
  if (!cov) return r.cannot(COVERAGE, "has no `**… · N gaps · …**` headline");
  if (!Number.isInteger(budget)) return r.cannot(BUDGET, "has no integer `gaps`");
  if (cov.gaps > budget) {
    r.say(
      `• ${cov.gaps} phone coverage gap(s), budget ${budget} (as \`npm run crawl:coverage\` last wrote ${COVERAGE}). Clear: a phone journey step per gap, or a re-judge in docs/members/triage.json, then \`npm run crawl:coverage\`.`,
    );
  } else if (cov.gaps < budget) {
    r.say(
      `• coverage gaps fell to ${cov.gaps}, budget ${budget}. Clear: \`node scripts/crawl/coverage-budget.mjs --update\` (locks the ratchet).`,
    );
  }
  if (cov.stale + cov.unjudged > 0) {
    r.say(
      `• ${cov.stale} stale · ${cov.unjudged} unjudged triage row(s) in ${COVERAGE}. Clear: fix docs/members/triage.json, then \`npm run crawl:coverage\`.`,
    );
  }
}

/** The scenario headline's known-gap count against the `it.fails` the specs actually hold. */
function scenarioLoop(r) {
  const text = r.read(SCENARIOS_DOC);
  const specDir = join(r.root, SCENARIOS_DIR);
  if (text === null || !existsSync(specDir)) {
    return r.skip(text === null ? SCENARIOS_DOC : SCENARIOS_DIR, "the scenario headline check");
  }
  const head = parseScenarioHeadline(text);
  if (!head)
    return r.cannot(SCENARIOS_DOC, "has no `**N acceptance lines, M of them known gaps**` line");
  const fails = readdirSync(specDir)
    .filter((f) => f.endsWith(".spec.ts"))
    .reduce((n, f) => n + countItFails(readFileSync(join(specDir, f), "utf8")), 0);
  if (fails !== head.gaps) {
    r.say(
      `• ${fails} \`it.fails\` in ${SCENARIOS_DIR}/*.spec.ts, but ${SCENARIOS_DOC}'s headline says ${head.gaps} known gaps. Clear: recount with \`grep -c "it.fails(" ${SCENARIOS_DIR}/*.spec.ts\` and correct the headline.`,
    );
  }
}

/** @returns {{lines: string[], unknown: number}} the section's lines; unknown → exit 2 */
export function loopFreshness({ root, today }) {
  const r = report(root);
  crawlLoop(r, today);
  coverageLoop(r);
  scenarioLoop(r);
  return { lines: r.lines, unknown: r.unknown };
}
