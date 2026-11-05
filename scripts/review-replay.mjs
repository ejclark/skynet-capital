#!/usr/bin/env node
// Replay a review lens over labelled history and score what it finds.
//
// Nothing could score a lens: the 2026-10-27 audit's refuted and low counts were not saved, so its
// recall and how often it manufactures are unknown. docs/review/replay-set.json holds PRs with a known
// defect and PRs with none on record; this hands a reviewer one of those changes with none of the
// answer, then counts what comes back. A script cannot spawn a model, so the fan-out lives in
// .claude/workflows/review-replay.js, which calls this for its cases and each reviewer's prompt.
//
//   node scripts/review-replay.mjs cases  --lens <name> [--ids A,B] [--set <file>]
//   node scripts/review-replay.mjs prompt --lens <name> --head <sha> [--set <file>] [--lens-file <file>]
//   node scripts/review-replay.mjs score  --results <file>[,<file>] [--set <file>] [--json]
//   node scripts/review-replay.mjs check  [--set <file>]    # every sha resolves and fits its PR
//   node scripts/review-replay.mjs tokens --run-dir <dir> --results <file>   # real tokens per tier
//
// What a score can and cannot say is in the set's own howThisCouldFlatterALens: this measures a lens
// on the cases it was grown from. The post-merge lenses run reviewers only; the pre-merge lens
// (scripts/review-replay/pre-merge.mjs) adds one trace refuter per PR, and a refuted finding counts
// for nothing, so its score is read after the refuter, with the number before it beside.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  PASS_BAR,
  preMergePromptFor,
  RULES_FILE,
  readProtectedRules,
  shapeOf,
  verdictOf,
} from "./review-replay/pre-merge.mjs";
import { readRunAgents, renderTokens, tokensPerTier } from "./review-replay/tokens.mjs";

const SET_FILE = "docs/review/replay-set.json";
const MAX_PRS = 40; // the same cap post-merge-audit carries: a wider run is two runs, never a cut
const START_TOKENS = 30_000; // what docs/COMPUTE.md gives for a worker's start; output is on top
const LOOKUPS = 2; // the work-spigot read and the `cases` read, one mechanical agent each

export const LENSES = {
  adversarial: "correctness",
  performance: "performance",
  security: "security",
  "context-loop": "context-loop",
  "reuse-composability": "reuse",
  "smells-and-patterns": "structure",
  "pre-merge": "correctness",
};
export const PRE_MERGE = "pre-merge";

function facetOf(lens) {
  const facet = LENSES[lens];
  if (!facet) throw new Error(`unknown lens ${lens}; one of ${Object.keys(LENSES).join(", ")}`);
  return facet;
}

const runsOn = (row, lens, facet) =>
  row.isControl
    ? row.cleanFor.includes(facet) || row.trapFor === facet
    : row.facet === facet || (row.alsoFor ?? []).includes(lens);

/** The PRs a lens runs on, one reviewer each: two defects on one PR share one read of it. */
function inputsFor(set, lens, ids) {
  const facet = facetOf(lens);
  const eligible = set.cases.filter((row) => runsOn(row, lens, facet));
  const unknown = (ids ?? []).filter((id) => !eligible.some((row) => row.id === id));
  if (unknown.length) throw new Error(`${lens} does not run on ${unknown.join(", ")}`);
  const picked = ids ? eligible.filter((row) => ids.includes(row.id)) : eligible;
  const byPr = new Map();
  for (const { id, pr, base, head } of picked) {
    const input = byPr.get(pr) ?? { pr, base, head, caseIds: [] };
    input.caseIds.push(id);
    byPr.set(pr, input);
  }
  return [...byPr.values()];
}

/** One run of a lens, capped and priced. */
export function casesFor(set, lens, { ids } = {}) {
  const facet = facetOf(lens);
  const inputs = inputsFor(set, lens, ids);
  if (inputs.length > MAX_PRS) {
    throw new Error(
      `${inputs.length} PRs is over the ${MAX_PRS} one run may review; name a batch with --ids`,
    );
  }
  // The pre-merge lens refutes on the PR, so a PR with any finding pays one more agent.
  const refuters = lens === PRE_MERGE ? { refuters: inputs.length } : {};
  const agents = inputs.length + (refuters.refuters ?? 0) + LOOKUPS;
  const price = {
    reviewers: inputs.length,
    ...refuters,
    lookups: LOOKUPS,
    agents,
    startTokens: agents * START_TOKENS,
  };
  return { lens, facet, inputs, price };
}

