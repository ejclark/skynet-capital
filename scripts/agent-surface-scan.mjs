#!/usr/bin/env node
// Agent-surface scan — the eye for the files that route plain intent to machinery: .claude/skills,
// .claude/agents and the hooks in .claude/settings.json.
//
//   node scripts/agent-surface-scan.mjs              # check the repo (exit 1 on an error, 2 unknown)
//   node scripts/agent-surface-scan.mjs --root <dir> # check another tree (specs)
//   node scripts/agent-surface-scan.mjs --json       # machine shape
//
// WHY (2026-09-26, #3769 slice 3, the lousy-agents lesson "instruction files are code: lint them"):
// a skill whose frontmatter `name` does not match its directory, an agent with no description, or
// a hook wired to an event name Claude Code does not know all fail the same way — silently. The
// skill is never routed, the hook never fires, and nothing in the repo said so. `/grind` shipped
// documented and un-invokable that way once (scripts/workflow-meta-scan.mjs); this is the same
// check for the rest of the surface. The hook-event list is read from the vendored Claude Code
// docs (docs/vendor/claude-code/hooks.md → "## Hook events"), never from memory, so a docs bump
// moves the truth with it.
//
// Findings are `error` (the construct will not work as written) or `note` (it works, but a reader
// would want to know). Advisory in CI via tests/arch/agent-surface.spec.ts: the sweep is new, and
// a gate that has not yet proved it fires only on real defects stays advisory (docs/COACHES.md →
// "A gate is a momentum breaker unless it protects a constraint").
//
// Exit codes: 0 clean · 1 at least one error · 2 UNKNOWN — an input the check needs is missing
// (no vendored hooks doc, unreadable settings.json), so the verdict is not an answer.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const argOf = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
};

/** Events whose handlers select by a matcher; one without a matcher fires on everything. */
const MATCHED_EVENTS = new Set([
  "PreToolUse",
  "PostToolUse",
  "PostToolUseFailure",
  "PermissionRequest",
]);
/** A routing trigger a skill or agent description must carry (CLAUDE.md → Operations: "every
 *  skill/agent states its own `Use when`"). The wording varies; the shape is `Use <when|…>`. */
const USE_TRIGGER = /\bUse (when|whenever|before|after|to|for|only|on)\b/;

/**
 * The YAML subset our frontmatter actually uses: `key: scalar`, `key: >-` / `key: |` folded blocks,
 * and `key:` followed by `- item` lists. Anything richer is not something this repo writes, and a
 * parser that accepted more would hide a malformed file behind a permissive read.
 */
/** Lines of a folded (`>-`) or literal (`|`) block: the indented run after the key. */
function readBlock(lines, from, end) {
  const block = [];
  let i = from;
  while (i < end && (lines[i].startsWith("  ") || lines[i].trim() === "")) {
    block.push(lines[i].trim());
    i += 1;
  }
  return { block, next: i };
}

/** Items of a `- item` list after a bare `key:`. */
function readList(lines, from, end) {
  const list = [];
  let i = from;
  while (i < end && /^\s+-\s+/.test(lines[i])) {
    list.push(lines[i].replace(/^\s+-\s+/, "").trim());
    i += 1;
  }
  return { list, next: i };
}

export function parseFrontmatter(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trim() !== "---")
    return { fields: null, reason: "no frontmatter (first line is not ---)" };
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
  if (end === -1) return { fields: null, reason: "unterminated frontmatter (no closing ---)" };
  const fields = {};
  let i = 1;
  while (i < end) {
    const line = lines[i];
    const m = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!m) {
      if (line.trim() !== "")
        return { fields: null, reason: `unparseable frontmatter line ${i + 1}: ${line}` };
      i += 1;
      continue;
    }
    const [, key, rest] = m;
    if (rest === ">-" || rest === "|" || rest === ">" || rest === "|-") {
      const { block, next } = readBlock(lines, i + 1, end);
      fields[key] = block.join(rest.startsWith("|") ? "\n" : " ").trim();
      i = next;
    } else if (rest === "") {
      const { list, next } = readList(lines, i + 1, end);
      fields[key] = list;
      i = next;
    } else {
      fields[key] = rest.trim().replace(/^["']|["']$/g, "");
      i += 1;
    }
  }
  return { fields, reason: null };
}

const finding = (level, where, detail) => ({ level, where, detail });

function scanSkills(root) {
  const dir = join(root, ".claude", "skills");
  const out = [];
  if (!existsSync(dir))
    return {
      findings: [finding("note", ".claude/skills", "absent — no skills to check")],
      count: 0,
    };
  const dirs = readdirSync(dir).filter((d) => statSync(join(dir, d)).isDirectory());
  for (const d of dirs) {
    const file = join(dir, d, "SKILL.md");
    const where = `.claude/skills/${d}/SKILL.md`;
    if (!existsSync(file)) {
      out.push(
        finding("error", where, "missing — a skill directory without SKILL.md is not a skill"),
      );
      continue;
    }
    const { fields, reason } = parseFrontmatter(readFileSync(file, "utf8"));
    if (!fields) {
      out.push(finding("error", where, reason));
      continue;
    }
    if (fields.name !== d)
      out.push(
        finding(
          "error",
          where,
          `frontmatter name "${fields.name ?? ""}" ≠ directory "${d}" — /${d} never resolves`,
        ),
      );
    if (!fields.description)
      out.push(finding("error", where, "no description — the roster cannot route to it"));
    else if (!USE_TRIGGER.test(fields.description))
      out.push(
        finding("note", where, "description states no `Use when` trigger (CLAUDE.md → Operations)"),
      );
  }
  return { findings: out, count: dirs.length };
}

