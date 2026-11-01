// The meter's other REST reads (#6470): pipeline runs for the first-pass split, and merged PRs for
// open-to-merge. Both go through the same counted layer as the lanes, so the run's REST total is
// one number.
import { listRuns, REPO } from "./lanes.mjs";

/**
 * Pipeline runs in the window, with each failed main push's job list read once and cached: twelve
 * straight failures on 2026-10-31 were one bots deploy, and only the job name says so.
 */
export function pipelineRuns(rest, cache, w, maxRest) {
  cache.pipeline ??= {};
  const runs = listRuns(rest, "pipeline.yml", w.sinceMs).filter((run) => {
    const at = Date.parse(run.run_started_at);
    return at >= w.sinceMs && at <= w.untilMs;
  });
  const main = runs.filter((run) => run.event === "push" && run.head_branch === "main");
  for (const run of main) {
    if (run.conclusion !== "failure" || cache.pipeline[run.id]) continue;
    if (rest.calls >= maxRest) break;
    const jobs = rest.api(`repos/${REPO}/actions/runs/${run.id}/jobs?per_page=100`).jobs ?? [];
    cache.pipeline[run.id] = jobs
      .filter((j) => j.conclusion === "failure")
      .map((j) => ({
        job: j.name,
        step: j.steps?.find((s) => s.conclusion === "failure")?.name ?? null,
      }));
  }
  return {
    all: runs,
    main: main.map((run) => ({ ...run, failedJobs: cache.pipeline[run.id] ?? null })),
  };
}

/** Closed PRs newest-updated first, until the page runs past the window; merged_at says which merged. */
export function mergedPrs(rest, sinceMs) {
  const prs = [];
  for (let page = 1; page <= 5; page += 1) {
    const items = rest.api(
      `repos/${REPO}/pulls?state=closed&sort=updated&direction=desc&per_page=100&page=${page}`,
    );
    prs.push(
      ...items.map((pr) => ({ title: pr.title, createdAt: pr.created_at, mergedAt: pr.merged_at })),
    );
    if (items.length < 100 || Date.parse(items.at(-1).updated_at) < sinceMs) break;
  }
  return prs;
}

/** Issues carrying the audit's `Introduced in` field, created since the window's first day. */
export function defectIssues(rest, sinceMs) {
  const day = new Date(sinceMs).toISOString().slice(0, 10);
  const q = encodeURIComponent(`repo:${REPO} "Introduced in" in:body created:>=${day}`);
  return rest.api(`search/issues?q=${q}&per_page=100`).items;
}
