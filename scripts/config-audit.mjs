#!/usr/bin/env node
// Config audit — a read-only "eye" for CONFIG/CAPABILITY drift, the dimension incident-scan.mjs is
// blind to (it only sees a red `main`). This one watches whether the .claude/ ecosystem stays
// coherent: capabilities nothing routes to, owner-claims that contradict CLAUDE.md, and recurring
// corrections that should be templatized.
//
// It is the missing consumer the duel-log hook (scripts/duel-log.mjs) promised — "a mining pass
// later distills this." Design invariants, by construction:
//   • CONTINUOUS DETECTION, GATED CORRECTION — it detects over objective logged signal and PROPOSES;
//     it applies nothing. Every fix is a human's to approve.
//   • It WRITES NOTHING and never touches a gate it could be judged by (no reward-hacking surface).
//   • Deterministic + free — one build cost, ~free per run, can't drift back (docs/COACHES.md).
//
// Honest limits (verified against the live log): the duel-log `fanout.agent` field is the task
// LABEL, not the agent-type, so it cannot say which roster agent fired. Orphan detection is therefore
// reference-counting over the CONFIG SURFACE (.claude + CLAUDE.md + routing docs), a heuristic that
// can miss a capability invoked only via `Workflow` agentType — so it PROPOSES "possibly orphaned,
// verify," never asserts. Extending Graphify to index .claude/ is the deferred elegant replacement
// (docs/TECHNIQUES.md / the plan).
//
//   node scripts/config-audit.mjs        # print the proposal report; modify nothing; exit 0

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const AGENTS_DIR = join(ROOT, ".claude/agents");
const SKILLS_DIR = join(ROOT, ".claude/skills");
const CLAUDE_MD = join(ROOT, "CLAUDE.md");
const DUEL_LOG = join(ROOT, "data/duel-log.jsonl");
const COMPUTE_MD = join(ROOT, "docs/COMPUTE.md");

// Ordered tiers for floor comparison. A value at index i satisfies a floor at index j iff i >= j.
const MODEL_RANK = ["haiku", "sonnet", "opus", "fable"];
const EFFORT_RANK = ["low", "medium", "high", "xhigh", "max"];

// ---- enumerate capabilities -----------------------------------------------------------------------

/** @returns {{name: string, kind: "agent"|"skill", file: string}[]} */
function capabilities() {
  const out = [];
  if (existsSync(AGENTS_DIR)) {
    for (const f of readdirSync(AGENTS_DIR)) {
      if (f.endsWith(".md"))
        out.push({ name: f.replace(/\.md$/, ""), kind: "agent", file: join(".claude/agents", f) });
    }
  }
  if (existsSync(SKILLS_DIR)) {
    for (const d of readdirSync(SKILLS_DIR, { withFileTypes: true })) {
      if (d.isDirectory() && existsSync(join(SKILLS_DIR, d.name, "SKILL.md"))) {
        out.push({ name: d.name, kind: "skill", file: join(".claude/skills", d.name, "SKILL.md") });
      }
    }
  }
  return out;
}

/** Files (repo-relative) that mention `term` as a whole word, over the config/routing surface. */
function refFiles(term) {
  try {
    const stdout = execFileSync(
      "git",
      ["grep", "-l", "-w", "-F", "-e", term, "--", ".claude", "CLAUDE.md", "docs"],
      { cwd: ROOT, encoding: "utf8" },
    );
    return stdout.split("\n").filter(Boolean);
  } catch {
    return []; // git grep exits 1 on no match
  }
}

// ---- check 1: possibly-orphaned capabilities ------------------------------------------------------

function orphanFindings(caps) {
  const findings = [];
  for (const cap of caps) {
    // Reference forms: the bare name, and the slash form for skills. Exclude the capability's own file.
    const refs = new Set([
      ...refFiles(cap.name),
      ...(cap.kind === "skill" ? refFiles(`/${cap.name}`) : []),
    ]);
    refs.delete(cap.file);
    // A skill's own dir may hold reference files; drop anything under its own directory.
    const own = cap.kind === "skill" ? `.claude/skills/${cap.name}/` : cap.file;
    const external = [...refs].filter((f) => !f.startsWith(own));
    if (external.length === 0) {
      findings.push(
        `  • ${cap.kind} "${cap.name}" — no config-surface references outside its own file. Possibly orphaned; verify it is invoked (e.g. via Workflow agentType) or retire/route it.`,
      );
    }
  }
  return findings;
}

// ---- check 2: owner-claims that contradict CLAUDE.md ----------------------------------------------

