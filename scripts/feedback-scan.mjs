#!/usr/bin/env node
// FEEDBACK LANE SCOREBOARD — how often a member actually gets an answer, and how fast.
//
//   node scripts/feedback-scan.mjs                     # human-readable table
//   node scripts/feedback-scan.mjs --json              # machine-readable, for the digest
//   node scripts/feedback-scan.mjs --fixture f.json    # score a fixture, no gh, no network
//
// WHY: until 2026-08-22 the only number describing this lane was a sentence someone hand-counted by
// reading GitHub — `.github/prompts/feedback-build.md` said "exactly one reached a merge without a
// human touch". It was optimistic. Measured properly, 0 of 7 had gone filed→built→merged→closed,
// because the one clean build (#447) shipped, released as v1.181.1, and never closed.
//
// THE METRIC IS ERIC'S (2026-08-22): "member got a real answer, fast". Not "did it ship" — a fast,
// honest "which page was this on?" serves the member; silence never does. So `answered` counts a
// merged PR, a shipped slice, AND a question back; the number that matters is time-to-first-answer
// and the count that got none.
//
// Read-only, no network writes. Uses `gh`, which is present wherever Moneypenny runs.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { ghRest } from "./moneypenny/gh.mjs";
import { LABELS } from "./moneypenny/index.mjs";

// One vocabulary, not a set of string literals that can drift from it (#500). This scan is the
// concrete consequence that issue names: it classifies by label, so a label it spells differently
// from the lane that applies one is an issue that appears in no queue and no digest.
const TERMINAL = [LABELS.needsInfo.name, LABELS.nextSlice.name, LABELS.needsEric.name];

const gh = (args) => execFileSync("gh", args, { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });

/**
 * `gh` with its most common failure translated. An unknown `--json` field exits non-zero with the
 * field name and the allow-list on stderr; the raw error is `Command failed: gh issue list …`,
 * which says nothing about the cause. #813 was exactly this, and it read as "gh is unreachable".
 */
function ghJson(args) {
  try {
    return gh(args);
  } catch (err) {
    const detail = String(err.stderr || err.message);
    const unknown = detail.match(/Unknown JSON field: "?([^"\s]+)"?/);
    if (unknown) {
      throw new Error(
        `feedback-scan: gh does not know the JSON field "${unknown[1]}" — it was renamed. ` +
          `Fix the field list in fetchIssues(), and check tests/arch/gh-json-fields.spec.ts.`,
      );
    }
    throw err;
  }
}

/**
 * Every `feedback` issue with the fields an outcome needs, with the closing PRs hydrated.
 *
 * TWO NAMES, TWO SHAPES (#813). `gh` renamed `closedByPullRequests` to
 * `closedByPullRequestsReferences` and, in doing so, dropped `state` and `createdAt` from each
 * element — the two fields this scoreboard is built on. `outcomeOf` needs `state` to tell a
 * shipped issue from a labelled one, and `firstAnswerAt` uses `createdAt` as a candidate for
 * time-to-first-answer. So the rename alone is not the fix; the missing fields have to come back
 * from somewhere.
 *
 * They come from REST, one read per referenced PR, on the plentiful core bucket — never a second
 * `gh --json` call, which compiles to GraphQL and is the scarce one the postmaster already
 * exhausted once (docs/LESSONS.md, 2026-08-26). The scorers keep reading `closedByPullRequests`
 * in its original `{state, createdAt}` shape, so every pure function and fixture below is
 * untouched: the rename is absorbed here, at the I/O edge, where it belongs.
 */
function fetchIssues() {
  const issues = JSON.parse(
    ghJson([
      "issue",
      "list",
      "--state",
      "all",
      "--label",
      LABELS.feedback.name,
      "--limit",
      "200",
      "--json",
      "number,title,state,createdAt,closedAt,labels,comments,closedByPullRequestsReferences,body",
    ]) || "[]",
  );
  return issues.map((issue) => ({
    ...issue,
    closedByPullRequests: hydrateClosingPrs(issue.closedByPullRequestsReferences ?? []),
  }));
}

/**
 * `{number}` → `{state, createdAt}` for each closing reference, read over REST.
 *
 * Memoised per run: several issues can close on the same PR. A reference we cannot read degrades
 * to `undefined` and is dropped rather than counted as merged — the conservative direction, since
 * a wrongly-merged reading would inflate the lane's own success rate, which is the one number this
 * scoreboard exists to keep honest.
 *
 * Same-repo only. A closing PR in another repository would need its own path; none exist here, and
 * inventing one unused would be a second code path nothing exercises.
 */
const prCache = new Map();
function hydrateClosingPrs(refs) {
  const out = [];
  for (const ref of refs) {
    const number = Number(ref?.number);
    if (!Number.isInteger(number)) continue;
    if (!prCache.has(number)) {
      try {
        const pr = ghRest(`pulls/${number}`);
        prCache.set(number, { state: pr.merged ? "MERGED" : "UNMERGED", createdAt: pr.created_at });
      } catch {
        prCache.set(number, undefined);
      }
    }
    const hydrated = prCache.get(number);
    if (hydrated) out.push(hydrated);
  }
  return out;
}

/**
 * The first moment a member could see an answer: the earliest of a linked PR, a terminal label, or
 * a comment that is not the lane's own "a build session has started" receipt. Pure.
 */
