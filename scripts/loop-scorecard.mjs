#!/usr/bin/env node
// THE LOOP SCORECARD (#8199, the sense step of #8161 stage 3): the six numbers plan #8161 steers by,
// each with its value now, its goal and the source it was read from, in one command. The daily loops
// Routine runs it as step 6 (docs/process/LOOPS-ROUTINE.md) and carries one clause of it in its line.
//
//   npm run loop:scorecard              # the rows as text
//   npm run loop:scorecard -- --json    # the same rows as JSON, nothing else on stdout
//
// ONE SOURCE PER NUMBER, NEVER A SECOND COPY. Open issues and `needs-eric` are the weekly
// newsletter's own reads (`openIssues`, `needsEric` in newsletter/gather.mjs) and sums
// (`backlogStock`, `metrics.needsEric`); the multi-home count is the cohesion census's own row 2
// (`multiHomeConcepts`, git-free so a shallow clone's history, #8065, cannot reach it). So the
// scorecard, the newsletter and the census cannot print three different numbers for one thing.
//
// HONEST WHEN BLIND. A source that cannot be read prints `unavailable: <reason>`, never 0, and the
// other rows still print; the run exits 0 (advisory, never a gate). A number whose source is not
// built yet prints `pending` with the issue building it, read live; once that issue closes the row
// says `landed: reader not wired`, so the follow-up shows instead of a blank.
//
// GOALS LIVE HERE, not parsed from #8161's body (a prose edit there would break a parse silently).
// When #8161's *Scorecard* table changes, the PR that changes it updates GOALS.
//
// Off goal reads `▲ off goal`: a symbol and a word, never colour alone (CLAUDE.md, colourblind reader).
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRest, REPO } from "./agent-meter/lanes.mjs";
import { multiHomeConcepts } from "./crawl/cohesion.mjs";
import { isMain } from "./is-main.mjs";
import { backlogStock } from "./newsletter/backlog.mjs";
import { needsEric, openIssues } from "./newsletter/gather.mjs";
import { journeyGaps } from "./newsletter/member-reads.mjs";
import { needsEric as needsEricSum } from "./newsletter/metrics.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DAY = 86400000;
/** Push runs of pipeline.yml on main read, newest first, looking for a finished integration job. */
const RUNS_READ = 8;
const JOB = "integration tests";

/** #8161 → *Scorecard* (and its acceptance criteria for the journeys row), as of 2026-11-24. */
export const GOALS = {
  openIssues: "down by stage 1's close-out, then flat or falling",
  needsEric: "≤ 3",
  multiHome: "0 by end of stage 2",
  journeys: "green on every merge",
  phone: "—",
  back: "—",
};
const MAX_NEEDS_ERIC = 3;

/** Numbers whose source another issue is building; the row reads that issue's state live. */
export const PENDING = {
  phone: { issue: 8150, source: "scripts/study/metrics.mjs (estSeconds)" },
  back: { issue: 8169, source: "/data/member-visits (src/server/member-visits.ts)" },
};

const LABELS = {
  openIssues: "Open issues",
  needsEric: "Open needs-eric",
  multiHome: "Concepts with more than one home",
  journeys: "Member journeys on main",
  phone: "Phone task time",
  back: "Members who came back",
};

const reason = (err) =>
  String(err?.message ?? err)
    .split("\n")[0]
    .slice(0, 160);
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function row(id, fields) {
  return { id, label: LABELS[id], goal: GOALS[id], ...fields };
}

/** A read that throws becomes its own row's `unavailable`, never the run's failure. */
function attempt(id, source, read) {
  try {
    return read();
  } catch (err) {
    return row(id, {
      value: null,
      status: "unavailable",
      source,
      detail: `unavailable: ${reason(err)}`,
    });
  }
}

function openIssuesRow(rest, asOfMs) {
  const source = `GitHub: repos/${REPO}/issues?state=open`;
  return attempt("openIssues", source, () =>
    row("openIssues", {
      value: backlogStock(openIssues(rest), asOfMs).open,
      // One reading cannot say "falling": the trend needs the stored series (#8161 stage 3, remember).
      status: "no verdict",
      source,
    }),
  );
}

function needsEricRow(rest, asOfMs) {
  const source = `GitHub: repos/${REPO}/issues?labels=needs-eric`;
  return attempt("needsEric", source, () => {
    const sum = needsEricSum(needsEric(rest), asOfMs);
    return row("needsEric", {
      value: sum.count,
      status: sum.count > MAX_NEEDS_ERIC ? "off goal" : "on goal",
      source,
      detail: sum.oldestDays === null ? null : `oldest ${sum.oldestDays} days`,
    });
  });
}

function multiHomeRow(read) {
  const source = "docs/IA.md §2f × docs/members/triage.json";
  return attempt("multiHome", source, () => {
    const n = read().length;
    return row("multiHome", { value: n, status: n > 0 ? "off goal" : "on goal", source });
  });
}

const ageOf = (ms) => {
  const h = Math.round(ms / 3600000);
  if (h < 1) return `${Math.max(0, Math.round(ms / 60000))}m ago`;
  return h < 48 ? `${h}h ago` : `${Math.round(ms / DAY)}d ago`;
};

/**
 * The newest finished `integration tests` job on a push run of pipeline.yml on main. A run is often
 * cancelled by the next merge's deploy while its integration job had already finished, so the job's
 * own conclusion decides; a cancelled or skipped job says nothing and the next run is read.
 */
