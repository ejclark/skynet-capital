#!/usr/bin/env node
// Workflow lint — the eye that would have caught the 2026-08-22 outage before it merged.
//
//   node scripts/workflow-lint.mjs            # check .github/workflows (exit 1 on a problem)
//   node scripts/workflow-lint.mjs <dir>      # check another directory (specs)
//
// WHAT HAPPENED: an edit to moneypenny-events.yml (then postmaster.yml) left the `build-feedback:` job key defined TWICE. YAML
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
//   4. A `workflow_run` trigger with no `workflows:` list — added after the same outage recurred on
//      moneypenny-repair.yml (then ci-medic.yml) itself when that list was removed.
//   5. A prompt shim naming a `.github/prompts/*.md` that does not exist. Since 2026-08-22 the AI
//      lanes read their instructions from files rather than inline YAML; a wrong path is silent
//      here and only shows up as a live session running with no orders.
//   6. A job step running `node scripts/<x>.mjs`, where that script's own import graph reaches a
//      package needing `node_modules`, with no earlier step in the same job installing dependencies
//      (`npm ci`/`npm install`). Added 2026-08-29 (#894) after #889/#890: `arm-auto-merge` ran
//      `envelope-scan.mjs` — which imports the `typescript` devDependency via `envelope-widening.mjs`
//      — with no install step ahead of it, crashed silently, and the job failed instead of correctly
//      reporting "this diff touches a protected path, skip." #889 itself still merged, because this
//      check is the one that would have caught it and did not yet exist.
//
// Dependency-free on purpose (same doctrine as arch-scan/dupe-scan): a gate that guards CI must not
// itself depend on a package resolving. It parses only the block-style, 2-space-indented subset
// this repo's workflows are written in, and skips block scalars (`run: |`) wholesale, which is
// where arbitrary shell text lives.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { needsInstalledDeps } from "./script-deps.mjs";

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

/**
 * A `workflow_run` trigger must name its workflows. HOUSE RULE FROM AN INCIDENT, not from the
 * schema: SchemaStore marks `workflows` optional, and on 2026-08-22 removing it (to catch
 * unparseable files, whose runs are named by path) got ci-medic.yml (renamed moneypenny-repair.yml, #912) rejected by GitHub outright —
 * a zero-job run named by its own path. Whatever the validator's exact objection, a listed trigger
 * is the shape that provably works here, and the path forms cover the unparseable case.
 */
