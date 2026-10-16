#!/usr/bin/env node
// THE GRADER (#4943) — scores a round's findings against the sealed answer key and writes grade.json.
//
//   node scripts/study/grade.mjs --sealed <dir> --round <dir> [--struck <file>]
//        [--negative <control round>] [--positive <control round>] [--out <grade.json>]
//        [--matches-1 f] [--matches-2 f] [--tiebreak f] [--checks f] [--touches f]
//
// The sealed key is read ONLY from the --sealed directory given (gold.md + primes.json), never a
// default path: the key lives outside every repo, and a grader that reached for it on its own
// would be one stray run from leaking it. The round's layout is round-contract.mjs's header; the
// matcher, checker, touch and strike files default to their names inside the round. `--struck` is
// the list of key items parity proved cannot render (a JSON array or one id a line); without it the
// round's own struck.json is read when there is one.
//
// What it decides is grade-round.mjs (the assembly) over grade-core.mjs (the arithmetic). It writes
// grade.json even when the inputs have problems (an unlabelled finding, an unknown id), prints
// them, and exits 1 — a grade built on a half-labelled round is not one to read out.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseGold } from "./grade-core.mjs";
import { gradeRound } from "./grade-round.mjs";
import { FILES } from "./round-contract.mjs";
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

/**
 * A control round (round.mjs --frozen-from … --control <kind>): its findings, matcher files,
 * sessions (whether each reached its build) and control.json — what it expects, and the record
 * gradeRound holds to the contract (its kind, the main round's freeze, another pin). A dir with no
 * control.json is refused: it is not a control round.
 */
function loadControl(dir) {
  if (!dir) return null;
  const file = join(dir, FILES.control);
  if (!existsSync(file)) throw new Error(`${dir} holds no ${FILES.control} — not a control round`);
  const control = readJson(file);
  return {
    record: control,
    expect: control.expect,
    findings: readJsonl(join(dir, FILES.findings)),
    m1: readJson(join(dir, FILES.m1)),
    m2: readJson(join(dir, FILES.m2)),
    tiebreak: readOptional(join(dir, FILES.tiebreak), []),
    sessions: findSessions(dir).map((s) => ({ success: !!s.summary.oracle?.success })),
  };
}

/**
 * The struck key items: `--struck` when given, else the round's own struck.json when it has one.
 * A strike left behind would keep an item that cannot render in the denominator, silently.
 */
function struckList(given, round) {
  if (given) return readList(given);
  const own = join(round, FILES.struck);
  return existsSync(own) ? readList(own) : [];
}

/**
 * Every input gradeRound takes, read from disk. A control round passed as `--round` is refused:
 * one run, one expert, another build — its recall is no headline.
 */
export function loadRound(opts) {
  const round = resolve(opts.round);
  const mode = readOptional(join(round, "round.json"), null);
  if (existsSync(join(round, FILES.control)) || mode?.control) {
    throw new Error(`${round} is a control round — pass it as --negative or --positive`);
  }
  const at = (key, name) => opts.files?.[key] ?? join(round, name);
  const goldPath = join(opts.sealed, "gold.md");
  const primesPath = join(opts.sealed, "primes.json");
  for (const p of [goldPath, primesPath])
    if (!existsSync(p)) throw new Error(`the sealed folder has no ${p.split("/").at(-1)}`);
  return {
    gold: parseGold(readFileSync(goldPath, "utf8")),
    primes: readJson(primesPath),
    findings: readJsonl(join(round, FILES.findings)),
    classes: readJson(join(round, FILES.classes)),
    m1: readJson(at("m1", FILES.m1)),
    m2: readJson(at("m2", FILES.m2)),
    tiebreak: readOptional(at("tiebreak", FILES.tiebreak), []),
    checks: readOptional(at("checks", FILES.checks), []),
    touches: readOptional(at("touches", FILES.touches), null),
    struck: struckList(opts.struck, round),
    sessions: findSessions(round).map((s) => ({
      member: s.member,
      success: !!s.summary.oracle?.success,
      ease: s.summary.ease?.score ?? null,
    })),
    negative: loadControl(opts.negative),
    positive: loadControl(opts.positive),
    frozen: readOptional(join(round, FILES.frozen), null)?.sha256 ?? null,
  };
}

const pct = (x) => (x === null ? "n/a" : `${Math.round(x * 100)}%`);

function main(argv) {
  const opts = gradeArgs(argv);
  const grade = gradeRound(loadRound(opts));
  const out = resolve(opts.out ?? join(opts.round, FILES.grade));
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
