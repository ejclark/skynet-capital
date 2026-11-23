#!/usr/bin/env node
// Platter sweep — which held PRs should ride the platter, and does the platter itself need a rebuild?
//
// WHY (#7939, 2026-11-22): the platter exists so every protected-path change costs Eric ONE merge per
// cadence (#1343), yet that day he had 9 separate touches: two protected PRs held on their own
// (#7737, #7711), a protected dependabot bump on no platter (#7674), and the platter (#7424) itself
// `conflict-flagged`. This reads the open PRs and prints, as JSON, (a) the PRs `ship platter adopt`
// may board and (b) an open platter that `ship platter rebuild` should re-open from main. It changes
// nothing; the daily loops Routine (docs/process/LOOPS-ROUTINE.md → Platter) acts on its answer.
//
//   node scripts/platter-sweep.mjs            # {platter, rebuild, adoptable, refused}
//   node scripts/platter-sweep.mjs --pr 7737  # one PR's verdict, plus the open platter
//
// Decisions live in scripts/platter-sweep-decide.mjs (pure, specced). Resource doctrine: REST core
// only through `gh api` — no GraphQL (a cloud session is refused it) and never `--paginate`, whose
// Link header names the repo by numeric id, which the cloud proxy refuses (#7711). Pages are read
// by `&page=N` until a short page. No token or no network exits 1 with the error: the caller is a
// session that should say so, not a gate that should pass quietly.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { breachOf } from "./envelope-scan.mjs";
import { isMain } from "./is-main.mjs";
import {
  adoptCandidates,
  isPlatterBranch,
  judgeAdopt,
  judgeRebuild,
  openPlatter,
} from "./platter-sweep-decide.mjs";

const PAGE = 100;
const MAX_PAGES = 10;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const defaultExec = (cmd, args) =>
  execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

/** One REST read; `{owner}/{repo}` is filled in by gh from the checkout's remote. */
const get = (exec, path) => JSON.parse(exec("gh", ["api", `repos/{owner}/{repo}/${path}`]));

/** Every row of a list endpoint, page by page. `pick` takes the rows out of a page (check-runs
 *  wraps them in an object). Past MAX_PAGES it throws rather than return a truncated list. */
export function everyPage(exec, path, pick = (page) => page) {
  const rows = [];
  const sep = path.includes("?") ? "&" : "?";
  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = pick(get(exec, `${path}${sep}per_page=${PAGE}&page=${page}`)) ?? [];
    rows.push(...batch);
    if (batch.length < PAGE) return rows;
  }
  throw new Error(`${path} still had more after ${MAX_PAGES} pages`);
}

export function protectedTest(root = ROOT) {
  const rules = JSON.parse(readFileSync(join(root, "envelope.json"), "utf8")).protected ?? [];
  return (path) => breachOf(path, rules) !== null;
}

/** The verdict on one PR, from the single-PR read (it alone carries `mergeable`). */
function judgeOne(exec, number, isProtected) {
  const pr = get(exec, `pulls/${number}`);
  const files = everyPage(exec, `pulls/${number}/files`).map((f) => f.filename);
  const checkRuns = everyPage(exec, `commits/${pr.head.sha}/check-runs`, (page) => page.check_runs);
  return judgeAdopt({ pr, files, isProtected, checkRuns });
}

/** The platter boards land on, with its rebuild verdict, or null when none is open. */
function platterOf(exec, open) {
  const listed = openPlatter(open);
  if (!listed) return null;
  const verdict = judgeRebuild(get(exec, `pulls/${listed.number}`));
  return { number: listed.number, branch: listed.head.ref, ...verdict };
}

/** The whole sweep, or one PR's verdict when `only` is a number. */
export function sweep({ exec = defaultExec, isProtected = protectedTest(), only = null } = {}) {
  const open = everyPage(exec, "pulls?state=open").filter((p) => p.base?.ref === "main");
  const platter = platterOf(exec, open);
  if (only !== null) {
    return { platter, verdict: judgeOne(exec, only, isProtected) };
  }
  const adoptable = [];
  const refused = [];
  for (const listed of adoptCandidates(open)) {
    const verdict = judgeOne(exec, listed.number, isProtected);
    (verdict.adopt ? adoptable : refused).push(verdict);
  }
  // Oldest first: the order they waited in is the order they board.
  adoptable.sort((a, b) => a.number - b.number);
  const others = open.filter((p) => isPlatterBranch(p.head?.ref) && p.number !== platter?.number);
  return {
    platter,
    rebuild: platter?.rebuild ? platter : null,
    adoptable,
    refused,
    // More than one open platter is itself a leak worth naming; adopt boards onto the newest.
    otherPlatters: others.map((p) => p.number),
  };
}

function main(argv) {
  const at = argv.indexOf("--pr");
  const only = at === -1 ? null : Number(argv[at + 1]);
  if (at !== -1 && !(only > 0)) {
    console.error("usage: node scripts/platter-sweep.mjs [--pr <number>]");
    return 1;
  }
  try {
    console.log(JSON.stringify(sweep({ only }), null, 2));
    return 0;
  } catch (err) {
    console.error(`platter-sweep: could not read GitHub (${err.message?.split("\n")[0]})`);
    return 1;
  }
}

if (isMain(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
