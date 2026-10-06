#!/usr/bin/env node
// bottleneck-baseline.mjs — does each bottleneck issue carry the number its fix should move?
// (#4063, slice 5 of #3955)
//
// The `bottleneck` label is for a *measured* constraint (CLAUDE.md → "A bottleneck surfaced by
// fan-out"), but the only outcome the research lane ever recorded was "call sheet posted": 35
// issues, and not one said afterwards whether the fix moved anything. This is the before/after
// loop in docs/process/LEARNING-LOOP.md. Its prediction: each fix moves the number its issue named.
//
// THE CONTRACT, two lines in the issue body (docs/ISSUES.md → Bottleneck issues):
//   **Before:** <number, unit> — <date>, <how it was measured>     required from filing
//   **After:**  <number, unit> — <date>, <how it was measured>     required by close
// Either line may instead say `unmeasured — <why>`: an honest "we could not count this" is an
// answer; a missing line is not. issue-lint.mjs refuses a `bottleneck`-labelled body with no Before
// line (readBaseline, below). This report checks the After half, which only exists at close.
//
// Advisory, exits 0: it names the gaps, it never blocks a lane (docs/COACHES.md — a gate is for a
// constraint; this is a score). Issues filed before the contract are counted as legacy, never
// silently dropped, so the report cannot read "all clean" by ignoring the old ones.
//
//   node scripts/bottleneck-baseline.mjs                  # live report (GH_TOKEN/GITHUB_TOKEN, REST)
//   node scripts/bottleneck-baseline.mjs --fixture f.json # score a saved issue list, no network
//   node scripts/bottleneck-baseline.mjs --json           # the report as JSON
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ghRestAll } from "./moneypenny/gh.mjs";

/** The first full day the Before line is required (#4063 landed 2026-09-30). Earlier is legacy: reported,
 *  not counted as a miss — it was filed under a contract that did not ask for the number. */
export const CONTRACT_DATE = "2026-10-01";

/** A value counts when it carries a digit (a measurement) or says `unmeasured` (with its why). */
const ANSWERED = /\d|\bunmeasured\b/i;

/** `**Before:**` / `**After:**` at the start of a line (bullets and a leading table pipe allowed),
 *  its value to the end of that line. `null` when the line is absent or its value answers nothing
 *  ("TBD", blank) — a placeholder is the same miss as no line, only harder to spot. */
function fieldValue(body, name) {
  const m = new RegExp(`^[\\s>|*-]*\\*\\*${name}:?\\*\\*:?[ \\t]*(.*)$`, "im").exec(body ?? "");
  if (!m) return null;
  const value = m[1].replace(/\|\s*$/, "").trim();
  return ANSWERED.test(value) ? value : null;
}

/** `{ before, after }`, each the line's value or `null`. */
export function readBaseline(body) {
  return { before: fieldValue(body, "Before"), after: fieldValue(body, "After") };
}

/** GitHub issue rows → the report. Pure: a spec feeds it rows, the CLI feeds it the API. */
export function baselineReport(issues, { contractDate = CONTRACT_DATE } = {}) {
  const rows = issues
    .filter((i) => !i.pull_request)
    .map((i) => ({
      number: i.number,
      title: i.title ?? "",
      state: i.state === "closed" ? "closed" : "open",
      legacy: (i.created_at ?? "").slice(0, 10) < contractDate,
      ...readBaseline(i.body),
    }));
  const pick = (f) => rows.filter(f).map((r) => r.number);
  const current = rows.filter((r) => !r.legacy);
  return {
    total: rows.length,
    legacy: rows.filter((r) => r.legacy).length,
    // Owed now: a post-contract issue with no Before, or a post-contract close with no After.
    missingBefore: pick((r) => !(r.legacy || r.before)),
    closedMissingAfter: pick((r) => !r.legacy && r.state === "closed" && !r.after),
    // The score the loop reads: closed issues carrying both numbers, whatever their filing date.
    scored: pick((r) => r.state === "closed" && r.before && r.after),
    withBefore: rows.filter((r) => r.before).length,
    current: current.length,
    rows,
  };
}

export function renderReport(report) {
  const list = (ns) => (ns.length ? ns.map((n) => `#${n}`).join(", ") : "none");
  return [
    `bottleneck baseline — ${report.total} issues labelled \`bottleneck\` (${report.legacy} filed before the ${CONTRACT_DATE} contract).`,
    `  carry a Before number   ${report.withBefore} of ${report.total}`,
    `  scored (closed, before + after)   ${list(report.scored)}`,
    `  owed a Before line      ${list(report.missingBefore)}`,
    `  closed with no After    ${list(report.closedMissingAfter)}`,
    "Contract: docs/ISSUES.md → Bottleneck issues. A line may say `unmeasured — <why>`.",
  ].join("\n");
}

function main(argv) {
  const at = argv.indexOf("--fixture");
  const issues =
    at !== -1
      ? JSON.parse(readFileSync(argv[at + 1], "utf8"))
      : ghRestAll("issues?labels=bottleneck&state=all");
  const report = baselineReport(issues);
  if (argv.includes("--json")) console.log(JSON.stringify(report, null, 2));
  else console.log(renderReport(report));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main(process.argv.slice(2));
}
