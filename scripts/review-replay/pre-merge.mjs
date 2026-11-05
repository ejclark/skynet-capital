// The pre-merge lens: the reviewer as it would run before merge (#6870, slice S1), so its recall,
// how often it flags a clean PR, and what it costs per tier are measured before anything ships.
//
// It differs from the post-merge lenses in four ways, each the shape the CI job will have:
//   - the diff comes first, then docs/review/REVIEW.md as its rules, so the change is read before
//     any checklist primes what to look for;
//   - severities are Important and Nit, capped at 5 and 3, and every finding carries a file:line;
//   - one trace refuter per PR checks all of that PR's findings at once (the workflow's job);
//   - the tier follows the post-merge audit's routing, plus a light tier for small changes.
//
// No hunk filter yet, and a plain file match flatters recall: 5 of the set's 21 correctness defects sit
// in a file their PR never changed, where the shipped job cannot post a finding. So the score also
// counts hits on a file in the diff, and the bar passes only on those (verdictOf). The plain-code
// filter is slice S2's.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { breachOf } from "../envelope-scan.mjs";

export const RULES_FILE = "docs/review/REVIEW.md";

// A copy of .claude/workflows/post-merge-audit.js's DEEP_ROOTS and DOCS_ONLY, because a workflow
// cannot import. tests/scripts/review-replay-pre-merge.spec.ts fails when the two drift; slice S2
// moves both into one module the audit reads too.
export const DEEP_ROOTS = [
  "src/trading/",
  "src/options/",
  "src/risk/",
  "src/math/",
  "src/engine/",
  "src/playbooks/",
  "src/autonomous/",
  "src/bots/",
  "src/alpaca/",
  "src/storage/",
  "src/server/",
  "src/scripts/",
  "app/src/live/",
  ".github/workflows/",
  "scripts/bots-",
];
export const DOCS_ONLY_ROOTS = ["docs/", "src/domain/market-events/proposals/"];
export const DOCS_ONLY = (file) => DOCS_ONLY_ROOTS.some((root) => file.startsWith(root));
export const LIGHT_LINES = 60; // the plan's light tier: at most this many changed lines, no risky path

/** deep · standard · light · skip, by rule: the audit's routing, with small safe changes made light. */
export function tierOf({ files, lines, protectedPath }) {
  if (protectedPath || files.some((f) => DEEP_ROOTS.some((root) => f.startsWith(root)))) {
    return "deep";
  }
  if (files.length && files.every(DOCS_ONLY)) return "skip";
  return lines <= LIGHT_LINES ? "light" : "standard";
}

/** Files and changed lines from `git diff --numstat`; a binary file's "-" counts as no lines. */
export function parseNumstat(text) {
  const rows = text
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split("\t"));
  return {
    files: rows.map((row) => row.slice(2).join("\t")),
    lines: rows.reduce(
      (sum, [added, deleted]) => sum + (Number(added) || 0) + (Number(deleted) || 0),
      0,
    ),
  };
}

function git(...args) {
  const run = spawnSync("git", args, { encoding: "utf8", maxBuffer: 2 ** 28 });
  if (run.status !== 0) throw new Error(`git ${args[0]} failed: ${run.stderr.trim()}`);
  return run.stdout;
}

/** One PR's tier and size, read from git and the envelope, never from the PR's text. */
export function shapeOf({ base, head }, protectedRules) {
  const { files, lines } = parseNumstat(git("diff", "--numstat", base, head));
  const protectedPath = files.some((file) => breachOf(file, protectedRules));
  return { tier: tierOf({ files, lines, protectedPath }), lines, fileCount: files.length };
}

/** The paths one PR changed, so the score can tell a hit the job could post from one it could not. */
export const changedFilesOf = ({ base, head }) =>
  new Set(git("diff", "--name-only", base, head).split("\n").filter(Boolean));

export const readProtectedRules = () =>
  JSON.parse(readFileSync("envelope.json", "utf8")).protected ?? [];

// The worker reads the prompt as one command's output, and a tool result past about 30,000
// characters is cut. A diff that would push the rules off the end is replaced by its stat and an
// instruction to read it file by file, first.
export const DIFF_CAP = 20_000;

/** Exactly what the reviewer is told: the change first, then the rules. No PR number or label. */
export function preMergePrompt({ base, head, diff, stat, rules }) {
  const change =
    diff.length <= DIFF_CAP
      ? `\`git diff ${base} ${head}\`:\n\n\`\`\`diff\n${diff}\n\`\`\``
      : `The diff is ${diff.length} characters, too long to print here. Its stat:\n\n\`\`\`\n${stat}\n\`\`\`\n\nRead all of it before anything else, file by file: \`git diff ${base} ${head} -- <path>\`.`;
  return `Review one pull request before it merges. Read-only: write no file, and return only the schema you were given.

## The change

${change}

## How to read around it

Read anything else in the tree as it stood at the PR's head with \`git show ${head}:<path>\` and \`git grep <pattern> ${head}\`. The working tree is shared and on some other commit: never read its files for this, and never run git checkout, switch, reset, commit or clean in it.

Judge it with nothing newer. Never read GitHub, any issue or PR text, \`git log\` at or after ${head}, docs/LESSONS.md, docs/IDEAS.md or anything under docs/review/: each can name the answer, and a read of one voids this review.

## The rules

${rules.trim()}

## What to return

Each finding: severity \`important\` or \`nit\`, one category from the rules, the file, the line in it at the head, a one-sentence summary, and the failure scenario. At most 5 important and 3 nit.`;
}

/** The prompt for one PR, with its diff read from git. */
export function preMergePromptFor(input, rulesText) {
  const { base, head } = input;
  return preMergePrompt({
    base,
    head,
    diff: git("diff", base, head),
    stat: git("diff", "--stat", base, head).trimEnd(),
    rules: rulesText,
  });
}

// The bar the plan set for S1 (#6870): enough recall to be worth a review on every PR, and few
// enough false Important findings that an author answering them is not a tax.
export const PASS_BAR = { hits: 9, controlImportant: 2 };

/**
 * PASS, FAIL, READ or UNKNOWN. It passes only on hits the job could post (a file match on a file in
 * the diff), and fails only when even every PR with a standing Important finding falls short; in
 * between, those findings have to be read. Unknown while any PR went unreviewed or any serious
 * finding unjudged, because each of those would otherwise read as clean.
 */
export function verdictOf({ recall, controls, unjudged = [] }) {
  if (recall.unknown.length || controls.unknown.length || unjudged.length) return "UNKNOWN";
  if (controls.flagged.length > PASS_BAR.controlImportant) return "FAIL";
  if ((recall.hitsInDiff ?? recall.hit) >= PASS_BAR.hits) return "PASS";
  return recall.withFindings < PASS_BAR.hits ? "FAIL" : "READ";
}
