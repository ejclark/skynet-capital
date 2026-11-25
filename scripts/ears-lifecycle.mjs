#!/usr/bin/env node
// EARS lifecycle — a plan's state diagram, read as requirements: one EARS line per guarded
// transition, and the spec scaffold each line maps to.
//
//   gh issue view <n> --json body --jq .body | node scripts/ears-lifecycle.mjs --stdin
//   node scripts/ears-lifecycle.mjs <file.md> [--system "the plan lane"] [--spec] [--json]
//
// WHY (plan #3748 slice 9, #4342). A plan issue that draws its lifecycle as a `stateDiagram-v2`
// already states which moves exist and what makes each one happen; its acceptance criteria then
// restate the same moves in prose, by hand, and the two drift. This reads the diagram the way
// Mermaid PARSED it (mermaid-lint --ast, the slice-7a harness) and writes the criteria from it, so
// a transition drawn is a requirement written and a spec scaffolded — /ears step 3, made mechanical
// for the one input shape where it can be.
//
// WHAT COUNTS AS GUARDED: a transition with a label. The label is what makes the move happen (a
// trigger, a condition) — the EARS clause. An unlabeled arrow says only "this can happen", which is
// no requirement a spec can construct, so it gets no line; it is listed under `unguarded` instead of
// dropped silently, so the author sees which arrows still need their trigger written. Note links
// (Mermaid draws `note right of x` as an edge) are never transitions.
//
// THE MAPPING, one rule per source shape (pinned 11.17.2 model: `[*]` parses to `<parent>_start` /
// `<parent>_end` with shape stateStart / stateEnd; `<<choice>>` to shape `choice`):
//   s --> t: e            WHILE `s`, WHEN e, the <system> shall move to `t`.        (complex)
//   s --> t: e [g]        WHILE `s`, WHEN e, IF g, THEN the <system> shall move to `t`.
//   s --> t: [g]          WHILE `s`, IF g, THEN the <system> shall move to `t`.     (unwanted/guard)
//   [*] --> t: e          WHEN e, the <system> shall enter `t`.                     (event-driven)
//   s --> [*]: e          WHILE `s`, WHEN e, the <system> shall finish.
//   choice --> t: g       WHILE `p`, IF g, THEN the <system> shall move to `t`.     (p = what enters the choice)
// A choice's arrows carry conditions, never events (UML's own reading), so they are IF/THEN, and its
// WHILE names the state(s) that flow into it — a choice is transient, "while at the choice" is no
// state a builder can set up. A state inside a composite is named with its parent
// (`building › verify`); a composite's own `[*]` end reads "shall complete `building`".
//
// THE SYSTEM is the one word EARS insists on (/ears rule 2) and the diagram cannot know: `--system`,
// else the diagram's title, else a visible `<system>` blank for the author to fill — never "the app".
// Labels are the author's words (a `<br>` becomes a space); nothing is paraphrased.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { isMain } from "./is-main.mjs";

const START = "stateStart";
const END = "stateEnd";
/** Node shapes that are not states: a note and the group Mermaid wraps it in. */
const NOT_STATE = new Set(["note", "noteGroup"]);
/** UML's `event [guard]` — a trailing bracketed condition. */
const GUARD = /^(.*?)\s*\[([^\]]+)\]\s*$/;