export function newestIntegrationJob(rest) {
  const runs = rest.api(
    `repos/${REPO}/actions/workflows/pipeline.yml/runs?branch=main&event=push&per_page=${RUNS_READ}`,
  ).workflow_runs;
  for (const run of runs) {
    const job = rest
      .api(`repos/${REPO}/actions/runs/${run.id}/jobs?per_page=100`)
      .jobs.find((j) => j.name === JOB);
    if (job?.status === "completed" && ["success", "failure", "timed_out"].includes(job.conclusion))
      return { run: run.id, sha: run.head_sha, conclusion: job.conclusion, at: job.completed_at };
  }
  throw new Error(`no finished ${JOB} job in the newest ${runs.length} push runs on main`);
}

function journeysRow(rest, asOfMs, gaps) {
  const source = "GitHub: pipeline.yml push runs on main, job integration tests";
  return attempt("journeys", source, () => {
    const job = newestIntegrationJob(rest);
    const green = job.conclusion === "success";
    const known = (() => {
      try {
        return plural(gaps().length, "known gap");
      } catch (err) {
        return `known gaps unavailable: ${reason(err)}`;
      }
    })();
    return row("journeys", {
      value: green ? "green" : "red",
      status: green ? "on goal" : "off goal",
      source: `pipeline run ${job.run}`,
      detail: `${job.sha.slice(0, 7)} · ${ageOf(asOfMs - Date.parse(job.at))} · ${known} · whole e2e suite, a red from any spec reads red`,
    });
  });
}

function pendingRow(rest, id) {
  const { issue, source } = PENDING[id];
  return attempt(id, source, () => {
    const state = rest.api(`repos/${REPO}/issues/${issue}`).state;
    return state === "closed"
      ? row(id, {
          value: "landed: reader not wired",
          status: "landed",
          source,
          detail: `#${issue} closed`,
        })
      : row(id, { value: "pending", status: "pending", source, detail: `#${issue} ${state}` });
  });
}

/**
 * The six rows, each read on its own. `reads` is injectable so a spec runs on saved inputs:
 * `rest` (the counted REST layer), `multiHome` and `gaps` (the tree reads).
 */
export function scorecard({
  rest,
  asOfMs = Date.now(),
  multiHome = multiHomeConcepts,
  gaps = () => journeyGaps(ROOT),
}) {
  return [
    openIssuesRow(rest, asOfMs),
    needsEricRow(rest, asOfMs),
    multiHomeRow(multiHome),
    journeysRow(rest, asOfMs, gaps),
    pendingRow(rest, "phone"),
    pendingRow(rest, "back"),
  ];
}

/** The Routine's clause (LOOPS-ROUTINE.md step 7). A number it could not read is `?`, never 0. */
export function clause(rows) {
  const by = Object.fromEntries(rows.map((r) => [r.id, r]));
  const n = (id) => by[id]?.value ?? "?";
  const journeys = by.journeys?.status === "unavailable" ? "unknown" : by.journeys?.value;
  const later = (id) => {
    const r = by[id];
    if (r?.status === "pending") return "pending";
    if (r?.status === "landed") return "unwired";
    return r?.value ?? "?";
  };
  return `scorecard ${n("openIssues")} open · ${n("needsEric")} asks · ${n("multiHome")} two-home · journeys ${journeys} · phone ${later("phone")} · back ${later("back")}`;
}

/** Two lines a row, so it reads on a phone: the number and its goal, then where it was read. */
export function renderText(rows, { asOfMs, tree }) {
  const stamp = new Date(asOfMs).toISOString().slice(0, 16).replace("T", " ");
  const out = [`scorecard · ${tree} · ${stamp} UTC`];
  for (const r of rows) {
    const value = r.status === "unavailable" ? r.detail : String(r.value);
    const parts = [r.status === "off goal" ? "▲ off goal" : null, `goal ${r.goal}`];
    if (r.detail && r.status !== "unavailable") parts.push(r.detail);
    out.push(`  ${r.label.padEnd(33)} ${value}  ${parts.filter(Boolean).join(" · ")}`);
    out.push(`      from ${r.source}`);
  }
  out.push(clause(rows));
  return out.join("\n");
}

export function renderJson(rows, { asOfMs, tree }) {
  return JSON.stringify(
    {
      asOf: new Date(asOfMs).toISOString(),
      tree,
      rows: rows.map(({ id, label, value, goal, source, status, detail }) => ({
        id,
        label,
        value,
        goal,
        source,
        status,
        detail: detail ?? null,
      })),
      clause: clause(rows),
    },
    null,
    2,
  );
}

const FLAGS = new Set(["--json", "--help", "-h"]);

/** Flags → `{ json }`, or `{ error }` for one this script does not know (exit 1). */
export function parseArgs(argv) {
  const bad = argv.find((a) => !FLAGS.has(a));
  if (bad) return { error: `loop-scorecard: unknown flag ${bad} (use --json)` };
  return { json: argv.includes("--json"), help: argv.includes("--help") || argv.includes("-h") };
}

function treeOf() {
  try {
    const git = (args) => execFileSync("git", args, { encoding: "utf8", cwd: ROOT }).trim();
    return `${git(["rev-parse", "--abbrev-ref", "HEAD"])} ${git(["rev-parse", "--short", "HEAD"])}`;
  } catch {
    return "tree unknown";
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.error) {
    console.error(args.error);
    process.exit(1);
  }
  if (args.help) {
    console.log("npm run loop:scorecard [-- --json]  (#8199: #8161's scorecard with its sources)");
    return;
  }
  const rest = createRest();
  const asOfMs = Date.now();
  const rows = scorecard({ rest, asOfMs });
  const ctx = { asOfMs, tree: treeOf() };
  console.log(args.json ? renderJson(rows, ctx) : renderText(rows, ctx));
  console.error(`scorecard: ${rest.calls} REST calls`);
}

if (isMain(import.meta.url)) main();
