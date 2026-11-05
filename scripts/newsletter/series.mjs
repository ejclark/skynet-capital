// The newsletter's time series (#6872): one entry per week in `series.json` on the `data/newsletter`
// branch, so week-over-week trend lines read from a file, not from re-running old weeks.
//
// WHY A DATA BRANCH, WRITTEN OVER THE CONTENTS API. The numbers change every week and are nobody's
// code: on main they would be a PR a week through the merge pipeline. A branch no workflow watches
// (pipeline.yml and the lanes trigger on main only) takes a commit per week with no CI, and the
// contents API writes it from any runner or cloud session without a checkout. The branch starts as
// an orphan holding only this file (the git data API, once), because the contents API cannot
// create a branch, and a branch cut from main would carry the whole tree for nothing.
//
// A week is written once and replaced on a re-run, never appended twice: a mid-week reading is
// marked `partial`, and the run after the week closes overwrites it.
import { spawnSync } from "node:child_process";
import { REPO } from "../agent-meter/lanes.mjs";

export const SERIES_BRANCH = "data/newsletter";
export const SERIES_PATH = "series.json";

/** The series with `entry` in its week's place, oldest week first. Pure. */
export function mergeSeries(series, entry) {
  const rest = (Array.isArray(series) ? series : []).filter((e) => e?.week !== entry.week);
  return [...rest, entry].sort((a, b) => String(a.week).localeCompare(String(b.week)));
}

/** What a week keeps in the series: the numbers, not the lists a newsletter links to. */
export function seriesEntry(newsletter) {
  const h = newsletter.humanSteps;
  return {
    week: newsletter.week,
    schema: newsletter.schema,
    asOf: newsletter.asOf,
    partial: newsletter.window.partial,
    metrics: newsletter.metrics,
    tokenSplit: newsletter.tokenSplit,
    milestones: {
      closedSubIssues: Array.isArray(newsletter.milestones.closedSubIssues)
        ? newsletter.milestones.closedSubIssues.length
        : null,
      planLogLines: Array.isArray(newsletter.milestones.planLog)
        ? newsletter.milestones.planLog.length
        : null,
    },
    humanSteps:
      h && typeof h === "object"
        ? { due: h.due, asked: h.asks.length, rolledOver: h.rolledOver.length }
        : null,
  };
}

function gh(args, input) {
  const res = spawnSync("gh", ["api", ...args], {
    encoding: "utf8",
    input: input === undefined ? undefined : JSON.stringify(input),
    maxBuffer: 64 * 1024 * 1024,
  });
  return { ok: res.status === 0, out: res.stdout, err: res.stderr };
}

const b64 = (text) => Buffer.from(text, "utf8").toString("base64");

/** Write `entry` into the series on the data branch, creating the branch on first use. */
export function appendSeries(entry) {
  const file = gh([
    `repos/${REPO}/contents/${SERIES_PATH}?ref=${encodeURIComponent(SERIES_BRANCH)}`,
  ]);
  const message = `data(newsletter): ${entry.week}${entry.partial ? " (partial)" : ""}`;
  if (file.ok) {
    const current = JSON.parse(file.out);
    const series = JSON.parse(Buffer.from(current.content, "base64").toString("utf8"));
    const body = `${JSON.stringify(mergeSeries(series, entry), null, 2)}\n`;
    const put = gh(["-X", "PUT", `repos/${REPO}/contents/${SERIES_PATH}`, "--input", "-"], {
      message,
      content: b64(body),
      sha: current.sha,
      branch: SERIES_BRANCH,
    });
    if (!put.ok) throw new Error(`series write refused: ${put.err.trim().slice(0, 200)}`);
    return `wrote ${entry.week} to ${SERIES_BRANCH}:${SERIES_PATH}`;
  }
  if (!/Not Found|404/.test(file.err))
    throw new Error(`series read failed: ${file.err.trim().slice(0, 200)}`);
  if (gh([`repos/${REPO}/branches/${encodeURIComponent(SERIES_BRANCH)}`]).ok)
    throw new Error(`${SERIES_BRANCH} exists without ${SERIES_PATH}; refusing to guess its shape`);
  const content = `${JSON.stringify(mergeSeries([], entry), null, 2)}\n`;
  const step = (args, input) => {
    const res = gh(["-X", "POST", ...args, "--input", "-"], input);
    if (!res.ok) throw new Error(`${args[0]}: ${res.err.trim().slice(0, 200)}`);
    return JSON.parse(res.out);
  };
  const tree = step([`repos/${REPO}/git/trees`], {
    tree: [{ path: SERIES_PATH, mode: "100644", type: "blob", content }],
  });
  const commit = step([`repos/${REPO}/git/commits`], { message, tree: tree.sha, parents: [] });
  step([`repos/${REPO}/git/refs`], { ref: `refs/heads/${SERIES_BRANCH}`, sha: commit.sha });
  return `created ${SERIES_BRANCH} with ${entry.week}`;
}
