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
//   7. A workflow referencing a LABEL NAME that `scripts/moneypenny/labels.mjs` does not register.
//      Added 2026-09-05 (#894), the third incident of that same-day chain: #892 had to provision
//      `hold-merge` after the fact, because #889 shipped `pipeline.yml`'s `arm-auto-merge` job with
//      `!contains(github.event.pull_request.labels.*.name, 'hold-merge')` while no lane created that
//      label. Nothing fails — the condition simply never matches, so the escape hatch a session was
//      told to reach for did not exist. Same failure shape as rules 5 and 6: a workflow naming
//      something that has to exist elsewhere, where the mismatch is silent at run time. The
//      reference grammar lives in `workflow-labels.mjs`, split out as script-deps.mjs was for 6.
//   8. A workflow that re-dispatches ITSELF (`gh workflow run <this file>`) under a token whose
//      bot actor a `claude-code-action` job REACHABLE on that dispatch does not name in
//      `allowed_bots`. Added 2026-09-26 after #2292 moved moneypenny-events.yml's re-dispatch from
//      GITHUB_TOKEN (actor `github-actions`) to the App token (actor `skynet-envoy`) while
//      `build-events` still allow-listed only `github-actions`: every leg died in ~3s with
//      "non-human actor: skynet-envoy", and event research was dark ~41h before a digest said so.
//      Same silent-mismatch shape as 5–7 — the dispatch and the allow-list live 100 lines apart.
//
// Dependency-free on purpose (same doctrine as arch-scan/dupe-scan): a gate that guards CI must not
// itself depend on a package resolving — the two repo imports rule 7 adds reach only Node builtins.
// It parses only the block-style, 2-space-indented subset this repo's workflows are written in, and
// skips block scalars (`run: |`) wholesale, which is where arbitrary shell text lives.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { LABEL_NAMES } from "./moneypenny/labels.mjs";
import { needsInstalledDeps } from "./script-deps.mjs";
import { unknownLabels } from "./workflow-labels.mjs";

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

// The bot actor each token signs as. The App's actor is its slug (the Skynet Envoy App, minted by
// `.github/actions/app-token`); GITHUB_TOKEN always acts as `github-actions`.
const TOKEN_ACTORS = [
  [/steps\.app-token\.outputs\.token/, "skynet-envoy"],
  [/secrets\.GITHUB_TOKEN|github\.token/, "github-actions"],
];
const SELF_DISPATCH = /\bgh workflow run\s+([\w.-]+\.ya?ml)\b/;

/** The bot actors this file signs its own `gh workflow run <this file>` re-dispatches as — `null`
 *  for a token whose actor cannot be read. */
export function selfDispatchActors(name, text) {
  const actors = new Set();
  for (const job of jobs(text)) {
    for (const step of stepsOf(job.text)) {
      const m = SELF_DISPATCH.exec(step);
      if (!m || m[1] !== name) continue;
      const token = /GH_TOKEN:\s*(.+)/.exec(step)?.[1] ?? "";
      actors.add(TOKEN_ACTORS.find(([re]) => re.test(token))?.[1] ?? null);
    }
  }
  return actors;
}

/** Each claude-code-action step in a job, with the bots its `allowed_bots` names. */
function actionAllowLists(jobText) {
  return stepsOf(jobText)
    .filter((step) => /anthropics\/claude-code-action/.test(step))
    .map((step) =>
      (/allowed_bots:\s*"?([^"\n]*)"?/.exec(step)?.[1] ?? "").split(",").map((b) => b.trim()),
    );
}

function refusals(job, actors) {
  const problems = [];
  for (const listed of actionAllowLists(job.text)) {
    for (const actor of actors) {
      if (actor === null) problems.push({ job: job.name, actor: null });
      else if (!(listed.includes(actor) || listed.includes("*")))
        problems.push({ job: job.name, actor });
    }
  }
  return problems;
}

/** Rule 8: `{ job, actor }` for each dispatch-reachable claude-code-action step that would refuse
 *  this file's own re-dispatch. `actor` is null when the dispatching token could not be read —
 *  reported as UNKNOWN, never passed.
 *
 *  Reachability is the same question rule 9 asks of `push`, so it reuses the same answer rather
 *  than a substring test. Naming `workflow_dispatch` is not the only way in: `build-plan`'s
 *  `github.event_name != 'push'` rules push out and lets a dispatch straight through while never
 *  naming it. That job shipped with no `allowed_bots` at all and died in ~3s on "non-human actor:
 *  skynet-envoy" (run 36802272261), with this gate green the whole time. */
export function unlistedDispatchActor(name, text) {
  const actors = selfDispatchActors(name, text);
  if (!actors.size) return [];
  return jobs(text).flatMap((job) =>
    reachableOnEvent(job.text, "workflow_dispatch") ? refusals(job, actors) : [],
  );
}

