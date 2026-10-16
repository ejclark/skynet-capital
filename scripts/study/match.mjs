#!/usr/bin/env node
// THE MATCH RUN (#5218) — labels one round's findings against the sealed key and writes the files
// grade.mjs reads: matches-1.json, matches-2.json and (when the two disagree) tiebreak.json.
//
//   node scripts/study/match.mjs --sealed <dir> --round <dir> [--expect <file>] [--chunk <n>]
//        [--stub <dir>]
//
// Round one's matchers ran from a prompt and a script kept only in one session's scratchpad; this
// is that script, in the repo, on the rubric in docs/members/study/roles/matcher.md. Every call
// goes through sealed.mjs (an empty temp dir, no tools): the key and a control's --expect file are
// handed over in the message, so the matcher never reads the sealed folder itself and can never
// write to it. The key is read ONLY from --sealed, as grade.mjs reads it.
//
// Each call is recorded under <round>/match/requests/ — a re-run replays what it already paid for,
// and usage.mjs prices it like any other step. What each matcher left out is asked again once
// (match-core.mjs); anything still missing is printed by id and the run exits 1, so a half-labelled
// round never reaches the grader looking whole. `--stub` answers from <dir>/<role>/<n>.json
// (roles: matcher-1, matcher-2, tiebreak) — the dry run the spec drives.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { CHUNK, matchReport, runMatch } from "./match-core.mjs";
import { FILES } from "./round-contract.mjs";
import { expectEntries } from "./round-control.mjs";
import { readJson, readJsonl, readList } from "./round-files.mjs";
import { makeCaller, ROLES, readSchema, signedIn, userMessage } from "./sealed.mjs";
import { readRequests, sumUsage } from "./usage.mjs";

const USAGE =
  "usage: match.mjs --sealed <dir> --round <dir> [--expect <file>] [--chunk <n>] [--stub <dir>]";
/** The recorded calls' folder inside the round. */
export const MATCH_DIR = "match";
/** One matcher call reads the key and up to CHUNK findings; the experts' batches took up to ~3 min. */
const TIMEOUT_MS = 10 * 60_000;

/** The command line, checked; throws the usage line naming what is missing. */
export function matchArgs(argv) {
  const get = (flag) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const chunk = get("--chunk");
  const opts = {
    sealed: get("--sealed"),
    round: get("--round"),
    expect: get("--expect"),
    stub: get("--stub"),
    chunk: chunk === undefined ? CHUNK : Number(chunk),
  };
  const missing = ["sealed", "round"].filter((k) => !opts[k]);
  if (missing.length) throw new Error(`missing --${missing.join(", --")}\n${USAGE}`);
  if (!(Number.isInteger(opts.chunk) && opts.chunk > 0))
    throw new Error(`--chunk must be a whole number above 0\n${USAGE}`);
  return opts;
}

const write = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 1)}\n`);

/** Runs the match and writes its files; resolves to the exit code. */
export async function main(argv) {
  const opts = matchArgs(argv);
  const round = resolve(opts.round);
  const goldPath = join(resolve(opts.sealed), "gold.md");
  if (!existsSync(goldPath)) throw new Error(`no gold.md in --sealed ${opts.sealed}`);
  const findings = readJsonl(join(round, FILES.unlabelled));
  if (findings.length === 0) throw new Error(`${FILES.unlabelled} in ${opts.round} is empty`);
  // A control round names its expected ids in control.json, but only --expect carries mechanisms.
  const control = existsSync(join(round, FILES.control))
    ? readJson(join(round, FILES.control))
    : null;
  if (control && !opts.expect)
    throw new Error(
      `${opts.round} is a ${control.kind} control: pass its --expect file, the matchers judge each id by the mechanism written there`,
    );
  const expect = opts.expect ? expectEntries(readList(resolve(opts.expect))) : [];
  if (!opts.stub) {
    const auth = signedIn();
    if (!auth.ok) throw new Error(auth.why);
  }

  const requests = join(round, MATCH_DIR, "requests");
  const caller = makeCaller({ stub: opts.stub && resolve(opts.stub), record: requests });
  const rolePath = join(ROLES, "matcher.md");
  const schema = readSchema("matcher");
  const result = await runMatch({
    findings,
    gold: readFileSync(goldPath, "utf8"),
    expect,
    size: opts.chunk,
    message: (text) => userMessage(text),
    call: ({ role, n, message }) =>
      caller({ role, n, rolePath, schema, message, timeoutMs: TIMEOUT_MS }),
  });

  write(join(round, FILES.m1), result.m1);
  write(join(round, FILES.m2), result.m2);
  if (result.disputed.length > 0) write(join(round, FILES.tiebreak), result.tiebreak);
  const { lines, complete } = matchReport(findings.length, result);
  mkdirSync(join(round, MATCH_DIR), { recursive: true });
  write(join(round, MATCH_DIR, "coverage.json"), {
    findings: findings.length,
    disputed: result.disputed,
    left: result.left,
    stray: result.stray,
    complete,
  });
  const cost = sumUsage(readRequests(join(round, MATCH_DIR)));
  for (const l of lines) console.log(l);
  console.log(
    `${result.calls} calls · ${cost.replayed} replayed · $${cost.cost_usd} (the CLI's estimate)`,
  );
  if (!complete) {
    console.error(
      // A plain re-run replays the recorded second pass, skips and all; only a deleted record asks again.
      `match: some findings are still unlabelled after the second pass — label the listed ids by hand, or delete that role's last call in ${MATCH_DIR}/requests/ and re-run to ask it once more`,
    );
    return 1;
  }
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (e) => {
      console.error(e.message);
      process.exitCode = 2;
    },
  );
}
