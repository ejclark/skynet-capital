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
//   GH_TOKEN=<eric's PAT> node scripts/moneypenny/projects-backfill.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ghRestAll } from "./gh.mjs";
import { isBacklogCandidate } from "./projects.mjs";
import { syncIssue } from "./projects-sync.mjs";

const HORIZONS_PATH = fileURLToPath(new URL("./projects-horizons.json", import.meta.url));

function main() {
  const horizons = JSON.parse(readFileSync(HORIZONS_PATH, "utf8"));
  const issues = ghRestAll("issues?state=open").filter((i) => !("pull_request" in i));

  let added = 0;
  let skipped = 0;
  const failures = [];

  for (const issue of issues) {
    const labels = (issue.labels ?? []).map((l) => l.name);
    if (!isBacklogCandidate({ labels })) {
      skipped++;
      continue;
    }
    const horizon = horizons[String(issue.number)];
    try {
      const result = syncIssue(String(issue.number), { horizon });
      console.log(
        `#${issue.number}: Status="${result.status}"${result.horizon ? ` Horizon="${result.horizon}"` : " (no Horizon triaged yet)"}`,
      );
      added++;
    } catch (err) {
      console.error(`#${issue.number}: FAILED — ${err.message}`);
      failures.push({ number: issue.number, message: err.message });
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