/** A lens's real examples are drawn from this same set, so a lens read whole hands over the answer. */
const withoutExamples = (lensText) =>
  lensText.replace(/\s*Real: [\s\S]*?(?=\n\s*\n|$)/g, "").replace(/#\d{3,5}\b/g, "a past change");

/** Exactly what one reviewer is told: the shas and the lens. No PR number, label, note or file. */
export function promptFor(set, lens, head, lensText) {
  const input = inputsFor(set, lens).find((row) => row.head === head);
  if (!input) throw new Error(`${lens} does not run on ${head}`);
  const { base } = input;
  return `Review one change as it stood when it merged. Read-only: write no file, and return only the schema you were given.

The change is \`git diff ${base} ${head}\`. Read anything else in the tree as it stood then with \`git show ${head}:<path>\` and \`git grep <pattern> ${head}\`. The working tree is shared and on some other commit: never read its files for this, and never run git checkout, switch, reset, commit or clean in it.

Judge it with nothing newer. Never read GitHub, any issue or PR text, \`git log\` at or after ${head}, docs/LESSONS.md, docs/IDEAS.md or docs/review/replay-set.json: each can name the answer, and a read of one voids this review.

Report a finding only when you can name a concrete failure or cost: the input or state, and the wrong result or the measurable cost it produces. Zero findings is a normal answer; a reviewer told to find gaps manufactures them. Severity: high = wrong money or state, data loss, a crash on a common path, a broken gate or lane; medium = wrong on a real but narrower path; low = an edge you are unsure anyone hits.

Read the change through this lens and no other:

${withoutExamples(lensText)}`;
}

const SERIOUS = (finding) => ["high", "medium", "important"].includes(finding.severity);
// A finding its refuter knocked down never reaches an author, so it counts for nothing either way.
const STANDS = (finding) => finding.refuted !== true;

function scoreDefects(rows, seen) {
  const prs = [...new Set(rows.map((row) => row.pr))];
  const recall = {
    prs: prs.length,
    reviewed: 0,
    hit: 0,
    hits: [],
    lowOnly: [],
    refutedOnly: [],
    missed: [],
    unknown: [],
  };
  for (const pr of prs) {
    const result = seen.get(pr);
    if (!result) {
      recall.unknown.push(pr);
      continue;
    }
    recall.reviewed += 1;
    const onDefect = (row) => (finding) => finding.file === row.defect.file;
    const counted = (finding) => SERIOUS(finding) && finding.mechanism !== false && STANDS(finding);
    const cases = rows.filter((row) => row.pr === pr);
    const matched = cases.filter((row) =>
      result.findings.some((f) => onDefect(row)(f) && counted(f)),
    );
    if (matched.length) {
      recall.hit += 1;
      // Both sentences, because a file match is only an upper bound until someone reads them.
      recall.hits.push({
        pr,
        caseIds: matched.map((row) => row.id),
        defect: matched[0].defect.summary,
        found: result.findings.find((f) => onDefect(matched[0])(f) && counted(f)).summary,
      });
    } else if (
      cases.some((row) =>
        result.findings.some((f) => onDefect(row)(f) && SERIOUS(f) && f.mechanism !== false),
      )
    ) {
      recall.refutedOnly.push(pr); // found, then refuted: read these, the refuter may be wrong
    } else if (
      cases.some((row) =>
        result.findings.some((f) => onDefect(row)(f) && ["low", "nit"].includes(f.severity)),
      )
    ) {
      recall.lowOnly.push(pr);
    } else {
      recall.missed.push(pr);
    }
  }
  return recall;
}

function scoreControls(rows, facet, seen) {
  const controls = { reviewed: 0, clean: 0, flagged: [], traps: [], unknown: [] };
  for (const row of rows) {
    const result = seen.get(row.pr);
    if (!result) {
      controls.unknown.push(row.pr);
      continue;
    }
    controls.reviewed += 1;
    const serious = result.findings
      .filter((f) => SERIOUS(f) && STANDS(f))
      .map((f) => ({ id: row.id, pr: row.pr, ...f }));
    if (!serious.length) controls.clean += 1;
    else if (row.trapFor === facet) controls.traps.push(...serious);
    else controls.flagged.push(...serious);
  }
  return controls;
}

/** One lens's run. A reviewer that never returned is unknown: neither a miss nor a clean control. */
export function scoreRun(set, { lens, results }) {
  const facet = facetOf(lens);
  const rows = set.cases.filter((row) => runsOn(row, lens, facet));
  const seen = new Map(results.filter((row) => row.returned !== false).map((row) => [row.pr, row]));
  const report = {
    lens,
    facet,
    recall: scoreDefects(
      rows.filter((row) => !row.isControl),
      seen,
    ),
    controls: scoreControls(
      rows.filter((row) => row.isControl),
      facet,
      seen,
    ),
  };
  const refuterRan = results.some((row) => row.findings?.some((f) => "refuted" in f));
  if (refuterRan) {
    // What the reviewer alone said, so the refuter's share of the score can be read off.
    const unrefuted = results.map((row) => ({
      ...row,
      findings: (row.findings ?? []).map(({ refuted: _r, ...f }) => f),
    }));
    const raw = scoreRun(set, { lens, results: unrefuted });
    report.beforeRefuters = { hit: raw.recall.hit, controlFlags: raw.controls.flagged.length };
  }
  if (lens === PRE_MERGE) report.bar = { ...PASS_BAR, verdict: verdictOf(report) };
  return report;
}

function checkSet(set) {
  const git = (...args) => {
    const run = spawnSync("git", args, { encoding: "utf8" });
    return run.status === 0 ? run.stdout.trim() : null;
  };
  if (git("rev-parse", "--is-shallow-repository") === "true") {
    console.error("review-replay check: a shallow clone cannot tell — verdict UNKNOWN.");
    return 2;
  }
  const problems = set.cases.flatMap((row) => {
    const subject = git("log", "-1", "--format=%s", row.head);
    if (subject === null) return [`${row.id}: head ${row.head} does not resolve`];
    if (git("rev-parse", `${row.head}^`) !== row.base)
      return [`${row.id}: base is not head's parent`];
    return subject.includes(`(#${row.pr})`) ? [] : [`${row.id}: head is not PR ${row.pr}`];
  });
  for (const problem of problems) console.error(problem);
  const total = set.cases.length;
  console.log(`review-replay check: ${total - problems.length} of ${total} cases resolve.`);
  return problems.length ? 1 : 0;
}

const summary = ({ lens, recall, controls, beforeRefuters, bar }) =>
  [
    `${lens}: recall ${recall.hit} of ${recall.reviewed} PRs reviewed (${recall.prs} labelled), by file match; read each hit`,
    `  low only: ${recall.lowOnly.join(", ") || "none"} · refuted: ${recall.refutedOnly.join(", ") || "none"} · missed: ${recall.missed.join(", ") || "none"} · not reviewed: ${recall.unknown.join(", ") || "none"}`,
    `  controls: ${controls.clean} clean of ${controls.reviewed} reviewed; ${controls.flagged.length} serious counted against the lens, ${beforeRefuters ? "after its refuter" : "before any refuter"}; ${controls.traps.length} on a trap, to read; not reviewed: ${controls.unknown.join(", ") || "none"}`,
    ...(beforeRefuters
      ? [
          `  before the refuter: ${beforeRefuters.hit} hits, ${beforeRefuters.controlFlags} serious on controls`,
        ]
      : []),
    ...(bar
      ? [
          `  bar: at least ${bar.hits} hits and at most ${bar.controlImportant} Important on controls — ${bar.verdict}`,
        ]
      : []),
  ].join("\n");

function flag(argv, name) {
  const at = argv.indexOf(`--${name}`);
  return at === -1 ? undefined : argv[at + 1];
}

function scoreCommand(argv, set) {
  const runs = new Map(); // lens → its results: a lens re-batched over several runs scores as one
  for (const file of (flag(argv, "results") ?? "").split(",").filter(Boolean)) {
    const run = JSON.parse(readFileSync(file, "utf8"));
    const lens = run.lens ?? flag(argv, "lens");
    runs.set(lens, [...(runs.get(lens) ?? []), ...run.results]);
  }
  const facets = {};
  for (const [lens, results] of runs) {
    const report = scoreRun(set, { lens, results });
    facets[report.facet] = report;
  }
  if (!Object.keys(facets).length) throw new Error("score needs --results <file>");
  if (argv.includes("--json")) console.log(JSON.stringify({ facets }, null, 2));
  else for (const report of Object.values(facets)) console.log(summary(report));
  return 0;
}

function main(argv) {
  const [command] = argv;
  const set = JSON.parse(readFileSync(flag(argv, "set") ?? SET_FILE, "utf8"));
  const lens = flag(argv, "lens");
  if (command === "cases") {
    const ids = flag(argv, "ids")?.split(",").filter(Boolean);
    const run = casesFor(set, lens, { ids });
    if (lens === PRE_MERGE) {
      // The tier is a rule over git and the envelope, never the workflow's or a model's judgment.
      const rules = readProtectedRules();
      run.inputs = run.inputs.map((input) => ({ ...input, ...shapeOf(input, rules) }));
    }
    console.log(JSON.stringify(run));
    return 0;
  }
  if (command === "prompt") {
    const head = flag(argv, "head");
    if (lens === PRE_MERGE) {
      const input = inputsFor(set, lens).find((row) => row.head === head);
      if (!input) throw new Error(`${lens} does not run on ${head}`);
      console.log(
        preMergePromptFor(input, readFileSync(flag(argv, "lens-file") ?? RULES_FILE, "utf8")),
      );
      return 0;
    }
    const lensText = readFileSync(
      flag(argv, "lens-file") ?? `docs/review/lenses/${lens}.md`,
      "utf8",
    );
    console.log(promptFor(set, lens, head, lensText));
    return 0;
  }
  if (command === "score") return scoreCommand(argv, set);
  if (command === "check") return checkSet(set);
  if (command === "tokens") {
    const runDir = flag(argv, "run-dir");
    if (!runDir) throw new Error("tokens needs --run-dir <a workflow run's folder>");
    const results = (flag(argv, "results") ?? "")
      .split(",")
      .filter(Boolean)
      .flatMap((file) => JSON.parse(readFileSync(file, "utf8")).results);
    const report = tokensPerTier(readRunAgents(runDir), results);
    console.log(argv.includes("--json") ? JSON.stringify(report, null, 2) : renderTokens(report));
    return 0;
  }
  throw new Error(
    "usage: review-replay.mjs cases|prompt|score|check|tokens (see the file's header)",
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    // Nothing printed is ever a score: a run that could not read its inputs says unknown.
    console.error(`review-replay: ${error.message} — verdict UNKNOWN.`);
    process.exitCode = 2;
  }
}
