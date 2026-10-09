#!/usr/bin/env node
// THE GRADER (#4943) — scores a round's findings against the sealed answer key and writes grade.json.
//
//   node scripts/study/grade.mjs --sealed <dir> --round <dir> [--struck <file>]
//        [--negative <control round>] [--positive <control round>] [--out <grade.json>]
//        [--matches-1 f] [--matches-2 f] [--tiebreak f] [--checks f] [--touches f]
//
// The sealed key is read ONLY from the --sealed directory given (gold.md + primes.json), never a
// default path: the key lives outside every repo, and a grader that reached for it on its own
// would be one stray run from leaking it. The round's layout is round-files.mjs's header; the
// matcher, checker and touch files default to their names inside the round. `--struck` is the list
// of key items parity proved cannot render (a JSON array or one id a line).
//
// What it decides is grade-round.mjs (the assembly) over grade-core.mjs (the arithmetic). It writes
// grade.json even when the inputs have problems (an unlabelled finding, an unknown id), prints
// them, and exits 1 — a grade built on a half-labelled round is not one to read out.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseGold } from "./grade-core.mjs";
import { gradeRound } from "./grade-round.mjs";
import { findSessions, readJson, readJsonl, readList, readOptional } from "./round-files.mjs";

const USAGE =
  "usage: grade.mjs --sealed <dir> --round <dir> [--struck <file>] [--negative <dir>] " +
  "[--positive <dir>] [--out <file>] [--matches-1 f] [--matches-2 f] [--tiebreak f] " +
  "[--checks f] [--touches f]";

/** The command line, checked; throws the usage line naming what is missing. */
export function gradeArgs(argv) {
  const get = (flag) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const opts = {
    sealed: get("--sealed"),
    round: get("--round"),
    struck: get("--struck"),
    negative: get("--negative"),
    positive: get("--positive"),
    out: get("--out"),
    files: {
      m1: get("--matches-1"),
      m2: get("--matches-2"),
      tiebreak: get("--tiebreak"),
      checks: get("--checks"),
      touches: get("--touches"),
    },
  };
  const missing = ["sealed", "round"].filter((k) => !opts[k]);
  if (missing.length) throw new Error(`missing --${missing.join(", --")}\n${USAGE}`);
  return opts;
}

/** A control round: its findings, matcher files and what it expects (control.json). */
function loadControl(dir) {
  if (!dir) return null;
  const control = readJson(join(dir, "control.json"));
  return {
    expect: control.expect,
    findings: readJsonl(join(dir, "findings.jsonl")),
    m1: readJson(join(dir, "matches-1.json")),
    m2: readJson(join(dir, "matches-2.json")),
    tiebreak: readOptional(join(dir, "tiebreak.json"), []),
  };
}

/** Every input gradeRound takes, read from disk. */
export function loadRound(opts) {
  const round = resolve(opts.round);
  const at = (key, name) => opts.files?.[key] ?? join(round, name);
  const goldPath = join(opts.sealed, "gold.md");
  const primesPath = join(opts.sealed, "primes.json");
  for (const p of [goldPath, primesPath])
    if (!existsSync(p)) throw new Error(`the sealed folder has no ${p.split("/").at(-1)}`);
  return {
    gold: parseGold(readFileSync(goldPath, "utf8")),
    primes: readJson(primesPath),
    findings: readJsonl(join(round, "findings.jsonl")),
    classes: readJson(join(round, "classes.json")),
    m1: readJson(at("m1", "matches-1.json")),
    m2: readJson(at("m2", "matches-2.json")),
    tiebreak: readOptional(at("tiebreak", "tiebreak.json"), []),
    checks: readOptional(at("checks", "checks.json"), []),
    touches: readOptional(at("touches", "touches.json"), null),
    struck: opts.struck ? readList(opts.struck) : [],
    sessions: findSessions(round).map((s) => ({
      member: s.member,
      success: !!s.summary.oracle?.success,
      ease: s.summary.ease?.score ?? null,
    })),
    negative: loadControl(opts.negative),
    positive: loadControl(opts.positive),
  };
}

const pct = (x) => (x === null ? "n/a" : `${Math.round(x * 100)}%`);

function main(argv) {
  const opts = gradeArgs(argv);
  const grade = gradeRound(loadRound(opts));
  const out = resolve(opts.out ?? join(opts.round, "grade.json"));
  writeFileSync(out, `${JSON.stringify(grade, null, 2)}\n`);
  const h = grade.headline;
  const b = grade.classes.blind;
  console.log(
    `grade: found ${h.found} of ${h.renders} blind (${pct(b.thoroughness.rate)}; ${h.struck} struck)` +
      ` · validity ${pct(b.validity.rate)} · ${h.structural} structural · ${h.smaller} smaller` +
      ` · matchers kappa ${grade.agreement.kappa ?? "n/a"} · bar ${grade.gate.pass ? "PASSED" : "missed"} → ${out}`,
  );
  for (const p of grade.problems) console.error(`grade: problem — ${p}`);
  return grade.problems.length ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  }
}
