#!/usr/bin/env node
// IS A POST-MERGE AUDIT DUE? (#7311 slice 1) — the cheap check that lets the audit start on its own.
//
// Auto-merge means a PR's correctness review happens after it lands, and until now an audit ran only
// when a session remembered to start one (2026-11-10: 5 confirmed defects in 6 merged PRs, found by
// a hand-started run). A daily audit of everything would cost ~6M tokens a day, and docs/ROUTINES.md
// puts events before clocks, so the trigger is a count: 6 or more code PRs merged since the last
// audit's marker. A quiet day must cost almost nothing, so this makes ONE REST read (the marker) and
// reads everything else from local git, which costs no API quota.
//
//   node scripts/audit-due.mjs [--json] [--min 6] [--max 40] [--since ISO]
//
// THE MARKER is `audit/marker.json` on the `data/pr-review` ledger branch, beside the audit receipts
// the meter already reads (scripts/pr-review/ledger.mjs): `{at, through, prs}`. `through` is the main
// commit this script listed up to; the session that runs the audit passes it back with
// `node scripts/agent-meter.mjs --audit-receipt --prs … --confirmed N --through <sha>`, which writes
// the receipt and then moves the marker. A commit sha, not a time, so a PR that merges while a
// 30-minute audit runs is neither skipped nor read twice. With no marker yet (or a `through` main
// no longer contains) the window is `--since`, else the last 24 hours, and the output says so.
//
// WHAT COUNTS (the plan's criterion: non-docs, non-research, non-dependabot). Every squash or merge
// commit on main's first-parent line that names a PR is read for its author, subject and files:
//   dependabot   authored by dependabot[bot]: dep-warden reviews those before merge
//   docs-only    every file is one the audit itself skips (DOCS_ONLY, same rule as the workflow)
//   research     a `docs(research)` PR touching only docs/ and src/domain/market-events/ data
//   deep         a money, state, auth or bot path, or an envelope-protected one (DEEP_ROOTS)
//   standard     every other code or process change
// DEEP_ROOTS and DOCS_ONLY come from scripts/review-roots.mjs, the importable copy of the audit
// workflow's own rules (tests/scripts/review-roots.spec.ts fails when the two differ).
//
// A FAILED READ IS NEVER `due: false`. A marker read that fails for any reason but "absent", or a git
// history that cannot be read, exits 1 with the reason: an unread count must not pass for a quiet day.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { breachOf } from "./envelope-scan.mjs";
import { isMain } from "./is-main.mjs";
import { ensureGhToken } from "./moneypenny/gh.mjs";
import { AUDIT_MARKER_PATH, LEDGER_BRANCH, readLedgerFile } from "./pr-review/ledger.mjs";
import { DOCS_ONLY, isDeepPath } from "./review-roots.mjs";

const RESEARCH_ROOTS = ["docs/", "src/domain/market-events/"];

export const DEFAULT_MIN = 6;
/** The audit's own cap (post-merge-audit.js refuses more than 40 PRs in one run). */
export const DEFAULT_MAX = 40;
const DAY_MS = 86_400_000;
const SHA = /^[0-9a-f]{7,40}$/;
const RS = "\u001e";
const US = "\u001f";

const under = (roots) => (f) => roots.some((r) => f.startsWith(r));

