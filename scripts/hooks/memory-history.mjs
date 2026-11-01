#!/usr/bin/env node
// Memory history — a PostToolUse hook that gives the shared auto-memory folder a version per change.
//
//   .claude/settings.json → hooks.PostToolUse (matcher "Write|Edit") → node scripts/hooks/memory-history.mjs
//
// WHY (#6470): every worktree on this machine shares one memory folder, and it had no history, so a
// bad write could not be seen or undone. Anthropic's production guidance for agent memory leads with
// this: store versions, and record which session and agent made each one. Git already does the rest.
//
// WHY ONE FILE AT A TIME: many sessions share this folder, so staging the whole folder committed
// another session's file under this session's name, and git's index lock made the losers fail
// silently (10 staggered writers: 1 commit, 5 failures, 9 files under the wrong session). Each hook
// now stages and commits only the file it was fired for. One gap stays: two sessions writing the
// SAME file before the first hook runs share a version, named for whichever hook got there first,
// because the hook only sees what is on disk.
//
// WHY A LOCK AS WELL, when git has its own: with per-file commits and lock retries alone, 3 of 13
// runs at 50 writers still left a file unversioned with exit 0. The file ends up untracked after its
// add succeeded, which fits `git commit -- <file>` reading the index before it takes git's lock and
// writing that older copy back. So hooks take turns here, and the retries are left for a git process
// outside this hook, such as someone reading the folder's history by hand.
//
// The folder's repo is local with no remote: memories are private and machine-local by design.
// Records provenance only, never content beyond the diff git keeps. Bad input exits 0, since a hook
// must never break the session that fired it. A version that cannot land is the one failure worth
// saying out loud: it exits 2 with a one-line reason, and prints the same line as a systemMessage.
// The JSON is there because settings.json runs this as `async` behind `2>/dev/null || true`, which
// drops stderr and the exit code but not stdout (docs/vendor/claude-code/hooks.md → async hooks).
//
// Seam: AGENT_MEMORY_ROOT overrides the path test, for specs.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pause, withFileLock } from "../file-lock.mjs";

// Tries against a git process outside this hook, about a second and a half in all.
const LOCK_RETRIES = 8;
// Hooks wait their turn longer than that: each holds the lock for tens of milliseconds, so this
// clears a queue of hundreds. It is a bound, not a guess at load: past it the hook says so.
const TURN_WAIT_MS = 30_000;
// Every way git says another git process is mid-write.
const BUSY = /index\.lock|Unable to create|Another git process|cannot lock ref|could not lock/;

/** The memory folder a written path belongs to, or null when it is any other file. */
export function memoryDirOf(path, root = join(homedir(), ".claude", "projects")) {
  if (!path?.startsWith(`${root}/`)) return null;
  const parts = path.slice(root.length + 1).split("/");
  return parts.length === 3 && parts[1] === "memory" ? join(root, parts[0], "memory") : null;
}

// Git's own hook variables outrank -C (tests/support/hermetic-git.ts), so a Write fired from inside a
// git hook could otherwise commit to the real repo. Scrub them all.
const GIT_FREE_ENV = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !key.startsWith("GIT_")),
);

function git(dir, ...args) {
  return spawnSync(
    "git",
    [
      "-C",
      dir,
      // A name is a name: a * or : in a memory file's name must not widen the commit past that file.
      "--literal-pathspecs",
      "-c",
      "user.name=claude-memory",
      "-c",
      "user.email=noreply@anthropic.com",
      "-c",
      "commit.gpgsign=false",
      ...args,
    ],
    { encoding: "utf8", env: GIT_FREE_ENV },
  );
}

/** One pass at landing the version: "done", "busy: <why>", or the reason it cannot land. */
function attempt(dir, name, message) {
  if (!existsSync(join(dir, ".git"))) {
    const init = git(dir, "init", "-q");
    if (init.status !== 0) return classify(init);
  }
  const add = git(dir, "add", "--", name);
  if (add.status !== 0) {
    // Written and removed again before this hook ran: nothing is left to version, nothing went wrong.
    return existsSync(join(dir, name)) ? classify(add) : "done";
  }
  if (git(dir, "diff", "--cached", "--quiet", "--", name).status === 0) return "done";
  // The pathspec is what keeps this to one file: another session's staged write stays staged.
  const commit = git(dir, "commit", "-q", "-m", message, "--", name);
  return commit.status === 0 ? "done" : classify(commit);
}

// Never empty, because the caller reads an empty reason as success. git killed by a signal has no
// stderr, and git that could not start has none at all, only an error.
function classify(res) {
  const why = res.stderr?.trim().split("\n")[0] || res.error?.message || "git failed silently";
  return `${BUSY.test(why) ? "busy: " : ""}${why}`;
}

/** Lands one file's version, retrying while git is busy. Returns null, or why it did not land. */
function landVersion(dir, name, message) {
  let outcome = "";
  for (let tries = 0; tries < LOCK_RETRIES; tries += 1) {
    outcome = attempt(dir, name, message);
    if (outcome === "done") return null;
    if (!outcome.startsWith("busy: ")) return outcome;
    // Jitter, so writers that collided once do not collide again on the same beat.
    pause(20 + Math.random() * 60 * (tries + 1));
  }
  return `gave up after ${LOCK_RETRIES} tries (${outcome.slice("busy: ".length)})`;
}

/** Runs one hook's git work while no other hook runs any. The lock sits beside the folder, not in it. */
function takeTurn(dir, body) {
  try {
    return withFileLock(`${dir}.history.lock`, body, { waitMs: TURN_WAIT_MS });
  } catch (error) {
    return error.message; // Any failure here costs a version, so all of them are worth saying.
  }
}

function record(input) {
  const file = input.tool_input?.file_path;
  const dir = memoryDirOf(file, process.env.AGENT_MEMORY_ROOT);
  if (!dir) return;
  const name = basename(file);
  const message = [
    `${input.tool_name ?? "write"} ${name}`,
    "",
    `session: ${input.session_id ?? "unknown"}`,
    `agent: ${input.agent_id ?? input.agent_type ?? "main"}`,
    `cwd: ${input.cwd ?? "unknown"}`,
    `transcript: ${input.transcript_path ? basename(input.transcript_path) : "unknown"}`,
  ].join("\n");
  const failure = takeTurn(dir, () => landVersion(dir, name, message));
  if (!failure) return;
  const line = `memory-history: ${name} has no version: ${failure}`;
  console.error(line);
  console.log(JSON.stringify({ systemMessage: line }));
  process.exitCode = 2;
}

if (process.argv[1] && dirname(fileURLToPath(import.meta.url)) === dirname(process.argv[1])) {
  let raw = "";
  process.stdin.on("data", (chunk) => {
    raw += chunk;
  });
  process.stdin.on("end", () => {
    try {
      record(JSON.parse(raw));
    } catch (error) {
      console.error(`memory-history: ${error.message}`);
    }
  });
}
