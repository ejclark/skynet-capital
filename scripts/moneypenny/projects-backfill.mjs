#!/usr/bin/env node
// PROJECTS V2 BACKFILL — #3818 consolidation pass (2026-09-27). One-time (safe to re-run): walks
// every open issue, adds the real backlog candidates to the board with Status set, and applies
// Horizon for whatever this pass has already triaged in `projects-horizons.json`.
//
// Needs GH_TOKEN = Eric's PROJECTS_PAT, same as projects-sync.mjs (which supplies the per-issue
// glue this script reuses) and projects-setup.mjs. GraphQL is blocked from interactive Claude
// Code sessions, so — like both of those — this script's real IO could not be exercised while
// authoring it; the first `workflow_dispatch` run is the test.
//
// `projects-horizons.json` is a plain issue-number -> "Now"|"Next"|"Later" map, hand-triaged (not
// mechanical — Horizon is a sequencing judgment, same footing as Priority, which nothing here
// ever sets automatically either). An issue missing from the map still gets added with Status
// set; its Horizon is left for a later triage pass rather than guessed.
//
// #4183 — THIS SCRIPT IS THE ONE THAT DRAINED THE HOUR, and the three things below are why it
// can't again. It calls `syncIssue` once per open issue, and `syncIssue` used to re-read the board's
// whole item list plus the project and its fields on every call: ~100 GraphQL points each, ninety
// times, which spent Eric's entire 5,000-point hour in 5m41s on 2026-09-30 and took every
// `sync project status` run behind it down with it (#4183 was filed by one of those bystanders).
//   1. ONE shared `createBoardContext()` for the whole sweep — the three board-wide reads happen
//      once, not once per issue. This is the fix; the other two are nets under it.
//   2. A free pre-flight (`ghRateLimit` + `planBoardSweep`): refuse to start a sweep the remaining
//      budget cannot finish, rather than half-writing the board and finding out at issue 40.
//   3. ABORT on exhaustion, never grind on. The old loop caught every error per issue and kept
//      going, so one drained quota produced fifty identical "FAILED — API rate limit exceeded"
//      lines and spent two more points apiece proving it.
//
//   GH_TOKEN=<eric's PAT> node scripts/moneypenny/projects-backfill.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ghRateLimit, ghRestAll } from "./gh.mjs";
import { isBacklogCandidate, isRateLimitExhausted, planBoardSweep } from "./projects.mjs";
import { createBoardContext, syncIssue } from "./projects-sync.mjs";

const HORIZONS_PATH = fileURLToPath(new URL("./projects-horizons.json", import.meta.url));

function main() {
  const horizons = JSON.parse(readFileSync(HORIZONS_PATH, "utf8"));
  const issues = ghRestAll("issues?state=open").filter((i) => !("pull_request" in i));
  const candidates = issues.filter((i) =>
    isBacklogCandidate({ labels: (i.labels ?? []).map((l) => l.name) }),
  );

  // The budget read is free (`GET /rate_limit` counts against nothing), so this pre-flight is pure
  // upside — and its `reason` is logged on the GO path too, which is how the next run's log carries
  // the budget it actually saw instead of leaving a future session to infer it from a stack trace.
  const { graphql } = ghRateLimit();
  const plan = planBoardSweep({
    issueCount: candidates.length,
    remaining: graphql?.remaining,
    reset: graphql?.reset,
  });
  console.log(`budget check: ${plan.reason}`);
  if (!plan.ok) process.exit(1);

  const board = createBoardContext();
  let added = 0;
  const skipped = issues.length - candidates.length;
  const failures = [];

  for (const issue of candidates) {
    const horizon = horizons[String(issue.number)];
    try {
      const result = syncIssue(String(issue.number), { horizon, board });
      console.log(
        `#${issue.number}: Status="${result.status}"${result.horizon ? ` Horizon="${result.horizon}"` : " (no Horizon triaged yet)"}`,
      );
      added++;
    } catch (err) {
      console.error(`#${issue.number}: FAILED — ${err.message}`);
      failures.push({ number: issue.number, message: err.message });
      // One drained quota is the whole sweep's problem, not this issue's: every remaining issue
      // would fail identically, and each attempt spends more of a budget that is already gone.
      if (isRateLimitExhausted(err?.message)) {
        console.error(
          `aborting the sweep after #${issue.number} — ${candidates.length - added - failures.length} ` +
            "issue(s) left unsynced. Re-run once the window has rolled over; this script is idempotent.",
        );
        break;
      }
    }
  }

  console.log(
    `\nbackfill: ${added} synced, ${skipped} skipped (not backlog candidates), ${failures.length} failed`,
  );
  if (failures.length > 0) {
    console.error(JSON.stringify(failures, null, 2));
    process.exit(1);
  }
}

main();