export function unfilteredWorkflowRun(text) {
  if (!/^\s{2}workflow_run:/m.test(text)) return [];
  const block = /^\s{2}workflow_run:\n((?:\s{4}\S[^\n]*\n|\s*\n|\s{6,}[^\n]*\n)*)/m.exec(text);
  return /^\s{4}workflows:\s*\S/m.test(block?.[1] ?? "") ? [] : ["missing-workflows"];
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

/**
 * Prompt shims pointing at nothing. Pure like the rest, so the caller supplies the set of prompt
 * files that exist — specs pass a fixture set, `main` passes the real directory.
 */
export function danglingPrompts(text, available = []) {
  const have = new Set(available);
  const referenced = [...text.matchAll(/\.github\/prompts\/([a-z0-9-]+\.md)/g)].map((m) => m[1]);
  return [...new Set(referenced)].filter((f) => !have.has(f));
}

const INSTALLS_DEPS = /\bnpm ci\b|\bnpm install\b/;
const SCRIPT_INVOCATION = /\bnode\s+(scripts\/[\w.-]+\.mjs)\b/;

/** A job's steps, in source order, as raw text blocks — each one starts at a `      - ` item under
 *  that job's `steps:` list (this repo's fixed 6-space step-item indent; same convention the rest
 *  of this file already hardcodes for `needs:`/`id:`). */
function stepsOf(jobText) {
  const lines = jobText.split("\n");
  const starts = [];
  lines.forEach((l, i) => {
    if (/^ {6}- /.test(l)) starts.push(i);
  });
  return starts.map((s, k) => lines.slice(s, starts[k + 1] ?? lines.length).join("\n"));
}

/**
 * A job step that runs `node scripts/<x>.mjs`, where that script's own import graph reaches a
 * package needing `node_modules`, with no earlier step in the SAME job installing dependencies.
 * `hasDeps(scriptRelPath) => boolean` is injectable so specs can stub a fixture answer instead of
 * resolving real files; `main()` below wires it to `needsInstalledDeps` against the real repo.
 */
export function missingDepsInstall(text, hasDeps) {
  const problems = [];
  for (const job of jobs(text)) {
    let installed = false;
    for (const step of stepsOf(job.text)) {
      if (INSTALLS_DEPS.test(step)) installed = true;
      if (installed) continue;
      const m = SCRIPT_INVOCATION.exec(step);
      if (m && hasDeps(m[1])) problems.push({ job: job.name, script: m[1] });
    }
  }
  return problems;
}

export function lintWorkflow(name, text, prompts = [], hasScriptDeps = () => false) {
  return [
    ...duplicateKeys(text).map(
      (d) =>
        `${name}:${d.line} duplicate key \`${d.key}\` in the same mapping — GitHub rejects the file and the run has zero jobs`,
    ),
    ...danglingStepRefs(text).map(
      (d) =>
        `${name} job \`${d.job}\` reads \`steps.${d.ref}.outputs\` but declares no step \`${d.ref}\``,
    ),
    ...unfilteredWorkflowRun(text).map(
      () =>
        `${name} has a \`workflow_run\` trigger with no \`workflows:\` list — GitHub rejected exactly that shape on 2026-08-22 (docs/LESSONS.md); name the workflows, paths included`,
    ),
    ...danglingNeeds(text).map(
      (d) => `${name} job \`${d.job}\` needs \`${d.need}\`, which this file does not define`,
    ),
    ...danglingPrompts(text, prompts).map(
      (f) =>
        `${name} points a prompt shim at \`.github/prompts/${f}\`, which does not exist — that lane would run with no instructions`,
    ),
    ...missingDepsInstall(text, hasScriptDeps).map(
      (d) =>
        `${name} job \`${d.job}\` runs \`node ${d.script}\`, which imports a package needing ` +
        `\`node_modules\`, with no earlier \`npm ci\`/\`npm install\` step in that job — see #890`,
    ),
  ];
}

function main(argv) {
  const dir = argv.find((a) => !a.startsWith("--")) ?? ".github/workflows";
  // Scripts referenced in a workflow's `run:` blocks are always written as `scripts/<x>.mjs`
  // relative to the REPO root, regardless of which directory is being linted (the real
  // `.github/workflows`, or a spec's fixture directory elsewhere) — so resolve against cwd, not
  // against `dir`'s own position on disk.
  const repoRoot = process.cwd();
  const files = readdirSync(dir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
  let prompts = [];
  try {
    prompts = readdirSync(join(dir, "..", "prompts"));
  } catch {
    /* a repo with no prompt files simply has no shims to check */
  }
  // Real-filesystem answer for rule 6: does `scripts/<x>.mjs`'s import graph reach node_modules?
  // Memoized — the same script is invoked from several workflow files/jobs.
  const cache = new Map();
  const hasScriptDeps = (scriptRelPath) => {
    if (!cache.has(scriptRelPath)) {
      cache.set(
        scriptRelPath,
        needsInstalledDeps(
          join(repoRoot, scriptRelPath),
          (p) => readFileSync(p, "utf8"),
          (from, spec) => resolve(dirname(from), spec),
        ),
      );
    }
    return cache.get(scriptRelPath);
  };
  const problems = files.flatMap((f) =>
    lintWorkflow(f, readFileSync(join(dir, f), "utf8"), prompts, hasScriptDeps),
  );
  for (const p of problems) console.error(`✗ ${p}`);
  if (problems.length) {
    console.error(`\n${problems.length} problem(s) in ${dir} — see docs/LESSONS.md 2026-08-22.`);
    process.exit(1);
  }
  console.log(`workflow-lint: ✓ ${files.length} workflow(s) structurally sound.`);
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2));
