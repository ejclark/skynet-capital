#!/usr/bin/env node
// Run memory: one folder per run, so a run's contract, attempts and working notes outlive its
// context window and can be picked up by a resumed session or a sub-agent (#6470).
//
//   ~/.claude/runs/<run-id>/
//     contract.md          what done means, written before the first attempt
//     attempts.jsonl       one row per attempt or note, append-only
//     agents/<agent-id>/   each agent's private scratch pad
//
// Why attempts refuse rather than warn: a retry that changes nothing pays to reproduce the same
// failure. So `attempt` enforces the two rules a prompt only asks for: a failure class gets a
// budget, and a repeat in that class must name a changed condition no earlier attempt named.
//
// It lives outside any worktree so it survives one being removed, and so agents in different
// worktrees can share a run. Shared memory is reached only through `promote`, which refuses if the
// target changed since it was read: two agents working from the same read cannot silently
// overwrite each other, the gap a plain shared folder leaves.
//
//   run-memory start <slug> --outcome O --scope S --keep K --evidence E --approval A
//   run-memory attempt <run> --class C --action A --changed C --result R [--verified]
//   run-memory note <run> <text>
//   run-memory scratch <run> <agent-id>      prints the agent's scratch path
//   run-memory status <run>                  what a resuming session needs
//   run-memory hash <file>                   the read-time hash to hand back to promote
//   run-memory promote <source> <target> --read-hash H
//
// Exit codes: 0 ok, 2 usage, 3 budget spent, 4 nothing changed, 5 target changed since read.
import { createHash } from "node:crypto";
import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const BUDGET_PER_CLASS = 3;
export const EMPTY_FILE_HASH = "absent";

/** Decide whether another attempt may run. Pure, so the rule is specced apart from the file I/O. */
export function checkAttempt(rows, next) {
  const earlier = rows.filter((row) => row.kind === "attempt" && row.class === next.class);
  if (earlier.length >= BUDGET_PER_CLASS) {
    return {
      ok: false,
      code: 3,
      why: `budget spent: ${earlier.length} attempts in class "${next.class}". Stop and report.`,
    };
  }
  const changed = (next.changed ?? "").trim().toLowerCase();
  if (
    earlier.length > 0 &&
    (!changed || earlier.some((row) => (row.changed ?? "").trim().toLowerCase() === changed))
  ) {
    return {
      ok: false,
      code: 4,
      why: `nothing changed since the last "${next.class}" attempt. A retry must change a condition.`,
    };
  }
  return { ok: true };
}

/** The content hash promote compares, or a marker for a file that does not exist yet. */
export function hashOf(path) {
  return existsSync(path)
    ? createHash("sha256").update(readFileSync(path)).digest("hex")
    : EMPTY_FILE_HASH;
}

function runsDir() {
  return process.env.AGENT_RUNS_DIR ?? join(homedir(), ".claude", "runs");
}

function runPath(run) {
  const path = join(runsDir(), run);
  if (!existsSync(join(path, "contract.md"))) fail(2, `no run "${run}" under ${runsDir()}`);
  return path;
}

function fail(code, message) {
  console.error(`run-memory: ${message}`);
  process.exit(code);
}

function readRows(path) {
  const file = join(path, "attempts.jsonl");
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function flags(args) {
  const out = { _: [] };
  for (let i = 0; i < args.length; i += 1) {
    if (!args[i].startsWith("--")) out._.push(args[i]);
    else if (args[i + 1] === undefined || args[i + 1].startsWith("--"))
      out[args[i].slice(2)] = true;
    else {
      out[args[i].slice(2)] = args[i + 1];
      i += 1;
    }
  }
  return out;
}

function start(f) {
  const slug = f._[0];
  for (const key of ["outcome", "scope", "keep", "evidence", "approval"]) {
    if (typeof f[key] !== "string")
      fail(2, `start needs --${key}: a run states what done means before it begins`);
  }
  if (!/^[a-z0-9-]+$/.test(slug ?? "")) fail(2, "start needs a lowercase slug");
  const run = `${new Date().toISOString().slice(0, 10)}-${slug}`;
  const path = join(runsDir(), run);
  if (existsSync(join(path, "contract.md")))
    fail(2, `run "${run}" already exists; resume it with status`);
  mkdirSync(join(path, "agents"), { recursive: true });
  writeFileSync(
    join(path, "contract.md"),
    `# ${run}\n\n- **Outcome:** ${f.outcome}\n- **In scope:** ${f.scope}\n- **Must not change:** ${f.keep}\n- **Evidence of done:** ${f.evidence}\n- **Needs approval:** ${f.approval}\n`,
  );
  console.log(run);
}

function attempt(f) {
  const path = runPath(f._[0]);
  if (typeof f.class !== "string" || typeof f.action !== "string")
    fail(2, "attempt needs --class and --action");
  const row = {
    kind: "attempt",
    at: new Date().toISOString(),
    class: f.class,
    action: f.action,
    changed: typeof f.changed === "string" ? f.changed : "",
    result: typeof f.result === "string" ? f.result : "",
    verified: f.verified === true,
  };
  const check = checkAttempt(readRows(path), row);
  if (!check.ok) fail(check.code, check.why);
  appendFileSync(join(path, "attempts.jsonl"), `${JSON.stringify(row)}\n`);
}

function note(f) {
  const path = runPath(f._[0]);
  const row = { kind: "note", at: new Date().toISOString(), text: f._.slice(1).join(" ") };
  appendFileSync(join(path, "attempts.jsonl"), `${JSON.stringify(row)}\n`);
}

function scratch(f) {
  const agent = f._[1];
  if (!/^[A-Za-z0-9._-]+$/.test(agent ?? "")) fail(2, "scratch needs an agent id");
  const path = join(runPath(f._[0]), "agents", agent);
  mkdirSync(path, { recursive: true });
  console.log(path);
}

function status(f) {
  const path = runPath(f._[0]);
  console.log(readFileSync(join(path, "contract.md"), "utf8"));
  for (const row of readRows(path)) {
    if (row.kind === "note") console.log(`${row.at} note: ${row.text}`);
    else
      console.log(
        `${row.at} [${row.class}]${row.verified ? " VERIFIED" : ""} ${row.action}${row.changed ? ` (changed: ${row.changed})` : ""}: ${row.result}`,
      );
  }
}

function promote(f) {
  const [source, target] = f._;
  if (!(source && target) || typeof f["read-hash"] !== "string")
    fail(2, "promote needs <source> <target> --read-hash H");
  if (!existsSync(source)) fail(2, `no source file ${source}`);
  if (hashOf(target) !== f["read-hash"]) {
    fail(
      5,
      `${target} changed since it was read. Re-read it, merge, and promote with the new hash.`,
    );
  }
  mkdirSync(dirname(target), { recursive: true });
  // A rename, so a reader never sees half a file.
  const temp = `${target}.promote-${process.pid}`;
  copyFileSync(source, temp);
  renameSync(temp, target);
  console.log(hashOf(target));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, ...rest] = process.argv.slice(2);
  const f = flags(rest);
  const commands = {
    start,
    attempt,
    note,
    scratch,
    status,
    promote,
    hash: (x) => console.log(hashOf(x._[0])),
  };
  if (!commands[command])
    fail(
      2,
      "usage: run-memory start|attempt|note|scratch|status|hash|promote (see the file header)",
    );
  commands[command](f);
}
