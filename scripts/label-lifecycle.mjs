#!/usr/bin/env node
// Label lifecycle — the picture of which label lets an automated lane build an issue, generated from
// scripts/moneypenny/labels.mjs so it cannot drift from the rule it draws.
//
//   node scripts/label-lifecycle.mjs            # print the diagram
//   node scripts/label-lifecycle.mjs --write    # rewrite the block in docs/MONEYPENNY.md
//   node scripts/label-lifecycle.mjs --check    # exit 1 when that block is not the generator's render
//
// WHY (plan #3748 slice 7c, #4339; the surfaces study's ranked candidate 4). Three incidents came from
// a label that was missing or applied out of order — #3271 was one, where most of a queue sat parked
// behind a state nobody could see. The pull rule lives in `notPullable()`; the doc that explained it
// was prose. A picture drawn by hand about that rule drifts the first time a label joins
// PARKING_LABELS, so this one is generated, and held to the code two ways (tests/arch/
// label-lifecycle.spec.ts): the block in the docs equals this render, and every transition below is
// replayed through `notPullable()` — the issue before the label change classifies as the arrow's tail,
// the issue after as its head. An arrow the code does not honour is a red spec, not a stale picture.
//
// THE STATES ARE THE RULE'S OWN CODES (`notPullable`'s `code`), so a new refusal reason is a new state
// the spec reports as undrawn. Plain look, no hex: a lifecycle stays plain (docs/PICTURES.md, rule 11
// and the ink-mode scope). Labels say what the thing does; the house nouns stay in the code (rule 7).
import { readFileSync, writeFileSync } from "node:fs";
import { isMain } from "./is-main.mjs";
import { LABELS, PARKING_LABELS } from "./moneypenny/labels.mjs";

/** `notPullable`'s code → the state drawn for it; `null` (may be pulled) is Ready. */
export const STATE_OF_CODE = {
  "no-ready": "Backlog",
  parked: "Parked",
  "in-progress": "Building",
  "needs-session": "Session",
  platter: "HeldPR",
  blocked: "Blocked",
  closed: "Closed",
  ready: "Ready",
};

/** The words each state wears in the picture: what is true of the issue, not the code's name for it. */
const STATE_TEXT = {
  Backlog: "Backlog: not ready yet",
  Ready: "Ready: a lane may start it",
  Parked: "Parked: waiting on someone",
  Building: "Building now",
  Session: "Handed to a live session",
  Blocked: "Blocked by an open issue",
  HeldPR: "On a held PR, waiting for a merge",
  Closed: "Closed",
};

/**
 * Every arrow: `from` and `to` are states; `op` is the one change to the issue that moves it, replayed
 * by the spec through `notPullable()`. `label` and `labels` name labels from the registry, never a
 * literal, so renaming a label in labels.mjs renames it here.
 * kinds: add / remove (a label), blockers (the open blocked-by count), boarded (an open held PR
 * closes it), close (the issue's state).
 */
export function transitions() {
  const out = [
    { from: "Backlog", to: "Ready", op: { kind: "add", label: LABELS.ready.name } },
    ...PARKING_LABELS.map((label) => ({
      from: "Ready",
      to: "Parked",
      op: { kind: "add", label },
    })),
    { from: "Parked", to: "Ready", op: { kind: "remove", labels: [...PARKING_LABELS] } },
    { from: "Ready", to: "Building", op: { kind: "add", label: LABELS.inProgress.name } },
    { from: "Building", to: "Ready", op: { kind: "remove", labels: [LABELS.inProgress.name] } },
    { from: "Ready", to: "Session", op: { kind: "add", label: LABELS.needsSession.name } },
    { from: "Session", to: "Ready", op: { kind: "remove", labels: [LABELS.needsSession.name] } },
    { from: "Ready", to: "Blocked", op: { kind: "blockers", count: 1 } },
    { from: "Blocked", to: "Ready", op: { kind: "blockers", count: 0 } },
    { from: "Ready", to: "HeldPR", op: { kind: "boarded", on: true } },
    { from: "HeldPR", to: "Closed", op: { kind: "close" } },
    { from: "Building", to: "Closed", op: { kind: "close" } },
  ];
  return out;
}

/** The arrow's words — the label change, in the registry's own names. */
function guard(op) {
  if (op.kind === "add") return `add ${op.label}`;
  if (op.kind === "remove")
    return op.labels.length === 1 ? `remove ${op.labels[0]}` : "remove that label";
  if (op.kind === "blockers") return op.count ? "an open blocked-by link" : "the blocker closes";
  if (op.kind === "boarded") return "its last item boards a held PR";
  return "the PR merges";
}

/** The Mermaid source. Pure: the same registry always draws the same picture. */
export function lifecycleDiagram() {
  const states = Object.entries(STATE_TEXT)
    .map(([id, text]) => `    state "${text}" as ${id}`)
    .join("\n");
  const arrows = transitions()
    .map((t) => `    ${t.from} --> ${t.to}: ${guard(t.op)}`)
    .join("\n");
  const parking = PARKING_LABELS.join(", ");
  return `---
title: "Which label lets a lane build an issue"
---
stateDiagram-v2
    direction TB
${states}
    [*] --> Backlog: opened
${arrows}
    Closed --> [*]
    note right of Parked
        parking labels:
        ${parking}
    end note
    note left of Ready
        the one pull rule:
        ${LABELS.ready.name}, not parked,
        not ${LABELS.inProgress.name}, not blocked
    end note`;
}

const DOC = "docs/MONEYPENNY.md";
const START =
  "<!-- label-lifecycle:start — generated by scripts/label-lifecycle.mjs; do not edit -->";
const END = "<!-- label-lifecycle:end -->";

/** The fenced block as it sits between the markers. */
export const lifecycleBlock = () =>
  `${START}\n\`\`\`mermaid\n${lifecycleDiagram()}\n\`\`\`\n${END}`;

/** `text` with the marked block replaced by the current render; null when the markers are absent. */
export function withLifecycle(text) {
  const a = text.indexOf(START);
  const b = text.indexOf(END);
  if (a === -1 || b === -1 || b < a) return null;
  return `${text.slice(0, a)}${lifecycleBlock()}${text.slice(b + END.length)}`;
}

function main(argv) {
  if (!(argv.includes("--write") || argv.includes("--check"))) {
    process.stdout.write(`${lifecycleDiagram()}\n`);
    return;
  }
  const text = readFileSync(DOC, "utf8");
  const next = withLifecycle(text);
  if (next === null) {
    console.error(`label-lifecycle: ${DOC} has no ${START.slice(0, 30)}… block`);
    process.exit(1);
  }
  if (argv.includes("--write")) {
    if (next !== text) writeFileSync(DOC, next);
    console.log(next === text ? `${DOC}: already current` : `${DOC}: rewritten`);
    return;
  }
  if (next !== text) {
    console.error(
      `label-lifecycle: ${DOC} is stale — run node scripts/label-lifecycle.mjs --write`,
    );
    process.exit(1);
  }
  console.log(`${DOC}: current`);
}

if (isMain(import.meta.url)) main(process.argv.slice(2));
