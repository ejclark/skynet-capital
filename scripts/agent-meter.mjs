#!/usr/bin/env node
// The before-and-after numbers for the agentic process work (#6470): does a change to memory,
// context or loops actually move first-pass errors, fix speed, or what a session pays at startup?
//
// Each number states what it leaves out, because the audit that motivated this meter was misled by
// proxies. Fix-after-feat chains are deliberately absent: a placebo test showed same-scope fixes
// land before a feat as often as after it (78 vs 70 within a day), so they measure busy scopes, not
// rework. PR-run CI is a floor, not a first-pass rate: scripts/ship.sh verifies before pushing, so
// mistakes caught locally never reach CI. That half comes from the verify log ship.sh now appends.
//
//   node scripts/agent-meter.mjs [--json] [--days N]
//
// Seams (env, so a spec can drive it): AGENT_RUNS_DIR, AGENT_TRANSCRIPTS_DIR, AGENT_MEMORY_DIR.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CHARS_PER_TOKEN = 4;
const PROJECT = "-Users-eric-Developer-skynet-capital";

/** The value at quantile q of a list of numbers, or null when the list is empty. */
export function quantile(values, q) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
}

/** Non-cancelled CI runs split by trigger, so a main-only outage cannot pose as agent mistakes. */
export function ciByTrigger(runs) {
  const out = {};
  for (const run of runs) {
    if (run.conclusion === "cancelled" || run.conclusion === "skipped" || !run.conclusion) continue;
    const row = out[run.event] ?? { runs: 0, failed: 0 };
    out[run.event] = row;
    row.runs += 1;
    if (run.conclusion === "failure") row.failed += 1;
  }
  return out;
}

/** Open-to-merge minutes for merged feat and fix PRs; research and docs merges would swamp it. */
export function mergeMinutes(prs, sinceMs) {
  const minutes = prs
    .filter(
      (pr) => pr.mergedAt && Date.parse(pr.mergedAt) >= sinceMs && /^(feat|fix)\b/.test(pr.title),
    )
    .map((pr) => (Date.parse(pr.mergedAt) - Date.parse(pr.createdAt)) / 60000);
  return { n: minutes.length, p50: quantile(minutes, 0.5), p90: quantile(minutes, 0.9) };
}

/** Counts of local verify outcomes from ship.sh's log. */
export function localVerify(rows, sinceMs) {
  const recent = rows.filter((row) => Date.parse(row.at) >= sinceMs);
  return { runs: recent.length, failed: recent.filter((row) => row.ok === false).length };
}

/**
 * Per-run loop numbers from attempts.jsonl rows: how many attempts it took and how long from the
 * first attempt until one verified. An unverified run reports null, never a flattering partial.
 */
export function runLoop(rows) {
  const attempts = rows.filter((row) => row.kind === "attempt");
  const verified = attempts.find((row) => row.verified === true);
  const start = attempts[0] ? Date.parse(attempts[0].at) : null;
  return {
    attempts: attempts.length,
    verified: Boolean(verified),
    minutesToVerified: verified ? (Date.parse(verified.at) - start) / 60000 : null,
  };
}

// Attachment types that are copies of other context, not extra load on the first call.
const SKIP_ATTACHMENTS = new Set(["prompt_snapshot", "queued_command", "edited_text_file"]);

/**
 * What a session paid before its first answer, attributed from the transcript's attachments. The
 * remainder is the system prompt and loaded tool schemas, which transcripts do not itemize; it is
 * reported as such rather than spread across the named sources.
 */
export function startupFromTranscript(lines) {
  const sources = {};
  let firstCall = null;
  for (const line of lines) {
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }
    if (row.type === "assistant" && row.message?.usage) {
      const u = row.message.usage;
      firstCall =
        (u.input_tokens ?? 0) +
        (u.cache_creation_input_tokens ?? 0) +
        (u.cache_read_input_tokens ?? 0);
      break;
    }
    const type = row.attachment?.type;
    if (!type || SKIP_ATTACHMENTS.has(type)) continue;
    sources[type] =
      (sources[type] ?? 0) + Math.round(JSON.stringify(row.attachment).length / CHARS_PER_TOKEN);
  }
  if (firstCall === null) return null;
  const named = Object.values(sources).reduce((sum, tokens) => sum + tokens, 0);
  return { firstCall, sources, unitemized: Math.max(0, firstCall - named) };
}

function readLines(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8").split("\n").filter(Boolean);
}

function readJsonl(path) {
  return readLines(path).flatMap((line) => {
    try {
      return [JSON.parse(line)];
    } catch {
      return [];
    }
  });
}

