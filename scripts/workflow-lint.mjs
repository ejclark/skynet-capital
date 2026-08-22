#!/usr/bin/env node
// Workflow lint — the eye that would have caught the 2026-08-22 outage before it merged.
//
//   node scripts/workflow-lint.mjs            # check .github/workflows (exit 1 on a problem)
//   node scripts/workflow-lint.mjs <dir>      # check another directory (specs)
//
// WHAT HAPPENED: an edit to postmaster.yml left the `build-feedback:` job key defined TWICE. YAML
// loaders that follow the spec loosely — including `yaml.safe_load` in the check that was run —
// silently keep the last duplicate, so the file looked fine locally. GitHub's parser rejects it,
// and a rejected workflow does not fail one job: it produces a run with ZERO jobs, named after the
// file path instead of the workflow. `main` went red and the postmaster (feedback lane, event
// research, stall audit) was dead until a human noticed.
//
// So this is deliberately not a YAML validator. It checks the three structural things that broke,
// or nearly broke, in that one incident:
//
//   1. DUPLICATE KEYS in the same mapping — the outage itself.
//   2. A `steps.<id>.outputs` reference with no step declaring that id in the same job — the state
//      the file was in for several minutes while the tier step was being removed.
//   3. A `needs:` naming a job that does not exist.
//
// Dependency-free on purpose (same doctrine as arch-scan/dupe-scan): a gate that guards CI must not
// itself depend on a package resolving. It parses only the block-style, 2-space-indented subset
// this repo's workflows are written in, and skips block scalars (`run: |`) wholesale, which is
// where arbitrary shell text lives.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const KEY = /^(\s*)(-\s+)?([A-Za-z_][\w.-]*):(\s|$)/;
const BLOCK_SCALAR = /:\s*[|>][-+\d]*\s*$/;

/**
 * The open mappings, innermost last. A sequence item (`- name: x`) opens a fresh mapping, so a key
 * repeating across list items is correct and never flagged.
 */
class Scopes {
  constructor() {
    this.stack = [];
  }

  /** Record `key` at `indent`; returns true when it is a duplicate of a sibling. */
  visit(key, indent, isSeqItem) {
    while (this.stack.length && this.stack[this.stack.length - 1].indent > indent) this.stack.pop();
    if (isSeqItem) {
      while (this.stack.length && this.stack[this.stack.length - 1].indent >= indent) {
        this.stack.pop();
      }
    }
    let scope = this.stack[this.stack.length - 1];
    if (!scope || scope.indent < indent) {
      scope = { indent, keys: new Set() };
      this.stack.push(scope);
    }
    const duplicate = scope.keys.has(key);
    scope.keys.add(key);
    return duplicate;
  }
}

/** Duplicate mapping keys, as `{ line, key, indent }`. Block scalars (`run: |`) are opaque text. */
export function duplicateKeys(text) {
  const found = [];
  const scopes = new Scopes();
  let skipDeeperThan = -1;

  text.split("\n").forEach((raw, i) => {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim() || line.trim().startsWith("#")) return;
    const indent = line.length - line.trimStart().length;
    if (skipDeeperThan >= 0 && indent > skipDeeperThan) return;
    skipDeeperThan = -1;

    const m = KEY.exec(line);
    if (!m) return;
    const [, pad, dash, key] = m;
    // A `- key:` opens a new mapping whose keys sit at the dash's column + its width.
    const keyIndent = (pad ?? "").length + (dash ? dash.length : 0);
    if (scopes.visit(key, keyIndent, Boolean(dash)))
      found.push({ line: i + 1, key, indent: keyIndent });
    if (BLOCK_SCALAR.test(line)) skipDeeperThan = keyIndent;
  });
  return found;
}

/** Job blocks: `{ name, start, end, text }` for each two-space key under `jobs:`. */
function jobs(text) {
  const lines = text.split("\n");
  const at = lines.findIndex((l) => /^jobs:\s*$/.test(l));
  if (at === -1) return [];
  const starts = [];
  for (let i = at + 1; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (/^\S/.test(line) && line.trim()) break;
    if (/^ {2}[A-Za-z_][\w.-]*:\s*$/.test(line)) starts.push(i);
  }
  return starts.map((start, k) => {
    const end = starts[k + 1] ?? lines.length;
    return {
      name: (lines[start] ?? "").trim().replace(/:$/, ""),
      start: start + 1,
      text: lines.slice(start, end).join("\n"),
    };
  });
}

/** `steps.<id>.outputs.…` referenced in a job with no step declaring that id. */
export function danglingStepRefs(text) {
  const problems = [];
  for (const job of jobs(text)) {
    const declared = new Set([...job.text.matchAll(/^\s*-?\s*id:\s*([\w.-]+)/gm)].map((m) => m[1]));
    for (const ref of new Set(
      [...job.text.matchAll(/steps\.([\w.-]+)\.outputs/g)].map((m) => m[1]),
    )) {
      if (!declared.has(ref)) problems.push({ job: job.name, ref });
    }
  }
  return problems;
}

/** `needs:` entries naming a job the file does not define. */
export function danglingNeeds(text) {
  const names = new Set(jobs(text).map((j) => j.name));
  const problems = [];
  for (const job of jobs(text)) {
    const inline = /^\s{4}needs:\s*\[([^\]]*)\]/m.exec(job.text);
    const single = /^\s{4}needs:\s*([\w.-]+)\s*$/m.exec(job.text);
    const listed = inline
      ? inline[1].split(",").map((s) => s.trim().replace(/["']/g, ""))
      : single
        ? [single[1]]
        : [...job.text.matchAll(/^\s{4}needs:\s*\n((?:\s{6}-\s*[\w.-]+\s*\n)+)/gm)].flatMap((m) =>
            m[1].split("\n").map((l) => l.replace(/^\s*-\s*/, "").trim()),
          );
    for (const need of listed.filter(Boolean)) {
      if (!names.has(need)) problems.push({ job: job.name, need });
    }
  }
  return problems;
}

export function lintWorkflow(name, text) {
  return [
    ...duplicateKeys(text).map(
      (d) =>
        `${name}:${d.line} duplicate key \`${d.key}\` in the same mapping — GitHub rejects the file and the run has zero jobs`,
    ),
    ...danglingStepRefs(text).map(
      (d) =>
        `${name} job \`${d.job}\` reads \`steps.${d.ref}.outputs\` but declares no step \`${d.ref}\``,
    ),
    ...danglingNeeds(text).map(
      (d) => `${name} job \`${d.job}\` needs \`${d.need}\`, which this file does not define`,
    ),
  ];
}

function main(argv) {
  const dir = argv.find((a) => !a.startsWith("--")) ?? ".github/workflows";
  const files = readdirSync(dir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
  const problems = files.flatMap((f) => lintWorkflow(f, readFileSync(join(dir, f), "utf8")));
  for (const p of problems) console.error(`✗ ${p}`);
  if (problems.length) {
    console.error(`\n${problems.length} problem(s) in ${dir} — see docs/LESSONS.md 2026-08-22.`);
    process.exit(1);
  }
  console.log(`workflow-lint: ✓ ${files.length} workflow(s) structurally sound.`);
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2));