function contradictionFindings(caps) {
  const findings = [];
  const claudeMd = existsSync(CLAUDE_MD) ? readFileSync(CLAUDE_MD, "utf8") : "";
  // Case-insensitive: a capability named lowercase is still "named" when CLAUDE.md capitalizes it
  // (e.g. the "Ship loop" heading matches the `ship` skill) — the case-sensitive form false-flagged it.
  const named = (name) =>
    new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(claudeMd);
  for (const cap of caps) {
    const body = readFileSync(join(ROOT, cap.file), "utf8");
    // Does the capability CLAIM CLAUDE.md routes to / calls for it?
    const claimsClaudeMd =
      /CLAUDE\.md/.test(body) &&
      /(routes?|calls for|per CLAUDE\.md|standing second pass)/i.test(body);
    if (claimsClaudeMd && !named(cap.name)) {
      findings.push(
        `  • ${cap.kind} "${cap.name}" cites CLAUDE.md as routing to it, but CLAUDE.md never names it. Ambiguous ownership — reconcile the claim with the actual route.`,
      );
    }
  }
  return findings;
}

// ---- check 3: recurring corrections / templatization opportunities --------------------------------

const STOP = new Set([
  "the",
  "a",
  "an",
  "to",
  "of",
  "and",
  "or",
  "in",
  "on",
  "for",
  "is",
  "it",
  "this",
  "that",
  "i",
  "we",
  "you",
  "our",
  "be",
  "as",
  "with",
  "so",
  "if",
  "at",
  "by",
  "not",
  "but",
  "have",
  "has",
  "do",
  "can",
  "should",
  "would",
  "want",
  "like",
  "me",
  "my",
]);

// The intent hook logs EVERY user-turn, including harness-generated ones (task notifications, webhook
// events, scheduled PR check-ins, resume prompts). Those are not Eric's asks and drown the real signal
// (verified: the first run's clusters were almost entirely harness traffic). Filter them so check ③
// reflects genuine recurring corrections, not the harness talking to itself.
const HARNESS = [
  /^\s*<task-notification/i,
  /^\s*<github-webhook-activity/i,
  /^\s*<system-reminder/i,
  /^\s*<local-command/i,
  /\[SYSTEM NOTIFICATION/i,
  /^\s*Check[- ]?in on PR/i,
  /^\s*Continue from where you left off/i,
];
const isHarness = (prompt) => HARNESS.some((re) => re.test(prompt));

/** Significant word-set of a prompt (lowercased, de-punctuated, stopwords + short words dropped). */
function signature(prompt) {
  return new Set(
    prompt
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP.has(w)),
  );
}

/** Jaccard similarity of two word-sets. */
function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter);
}

/** Parse the duel-log into genuine (non-harness) intents + a count of corrections against agent output. */
function parseHumanIntents() {
  if (!existsSync(DUEL_LOG)) return { intents: [], correctionCount: 0 };
  const intents = [];
  let lastWasFanin = false;
  let correctionCount = 0;
  for (const line of readFileSync(DUEL_LOG, "utf8").split("\n").filter(Boolean)) {
    let ev;
    try {
      ev = JSON.parse(line);
    } catch {
      continue;
    }
    if (ev.kind === "fanin") {
      lastWasFanin = true;
      continue;
    }
    if (ev.kind !== "intent") {
      lastWasFanin = false;
      continue;
    }
    const prompt = String(ev.prompt || "");
    if (isHarness(prompt)) {
      lastWasFanin = false; // harness turns are not Eric's corrections
      continue;
    }
    if (lastWasFanin) correctionCount++; // an intent right after a fanin = a correction against just-produced work
    intents.push({ prompt: prompt.slice(0, 90).replace(/\s+/g, " "), sig: signature(prompt) });
    lastWasFanin = false;
  }
  return { intents, correctionCount };
}

/** Greedy-cluster intents by Jaccard word-overlap >= 0.4 (crude, deterministic); groups of >= 2. */
function clusterIntents(intents) {
  const clusters = [];
  const used = new Set();
  for (let i = 0; i < intents.length; i++) {
    if (used.has(i)) continue;
    const group = [intents[i].prompt];
    for (let j = i + 1; j < intents.length; j++) {
      if (used.has(j)) continue;
      if (jaccard(intents[i].sig, intents[j].sig) >= 0.4) {
        group.push(intents[j].prompt);
        used.add(j);
      }
    }
    if (group.length >= 2) {
      used.add(i);
      clusters.push(group);
    }
  }
  return clusters;
}

function recurringIntents() {
  const { intents, correctionCount } = parseHumanIntents();
  return { clusters: clusterIntents(intents), correctionCount };
}

// ---- check 4: compute-routing floor (model + effort per task class) -------------------------------

/** Read a `key: value` from the first frontmatter block of an agent file. */
function frontmatterValue(file, key) {
  const text = readFileSync(join(ROOT, file), "utf8");
  const end = text.indexOf("\n---", 3); // frontmatter opens with a leading `---`
  const block = end === -1 ? text : text.slice(0, end);
  const m = block.match(new RegExp(`^${key}:\\s*(\\S+)`, "m"));
  return m ? m[1] : null;
}