/** The workflow names/paths a `workflow_run` trigger watches (its quoted `workflows:` entries). */
export function watchedWorkflows(text) {
  const at = text.search(/^ {2}workflow_run:\s*$/m);
  if (at === -1) return [];
  const rest = text.slice(at).split("\n").slice(1);
  const body = [];
  for (const line of rest) {
    if (/^ {0,2}\S/.test(line) && line.trim() && !line.trim().startsWith("#")) break;
    if (/^ {4}types:/.test(line)) break;
    body.push(line.replace(/#.*$/, ""));
  }
  return [...body.join("\n").matchAll(/"([^"]+)"|'([^']+)'/g)].map((m) => m[1] ?? m[2]);
}

/** Rule 8, second half: a `workflow_run` run inherits the WATCHED run's actor (moneypenny-repair.yml
 *  says so itself), so every claude-code-action step in a watcher must admit each actor a watched
 *  workflow re-dispatches itself as. `actorsByWorkflow` maps a workflow's name and its path to
 *  those actors. */
export function unlistedWatchedActor(text, actorsByWorkflow) {
  const actors = new Set();
  for (const w of watchedWorkflows(text))
    for (const a of actorsByWorkflow.get(w) ?? []) actors.add(a);
  if (!actors.size) return [];
  return jobs(text).flatMap((job) => refusals(job, actors));
}

// ── rule 9: claude-code-action can never run under a `push` event ─────────────
// PROVENANCE (#4359, and docs/LESSONS.md 2026-08-20 for the first occurrence). The action rejects
// the event type outright — `Action failed with error: Unsupported event type: push` — so a job
// that invokes it from a push run cannot succeed, ever, for any prompt. The event-research lane
// already knows this and re-dispatches itself as a `workflow_dispatch`; nothing checked that the
// OTHER build lanes stayed out of push's reach, and #4165's retry sweep quietly put `build plan
// issue` there, failing every merge to `main` in ~17s.

/** A job's own `if:` expression — inline or block scalar — comments stripped, flattened to one line. */
function jobIf(jobText) {
  const header = jobText
    .split(/\n {4}steps:/)[0]
    .split("\n")
    .filter((l) => !l.trim().startsWith("#"));
  const at = header.findIndex((l) => /^ {4}if:/.test(l));
  if (at === -1) return "";
  const first = (header[at] ?? "").replace(/^ {4}if:\s*/, "");
  // `>`/`|` opens a block scalar whose value is the indented lines that follow; anything else is
  // the whole expression inline (with a possible trailing YAML comment).
  const parts = [/^[|>]/.test(first) ? "" : first.replace(/\s+#.*$/, "")];
  for (const line of header.slice(at + 1)) {
    if (line.trim() && /^ {0,4}\S/.test(line)) break;
    parts.push(line.trim());
  }
  return parts.join(" ").trim();
}

/** An expression split on its top-level `||` (parenthesis depth 0) — each operand is a way the
 *  condition can be true on its own, so each has to rule the event out by itself. */
function disjuncts(expr) {
  const out = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < expr.length; i++) {
    const c = expr[i];
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (depth === 0 && c === "|" && expr[i + 1] === "|") {
      out.push(expr.slice(start, i));
      i++;
      start = i + 1;
    }
  }
  out.push(expr.slice(start));
  return out.map((s) => s.trim()).filter(Boolean);
}

/** Does this operand make a run on `event` impossible — either by excluding it outright, or by
 *  pinning `github.event_name` to something else? */
function rulesOutEvent(operand, event) {
  if (new RegExp(`github\\.event_name\\s*!=\\s*'${event}'`).test(operand)) return true;
  const named = [...operand.matchAll(/github\.event_name\s*==\s*'([a-z_]+)'/g)].map((m) => m[1]);
  return named.length > 0 && !named.includes(event);
}

/** Can this job's `if:` be true on an `event` run? Every top-level `||` operand is a way in on its
 *  own, so the job is unreachable only when all of them rule the event out; no `if:` at all means
 *  every trigger reaches it. Shared by rules 8 and 9 — the two ask the same question of different
 *  events. */
function reachableOnEvent(jobText, event) {
  const operands = disjuncts(jobIf(jobText));
  return !(operands.length > 0 && operands.every((o) => rulesOutEvent(o, event)));
}

/** Does any step in this job actually invoke claude-code-action? `uses:` only — several jobs
 *  DISCUSS the action in comments (including the very re-dispatch step that works around this
 *  rule), and a comment must never read as an invocation. */
function invokesClaudeAction(jobText) {
  return stepsOf(jobText).some((step) =>
    step.split("\n").some((l) => /^\s*(-\s+)?uses:\s*anthropics\/claude-code-action[@\s]/.test(l)),
  );
}

/** Rule 9: job names that invoke claude-code-action and are reachable on `push`. */
export function actionReachableOnPush(text) {
  const head = (text.split(/^jobs:\s*$/m)[0] ?? "")
    .split("\n")
    .filter((l) => !l.trim().startsWith("#"))
    .join("\n");
  if (!/^ {2}push:/m.test(head)) return [];
  return jobs(text)
    .filter((job) => invokesClaudeAction(job.text))
    .filter((job) => reachableOnEvent(job.text, "push"))
    .map((job) => job.name);
}

export function lintWorkflow(
  name,
  text,
  prompts = [],
  hasScriptDeps = () => false,
  knownLabels = [],
  actorsByWorkflow = new Map(),
) {
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
    ...unknownLabels(text, knownLabels).map(
      (label) =>
        `${name} references the label \`${label}\`, which \`scripts/moneypenny/labels.mjs\` does ` +
        `not register — the condition would silently never match until someone provisions it by ` +
        `hand (see #892)`,
    ),
    ...unlistedDispatchActor(name, text).map((d) =>
      d.actor === null
        ? `${name} re-dispatches itself with a token whose bot actor cannot be read — whether job ` +
          `\`${d.job}\`'s \`allowed_bots\` admits it is UNKNOWN (rule 8)`
        : `${name} re-dispatches itself as \`${d.actor}\`, but dispatch-reachable job \`${d.job}\`'s ` +
          `\`allowed_bots\` does not name it — claude-code-action refuses the run in ~3s (#2292)`,
    ),
    ...unlistedWatchedActor(text, actorsByWorkflow).map((d) =>
      d.actor === null
        ? `${name} job \`${d.job}\` watches a workflow that re-dispatches itself with a token whose ` +
          "actor cannot be read — whether its `allowed_bots` admits the inherited actor is UNKNOWN (rule 8)"
        : `${name} job \`${d.job}\` is woken by \`workflow_run\` and inherits the watched run's actor ` +
          `\`${d.actor}\`, which its \`allowed_bots\` does not name — the repair dies in ~3s, the 2026-09-25 shape`,
    ),
    ...actionReachableOnPush(text).map(
      (job) =>
        `${name} job \`${job}\` invokes claude-code-action and its \`if:\` does not rule out ` +
        '`push` — the action rejects that event type outright ("Unsupported event type: push"), ' +
        "so the job fails on every merge. Re-dispatch as `workflow_dispatch` instead (#4359)",
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
  const promptsDir = join(dir, "..", "prompts");
  try {
    prompts = readdirSync(promptsDir);
  } catch {
    // Optional input: a repo with no prompt files has no shims to check, and rule 5 still means
    // what it says — with an empty set, any shim that IS referenced is flagged, never passed. Also
    // the path every single-file fixture in tests/arch/workflows.spec.ts takes (`withWorkflow`).
    console.log(
      `· workflow-lint: no prompts directory at ${promptsDir} — any prompt shim reads as dangling`,
    );
  }
  // Real-filesystem answer for rule 6: does `scripts/<x>.mjs`'s import graph reach node_modules?
  // Memoized — the same script is invoked from several workflow files/jobs.
  const cache = new Map();
  // Rule 6 cannot answer for a script whose import graph it could not fully read: that is an
  // UNKNOWN problem, never a pass (an unreadable file would otherwise hide its bare imports).
  const unreadable = new Map();
  const hasScriptDeps = (scriptRelPath) => {
    if (!cache.has(scriptRelPath)) {
      cache.set(
        scriptRelPath,
        needsInstalledDeps(
          join(repoRoot, scriptRelPath),
          (p) => readFileSync(p, "utf8"),
          (from, spec) => resolve(dirname(from), spec),
          (path) => unreadable.set(`${scriptRelPath}\0${path}`, { scriptRelPath, path }),
        ),
      );
    }
    return cache.get(scriptRelPath);
  };
  const texts = new Map(files.map((f) => [f, readFileSync(join(dir, f), "utf8")]));
  // Rule 8's cross-file half: who each workflow re-dispatches itself as, keyed by BOTH its `name:`
  // and its path — the two forms a `workflow_run` `workflows:` list may use.
  const actorsByWorkflow = new Map();
  for (const [f, text] of texts) {
    const actors = [...selfDispatchActors(f, text)];
    if (!actors.length) continue;
    const wfName = /^name:\s*["']?(.+?)["']?\s*$/m.exec(text)?.[1];
    if (wfName) actorsByWorkflow.set(wfName, actors);
    actorsByWorkflow.set(`.github/workflows/${f}`, actors);
  }
  const problems = files.flatMap((f) =>
    lintWorkflow(f, texts.get(f), prompts, hasScriptDeps, LABEL_NAMES, actorsByWorkflow),
  );
  for (const { scriptRelPath, path } of unreadable.values()) {
    problems.push(
      `a workflow runs \`node ${scriptRelPath}\`, but \`${relative(repoRoot, path)}\` in its import ` +
        "graph could not be read — whether it needs `npm ci` first is UNKNOWN (rule 6, #890)",
    );
  }
  for (const p of problems) console.error(`✗ ${p}`);
  if (problems.length) {
    console.error(`\n${problems.length} problem(s) in ${dir} — see docs/LESSONS.md 2026-08-22.`);
    process.exit(1);
  }
  console.log(`workflow-lint: ✓ ${files.length} workflow(s) structurally sound.`);
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2));
