import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// The one parser for every mermaid block this repo publishes — pinned to the Mermaid version
// github.com renders, so "parses here" means "draws there". It replaced the type-only allowlist in
// scripts/ship.sh (2026-09-25) whose own comment admitted it never checked syntax. The fear behind
// that allowlist — a broken diagram as the PR's opening frame — is what this spec pins; the type
// menu it enforced is gone, because GitHub has drawn gitGraph, quadrantChart and C4 for years.
type Report = {
  code: number;
  problems: string[];
  notes: string[];
  diagrams: { line: number; type: string; ok: boolean }[];
};

/** Drive the gate the way ship.sh and issue-lint do — as a subprocess over stdin, never an import. */
const lint = (body: string): Report => {
  try {
    const out = execFileSync("node", ["scripts/mermaid-lint.mjs", "--stdin", "--json"], {
      input: body,
      encoding: "utf8",
    });
    return { code: 0, ...JSON.parse(out) };
  } catch (error) {
    const e = error as { status?: number; stdout?: Buffer | string };
    return {
      code: e.status ?? -1,
      ...JSON.parse(e.stdout?.toString() || '{"problems":[],"notes":[],"diagrams":[]}'),
    };
  }
};

const fence = (src: string) => `\n\`\`\`mermaid\n${src}\n\`\`\`\n`;

