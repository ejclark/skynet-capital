#!/usr/bin/env node
// LAST-SLICE SCAN — which closed plans still have an open sub-issue? (#4056's "Only the last slice
// closes" loop row.)
//
// WHY. The row asks "does a parent stay open while a sub-issue is open?" and was checked by hand.
// The 2026-10-31 reading (loop census) found three closed plans with open slices — #3811 with
// #4316, #3527 with #4309, #3194 with #4254 and #4257 — that nobody had noticed, because nothing
// listed them. This is the row's command: the push-tick check (`scripts/loop-check.mjs`) runs
// `npm run plans:last-slice` with no arguments and posts what it prints beside the falsifier.
//
// READ-ONLY, REST core bucket, always exits 0: a report, never a gate. One paged read of the
// closed plans (about 70, one page) plus one sub-issue read per plan it flags — none for a clean
// one. A closed plan with no sub-issues at all has nothing to read (plan-close.mjs's rule) and is
// not listed.
import { ensureGhToken, ghRestAll } from "./moneypenny/gh.mjs";
import { subIssueCounts } from "./moneypenny/projects.mjs";

/** The closed plans whose sub-issue count says a slice is still open — pure, from REST issues. */
export function closedWithOpenSlices(issues) {
  return (issues ?? [])
    .filter((i) => i && !i.pull_request && i.state === "closed")
    .map((i) => ({ i, ...subIssueCounts(i) }))
    .filter(({ total, completed }) => total > completed)
    .map(({ i, total, completed }) => ({
      number: i.number,
      title: i.title ?? "",
      closedAt: String(i.closed_at ?? "").slice(0, 10),
      open: total - completed,
      total,
    }));
}

/** A title is free text; a pipe in it would split the row. */
const cell = (s) => String(s ?? "").replace(/\|/g, "\\|");

/** The markdown table, or the one line that says the rule held. `openSlices` maps a plan number
 *  to the open sub-issue numbers read for it. */
export function renderReport(rows, openSlices = {}) {
  if (!rows.length) return "0 closed plans with an open sub-issue — the rule held on this sweep.";
  return [
    `**${rows.length} closed plan${rows.length === 1 ? "" : "s"} with an open sub-issue** — a parent closed before its last slice.`,
    "",
    "| Plan | Title | Closed | Open slices | Which |",
    "|---|---|---|---|---|",
    ...rows.map(
      (r) =>
        `| #${r.number} | ${cell(r.title)} | ${r.closedAt} | ${r.open} of ${r.total} | ${(openSlices[r.number] ?? []).map((n) => `#${n}`).join(", ") || "—"} |`,
    ),
  ].join("\n");
}

function main() {
  ensureGhToken();
  const rows = closedWithOpenSlices(ghRestAll("issues?state=closed&labels=plan"));
  const openSlices = {};
  for (const r of rows) {
    openSlices[r.number] = ghRestAll(`issues/${r.number}/sub_issues`)
      .filter((s) => s.state === "open")
      .map((s) => s.number);
  }
  console.log(renderReport(rows, openSlices));
}

if (import.meta.url === `file://${process.argv[1]}`) main();
