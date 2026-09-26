#!/usr/bin/env node
// Bash guard — a PreToolUse hook that refuses the commands this repo's doctrine bans.
//
//   .claude/settings.json → hooks.PreToolUse (matcher "Bash") → node scripts/hooks/guard-bash.mjs
//   echo '{"tool_name":"Bash","tool_input":{"command":"git stash"}}' | node scripts/hooks/guard-bash.mjs
//
// WHY (2026-09-26, #3769 slice 5): docs/LESSONS.md carries a rank-3 "ledger-only" entry for an
// agent that ran `git stash` despite CLAUDE.md's ban and hit the exact failure the ban names —
// filed as ledger-only because "there is no standard git hook that intercepts" the command. There
// is a hook, just not git's: Claude Code fires PreToolUse before every Bash call, and exit 2 blocks
// the call with stderr as the reason (docs/vendor/claude-code/hooks.md → Exit code 2). A command an
// agent must never run is therefore a rank-1 gate, not a lesson to re-read. zpratt/lousy-agents
// draws the same line ("blocked rather than observed after the fact", agent-shell's preToolUse).
//
// Degrades honestly the one way a guard may: input it cannot read is NOT a reason to block the
// agent (a crashing hook blocks everything — the lousy-agents fail-open exception for hooks), so
// unreadable stdin allows with a stderr note. A recognised banned command is refused, named, and
// pointed at the doctrine line; nothing else is touched.
//
// Exit codes: 0 allow (stdin unreadable, another tool, or no match) · 2 refuse (the reason on stderr).
import { fileURLToPath } from "node:url";

/** The banned commands, each with the doctrine line that bans it and the alternative to offer. */
export const BANNED = [
  {
    name: "git stash",
    // `git stash list` / `show` only read; every other subcommand (push, pop, apply, drop, clear,
    // the bare form) moves working-tree state through a shared stack — the failure the ban names.
    test: (cmd) => /(^|[;&|]\s*|\s)git\s+stash(\s+(?!list\b|show\b)\S+|\s*$|\s*[;&|)])/m.test(cmd),
    reason:
      "`git stash` is banned here (CLAUDE.md → Ship loop: it has silently dropped edits; docs/LESSONS.md 2026-08-26). Branch first instead: `git fetch origin main && git checkout -B <branch> origin/main`, or set work aside with a temporary WIP commit.",
  },
];

/** Pure verdict over one hook payload. */
export function guardVerdict(input) {
  if (input?.tool_name !== "Bash") return { allow: true };
  const cmd = String(input.tool_input?.command ?? "");
  for (const rule of BANNED) {
    if (rule.test(cmd)) return { allow: false, rule: rule.name, reason: rule.reason };
  }
  return { allow: true };
}

async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  let input;
  try {
    input = JSON.parse(await readStdin());
  } catch (err) {
    process.stderr.write(
      `· guard-bash: could not read the hook payload (${err.message}) — not blocking\n`,
    );
    return;
  }
  const v = guardVerdict(input);
  if (v.allow) return;
  process.stderr.write(`guard-bash refused ${v.rule}: ${v.reason}\n`);
  process.exit(2);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