export function firstAnswerAt(issue) {
  const times = [];
  for (const c of issue.comments ?? []) {
    const body = String(c.body ?? "");
    // The receipt promises work; it is not an answer. Everything else the lane says is.
    if (/build session has started|🔇|⏱/.test(body)) continue;
    if (c.createdAt) times.push(Date.parse(c.createdAt));
  }
  for (const p of issue.closedByPullRequests ?? []) {
    if (p.createdAt) times.push(Date.parse(p.createdAt));
  }
  if (issue.closedAt) times.push(Date.parse(issue.closedAt));
  const earliest = times.filter(Number.isFinite).sort((a, b) => a - b)[0];
  return earliest ?? null;
}

/** Classify one issue into the lane's terminal states. Pure — this is the whole scoreboard. */
export function outcomeOf(issue) {
  const labels = (issue.labels ?? []).map((l) => l.name);
  const merged = (issue.closedByPullRequests ?? []).filter((p) => p.state === "MERGED");
  const answeredAt = firstAnswerAt(issue);
  const hours = answeredAt
    ? Math.round(((answeredAt - Date.parse(issue.createdAt)) / 3_600_000) * 10) / 10
    : null;

  let outcome = "no-answer";
  if (merged.length && issue.state === "CLOSED") outcome = "shipped-and-closed";
  else if (merged.length) outcome = "shipped-not-closed";
  else if (labels.includes(LABELS.needsEric.name)) outcome = LABELS.needsEric.name;
  else if (labels.includes(LABELS.needsInfo.name)) outcome = LABELS.needsInfo.name;
  else if (labels.includes(LABELS.nextSlice.name)) outcome = LABELS.nextSlice.name;
  else if (issue.state === "CLOSED") outcome = "closed-without-pr";

  return {
    number: issue.number,
    title: issue.title,
    outcome,
    answered: outcome !== "no-answer",
    hoursToAnswer: hours,
    curated: labels.includes(LABELS.curated.name),
    rounds: roundsOf(issue.body),
    terminal: labels.filter((l) => TERMINAL.includes(l)),
  };
}

/**
 * The coach's round count, out of the fenced spec block. This field has been written into every
 * curated issue since 2026-08-22 and read by NOTHING — which made the promise that the round ceiling
 * would be "set from the observed distribution" empty. This is the reader.
 */
export function roundsOf(body = "") {
  const block = /```skynet-spec\s*\n([\s\S]*?)\n```/.exec(String(body ?? ""));
  if (!block) return null;
  try {
    const rounds = JSON.parse(block[1]).rounds;
    return Number.isFinite(rounds) ? rounds : null;
  } catch {
    return null;
  }
}

/** Roll the per-issue rows into the numbers worth reporting. Pure. */
export function scoreboard(rows) {
  const answered = rows.filter((r) => r.answered);
  const times = answered.map((r) => r.hoursToAnswer).filter((h) => h !== null);
  const median = times.length
    ? [...times].sort((a, b) => a - b)[Math.floor(times.length / 2)]
    : null;
  const byOutcome = {};
  for (const r of rows) byOutcome[r.outcome] = (byOutcome[r.outcome] ?? 0) + 1;
  const roundCounts = rows.map((r) => r.rounds).filter((r) => r !== null);
  return {
    filed: rows.length,
    answered: answered.length,
    answeredPct: rows.length ? Math.round((answered.length / rows.length) * 100) : 0,
    noAnswer: rows.length - answered.length,
    medianHoursToAnswer: median,
    byOutcome,
    curated: rows.filter((r) => r.curated).length,
    rounds: roundCounts.length
      ? {
          n: roundCounts.length,
          median: [...roundCounts].sort((a, b) => a - b)[Math.floor(roundCounts.length / 2)],
          max: Math.max(...roundCounts),
        }
      : null,
  };
}

function main(argv) {
  const fixture = argv[argv.indexOf("--fixture") + 1];
  let issues;
  if (argv.includes("--fixture") && fixture) {
    issues = JSON.parse(readFileSync(fixture, "utf8"));
  } else {
    try {
      issues = fetchIssues();
    } catch (err) {
      console.error(
        `feedback-scan: could not reach gh — ${String(err.message).split("\n")[0]}\n` +
          "This runs where Moneypenny runs; locally, pass --fixture to score a saved list.",
      );
      process.exit(2);
    }
  }
  const rows = issues.map(outcomeOf);
  const score = scoreboard(rows);
  if (argv.includes("--json")) {
    console.log(JSON.stringify({ score, rows }, null, 2));
    return;
  }
  console.log("📮 Feedback lane — did the member get an answer?\n");
  for (const r of rows.sort((a, b) => b.number - a.number)) {
    const when = r.hoursToAnswer === null ? "  —  " : `${String(r.hoursToAnswer).padStart(5)}h`;
    console.log(
      `  #${String(r.number).padEnd(4)} ${when}  ${r.outcome.padEnd(19)}${r.curated ? " curated" : ""}${r.rounds !== null ? ` rounds=${r.rounds}` : ""}  ${r.title.slice(0, 46)}`,
    );
  }
  console.log(
    `\n  ${score.answered}/${score.filed} answered (${score.answeredPct}%) · median ${score.medianHoursToAnswer ?? "—"}h · ${score.noAnswer} got nothing`,
  );
  console.log(
    `  outcomes: ${Object.entries(score.byOutcome)
      .map(([k, v]) => `${k}=${v}`)
      .join(" · ")}`,
  );
  if (score.rounds) {
    console.log(
      `  coach rounds: n=${score.rounds.n} median=${score.rounds.median} max=${score.rounds.max}`,
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2));
