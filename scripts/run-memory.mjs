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
// Exit codes: 0 ok, 2 usage, 3 budget spent, 4 nothing changed, 5 target changed since read,
// 6 another promote still holds the target, 7 an index a session would cut off.
//
// Seam: AGENT_LOCK_WAIT_MS shortens the wait on a held lock, for specs.
import { spawnSync } from "node:child_process";
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
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { LockBusyError, withFileLock } from "./file-lock.mjs";

export const BUDGET_PER_CLASS = 3;
export const EMPTY_FILE_HASH = "absent";
const INDEX_LINE_LIMIT = 200;
// The loader's own number, read from the installed harness (2.1.263), not the vendor docs' "25KB",
// which reads as 25,600 and let through 600 bytes a session cuts.
const INDEX_BYTE_LIMIT = 25_000;
const LOCK_WAIT_MS = 10_000;
const HISTORY_HOOK = new URL("./hooks/memory-history.mjs", import.meta.url);

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

/**
 * Why an index would be cut off when a session loads it, or null when it fits. Past the limit the
 * harness loads only part of it and adds a warning line, so the entries past the cut are gone for that
 * session. The loader measures trimmed characters; bytes are never fewer, so this never passes what it
 * cuts, and may refuse a heavily multibyte index early. A final newline ends the last line and does
 * not start another.
 */
export function indexOverLimit(text) {
  const lines = text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
  if (lines > INDEX_LINE_LIMIT)
    return `${lines} lines; a session loads only the first ${INDEX_LINE_LIMIT}`;
  const bytes = Buffer.byteLength(text);
  if (bytes > INDEX_BYTE_LIMIT)
    return `${bytes} bytes; a session loads only the first ${INDEX_BYTE_LIMIT}`;
  return null;
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

/**
 * A promote is a rename, so no tool hook fires for it, and the history hook stages only the file it
 * is fired for. So promote fires it, and the hook itself ignores any path outside a memory folder.
 * A missing version is reported and does not undo the promote, which has already landed.
 */
function recordVersion(target) {
  const res = spawnSync(process.execPath, [fileURLToPath(HISTORY_HOOK)], {
    input: JSON.stringify({
      tool_name: "promote",
      tool_input: { file_path: resolve(target) },
      session_id: process.env.CLAUDE_CODE_SESSION_ID,
      // This process cannot tell a sub-agent from the main session, so it names itself and not "main".
      agent_type: "run-memory",
      cwd: process.cwd(),
    }),
    stdio: ["pipe", "ignore", "pipe"],
    encoding: "utf8",
  });
  if (res.status !== 0) console.error(res.stderr?.trim() || "run-memory: no version recorded");
}

function promote(f) {
  const [source, target] = f._;
  if (!(source && target) || typeof f["read-hash"] !== "string")
    fail(2, "promote needs <source> <target> --read-hash H");
  if (!existsSync(source)) fail(2, `no source file ${source}`);
  if (basename(target) === "MEMORY.md") {
    const over = indexOverLimit(readFileSync(source, "utf8"));
    if (over) fail(7, `refusing: MEMORY.md would be ${over}. Move detail into topic files first.`);
  }
  mkdirSync(dirname(target), { recursive: true });
  // The check and the rename are one step under the lock, or writers from the same read all pass the
  // check and all rename. Nothing in here may call fail: process.exit would skip the release.
  let outcome;
  try {
    outcome = withFileLock(
      `${target}.lock`,
      () => {
        if (hashOf(target) !== f["read-hash"]) return { changed: true };
        // A rename, so a reader never sees half a file.
        const temp = `${target}.promote-${process.pid}`;
        copyFileSync(source, temp);
        renameSync(temp, target);
        // Under the lock, so the version holds this promote's content and not the next one's.
        recordVersion(target);
        return { hash: hashOf(target) };
      },
      { waitMs: Number(process.env.AGENT_LOCK_WAIT_MS ?? LOCK_WAIT_MS) },
    );
  } catch (error) {
    if (error instanceof LockBusyError) fail(6, `${error.message}. Try the promote again.`);
    throw error;
  }
  if (outcome.changed)
    fail(
      5,
      `${target} changed since it was read. Re-read it, merge, and promote with the new hash.`,
    );
  console.log(outcome.hash);
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