function scanAgents(root) {
  const dir = join(root, ".claude", "agents");
  const out = [];
  if (!existsSync(dir))
    return {
      findings: [finding("note", ".claude/agents", "absent — no agents to check")],
      count: 0,
    };
  const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
  for (const f of files) {
    const stem = basename(f, ".md");
    const where = `.claude/agents/${f}`;
    const { fields, reason } = parseFrontmatter(readFileSync(join(dir, f), "utf8"));
    if (!fields) {
      out.push(finding("error", where, reason));
      continue;
    }
    if (fields.name !== stem)
      out.push(
        finding(
          "error",
          where,
          `frontmatter name "${fields.name ?? ""}" ≠ file "${stem}" — subagent_type "${stem}" never resolves`,
        ),
      );
    if (!fields.description)
      out.push(
        finding("error", where, "no description — the Agent tool shows nothing to route on"),
      );
    else if (!USE_TRIGGER.test(fields.description))
      out.push(
        finding("note", where, "description states no `Use when` trigger (CLAUDE.md → Operations)"),
      );
    if (fields.tools === undefined)
      out.push(
        finding("note", where, "no `tools` field — inherits every tool; say so if intended"),
      );
  }
  return { findings: out, count: files.length };
}

/** The event names Claude Code fires, read from the vendored docs' "## Hook events" section. */
export function hookEventsFromDocs(root) {
  const doc = join(root, "docs", "vendor", "claude-code", "hooks.md");
  if (!existsSync(doc)) return null;
  const lines = readFileSync(doc, "utf8").split(/\r?\n/);
  const start = lines.findIndex((l) => /^## Hook events\s*$/.test(l));
  if (start === -1) return null;
  const events = [];
  for (const l of lines.slice(start + 1)) {
    if (/^## /.test(l)) break;
    const m = l.match(/^### ([A-Z][A-Za-z]+)\s*$/);
    if (m) events.push(m[1]);
  }
  return events.length ? new Set(events) : null;
}

function scanHooks(root) {
  const file = join(root, ".claude", "settings.json");
  const where = ".claude/settings.json";
  if (!existsSync(file))
    return {
      findings: [finding("note", where, "absent — no hooks to check")],
      unknown: false,
      count: 0,
    };
  let settings;
  try {
    settings = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    return {
      findings: [
        finding("error", where, `not valid JSON (${err.message}) — every hook in it is dead`),
      ],
      unknown: false,
      count: 0,
    };
  }
  const events = hookEventsFromDocs(root);
  if (!events) {
    return {
      findings: [
        finding(
          "error",
          where,
          "UNKNOWN — docs/vendor/claude-code/hooks.md has no `## Hook events` section, so no event name can be checked",
        ),
      ],
      unknown: true,
      count: 0,
    };
  }
  const out = [];
  const hooks = settings.hooks ?? {};
  for (const key of Object.keys(settings)) {
    if (events.has(key))
      out.push(
        finding("error", where, `"${key}" sits at the top level, outside "hooks" — it never fires`),
      );
  }
  let count = 0;
  for (const [event, entries] of Object.entries(hooks)) {
    if (!events.has(event))
      out.push(
        finding(
          "error",
          `${where} → hooks.${event}`,
          `not a Claude Code hook event (vendored docs list ${events.size}) — it never fires`,
        ),
      );
    if (!Array.isArray(entries)) {
      out.push(
        finding("error", `${where} → hooks.${event}`, "must be an array of {matcher?, hooks:[…]}"),
      );
      continue;
    }
    entries.forEach((entry, i) => {
      const at = `${where} → hooks.${event}[${i}]`;
      if (!Array.isArray(entry.hooks) || entry.hooks.length === 0)
        out.push(finding("error", at, "no `hooks` array — nothing runs"));
      else
        entry.hooks.forEach((h, j) => {
          count += 1;
          if (h.type === "command" && !h.command)
            out.push(finding("error", `${at}.hooks[${j}]`, "type command with no `command`"));
          if (
            h.type !== "command" &&
            h.type !== "prompt" &&
            h.type !== "agent" &&
            h.type !== "http"
          )
            out.push(finding("error", `${at}.hooks[${j}]`, `unknown hook type "${h.type ?? ""}"`));
        });
      if (MATCHED_EVENTS.has(event) && entry.matcher === undefined)
        out.push(finding("note", at, "no matcher — fires on every tool; say so if intended"));
    });
  }
  return { findings: out, unknown: false, count };
}

export function scanAgentSurface(root = process.cwd()) {
  const skills = scanSkills(root);
  const agents = scanAgents(root);
  const hooks = scanHooks(root);
  const findings = [...skills.findings, ...agents.findings, ...hooks.findings];
  return {
    counts: { skills: skills.count, agents: agents.count, hooks: hooks.count },
    errors: findings.filter((f) => f.level === "error"),
    notes: findings.filter((f) => f.level === "note"),
    unknown: hooks.unknown,
  };
}

function main() {
  const root = argOf("root") ?? process.cwd();
  const result = scanAgentSurface(root);
  if (process.argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    console.log(
      `🧭 Agent-surface scan — ${result.counts.skills} skills · ${result.counts.agents} agents · ${result.counts.hooks} hook handlers`,
    );
    for (const f of result.errors) console.log(`  ✗ ${f.where} — ${f.detail}`);
    for (const f of result.notes) console.log(`  · ${f.where} — ${f.detail}`);
    if (result.errors.length === 0 && !result.unknown)
      console.log("  ✓ every skill, agent and hook resolves as written.");
  }
  if (result.unknown) process.exit(2);
  if (result.errors.length) process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