/** Parse the machine-readable FLOOR-TABLE block in docs/COMPUTE.md → Map(agent → {model, effort}). */
function parseFloorTable() {
  if (!existsSync(COMPUTE_MD)) return null;
  const text = readFileSync(COMPUTE_MD, "utf8");
  const start = text.indexOf("<!-- FLOOR-TABLE:START -->");
  const stop = text.indexOf("<!-- FLOOR-TABLE:END -->");
  if (start === -1 || stop === -1) return null;
  const floors = new Map();
  for (const line of text.slice(start, stop).split("\n")) {
    const cells = line.split("|").map((c) => c.trim());
    // Row shape: ["", agent, class, model, effort, ""]. Skip header ("agent") and separator ("---").
    if (cells.length < 6) continue;
    const [, agent, , model, effort] = cells;
    if (!agent || agent === "agent" || /^-+$/.test(agent)) continue;
    floors.set(agent, { model, effort });
  }
  return floors;
}

function computeFloorFindings(caps) {
  const floors = parseFloorTable();
  if (!floors) {
    return ["  • docs/COMPUTE.md FLOOR-TABLE block not found — cannot enforce compute floors."];
  }
  const findings = [];
  const agents = caps.filter((c) => c.kind === "agent");
  for (const cap of agents) {
    const floor = floors.get(cap.name);
    if (!floor) {
      findings.push(
        `  • agent "${cap.name}" has no row in the COMPUTE.md floor table — assign it a model/effort floor (or confirm it is exempt).`,
      );
      continue;
    }
    const model = frontmatterValue(cap.file, "model");
    const effort = frontmatterValue(cap.file, "effort");
    if (!effort) {
      findings.push(
        `  • agent "${cap.name}" declares no \`effort:\` — floor is ${floor.effort}. Add it (no-shortcuts guard).`,
      );
    } else if (EFFORT_RANK.indexOf(effort) < EFFORT_RANK.indexOf(floor.effort)) {
      findings.push(
        `  • agent "${cap.name}" effort "${effort}" is below its floor "${floor.effort}" — raise it or re-class the agent in COMPUTE.md.`,
      );
    }
    if (model && MODEL_RANK.indexOf(model) < MODEL_RANK.indexOf(floor.model)) {
      findings.push(
        `  • agent "${cap.name}" model "${model}" is below its floor "${floor.model}" — upgrade it or re-class the agent in COMPUTE.md.`,
      );
    }
  }
  // Floor rows with no matching agent — a stale table entry.
  const names = new Set(agents.map((a) => a.name));
  for (const agent of floors.keys()) {
    if (!names.has(agent)) {
      findings.push(
        `  • COMPUTE.md floor table names "${agent}", but no such agent exists — remove the stale row.`,
      );
    }
  }
  return findings;
}

// ---- report ---------------------------------------------------------------------------------------

function main() {
  const caps = capabilities();
  const orphans = orphanFindings(caps);
  const contradictions = contradictionFindings(caps);
  const { clusters, correctionCount } = recurringIntents();
  const floorFindings = computeFloorFindings(caps);

  const line = "─".repeat(90);
  console.log(`\n${line}\nCONFIG AUDIT — proposals only; nothing was modified.\n${line}`);
  console.log(
    `Capabilities: ${caps.filter((c) => c.kind === "agent").length} agents, ${caps.filter((c) => c.kind === "skill").length} skills.\n`,
  );

  console.log(
    "① Possibly-orphaned capabilities (no config-surface references — verify or retire):",
  );
  console.log(orphans.length ? orphans.join("\n") : "  • none");

  console.log("\n② Owner-claims that contradict CLAUDE.md (ambiguous routing):");
  console.log(contradictions.length ? contradictions.join("\n") : "  • none");

  console.log(
    "\n③ Recurring intent themes (candidates to templatize / codify into a skill or rule):",
  );
  if (clusters.length) {
    for (const group of clusters.slice(0, 8)) {
      console.log(`  • ${group.length} similar prompts, e.g.:`);
      for (const p of group.slice(0, 3)) console.log(`      – "${p}…"`);
    }
    if (clusters.length > 8) console.log(`  • …and ${clusters.length - 8} more clusters.`);
  } else {
    console.log("  • none above threshold");
  }
  console.log(
    `\n  ${correctionCount} intent(s) immediately followed a subagent result — likely corrections against just-produced work (the richest templatization signal).`,
  );

  console.log(
    "\n④ Compute-routing floor (model + effort below the docs/COMPUTE.md class floor — the no-shortcuts guard):",
  );
  console.log(
    floorFindings.length ? floorFindings.join("\n") : "  • none — every agent meets its floor",
  );

  console.log(
    `\n${line}\nEvidence-triggered · human-gated · wrote nothing. Approve any proposal by acting on it yourself.\n${line}\n`,
  );
}

main();
