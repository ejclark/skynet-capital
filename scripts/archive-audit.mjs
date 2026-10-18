#!/usr/bin/env node
// ARCHIVE AUDIT — the done-check behind "archive this session?", run instead of asserted.
//
// Eric, 2026-10-18, answering that question at the end of a 16-session fan-out: "there should be an
// audit review … to walk through all the steps to give me confidence that when there is a question
// to ask about archiving, it's a simple yes". CLAUDE.md → "A finished session archives itself" lists
// the done-check in prose; nothing ran it and nothing showed him the result, so the question arrived
// as a claim to trust. This script turns each clause into a row with its evidence, and the ask
// carries the table: all green → the question is a formality; any red → no question, the session
// stays open (that clause of the rule is unchanged).
//
// Self-healing (Eric, same day: "Self healing and improving needs to be part of the process"): a
// failing row carries its `heal` — the safe, reversible action the session takes itself before
// re-running the audit (push stray work, link a follow-up, archive a finished child, cancel a
// check-in whose job is done). A row with no heal (an open PR, a child still working) is never
// forced green; it keeps the session open. Every heal is a slip caught late, so the session reports
// the heals it took, and one already banked in docs/LESSONS.md goes to /retro for a prevention.
//
// Why a script and not an agent: every check is a read (a PR's state, a scheduled task's state, a
// child session's state, a link that exists), not a judgment — the /charter bounded-trigger test.
//
// The session gathers what only it can see (its MCP tools: child sessions, scheduled check-ins) and
// passes a manifest on stdin; the script reads GitHub over REST (never GraphQL — a cloud session is
// refused it) and git locally. `--explain` takes GitHub's answers from the manifest too, so specs
// run offline.
//
//   echo '{"prs":[5629],"children":[{"id":"session_…","status":"SESSION_STATUS_ARCHIVED"}],
//          "checkins":[],"followups":[{"what":"#5159 missing predictions","home":"https://…"}]}' \
//     | node scripts/archive-audit.mjs [--explain] [--json]
//
// Exit 0 = archive is a yes; exit 1 = it is not (the rows say why); exit 2 = bad manifest.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const ARCHIVED = "SESSION_STATUS_ARCHIVED";

/**
 * Pure: the manifest (with each PR's state filled in) → one row per check. A check with nothing to
 * check passes and says so, so an empty row is never mistaken for a skipped one.
 */
export function audit({ prs = [], children = [], checkins = [], followups = [], git = {} }) {
  const rows = [];
  const openPrs = prs.filter((p) => p.state !== "merged" && p.state !== "closed");
  rows.push({
    check: "Every PR it opened is merged or closed",
    ok: openPrs.length === 0,
    heal: null, // an open PR is work, not a slip: drive it to merged, then re-run
    detail: prs.length ? prs.map((p) => `#${p.number} ${p.state}`).join(", ") : "opened none",
  });
  const live = children.filter((c) => c.status !== ARCHIVED);
  rows.push({
    check: "Every session it spawned is archived",
    ok: live.length === 0,
    heal: "archive each child whose PRs are merged or closed and whose leftovers have a home",
    detail: children.length
      ? live.length
        ? `still open: ${live.map((c) => c.id).join(", ")}`
        : `${children.length} of ${children.length} archived`
      : "spawned none",
  });
  const pending = checkins.filter((t) => t.enabled !== false && !t.fired);
  rows.push({
    check: "No scheduled check-in or PR watch is pending",
    ok: pending.length === 0,
    heal: "delete each check-in whose job is done; keep one that still guards open work",
    detail: pending.length ? `pending: ${pending.map((t) => t.id).join(", ")}` : "none pending",
  });
  const homeless = followups.filter((f) => !/^https:\/\//.test(String(f.home ?? "")));
  rows.push({
    check: "Every follow-up has a home outside the chat",
    ok: homeless.length === 0,
    heal: "post each as an issue comment (or docs/IDEAS.md line) and put its link in the manifest",
    detail: followups.length
      ? homeless.length
        ? `no home: ${homeless.map((f) => f.what).join("; ")}`
        : followups.map((f) => `${f.what} → ${f.home}`).join("; ")
      : "none left",
  });
  const dirty = Boolean(git.uncommitted) || Number(git.unpushed ?? 0) > 0;
  rows.push({
    check: "No uncommitted or unpushed work in the checkout",
    ok: !dirty,
    heal: "commit and ship it with /ship (or discard it if it was scratch)",
    detail: dirty
      ? `${git.uncommitted ? "uncommitted changes" : ""}${git.uncommitted && git.unpushed ? ", " : ""}${git.unpushed ? `${git.unpushed} unpushed commit(s)` : ""}`
      : "clean",
  });
  return { ok: rows.every((r) => r.ok), rows, heals: rows.filter((r) => !r.ok && r.heal) };
}

/** The table the ask carries, then one verdict line. */
export function render({ ok, rows }) {
  const lines = ["| | Check | Evidence |", "|---|---|---|"];
  for (const r of rows) lines.push(`| ${r.ok ? "✅" : "❌"} | ${r.check} | ${r.detail} |`);
  const failed = rows.filter((r) => !r.ok).length;
  lines.push(
    "",
    ok
      ? `ARCHIVE: yes — all ${rows.length} checks pass`
      : `ARCHIVE: no — ${failed} check(s) fail; keep the session open`,
  );
  for (const r of rows.filter((x) => !x.ok))
    lines.push(
      r.heal
        ? `HEAL: ${r.check} → ${r.heal}, then re-run`
        : `WAIT: ${r.check} — not healable; the session stays open`,
    );
  return lines.join("\n");
}

const sh = (cmd, args) =>
  execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

/** A PR's state over REST: merged · closed · open. */
function prState(number) {
  const pr = JSON.parse(sh("gh", ["api", `repos/{owner}/{repo}/pulls/${number}`]));
  return pr.merged_at ? "merged" : pr.state;
}

function gitState() {
  // Fetch first: a cached ref can be stale — on 2026-10-18 a deleted, already-merged branch's ref
  // read as "93 unpushed commits" (docs/LESSONS.md, 2026-09-04: fetch before trusting a ref).
  sh("git", ["fetch", "--quiet", "--prune", "origin"]);
  const uncommitted = sh("git", ["status", "--porcelain"]).length > 0;
  let unpushed = 0;
  try {
    unpushed = Number(sh("git", ["rev-list", "--count", "@{u}..HEAD"]));
  } catch {
    unpushed = Number(sh("git", ["rev-list", "--count", "origin/main..HEAD"]));
  }
  return { uncommitted, unpushed };
}

function main() {
  const flags = new Set(process.argv.slice(2));
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(0, "utf8") || "{}");
  } catch (err) {
    console.error(`archive-audit: the manifest on stdin is not JSON (${err.message})`);
    process.exit(2);
  }
  const offline = flags.has("--explain");
  const prs = (manifest.prs ?? []).map((p) =>
    typeof p === "object" ? p : { number: p, state: offline ? "unknown" : prState(p) },
  );
  const result = audit({ ...manifest, prs, git: offline ? (manifest.git ?? {}) : gitState() });
  console.log(flags.has("--json") ? JSON.stringify(result) : render(result));
  process.exit(result.ok ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
