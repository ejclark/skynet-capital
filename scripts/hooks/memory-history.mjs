#!/usr/bin/env node
// Memory history — a PostToolUse hook that gives the shared auto-memory folder a version per change.
//
//   .claude/settings.json → hooks.PostToolUse (matcher "Write|Edit") → node scripts/hooks/memory-history.mjs
//
// WHY (#6470): every worktree on this machine shares one memory folder, and it had no history, so a
// bad write could not be seen or undone. Anthropic's production guidance for agent memory leads with
// this: store versions, and record which session and agent made each one. Git already does the rest.
//
// The folder's repo is local with no remote: memories are private and machine-local by design.
// Records provenance only, never content beyond the diff git keeps. A hook must never break the
// session that fired it, so every failure here exits 0 with a stderr note.
//
// Seam: AGENT_MEMORY_ROOT overrides the path test, for specs.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

function record(input) {
  const file = input.tool_input?.file_path;
  const dir = memoryDirOf(file, process.env.AGENT_MEMORY_ROOT);
  if (!dir) return;
  if (!existsSync(join(dir, ".git")) && git(dir, "init", "-q").status !== 0) return;
  git(dir, "add", "-A");
  if (git(dir, "diff", "--cached", "--quiet").status === 0) return;
  const message = [
    `${input.tool_name ?? "write"} ${basename(file)}`,
    "",
    `session: ${input.session_id ?? "unknown"}`,
    `agent: ${input.agent_id ?? input.agent_type ?? "main"}`,
    `cwd: ${input.cwd ?? "unknown"}`,
    `transcript: ${input.transcript_path ? basename(input.transcript_path) : "unknown"}`,
  ].join("\n");
  const res = git(dir, "commit", "-q", "-m", message);
  if (res.status !== 0) console.error(`memory-history: ${res.stderr.trim()}`);
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
