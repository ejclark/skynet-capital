#!/usr/bin/env node
// The input to a memory review (/dream, #6470). A session transcript runs to tens of megabytes, so
// a review reads this digest instead: what the person typed, how the session ended, every tool
// error, which tools and skills ran, and each compaction.
//
// Tool errors and tool counts are in on purpose. Anthropic's account of the same process (Lamis,
// AI DevCon talk) scrutinizes tool calls and metadata, not just the conversation, because a
// misconfigured tool shows up there first. Harness rows are out on purpose: 185 of 545 duel-log
// "prompts" were task notifications, and a person never typed those.
//
// Reads only. Transcript text is untrusted data: it reaches a review agent labelled as such, and
// token-shaped strings are removed before it leaves here.
//
//   node scripts/dream-digest.mjs --session <path.jsonl>      one session's digest
//   node scripts/dream-digest.mjs --recent N [--since DATE]   paths of the N newest-started sessions
//   node scripts/dream-digest.mjs --memory <dir>              stale candidates in a memory folder
//   node scripts/dream-digest.mjs --checksums <dir>           a hash per file, to prove inputs held
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  closeSync,
  existsSync,
  openSync,
  readdirSync,
  readFileSync,
  readSync,
  statSync,
} from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT = "-Users-eric-Developer-skynet-capital";
const MAX_USER_CHARS = 1200;
const MAX_ERROR_CHARS = 300;
const MAX_FINAL_CHARS = 1500;
const HEAD_BYTES = 64 * 1024;

const HARNESS_PREFIXES = [
  "<task-notification",
  "<system-reminder",
  "<command-",
  "<local-command",
  "[SYSTEM NOTIFICATION",
  "Caveat:",
];
const SECRET_SHAPES = [
  /\b(?:sk|pk|ghp|gho|ghs|fo1|xox[abp])[-_][A-Za-z0-9_-]{12,}/g,
  /\b(?:api[_-]?key|token|secret|password)["'\s:=]+[A-Za-z0-9/+_-]{16,}/gi,
  /\bAK[A-Z0-9]{16,}\b/g,
];

/** Remove anything shaped like a credential before text leaves the transcript. */
export function redact(text) {
  return SECRET_SHAPES.reduce((out, shape) => out.replace(shape, "[redacted]"), text);
}

function textOf(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((part) => part?.type === "text")
    .map((part) => part.text)
    .join("\n");
}

function isTyped(text) {
  const trimmed = text.trim();
  return trimmed.length > 0 && !HARNESS_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}

/** One session's transcript lines, reduced to what a review can reason over. */
export function digestLines(lines) {
  const digest = {
    first: null,
    last: null,
    typed: [],
    errors: [],
    tools: {},
    skills: {},
    compactions: 0,
    final: "",
  };
  for (const line of lines) {
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }
    if (row.timestamp) {
      digest.first ??= row.timestamp;
      digest.last = row.timestamp;
    }
    if (row.isCompactSummary || row.subtype === "compact_boundary") digest.compactions += 1;
    const content = row.message?.content;
    if (row.type === "user" && !row.isSidechain) {
      const text = textOf(content);
      if (isTyped(text))
        digest.typed.push({ at: row.timestamp, text: redact(text.slice(0, MAX_USER_CHARS)) });
    }
    if (row.type === "assistant") {
      const said = textOf(content);
      if (said.trim()) digest.final = redact(said.slice(0, MAX_FINAL_CHARS));
    }
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (part?.type === "tool_use") {
        digest.tools[part.name] = (digest.tools[part.name] ?? 0) + 1;
        if (part.name === "Skill" && part.input?.skill) {
          digest.skills[part.input.skill] = (digest.skills[part.input.skill] ?? 0) + 1;
        }
      }
      if (part?.type === "tool_result" && part.is_error) {
        const text =
          typeof part.content === "string" ? part.content : JSON.stringify(part.content ?? "");
        digest.errors.push({ at: row.timestamp, text: redact(text.slice(0, MAX_ERROR_CHARS)) });
      }
    }
  }
  return digest;
}

