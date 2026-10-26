#!/usr/bin/env node
// CLEAR-PATH POST — the write half of .claude/workflows/clear-path-flip.js.
//
//   node scripts/clear-path-post.mjs <result.json> --dry-run   # print what would be posted
//   node scripts/clear-path-post.mjs <result.json>             # post + label, survivors only
//
// The workflow judges and refutes; it never writes. This script is the one place a session's flip
// lands on GitHub (docs/ISSUES.md → "Who may flip it"), so the paper trail has a gate a spec pins
// rather than a subagent's say-so. For each SURVIVOR carrying two verifier lines it posts the
// drafted comment with those lines and the footer appended, then applies `ready` — plus `feedback`
// when missing, because on 2026-10-26 two readied issues without it were never built: no lane
// pulls an issue that lacks it. It refuses everything else:
//   - `refuted` and `notClear` entries are never posted (they are the workflow's own "no");
//   - a survivor with fewer than two distinct verifier lines, a failing check, or no comment is a
//     malformed result, and ANY malformed survivor refuses the whole run before a single write —
//     a half-posted batch is harder to reason about than none;
//   - live, per issue: closed, already `ready`, or parked (`needs-eric` / `needs-info`) since the
//     judge read it → skipped with the reason, nothing written for it.
//
// Subagent text reaches the workflow result HTML-escaped (`&lt;details&gt;`), so every string is
// unescaped before it is posted — otherwise the comment renders the entities literally.
//
// Exit 0: every survivor posted (or nothing to post). Exit 1: refused or a write failed. Gate on
// the exit status, never through `| tail` (a pipeline reports the last command's status).
// Token: GH_TOKEN or GITHUB_TOKEN, else `gh auth token`. REST core bucket, curl so HTTPS_PROXY holds.
import { readFileSync } from "node:fs";
import { ensureGhToken, ghRest, sh } from "./moneypenny/gh.mjs";
import { FOOTER } from "./moneypenny/labels.mjs";

const REPO = () => process.env.GITHUB_REPOSITORY ?? "ejclark/skynet-capital";
const CHECKS = ["criteria", "size", "noFork", "notBlocked"];
const PARKED = ["needs-eric", "needs-info"];

// ─── pure core (specced in tests/scripts/clear-path-post.spec.ts) ─────────────────────────────────

const ENTITIES = { "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&#x27;": "'" };

/** Undo the HTML escaping subagent text arrives with. `&amp;` last, so `&amp;lt;` stays `&lt;`. */
export function unescapeHtml(s) {
  return String(s ?? "")
    .replace(/&lt;|&gt;|&quot;|&#39;|&#x27;/g, (m) => ENTITIES[m])
    .replace(/&amp;/g, "&");
}

/** The posted body: the drafted comment, the verifier lines, the footer — each exactly once. */
export function renderBody(survivor) {
  const comment = unescapeHtml(survivor.comment).trim();
  const lines = survivor.verifiers.map((v) => `- ${unescapeHtml(v).trim()}`).join("\n");
  return `${comment}\n\n**Verifiers** — two independent refuters tried and could not refute:\n${lines}\n\n${FOOTER}\n`;
}

/** Why this survivor cannot be posted, or null when it can. */
export function malformed(s) {
  if (!Number.isInteger(s?.issue) || s.issue <= 0) return "no issue number";
  if (!String(s.comment ?? "").trim()) return "no drafted comment";
  const verifiers = (s.verifiers ?? []).map((v) => unescapeHtml(v).trim()).filter(Boolean);
  if (new Set(verifiers).size < 2) return "fewer than two distinct verifier lines";
  const failing = CHECKS.filter((k) => s.checks?.[k]?.pass !== true);
  if (failing.length) return `checks not all passing: ${failing.join(", ")}`;
  return null;
}

/**
 * The workflow result → the writes it authorizes. Throws (refusing the whole run) on a result
 * that is not the workflow's shape, or on any malformed survivor.
 */
export function planPosts(result) {
  if (!Array.isArray(result?.survivors)) {
    throw new Error("not a clear-path-flip result: no survivors array");
  }
  const bad = result.survivors
    .map((s) => ({ issue: s?.issue, why: malformed(s) }))
    .filter((b) => b.why);
  if (bad.length) {
    throw new Error(
      `refusing the whole run — malformed survivor(s): ${bad.map((b) => `#${b.issue ?? "?"} (${b.why})`).join("; ")}`,
    );
  }
  const seen = new Set();
  for (const s of result.survivors) {
    if (seen.has(s.issue)) throw new Error(`refusing the whole run — #${s.issue} appears twice`);
    seen.add(s.issue);
  }
  return result.survivors.map((s) => ({
    issue: s.issue,
    title: unescapeHtml(s.title ?? ""),
    body: renderBody(s),
    labels: s.addFeedback === false ? ["ready"] : ["ready", "feedback"],
  }));
}

/** Live-state guard: the reason to skip this issue now, or null. `labels` may be names or objects. */
export function liveSkip(issue) {
  if (!issue) return "could not read the issue";
  if (issue.state !== "open") return `issue is ${issue.state}`;
  const names = (issue.labels ?? []).map((l) => (typeof l === "string" ? l : l.name));
  if (names.includes("ready")) return "already carries ready";
  const parked = names.filter((n) => PARKED.includes(n));
  if (parked.length) return `parked since judging: ${parked.join(", ")}`;
  return null;
}

// ─── IO ───────────────────────────────────────────────────────────────────────────────────────────

function ghWrite(method, path, payload) {
  const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN ?? "";
  return sh(
    "curl",
    [
      "-sS",
      "--fail-with-body",
      "-X",
      method,
      "-H",
      `Authorization: Bearer ${token}`,
      "-H",
      "Accept: application/vnd.github+json",
      "-H",
      "User-Agent: skynet-clear-path-post",
      "-H",
      "Content-Type: application/json",
      "--data-binary",
      "@-",
      `https://api.github.com/repos/${REPO()}/${path}`,
    ],
    { input: JSON.stringify(payload) },
  );
}

function main(argv) {
  const file = argv.find((a) => !a.startsWith("--"));
  const dryRun = argv.includes("--dry-run");
  if (!file) {
    console.error("usage: node scripts/clear-path-post.mjs <result.json> [--dry-run]");
    return 1;
  }
  let plan;
  try {
    plan = planPosts(JSON.parse(readFileSync(file, "utf8")));
  } catch (err) {
    console.error(`clear-path-post: ${err.message}`);
    return 1;
  }
  if (!plan.length) {
    console.log("clear-path-post: no survivors — nothing to post");
    return 0;
  }
  if (dryRun) {
    for (const p of plan) {
      console.log(`── #${p.issue} ${p.title} → labels: ${p.labels.join(", ")}\n${p.body}`);
    }
    console.log(`clear-path-post: dry run — ${plan.length} would post`);
    return 0;
  }
  ensureGhToken();
  let failed = 0;
  for (const p of plan) {
    try {
      const skip = liveSkip(ghRest(`issues/${p.issue}`));
      if (skip) {
        console.log(`#${p.issue} skipped — ${skip}`);
        continue;
      }
      // Comment first: a label with no paper trail is the one outcome the flip rule forbids.
      ghWrite("POST", `issues/${p.issue}/comments`, { body: p.body });
      ghWrite("POST", `issues/${p.issue}/labels`, { labels: p.labels });
      console.log(`#${p.issue} flipped — ${p.labels.join(" + ")}`);
    } catch (err) {
      failed++;
      console.error(`#${p.issue} FAILED — ${String(err.stderr || err.message).trim()}`);
    }
  }
  return failed ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main(process.argv.slice(2)));
