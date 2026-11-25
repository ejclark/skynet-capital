import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "@rstest/core";
import {
  earsFromStateModel,
  specScaffold,
  splitLabel,
  stateModels,
} from "../../scripts/ears-lifecycle.mjs";
import { diagramModel } from "../support/diagram";

// A plan's state diagram, read as requirements (plan #3748 slice 9, #4342): WHEN a plan issue carries
// a stateDiagram-v2, /ears SHALL emit one EARS line per guarded transition. The fixture is shaped like
// #3748's own state block (a flowchart picture first, then the lifecycle), so the spec holds the shape
// sessions actually write. Falsifier (#3748, 2026-11-25): no plan issue draws a state diagram a month
// after this lands — then the mapping is a tool nobody feeds, and goes.

const FIXTURE = "tests/fixtures/ears-lifecycle/plan-issue.md";
const run = (args: string[], input?: string) =>
  spawnSync(process.execPath, ["scripts/ears-lifecycle.mjs", ...args], { input, encoding: "utf8" });

describe("when a plan issue carries a stateDiagram-v2", () => {
  const [model, ...rest] = stateModels(readFileSync(FIXTURE, "utf8"));
  const result = earsFromStateModel(model as never, { system: "the build lane" });

  it("reads only the state diagram — the flowchart picture beside it is not a lifecycle", () => {
    expect(rest).toEqual([]);
    expect(model?.type).toBe("stateDiagram");
  });

  it("emits exactly one EARS line per guarded transition, and none for an unlabeled arrow", () => {
    const guarded = (model?.edges ?? []).filter((e) => e.label && !String(e.to).includes("note"));
    expect(result.lines).toHaveLength(guarded.length);
    expect(result.lines.map((l) => `${l.from}→${l.to}`)).toEqual(
      guarded.map((e) => `${e.from}→${e.to}`),
    );
    expect(result.lines.map((l) => l.ears)).toEqual([
      "WHILE `Building now › verify`, WHEN npm run verify exits 0, the build lane shall move to `Building now › pushed`.",
      "WHILE `Ready: a lane may start it`, WHEN a lane claims the issue, IF the work spigot admits it, THEN the build lane shall move to `Building now`.",
      "WHILE `Building now`, IF CI is red, THEN the build lane shall move to `Ready: a lane may start it`.",
      "WHILE `Building now`, IF the PR merged, THEN the build lane shall finish.",
      "WHILE `Ready: a lane may start it`, WHEN needs-eric is applied, the build lane shall move to `Parked`.",
    ]);
  });

  it("lists every unlabeled arrow the way it was drawn, so none is dropped silently", () => {
    expect(result.unguarded.map((u) => u.arrow)).toEqual([
      "`Building now › [*]` → `Building now › verify`",
      "`Building now › pushed` → `Building now › [*]`",
      "`[*]` → `Ready: a lane may start it`",
      "`Building now` → `landed`",
    ]);
  });

  it("never reads a note's link as a transition", () => {
    const arrows = [...result.lines, ...result.unguarded].map((t) => `${t.from}→${t.to}`);
    expect(arrows.some((a) => a.includes("note"))).toBe(false);
  });

  it("holds every line to the EARS shape: one `shall`, a named system, a clause before it", () => {
    for (const { ears } of result.lines) {
      expect(ears.match(/\bshall\b/g)).toHaveLength(1);
      expect(ears).toMatch(/^(WHILE|WHEN|IF) .+, (THEN )?the build lane shall .+\.$/);
      expect(/\bIF\b/.test(ears)).toBe(/\bTHEN\b/.test(ears));
    }
  });
});

describe("when a transition starts at [*] or ends at [*]", () => {
  it("reads a labeled start as an event that enters the state, inside its composite if nested", () => {
    const m = diagramModel(
      "stateDiagram-v2\n  [*] --> idle: the lane wakes\n  state run {\n    [*] --> step: a slice is named\n    step --> [*]: its PR opens\n  }",
    );
    expect(earsFromStateModel(m, { system: "the lane" }).lines.map((l) => l.ears)).toEqual([
      "WHEN the lane wakes, the lane shall enter `idle`.",
      "WHILE `run`, WHEN a slice is named, the lane shall enter `run › step`.",
      "WHILE `run › step`, WHEN its PR opens, the lane shall complete `run`.",
    ]);
  });
});

describe("when the diagram names no system", () => {
  it("uses the frontmatter title, then a visible blank — never a guessed name", () => {
    const titled = diagramModel("---\ntitle: the plan lane\n---\nstateDiagram-v2\n  a --> b: go");
    expect(earsFromStateModel(titled).lines[0]?.ears).toBe(
      "WHILE `a`, WHEN go, the plan lane shall move to `b`.",
    );
    const bare = diagramModel("stateDiagram-v2\n  a --> b: go");
    expect(earsFromStateModel(bare).system).toBe("<system>");
    expect(earsFromStateModel(bare).lines[0]?.ears).toContain("the <system> shall");
  });
});

describe("when a label carries a UML guard", () => {
  it("splits `event [guard]` into WHEN and IF, and a bare `[guard]` into IF alone", () => {
    expect(splitLabel("claimed [ci green]")).toEqual({ event: "claimed", guard: "ci green" });
    expect(splitLabel("[ci green]")).toEqual({ event: "", guard: "ci green" });
    expect(splitLabel("red<br>CI")).toEqual({ event: "red CI", guard: "" });
  });
});

describe("if the model is not a state diagram", () => {
  it("throws rather than reading a flowchart's edges as transitions", () => {
    expect(() => earsFromStateModel(diagramModel("flowchart LR\n  a -->|go| b"))).toThrow(
      /not a state diagram/,
    );
  });
});

describe("the CLI /ears runs", () => {
  it("prints the lines and the unguarded arrows for a plan issue on stdin", () => {
    const out = execFileSync(
      process.execPath,
      ["scripts/ears-lifecycle.mjs", "--stdin", "--system", "the build lane"],
      { input: readFileSync(FIXTURE, "utf8"), encoding: "utf8" },
    );
    expect(
      out.split("\n").filter((l) => l.startsWith("- WHILE") || l.startsWith("- WHEN")),
    ).toHaveLength(5);
    expect(out).toContain("_unguarded (no label, no line):");
  });

  it("scaffolds one describe/it.todo per line with --spec — the condition and the response", () => {
    const out = run([FIXTURE, "--spec"]).stdout;
    expect(out.match(/^describe\(/gm)).toHaveLength(5);
    expect(out.match(/it\.todo\(/g)).toHaveLength(5);
    expect(out).toContain('describe("WHILE `Building now`, IF CI is red", () => {');
    expect(out).toContain('it.todo("shall move to `Ready: a lane may start it`");');
    expect(out.startsWith('import { describe, it } from "@rstest/core";\n')).toBe(true);
    const m = diagramModel("stateDiagram-v2\n  a --> b: go");
    expect(specScaffold([earsFromStateModel(m, { system: "x" })])).toContain(
      'describe("WHILE `a`, WHEN go", () => {\n  it.todo("shall move to `b`");\n});',
    );
  });

  it("fails loudly on input with no state diagram, and on a block that does not parse", () => {
    const none = run(["--stdin"], "```mermaid\nflowchart LR\n  a --> b\n```\n");
    expect(none.status).toBe(1);
    expect(none.stderr).toContain("no stateDiagram block");
    const broken = run(["--stdin"], "```mermaid\nstateDiagram-v2\n  a --> \n```\n");
    expect(broken.status).not.toBe(0);
    expect(broken.stderr).toMatch(/does not lint/);
  });
});