function gh(args) {
  const res = spawnSync("gh", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (res.status !== 0) return null;
  return JSON.parse(res.stdout);
}

function newestTranscript(dir) {
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir)
    .filter((name) => name.endsWith(".jsonl"))
    .map((name) => ({ path: join(dir, name), mtime: statSync(join(dir, name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  return files;
}

function fileBytes(path) {
  return existsSync(path) ? statSync(path).size : null;
}

function measure(days) {
  const home = homedir();
  const runsDir = process.env.AGENT_RUNS_DIR ?? join(home, ".claude", "runs");
  const transcripts =
    process.env.AGENT_TRANSCRIPTS_DIR ?? join(home, ".claude", "projects", PROJECT);
  const memoryDir = process.env.AGENT_MEMORY_DIR ?? join(transcripts, "memory");
  const sinceMs = Date.now() - days * 86400000;

  const runs = gh([
    "run",
    "list",
    "--workflow",
    "pipeline.yml",
    "--limit",
    "300",
    "--created",
    `>=${new Date(sinceMs).toISOString().slice(0, 10)}`,
    "--json",
    "conclusion,event",
  ]);
  const prs = gh([
    "pr",
    "list",
    "--state",
    "merged",
    "--limit",
    "200",
    "--json",
    "title,createdAt,mergedAt",
  ]);

  const runRows = existsSync(runsDir)
    ? readdirSync(runsDir)
        .filter((name) => existsSync(join(runsDir, name, "attempts.jsonl")))
        .map((name) => ({
          run: name,
          ...runLoop(readJsonl(join(runsDir, name, "attempts.jsonl"))),
        }))
    : [];

  // A session's first call only: compare the newest few, because one session is not a trend.
  const startups = (newestTranscript(transcripts) ?? [])
    .slice(0, 5)
    .map((file) => startupFromTranscript(readLines(file.path)))
    .filter(Boolean);

  const memoryIndex = readLines(join(memoryDir, "MEMORY.md"));
  return {
    windowDays: days,
    firstPass: {
      ci: runs ? ciByTrigger(runs) : "unavailable: gh failed",
      localVerify: localVerify(readJsonl(join(runsDir, "ship-verify.jsonl")), sinceMs),
      note: "pull_request CI is a floor; local verify failures are the other half, logged since this meter shipped",
    },
    speed: {
      openToMergeMinutes: prs ? mergeMinutes(prs, sinceMs) : "unavailable: gh failed",
      runs: runRows,
      note: "open-to-merge excludes local verify and agent time; run rows are the fuller measure",
    },
    startup: {
      recentFirstCalls: startups.map((s) => s.firstCall),
      newest: startups[0] ?? null,
      note: "unitemized is the system prompt and loaded tool schemas",
    },
    limits: {
      claudeMdBytes: fileBytes(resolve("CLAUDE.md")),
      orientBytes: fileBytes(resolve(".claude/output-styles/orient.md")),
      memoryIndexLines: memoryIndex.length,
      memoryIndexLimit: 200,
      memoryFiles: existsSync(memoryDir)
        ? readdirSync(memoryDir).filter((n) => n.endsWith(".md")).length
        : 0,
    },
  };
}

function render(m) {
  const lines = [`agent meter, last ${m.windowDays} days`];
  lines.push("", "first-pass");
  if (typeof m.firstPass.ci === "string") lines.push(`  ci: ${m.firstPass.ci}`);
  else
    for (const [event, row] of Object.entries(m.firstPass.ci))
      lines.push(`  ci ${event}: ${row.failed} of ${row.runs} failed`);
  lines.push(
    `  local verify: ${m.firstPass.localVerify.failed} of ${m.firstPass.localVerify.runs} failed`,
  );
  lines.push("", "speed");
  const merge = m.speed.openToMergeMinutes;
  lines.push(
    typeof merge === "string"
      ? `  ${merge}`
      : `  open to merge: p50 ${merge.p50?.toFixed(1)} min, p90 ${merge.p90?.toFixed(1)} min (n=${merge.n})`,
  );
  for (const run of m.speed.runs)
    lines.push(
      `  run ${run.run}: ${run.attempts} attempts, ${run.verified ? `verified in ${run.minutesToVerified.toFixed(0)} min` : "not verified"}`,
    );
  lines.push("", "startup");
  lines.push(`  recent first calls: ${m.startup.recentFirstCalls.join(", ") || "none"} tokens`);
  if (m.startup.newest) {
    const entries = Object.entries(m.startup.newest.sources).sort((a, b) => b[1] - a[1]);
    for (const [source, tokens] of entries) lines.push(`  ${source}: ${tokens}`);
    lines.push(`  system prompt and tool schemas (unitemized): ${m.startup.newest.unitemized}`);
  }
  lines.push("", "limits");
  lines.push(`  CLAUDE.md: ${m.limits.claudeMdBytes} bytes; orient: ${m.limits.orientBytes} bytes`);
  lines.push(
    `  memory index: ${m.limits.memoryIndexLines} of ${m.limits.memoryIndexLimit} lines, ${m.limits.memoryFiles} files`,
  );
  return lines.join("\n");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const daysAt = args.indexOf("--days");
  const m = measure(daysAt >= 0 ? Number(args[daysAt + 1]) : 7);
  console.log(args.includes("--json") ? JSON.stringify(m, null, 2) : render(m));
}
