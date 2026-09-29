#!/usr/bin/env node
// READY REPORT — one row per open issue carrying `ready`, with the readiness notes the lint would
// give it (#4056 slice 1). Read-only, REST core bucket, always exits 0: a report, never a gate.
//
// WHO READS IT. Its first run went on #4056 as the baseline over the open ready plans. After that
// it is the check a session runs before flipping `ready` or picking up a ready item, and the input
// #4056 slice 2's scorer uses to test whether flagged items really deliver worse. The same notes
// also reach every filing through issue-lint, so this CLI is the queue-wide view of a check that
// already runs per issue.
//
//   node scripts/ready-report.mjs            # markdown table, open `ready` issues
//   node scripts/ready-report.mjs --label plan   # any label instead of `ready`
//   node scripts/ready-report.mjs --json
import { declaredPrs, readinessNotes, sizeCell } from "./issue-readiness.mjs";
import { ghRestAll } from "./moneypenny/gh.mjs";

/** One report row from a REST issue object — pure, so the table is testable without GitHub. */
export function reportRow(issue) {
  const labels = (issue.labels ?? []).map((l) => (typeof l === "string" ? l : l.name));
  const body = issue.body ?? "";
  return {
    number: issue.number,
    title: issue.title,
    labels,
    prs: declaredPrs(sizeCell(body)),
    subIssues: issue.sub_issues_summary?.total ?? 0,
    notes: readinessNotes({ title: issue.title, body, labels }).map((n) =>
      n.replace(/^readiness: /, "").replace(/ \(#4056\)$/, ""),
    ),
  };
}

const cell = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");

/** The markdown table: clean rows last, so the eye lands on what needs a look. */
export function renderReport(rows, label = "ready") {
  const sorted = [...rows].sort((a, b) => b.notes.length - a.notes.length || a.number - b.number);
  const flagged = sorted.filter((r) => r.notes.length).length;
  const lines = [
    `**${rows.length} open \`${label}\` issues · ${flagged} with readiness notes · ${rows.length - flagged} clean**`,
    "",
    "| Issue | Size | Sub-issues | Readiness notes |",
    "|---|---|---|---|",
  ];
  for (const r of sorted) {
    const size = r.prs === null ? "—" : `~${r.prs} PRs`;
    const notes = r.notes.length ? r.notes.map(cell).join("<br>") : "clean";
    lines.push(`| #${r.number} ${cell(r.title)} | ${size} | ${r.subIssues} | ${notes} |`);
  }
  return lines.join("\n");
}

function main() {
  const argv = process.argv.slice(2);
  const at = argv.indexOf("--label");
  const label = at === -1 ? "ready" : argv[at + 1];
  const issues = ghRestAll(`issues?state=open&labels=${encodeURIComponent(label)}`).filter(
    (i) => !i.pull_request,
  );
  const rows = issues.map(reportRow);
  console.log(argv.includes("--json") ? JSON.stringify(rows, null, 2) : renderReport(rows, label));
}

if (import.meta.url === `file://${process.argv[1]}`) main();