/** Paths and issue numbers a memory cites: the claims a stale check can test mechanically. */
export function memoryClaims(text) {
  const paths = [...text.matchAll(/`([\w./-]+\.(?:mjs|ts|tsx|sh|md|yml|json|js))`/g)]
    .map((m) => m[1])
    .filter((p) => p.includes("/"));
  const issues = [...text.matchAll(/(?:^|[\s(])#(\d{3,5})\b/g)].map((m) => Number(m[1]));
  return { paths: [...new Set(paths)], issues: [...new Set(issues)] };
}

/** The folders holding this project's session transcripts: the main checkout's and one per worktree. */
function transcriptDirs() {
  if (process.env.AGENT_TRANSCRIPTS_DIR) return [process.env.AGENT_TRANSCRIPTS_DIR];
  const root = join(homedir(), ".claude", "projects");
  return readdirSync(root)
    .filter((name) => name === PROJECT || name.startsWith(`${PROJECT}-`))
    .map((name) => join(root, name));
}

/** When a session started: the first timestamp in its transcript, read from the file's head. */
function startedAt(path) {
  const fd = openSync(path, "r");
  try {
    const head = Buffer.alloc(HEAD_BYTES);
    const read = readSync(fd, head, 0, HEAD_BYTES, 0);
    const stamp = /"timestamp":"([^"]+)"/.exec(head.toString("utf8", 0, read))?.[1];
    const at = Date.parse(stamp ?? "");
    return Number.isNaN(at) ? statSync(path).mtimeMs : at;
  } finally {
    closeSync(fd);
  }
}

/**
 * The sessions a review should read, newest started first. File times will not do: transcripts were
 * bulk-touched on 10-21 to 10-23, so the first review's "20 newest" reached back to 08-21, 14 of the
 * 20 predated 10-18, and it saw no session started in a worktree (#6470's study).
 */
export function recent(count, since = null) {
  const after = since ? Date.parse(since) : Number.NEGATIVE_INFINITY;
  return transcriptDirs()
    .flatMap((dir) =>
      readdirSync(dir)
        .filter((name) => name.endsWith(".jsonl"))
        .map((name) => join(dir, name)),
    )
    .map((path) => ({ path, at: startedAt(path) }))
    .filter((file) => file.at >= after)
    .sort((a, b) => b.at - a.at)
    .slice(0, count)
    .map((file) => file.path);
}

function staleCandidates(dir) {
  const out = [];
  for (const name of readdirSync(dir).filter((n) => n.endsWith(".md"))) {
    const claims = memoryClaims(readFileSync(join(dir, name), "utf8"));
    const missing = claims.paths.filter(
      (path) =>
        !(path.startsWith("/") || path.startsWith("~")) &&
        spawnSync("git", ["cat-file", "-e", `origin/main:${path}`]).status !== 0,
    );
    const closed = claims.issues.filter((n) => {
      const res = spawnSync(
        "gh",
        ["issue", "view", String(n), "--json", "state", "--jq", ".state"],
        { encoding: "utf8" },
      );
      return res.stdout?.trim() === "CLOSED";
    });
    out.push({
      file: name,
      modified: statSync(join(dir, name)).mtime.toISOString().slice(0, 10),
      missingPaths: missing,
      closedIssues: closed,
    });
  }
  return out;
}

function checksums(dir) {
  return Object.fromEntries(
    readdirSync(dir)
      .filter((name) => statSync(join(dir, name)).isFile())
      .sort()
      .map((name) => [
        name,
        createHash("sha256")
          .update(readFileSync(join(dir, name)))
          .digest("hex"),
      ]),
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [flag, value, option, optionValue] = process.argv.slice(2);
  if (flag === "--session" && existsSync(value)) {
    console.log(JSON.stringify(digestLines(readFileSync(value, "utf8").split("\n")), null, 1));
  } else if (flag === "--recent") {
    console.log(recent(Number(value), option === "--since" ? optionValue : null).join("\n"));
  } else if (flag === "--memory") {
    console.log(JSON.stringify(staleCandidates(value), null, 1));
  } else if (flag === "--checksums") {
    console.log(JSON.stringify(checksums(value), null, 1));
  } else {
    console.error(
      "usage: dream-digest --session F | --recent N [--since DATE] | --memory DIR | --checksums DIR",
    );
    process.exit(2);
  }
}
