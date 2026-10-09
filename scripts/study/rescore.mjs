#!/usr/bin/env node
// Re-grade a round's finished sessions after an oracle fix, without re-running a single session.
//
//   node scripts/study/rescore.mjs <round dir>
//
// The oracle's verdict has two halves: was the answer right (gradeAnswer, pure over the member's own
// `done` text and the frozen task) and was its place ever on screen (region, measured live — already
// in summary.json). Only the first half can be wrong after the fact, so only it is recomputed. Each
// re-graded summary keeps its previous verdict under `oracle.rescored.previous`, so a changed number in
// a readout can always be traced to the rule that changed it (first full round, 2026-10-09: a
// listing rule failed right answers that gave their breakdown).

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gradeAnswer, SEEN_MIN } from "./oracle.mjs";
import { SESSIONS } from "./round-contract.mjs";

/** The oracle verdict re-graded against `task`; `region` and `endedBy` are kept as measured. */
export function rescoreOracle(oracle, task, { rule, at }) {
  if (oracle.endedBy !== "done") return { changed: false, oracle };
  const answer = { given: oracle.answer.given, ...gradeAnswer(oracle.answer.given, task.answer) };
  const success = answer.matched && oracle.region.seen;
  const reason = success
    ? "answer matches and its place was on screen"
    : !answer.matched
      ? answer.why
      : `answer region never ≥ ${SEEN_MIN * 100}% on screen (best ${Math.round(oracle.region.ratio * 100)}%)`;
  const changed = success !== oracle.success || answer.why !== oracle.answer.why;
  if (!changed) return { changed: false, oracle };
  const { rescored: _prior, ...previous } = oracle;
  return {
    changed: true,
    oracle: { ...oracle, success, answer, reason, rescored: { rule, at, previous } },
  };
}

/** Every summary.json under a directory. */
function summaries(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...summaries(path));
    else if (name === "summary.json") out.push(path);
  }
  return out;
}

function main(argv) {
  const round = argv[0];
  const rule = argv[argv.indexOf("--rule") + 1] ?? "oracle rule change";
  if (!(round && existsSync(join(round, SESSIONS))))
    throw new Error("usage: rescore.mjs <round dir> [--rule <why>]");
  const at = new Date().toISOString();
  let changed = 0;
  let total = 0;
  for (const path of summaries(join(round, SESSIONS))) {
    const summary = JSON.parse(readFileSync(path, "utf8"));
    const taskFile = join(round, "4-tasks", "tasks", `${summary.task}.json`);
    if (!existsSync(taskFile)) throw new Error(`no frozen task for ${summary.task}`);
    total++;
    const r = rescoreOracle(summary.oracle, JSON.parse(readFileSync(taskFile, "utf8")), {
      rule,
      at,
    });
    if (!r.changed) continue;
    changed++;
    writeFileSync(path, `${JSON.stringify({ ...summary, oracle: r.oracle }, null, 1)}\n`);
    console.log(
      `${summary.task}: ${r.oracle.rescored.previous.success ? "pass" : "fail"} → ${r.oracle.success ? "pass" : "fail"} (${r.oracle.reason})`,
    );
  }
  console.log(`rescore: ${changed} of ${total} session(s) re-graded`);
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2));
