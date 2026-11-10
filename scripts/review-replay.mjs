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
//   node scripts/review-replay.mjs tokens --run-dir <dir>[,<dir>] --results <file>[,<file>]
//
// What a score can and cannot say is in the set's own howThisCouldFlatterALens: this measures a lens
// on the cases it was grown from. The post-merge lenses run reviewers only; the pre-merge lens
// (scripts/review-replay/pre-merge.mjs) adds one trace refuter per PR, and a refuted finding counts
// for nothing, so its score is read after the refuter, with the number before it beside.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { isMain } from "./is-main.mjs";
import {
  changedFilesOf,
  PASS_BAR,
  preMergePromptFor,
  RULES_FILE,
  readProtectedRules,
  shapeOf,
  verdictOf,
} from "./review-replay/pre-merge.mjs";
import { scoreRows, summary } from "./review-replay/score.mjs";
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

/** One lens's run, scored (scripts/review-replay/score.mjs), with the bar's verdict for pre-merge. */
export function scoreRun(set, { lens, results, changed }) {
  const facet = facetOf(lens);
  const rows = set.cases.filter((row) => runsOn(row, lens, facet));
  const report = scoreRows(rows, { lens, facet, results, changed });
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

function flag(argv, name) {
  const at = argv.indexOf(`--${name}`);
  return at === -1 ? undefined : argv[at + 1];
}

/** What each PR changed, for the pre-merge lens; a sha that will not resolve leaves its PR out. */
function changedFor(set, lens) {
  const changed = new Map();
  for (const input of inputsFor(set, lens)) {
    try {
      changed.set(input.pr, changedFilesOf(input));
    } catch {
      // unresolvable: hitsInDiff cannot count this PR, which only lowers the floor
    }
  }
  return changed;
}

function scoreCommand(argv, set) {
  const runs = new Map(); // lens → its results: a lens re-batched over several runs scores as one
  for (const file of (flag(argv, "results") ?? "").split(",").filter(Boolean)) {
    const run = JSON.parse(readFileSync(file, "utf8"));
    const lens = run.lens ?? flag(argv, "lens");
    runs.set(lens, [...(runs.get(lens) ?? []), ...run.results]);
  }
  // Keyed by lens: two lenses can read one facet (adversarial and pre-merge both read correctness).
  const lenses = {};
  for (const [lens, results] of runs) {
    const changed = lens === PRE_MERGE ? changedFor(set, lens) : undefined;
    lenses[lens] = scoreRun(set, { lens, results, changed });
  }
  if (!Object.keys(lenses).length) throw new Error("score needs --results <file>");
  if (argv.includes("--json")) console.log(JSON.stringify({ lenses }, null, 2));
  else for (const report of Object.values(lenses)) console.log(summary(report));
  return 0;
}

function casesCommand(argv, set, lens) {
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

function promptCommand(argv, set, lens) {
  const head = flag(argv, "head");
  if (lens === PRE_MERGE) {
    const input = inputsFor(set, lens).find((row) => row.head === head);
    if (!input) throw new Error(`${lens} does not run on ${head}`);
    console.log(
      preMergePromptFor(input, readFileSync(flag(argv, "lens-file") ?? RULES_FILE, "utf8")),
    );
    return 0;
  }
  const lensText = readFileSync(flag(argv, "lens-file") ?? `docs/review/lenses/${lens}.md`, "utf8");
  console.log(promptFor(set, lens, head, lensText));
  return 0;
}

function tokensCommand(argv) {
  const runDirs = (flag(argv, "run-dir") ?? "").split(",").filter(Boolean);
  if (!runDirs.length) throw new Error("tokens needs --run-dir <a workflow run's folder>[,<more>]");
  const results = (flag(argv, "results") ?? "")
    .split(",")
    .filter(Boolean)
    .flatMap((file) => JSON.parse(readFileSync(file, "utf8")).results);
  const report = tokensPerTier(runDirs.flatMap(readRunAgents), results);
  console.log(argv.includes("--json") ? JSON.stringify(report, null, 2) : renderTokens(report));
  return 0;
}

function main(argv) {
  const [command] = argv;
  const set = JSON.parse(readFileSync(flag(argv, "set") ?? SET_FILE, "utf8"));
  const lens = flag(argv, "lens");
  if (command === "cases") return casesCommand(argv, set, lens);
  if (command === "prompt") return promptCommand(argv, set, lens);
  if (command === "score") return scoreCommand(argv, set);
  if (command === "check") return checkSet(set);
  if (command === "tokens") return tokensCommand(argv);
  throw new Error(
    "usage: review-replay.mjs cases|prompt|score|check|tokens (see the file's header)",
  );
}

if (isMain(import.meta.url)) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    // Nothing printed is ever a score: a run that could not read its inputs says unknown.
    console.error(`review-replay: ${error.message} — verdict UNKNOWN.`);
    process.exitCode = 2;
  }
}
