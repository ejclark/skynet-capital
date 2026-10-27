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
      "`git stash` is banned here (CLAUDE.md → Ship loop: it has silently dropped edits; docs/LESSONS.md 2026-08-13). Branch first instead: `git fetch origin main && git checkout -B <branch> origin/main`, or set work aside with a temporary WIP commit.",
  },
  {
    // 2026-10-05: a session smoke-testing a new claim path by hand created a real lease tag and
    // labelled a real issue `in-progress` — the session's token is the App's, so every write landed.
    // The claim flags are the lane's IMPURE half; a spec or the workflow is where they belong. The
    // read-only and repair flags (`--check-claim`, `--peek-next`, `--release`, `--model-tier`,
    // `--dry-run`) are legitimately hand-run and deliberately not matched.
    // Anchored to a COMMAND position, like the `git stash` rule above and for the same reason: the
    // first draft matched the string anywhere, so writing a PR body that merely NAMED the flag was
    // refused (caught on its own first use, 2026-10-05). An env prefix still counts as the command.
    name: "moneypenny --claim-* by hand",
    test: (cmd) =>
      /(^|[;&|]\s*)(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)*node\s+\S*scripts\/moneypenny\/index\.mjs[^;&|\n]*\s--claim-(feedback|plan|next)\b/m.test(
        cmd,
      ),
    reason:
      "A `--claim-*` flag takes a real lease and writes real labels under this session's App token (docs/LESSONS.md 2026-10-05: a fixture smoke-test labelled a live issue `in-progress`). Exercise the claim path through its spec (tests/scripts/moneypenny/) or let the workflow run it; `--check-claim`, `--peek-next` and `--release` are the hand-runnable ones.",
  },
  {
    // 2026-10-26, #4537 (a pilot): a session's comment posted or edited through Eric's account with
    // no attribution footer reads to claude.yml's gate as Eric steering, and wakes the interactive
    // lane with nothing to do — 33+ wasted runs in October, 28 of them from state-block edits. The
    // footer is the marker the gate skips on and `scripts/issues.mjs` adds it on both paths. Only
    // WRITES are matched, per command segment: reading comments (`gh api …/comments --jq`, a curl
    // GET) stays open, and a string that merely names these commands is not a command.
    name: "raw issue/PR comment write",
    test: (cmd) => cmd.split(/[;&|\n]+/).some(isRawCommentWrite),
    reason:
      "Post or edit issue/PR comments through `npm run issues -- update <n> --comment-file f` (add `--edit-comment <id>` to edit in place): it adds the attribution footer claude.yml's gate skips on. A raw write carries none, so it wakes the interactive lane for nothing (#4537; docs/ISSUES.md → The state block). A comment meant to steer that lane on purpose is the member's to post.",
  },
];

// A comment write at a command position (env prefixes allowed): `gh issue|pr comment`, or a
// `gh api` / `curl` naming an issue-comments path with a POST/PATCH method or a body flag (both
// tools turn a body flag into a POST on their own).
const COMMENT_CMD =
  /^\s*(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)*(gh\s+(?:issue|pr)\s+comment\b|gh\s+api\b|curl\b)/;
const COMMENTS_PATH = /\/issues\/(\d+\/comments|comments\/\d+)\b/;
const WRITE_METHOD = /(?:--method|-X|--request)[\s=]+['"]?(POST|PATCH)\b/i;
const BODY_FLAG = {
  curl: /\s(?:-d|--data(?:-raw|-binary)?|--json)\b/,
  gh: /\s(?:-f|-F|--field|--raw-field|--input)\b/,
};
function isRawCommentWrite(segment) {
  const m = COMMENT_CMD.exec(segment);
  if (!m) return false;
  if (m[1].endsWith("comment")) return true;
  if (!COMMENTS_PATH.test(segment)) return false;
  const body = m[1] === "curl" ? BODY_FLAG.curl : BODY_FLAG.gh;
  return WRITE_METHOD.test(segment) || body.test(segment);
}

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