describe("mermaid lint — every block parses under GitHub's Mermaid", () => {
  it("passes the starters docs/PICTURES.md tells authors to copy — doc and gate cannot drift", () => {
    const { code, problems, diagrams } = lint(readFileSync("docs/PICTURES.md", "utf8"));
    expect(problems).toEqual([]);
    expect(diagrams.length).toBeGreaterThanOrEqual(3);
    expect(code).toBe(0);
  });

  it("accepts the richer types GitHub renders that the old allowlist refused", () => {
    const body = [
      fence(
        'gitGraph\n  commit id: "main"\n  branch item-1\n  commit id: "fix a"\n  checkout main\n  merge item-1',
      ),
      fence(
        "quadrantChart\n  title Calls\n  x-axis Low edge --> High edge\n  y-axis Low confidence --> High confidence\n  NVDA: [0.8, 0.7]",
      ),
      fence(
        'xychart-beta\n  title "Dead-code budget"\n  x-axis [w1, w2, w3]\n  y-axis "items" 0 --> 40\n  bar [38, 31, 22]\n  line [38, 31, 22]',
      ),
      fence(
        'C4Context\n  Person(eric, "Eric")\n  System(app, "Skynet Capital")\n  System_Ext(gh, "GitHub")\n  Rel(eric, app, "reviews")\n  Rel(app, gh, "opens PRs", "REST")',
      ),
      fence("kanban\n  ready\n    t1[Draw the C4 map]\n  in-flight\n    t2[Lint the diagrams]"),
      fence(
        "timeline\n  title Retro\n  section Detect\n    0800 : gate red\n  section Fix\n    0900 : patch pushed",
      ),
      fence(
        'flowchart LR\n  e@{ shape: person, label: "Eric" } --> app[app]\n  app ==> ledger[(ledger)]\n  app -.-> old[old path]',
      ),
    ].join("\n");
    const { code, problems, diagrams } = lint(body);
    expect(problems).toEqual([]);
    expect(diagrams.map((d) => d.type)).toEqual([
      "gitGraph",
      "quadrantChart",
      "xychart",
      "c4",
      "kanban",
      "timeline",
      "flowchart-v2",
    ]);
    expect(code).toBe(0);
  });

  it("fails a diagram that will not parse, naming the line — the opening-frame failure", () => {
    const { code, problems, diagrams } = lint(
      `intro\n${fence("flowchart LR\n  A[foo(bar)] --> B")}`,
    );
    expect(code).toBe(1);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("line 3");
    expect(problems[0]).toContain("will not parse");
    expect(problems[0]).toContain("Parse error");
    expect(diagrams[0]?.ok).toBe(false);
  });

  it("fails a 12.x-only type — github.com renders 11.17.2, and says which", () => {
    const { code, problems } = lint(fence("usecase-beta\n  actor Eric\n  Eric --> (review)"));
    expect(code).toBe(1);
    expect(problems.join(" ")).toContain("needs Mermaid 12");
    expect(problems.join(" ")).toContain("11.17.2");
  });

  it("fails a fixed theme — GitHub owns light and dark; a pinned theme freezes one", () => {
    const frontmatter = lint(fence("---\nconfig:\n  theme: forest\n---\nflowchart LR\n  a --> b"));
    expect(frontmatter.code).toBe(1);
    expect(frontmatter.problems.join(" ")).toContain("fixed theme");
    const directive = lint(fence("%%{init: {'theme':'dark'}}%%\nflowchart LR\n  a --> b"));
    expect(directive.problems.join(" ")).toContain("fixed theme");
  });

  it("fails icon packs — GitHub renders every iconify icon as a question mark", () => {
    const { code, problems } = lint(
      fence(
        "architecture-beta\n  service gh(logos:github-icon)[GitHub]\n  service db(database)[Ledger]\n  gh:R -- L:db",
      ),
    );
    expect(code).toBe(1);
    expect(problems.join(" ")).toContain("icon pack");
  });

  it("still refuses `journey` — a UX-satisfaction chart is the wrong shape for reasoning", () => {
    const { code, problems } = lint(fence("journey\n  title day\n  section a\n    x: 5: Eric"));
    expect(code).toBe(1);
    expect(problems.join(" ")).toContain("journey");
  });

  it("notes, never fails, the advisory class — init directives, elk layout, click, length", () => {
    const long = Array.from({ length: 45 }, (_, i) => `  n${i} --> n${i + 1}`).join("\n");
    const body = [
      fence("%%{init: {'flowchart': {'curve': 'basis'}}}%%\nflowchart LR\n  a --> b"),
      fence("---\nconfig:\n  layout: elk\n---\nflowchart LR\n  a --> b"),
      fence('flowchart LR\n  a --> b\n  click a "https://example.com"'),
      fence(`flowchart TD\n${long}`),
    ].join("\n");
    const { code, problems, notes } = lint(body);
    expect(problems).toEqual([]);
    expect(code).toBe(0);
    expect(notes.join(" ")).toContain("deprecated");
    expect(notes.join(" ")).toContain("dagre");
    expect(notes.join(" ")).toContain("click");
    expect(notes.join(" ")).toContain("legibility budget");
  });

  it("notes the round-3 taste rules — a handle, a fork with no question, a house noun — never fails", () => {
    const { code, problems, notes } = lint(
      fence(
        'flowchart TD\n  a["revert b0a4c8a"] --> b{"parse it the way GitHub does"}\n  b --> c["boards the platter"]',
      ),
    );
    expect(problems).toEqual([]);
    expect(code).toBe(0);
    expect(notes.join(" ")).toContain("reads as a handle");
    expect(notes.join(" ")).toContain("asks no question");
    expect(notes.join(" ")).toContain("is a house noun");
  });

  it("fails a classDef hex outside the checked-in snippets — a look is a mode, switched whole", () => {
    const { code, problems } = lint(
      fence("flowchart TD\n  a --> b\n  classDef hot fill:#FF0000,color:#FFFFFF"),
    );
    expect(code).toBe(1);
    expect(problems.join(" ")).toContain("#FF0000");
    expect(problems.join(" ")).toContain("docs/PICTURES.md");
  });

  it("accepts a snippet hex copied whole — the house removed class from docs/PICTURES.md", () => {
    const { code, problems } = lint(
      fence(
        "flowchart TD\n  a -.-> b\n  classDef removed stroke:#5A6B7B,stroke-width:2px,stroke-dasharray:6 4\n  class b removed",
      ),
    );
    expect(problems).toEqual([]);
    expect(code).toBe(0);
  });

  it("fails elk on a state diagram — GitHub throws at render where a flowchart only re-flows", () => {
    const { code, problems } = lint(
      fence("---\nconfig:\n  layout: elk\n---\nstateDiagram-v2\n  [*] --> a"),
    );
    expect(code).toBe(1);
    expect(problems.join(" ")).toContain("no fallback");
  });

  it("finds a block nested in a starter fence or indented in a comment, and dedents it", () => {
    const nested = "````markdown\n```mermaid\nflowchart LR\n    a --> b\n```\n````\n";
    const indented = "<!--\n    ```mermaid\n    flowchart LR\n        a --> b\n    ```\n-->\n";
    const { problems, diagrams } = lint(nested + indented);
    expect(problems).toEqual([]);
    expect(diagrams).toHaveLength(2);
  });

  it("costs nothing for a body with no diagram", () => {
    const { code, problems, notes, diagrams } = lint(
      "## The picture\n\nPicture: waived — docs only\n",
    );
    expect({ code, problems, notes, diagrams }).toEqual({
      code: 0,
      problems: [],
      notes: [],
      diagrams: [],
    });
  });

  it("the docs corpus parses — every checked-in diagram is a claim that renders", () => {
    let out: string;
    try {
      out = execFileSync("node", ["scripts/mermaid-lint.mjs", "--json"], { encoding: "utf8" });
    } catch (error) {
      out = (error as { stdout?: string }).stdout ?? "";
    }
    const report = JSON.parse(out) as Report;
    expect(report.problems).toEqual([]);
    expect(report.diagrams.length).toBeGreaterThan(5);
  });
});