const clean = (text) =>
  String(text ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Split a transition label into its event and its guard (either may be empty). */
export function splitLabel(label) {
  const text = clean(label);
  const m = GUARD.exec(text);
  return m ? { event: m[1].trim(), guard: m[2].trim() } : { event: text, guard: "" };
}

/** How a diagram's states are named and shaped, read off its model once. */
function stateReader(model) {
  const nodes = new Map((model.nodes ?? []).map((n) => [n.id, n]));
  const shape = (id) => String(nodes.get(id)?.shape ?? "");
  /** A state's name as written, with its composite parent(s) in front. */
  const name = (id) => {
    const path = [];
    for (let n = nodes.get(id); n; n = n.parent ? nodes.get(n.parent) : undefined) {
      path.unshift(clean(n.label) || n.id);
    }
    return `\`${path.join(" › ")}\``;
  };
  /** Where a pseudo-state sits: its composite's name, or none at the top level. */
  const parentName = (id) => (nodes.get(id)?.parent ? name(String(nodes.get(id)?.parent)) : "");
  const pseudo = (id) => shape(id) === START || shape(id) === END;
  return {
    shape,
    name,
    parentName,
    isState: (id) => nodes.has(id) && !NOT_STATE.has(shape(id)),
    /** How the author wrote it: a pseudo-state is `[*]` (inside its composite), never Mermaid's id. */
    shown: (id) =>
      !pseudo(id) ? name(id) : parentName(id) ? `${parentName(id).slice(0, -1)} › [*]\`` : "`[*]`",
  };
}

/** The WHILE / WHEN / IF clauses of one guarded transition — see THE MAPPING above. */
function clausesOf(edge, { event, guard }, transitions, s) {
  if (s.shape(edge.from) === "choice") {
    // A choice is transient: its WHILE is whatever flows into it, and its whole label is the
    // condition — `[g]` and a bare `g` mean the same thing there.
    const whiles = transitions
      .filter((e) => e.to === edge.from && s.shape(e.from) !== START)
      .map((e) => s.name(e.from));
    const condition = `IF ${[event, guard].filter(Boolean).join(" and ")}`;
    return whiles.length ? [`WHILE ${whiles.join(" or ")}`, condition] : [condition];
  }
  const clauses = [];
  const at = s.shape(edge.from) === START ? s.parentName(edge.from) : s.name(edge.from);
  if (at) clauses.push(`WHILE ${at}`);
  if (event) clauses.push(`WHEN ${event}`);
  if (guard) clauses.push(`IF ${guard}`);
  return clauses;
}

/** What the system does on one transition: enter, move to, finish, or complete its composite. */
function responseOf(edge, s) {
  if (s.shape(edge.to) === END) {
    const parent = s.parentName(edge.to);
    return parent ? `complete ${parent}` : "finish";
  }
  return `${s.shape(edge.from) === START ? "enter" : "move to"} ${s.name(edge.to)}`;
}

/**
 * The EARS lines a state diagram's model implies.
 * @param {import("./mermaid-model.mjs").DiagramModel} model a `stateDiagram` model from `--ast`
 * @param {{ system?: string }} [options]
 */
export function earsFromStateModel(model, { system } = {}) {
  if (!String(model?.type ?? "").startsWith("stateDiagram")) {
    throw new Error(`not a state diagram: ${model?.type ?? "no model"}`);
  }
  const subject = clean(system) || clean(model.title) || "<system>";
  const s = stateReader(model);
  const transitions = (model.edges ?? []).filter((e) => s.isState(e.from) && s.isState(e.to));
  const lines = [];
  const unguarded = [];
  for (const edge of transitions) {
    const label = splitLabel(edge.label);
    if (!(label.event || label.guard)) {
      const arrow = `${s.shown(edge.from)} → ${s.shown(edge.to)}`;
      unguarded.push({ from: edge.from, to: edge.to, arrow });
      continue;
    }
    const clauses = clausesOf(edge, label, transitions, s);
    const response = responseOf(edge, s);
    const condition = clauses.join(", ");
    const then = clauses.some((c) => c.startsWith("IF ")) ? "THEN " : "";
    const ears = `${condition}, ${then}the ${subject.replace(/^the /i, "")} shall ${response}.`;
    lines.push({
      from: edge.from,
      to: edge.to,
      label: clean(edge.label),
      condition,
      response,
      ears,
    });
  }
  return { system: subject, lines, unguarded };
}

/** An rstest scaffold: the condition → `describe`, the response → `it.todo` (/ears step 3). */
export function specScaffold(results) {
  const q = (s) => JSON.stringify(s);
  const body = results
    .flatMap((r) => r.lines)
    .map((l) => `describe(${q(l.condition)}, () => {\n  it.todo(${q(`shall ${l.response}`)});\n});`)
    .join("\n\n");
  return `import { describe, it } from "@rstest/core";\n\n${body}\n`;
}

/** Every state diagram's model in a markdown text, read through the lint CLI (the --ast harness). */
export function stateModels(markdown) {
  let out;
  try {
    out = execFileSync(
      process.execPath,
      ["scripts/mermaid-lint.mjs", "--stdin", "--json", "--ast"],
      {
        input: markdown,
        encoding: "utf8",
      },
    );
  } catch (error) {
    const stdout = /** @type {{ stdout?: string }} */ (error).stdout;
    const problems = stdout ? JSON.parse(stdout).problems : [String(error)];
    throw new Error(`a mermaid block does not lint:\n${problems.join("\n")}`);
  }
  return JSON.parse(out)
    .diagrams.map((d) => d.model)
    .filter((m) => String(m?.type ?? "").startsWith("stateDiagram"));
}

function main() {
  const argv = process.argv.slice(2);
  const flag = (f) => argv.includes(f);
  const sysAt = argv.indexOf("--system");
  const system = sysAt >= 0 ? argv[sysAt + 1] : undefined;
  const files = argv.filter((a, i) => !a.startsWith("--") && (sysAt < 0 || i !== sysAt + 1));
  if (!flag("--stdin") && files.length !== 1) {
    console.error(
      'usage: node scripts/ears-lifecycle.mjs (<file.md> | --stdin) [--system "the x"] [--spec] [--json]',
    );
    process.exit(2);
  }
  const markdown = flag("--stdin") ? readFileSync(0, "utf8") : readFileSync(files[0], "utf8");
  let models;
  try {
    models = stateModels(markdown);
  } catch (error) {
    console.error(`ears-lifecycle: ${/** @type {Error} */ (error).message}`);
    process.exit(1);
  }
  // Asked for a lifecycle and handed none: say so, never an empty success (the loud-failure rule).
  if (!models.length) {
    console.error("ears-lifecycle: no stateDiagram block in the input");
    process.exit(1);
  }
  const results = models.map((m) => earsFromStateModel(m, { system }));
  if (flag("--json")) {
    console.log(JSON.stringify(results, null, 2));
  } else if (flag("--spec")) {
    process.stdout.write(specScaffold(results));
  } else {
    results.forEach((r, i) => {
      if (results.length > 1) console.log(`${i ? "\n" : ""}## diagram ${i + 1}`);
      for (const l of r.lines) console.log(`- ${l.ears}`);
      if (r.unguarded.length) {
        const arrows = r.unguarded.map((u) => u.arrow).join(", ");
        console.log(`\n_unguarded (no label, no line): ${arrows}_`);
      }
    });
  }
  if (results.some((r) => r.system === "<system>")) {
    console.error('ears-lifecycle: no --system and no diagram title; fill the "<system>" blank');
  }
}

if (isMain(import.meta.url)) main();