/** Pure. `git log --format=%x1e%H%x1f%cI%x1f%an%x1f%s --name-only` text → commits, as given. */
export function parseLog(text) {
  return String(text ?? "")
    .split(RS)
    .filter((chunk) => chunk.trim())
    .map((chunk) => {
      const [head, ...rest] = chunk.split("\n");
      const [sha, at, author, subject = ""] = head.split(US);
      const pr =
        /\(#(\d+)\)\s*$/.exec(subject)?.[1] ?? /^Merge pull request #(\d+)\b/.exec(subject)?.[1];
      const files = [...new Set(rest.map((l) => l.trim()).filter(Boolean))];
      return { sha, at, author, subject, pr: pr ? Number(pr) : null, files };
    });
}

/** Pure. One commit's route: `deep` / `standard`, or `excluded` with why. */
export function classify(commit, protectedRules = []) {
  const { files } = commit;
  if (!commit.pr) return { tier: "excluded", why: "no PR" };
  if (/^dependabot\[bot\]$/i.test(commit.author)) return { tier: "excluded", why: "dependabot" };
  if (files.length && files.every(DOCS_ONLY)) return { tier: "excluded", why: "docs-only" };
  if (/^docs\(research\)/.test(commit.subject) && files.every(under(RESEARCH_ROOTS)))
    return { tier: "excluded", why: "research" };
  if (files.some((f) => isDeepPath(f) || breachOf(f, protectedRules))) return { tier: "deep" };
  return { tier: "standard" };
}

/**
 * Pure. Commits oldest first → the verdict. `due` counts every code PR in the window, `prs` holds at
 * most `max` of them, and `through` is the newest commit the listed batch fully accounts for: the
 * head when everything fit, else the last listed PR's commit, so the rest come next time.
 */
export function decide(
  commits,
  { min = DEFAULT_MIN, max = DEFAULT_MAX, rules = [], audited = [] } = {},
) {
  const done = new Set(audited);
  const code = [];
  const excluded = {};
  for (const c of commits) {
    const route = classify(c, rules);
    if (route.tier === "excluded") excluded[route.why] = (excluded[route.why] ?? 0) + 1;
    else if (done.has(c.pr)) excluded["already audited"] = (excluded["already audited"] ?? 0) + 1;
    else {
      done.add(c.pr);
      code.push({ pr: c.pr, sha: c.sha, tier: route.tier });
    }
  }
  const listed = code.slice(0, max);
  const through = code.length > max ? listed.at(-1)?.sha : commits.at(-1)?.sha;
  return {
    due: code.length >= min,
    code: code.length,
    min,
    prs: listed.map((c) => c.pr),
    deep: listed.filter((c) => c.tier === "deep").map((c) => c.pr),
    standard: listed.filter((c) => c.tier === "standard").map((c) => c.pr),
    excluded,
    through: through ?? null,
    left: Math.max(0, code.length - listed.length),
  };
}

/** Pure. The marker file's text → `{at, through, prs}`, or null when it holds nothing usable. */
export function parseMarker(body) {
  let m;
  try {
    m = JSON.parse(String(body ?? ""));
  } catch {
    return null;
  }
  if (!m || Number.isNaN(Date.parse(m.at))) return null;
  return {
    at: m.at,
    through: SHA.test(String(m.through ?? "")) ? m.through : null,
    prs: Array.isArray(m.prs) ? m.prs.filter(Number.isInteger) : [],
  };
}

const flag = (args, name) => {
  const at = args.indexOf(name);
  return at >= 0 ? args[at + 1] : undefined;
};
const count = (args, name, fallback) => {
  const raw = flag(args, name);
  if (raw === undefined) return fallback;
  if (!/^\d+$/.test(raw) || Number(raw) < 1) throw new Error(`${name} needs a whole number ≥ 1`);
  return Number(raw);
};

const LOG_FORMAT = `--format=${RS}%H${US}%cI${US}%an${US}%s`;

/** The window's commits on main, oldest first, through local git: `{commits, from}`. */
function readMain({ git, marker, since }) {
  git("fetch", "-q", "origin", "main");
  const startMs = marker ? Date.parse(marker.at) : since;
  // A cloud session clones ~50 commits deep (the audit's own FIND step says so), and a busy day's
  // merges fall outside that. Deepen back past the window's start, a day early for clock skew.
  if (git("rev-parse", "--is-shallow-repository") === "true")
    git(
      "fetch",
      "-q",
      `--shallow-since=${new Date(startMs - DAY_MS).toISOString()}`,
      "origin",
      "main",
    );
  let range = null;
  if (marker?.through) {
    try {
      git("merge-base", "--is-ancestor", marker.through, "origin/main");
      range = `${marker.through}..origin/main`;
    } catch {
      range = null; // not on main (or not fetched): fall back to the marker's time, said below
    }
  }
  const window = range ? [range] : [`--since=${new Date(startMs).toISOString()}`, "origin/main"];
  const text = git(
    "log",
    "--first-parent",
    "-m",
    "--reverse",
    "--name-only",
    LOG_FORMAT,
    ...window,
  );
  const from = range
    ? `marker through ${marker.through.slice(0, 9)} (${marker.at})`
    : marker
      ? `marker time ${marker.at}${marker.through ? `; its commit ${marker.through.slice(0, 9)} is not on main` : ""}`
      : `${new Date(startMs).toISOString()} (no marker on ${LEDGER_BRANCH} yet)`;
  return { commits: parseLog(text), from };
}

const list = (prs) => prs.map((n) => `#${n}`).join(" ") || "none";

/** Pure. The verdict, for a person or a Routine reading the log. */
export function render(v) {
  const skipped = Object.entries(v.excluded)
    .map(([why, n]) => `${n} ${why}`)
    .join(", ");
  const head = `due: ${v.due} · ${v.code} code PR(s) merged since ${v.from} (due at ${v.min})`;
  const lines = [head, `excluded: ${skipped || "none"}`];
  if (!v.due) return lines.join("\n");
  lines.push(`deep: ${list(v.deep)}`, `standard: ${list(v.standard)}`);
  if (v.left)
    lines.push(`${v.left} more wait for the next audit (over the --max of ${v.prs.length})`);
  lines.push(
    `run: the post-merge-audit workflow with ${JSON.stringify({ prs: v.prs, through: v.through })}`,
    `then: node scripts/agent-meter.mjs --audit-receipt --prs <reviewed> --confirmed <N> --through ${v.through}`,
    "  (--through only when every PR above came back reviewed or skipped: it moves the marker past them all)",
  );
  return lines.join("\n");
}

const defaultGit =
  (cwd) =>
  (...args) =>
    execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

/** The CLI. Seams: `api` (the ledger read), `git`, `cwd`, `now` — so a spec drives it offline. */
export function main(
  args,
  {
    cwd = process.cwd(),
    git = defaultGit(cwd),
    api,
    token = ensureGhToken,
    now = () => Date.now(),
  } = {},
) {
  const min = count(args, "--min", DEFAULT_MIN);
  const max = count(args, "--max", DEFAULT_MAX);
  const sinceArg = flag(args, "--since");
  const since = sinceArg === undefined ? now() - DAY_MS : Date.parse(sinceArg);
  if (Number.isNaN(since)) throw new Error(`--since needs an ISO time, got "${sinceArg}"`);
  if (!api) token();
  // The one REST read. readLedgerFile answers null only for a 404; anything else throws, and exits 1.
  const file = readLedgerFile(AUDIT_MARKER_PATH, api ? { api } : {});
  const marker = file ? parseMarker(file.body) : null;
  if (file && !marker)
    throw new Error(`${AUDIT_MARKER_PATH} on ${LEDGER_BRANCH} holds no readable marker`);
  // A missing envelope.json throws here: an unread protected list must not route a PR as standard.
  const rules = JSON.parse(readFileSync(join(cwd, "envelope.json"), "utf8")).protected ?? [];
  const { commits, from } = readMain({ git, marker, since });
  const verdict = { ...decide(commits, { min, max, rules, audited: marker?.prs ?? [] }), from };
  return args.includes("--json") ? JSON.stringify(verdict, null, 2) : render(verdict);
}

if (isMain(import.meta.url)) {
  try {
    console.log(main(process.argv.slice(2)));
  } catch (err) {
    console.error(`✗ audit-due: ${String(err?.message ?? err).split("\n")[0]} — not a due: false`);
    process.exitCode = 1;
  }
}
