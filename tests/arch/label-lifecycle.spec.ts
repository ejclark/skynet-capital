import { readFileSync } from "node:fs";
import {
  type LifecycleOp,
  lifecycleBlock,
  lifecycleDiagram,
  STATE_OF_CODE,
  transitions,
  withLifecycle,
} from "../../scripts/label-lifecycle.mjs";
import { mermaidBlocks } from "../../scripts/mermaid-lint.mjs";
import { LABELS, notPullable, PARKING_LABELS } from "../../scripts/moneypenny/labels.mjs";
import { diagramModel } from "../support/diagram";

// The label lifecycle picture is generated from labels.mjs and held to it (plan #3748 slice 7c, #4339).
// Three links, each one a way a hand-drawn picture drifts: the docs block equals the generator's
// render; the diagram Mermaid PARSED carries exactly the generator's arrows; and every arrow is true
// of `notPullable()` — the issue before the label change classifies as the tail, after it as the head.
// Falsifier (#3748, 2026-11-24): a label joins PARKING_LABELS and no spec goes red until someone
// redraws by hand. The "a new parking label" case below is that falsifier, run.

type Issue = {
  number: number;
  state: string;
  labels: string[];
  issue_dependencies_summary?: { blocked_by: number };
};

const codeOf = (issue: Issue, boarded = false) =>
  notPullable(issue, boarded ? { boardedOn: new Map([[issue.number, 1]]) } : {})?.code ?? "ready";

/** A minimal issue the rule reads as `state`; `boarded` rides beside it (the platter map is an option). */
function issueIn(state: string, parking = PARKING_LABELS[0]): { issue: Issue; boarded: boolean } {
  const open = { number: 9, state: "OPEN" };
  const ready = LABELS.ready?.name as string;
  switch (state) {
    case "Backlog":
      return { issue: { ...open, labels: [] }, boarded: false };
    case "Ready":
      return { issue: { ...open, labels: [ready] }, boarded: false };
    case "Parked":
      return { issue: { ...open, labels: [ready, parking as string] }, boarded: false };
    case "Building":
      return {
        issue: { ...open, labels: [ready, LABELS.inProgress?.name as string] },
        boarded: false,
      };
    case "Session":
      return {
        issue: { ...open, labels: [ready, LABELS.needsSession?.name as string] },
        boarded: false,
      };
    case "Blocked":
      return {
        issue: { ...open, labels: [ready], issue_dependencies_summary: { blocked_by: 1 } },
        boarded: false,
      };
    case "HeldPR":
      return { issue: { ...open, labels: [ready] }, boarded: true };
    case "Closed":
      return { issue: { number: 9, state: "CLOSED", labels: [ready] }, boarded: false };
    default:
      throw new Error(`no fixture for state ${state}`);
  }
}

/** The one change an arrow names, applied. `label` selects which of a multi-label op to use. */
function apply(op: LifecycleOp, issue: Issue, boarded: boolean, label?: string) {
  switch (op.kind) {
    case "add":
      return { issue: { ...issue, labels: [...issue.labels, op.label] }, boarded };
    case "remove": {
      const gone = new Set(label ? [label] : op.labels);
      return { issue: { ...issue, labels: issue.labels.filter((l) => !gone.has(l)) }, boarded };
    }
    case "blockers":
      return {
        issue: { ...issue, issue_dependencies_summary: { blocked_by: op.count } },
        boarded,
      };
    case "boarded":
      return { issue, boarded: op.on };
    case "close":
      return { issue: { ...issue, state: "CLOSED" }, boarded: false };
  }
}

describe("label lifecycle — generated, and true of the pull rule", () => {
  it("the block in docs/MONEYPENNY.md is the generator's render", () => {
    const doc = readFileSync("docs/MONEYPENNY.md", "utf8");
    expect(withLifecycle(doc), "the markers are in the doc").not.toBeNull();
    expect(withLifecycle(doc), "stale — run: node scripts/label-lifecycle.mjs --write").toBe(doc);
  });

  it("the parsed diagram carries exactly the transition table", () => {
    const doc = readFileSync("docs/MONEYPENNY.md", "utf8");
    const block = mermaidBlocks(doc).find((b) => b.source === lifecycleDiagram());
    expect(block, "the generated diagram is a fenced block in the doc").toBeDefined();
    const m = diagramModel(block?.source ?? "");
    expect(m.type).toBe("stateDiagram");
    const drawn = (m.edges ?? [])
      .filter(
        (e) => !(/^root_/.test(e.from) || /^root_/.test(e.to) || /----note-/.test(e.from + e.to)),
      )
      .map((e) => `${e.from}→${e.to}`)
      .sort();
    expect(drawn).toEqual(
      transitions()
        .map((t) => `${t.from}→${t.to}`)
        .sort(),
    );
    // every state the rule can answer with is drawn, so a new refusal reason is reported here
    const states = new Set((m.nodes ?? []).map((n) => n.id));
    for (const state of Object.values(STATE_OF_CODE)) expect(states, state).toContain(state);
  });

  it("every state the rule answers with is a state of the picture", () => {
    const answers = new Set(
      ["Backlog", "Ready", "Parked", "Building", "Session", "Blocked", "HeldPR", "Closed"].map(
        (s) => {
          const { issue, boarded } = issueIn(s);
          return codeOf(issue, boarded);
        },
      ),
    );
    expect([...answers].sort()).toEqual(Object.keys(STATE_OF_CODE).sort());
  });

  describe("each arrow, replayed through notPullable", () => {
    for (const t of transitions()) {
      const labels = t.op.kind === "remove" ? t.op.labels : [undefined];
      for (const label of labels) {
        const name = `${t.from} → ${t.to}: ${t.op.kind}${label ? ` ${label}` : ""}${t.op.kind === "add" ? ` ${t.op.label}` : ""}`;
        it(name, () => {
          const parking = t.op.kind === "add" && t.to === "Parked" ? t.op.label : label;
          const before = issueIn(t.from, parking ?? PARKING_LABELS[0]);
          expect(STATE_OF_CODE[codeOf(before.issue, before.boarded)]).toBe(t.from);
          const after = apply(t.op, before.issue, before.boarded, label);
          expect(STATE_OF_CODE[codeOf(after.issue, after.boarded)]).toBe(t.to);
        });
      }
    }
  });

  it("a new parking label draws itself: the render names it and gains an arrow", () => {
    // The falsifier, run: the generator reads PARKING_LABELS, so the next label added there changes the
    // render — and with it the doc block, which turns the first test red until `--write` redraws it.
    expect(lifecycleBlock()).toContain(PARKING_LABELS.join(", "));
    const arrows = transitions().filter((t) => t.from === "Ready" && t.to === "Parked");
    expect(arrows.map((t) => (t.op.kind === "add" ? t.op.label : ""))).toEqual(PARKING_LABELS);
  });
});
