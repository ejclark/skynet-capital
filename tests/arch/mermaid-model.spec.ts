import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { mermaidBlocks } from "../../scripts/mermaid-lint.mjs";
import { findLanding, landedPicture } from "../../scripts/platter-picture.mjs";
import { type DiagramModel, diagramModel, diagramModels } from "../support/diagram";

// The diagram-as-data harness (plan #3748 slice 7a, #4341): `mermaid-lint --json --ast` emits what
// Mermaid parsed — type, nodes, edges — so a spec can hold a diagram's claim to the code it draws.
// Done line: one model per block, and the platter starter on docs/PICTURES.md round-trips through it.
// Falsifier: a parity spec between a held PR's picture and its ledger cannot be written from the
// export — the "ledger ↔ picture" case below is that spec, written.

const ids = (m: DiagramModel) => (m.nodes ?? []).map((n) => n.id);
const pairs = (m: DiagramModel) => (m.edges ?? []).map((e) => `${e.from}→${e.to}`);
const childrenOf = (m: DiagramModel, parent: string) =>
  (m.nodes ?? []).filter((n) => n.parent === parent);

describe("mermaid model — the parsed diagram as data", () => {
  it("emits one model per block, in order, each carrying its type", () => {
    const models = diagramModels(
      "```mermaid\nflowchart LR\n  a --> b\n```\ntext\n```mermaid\nstateDiagram-v2\n  [*] --> s\n```\n",
    );
    expect(models.map((m) => m.type)).toEqual(["flowchart-v2", "stateDiagram"]);
  });

  it("round-trips the held-PR starter on docs/PICTURES.md — doc and model cannot drift", () => {
    const page = readFileSync("docs/PICTURES.md", "utf8");
    const starter = mermaidBlocks(page).find((b) => /subgraph held\b/.test(b.source));
    expect(starter, "the squash-ending starter is on the page").toBeDefined();
    const m = diagramModel(starter?.source ?? "");
    expect(m.type).toBe("flowchart-v2");
    expect(m.title).toBe("PR #3711: an item reverts by ship revert");
    expect(childrenOf(m, "held").map((n) => [n.id, n.shape])).toEqual([
      ["i1", "doc"],
      ["i2", "doc"],
      ["i3", "doc"],
    ]);
    expect(m.nodes?.find((n) => n.id === "held")?.group).toBe(true);
    expect(m.nodes?.find((n) => n.id === "main")?.shape).toBe("cyl");
    expect(m.edges).toEqual([
      expect.objectContaining({
        from: "held",
        to: "main",
        label: "Squash and merge",
        stroke: "thick",
      }),
    ]);
  });

  it("ledger ↔ picture: the landed picture carries exactly the ledger's items, in order", () => {
    // The parity the falsifier names. The ledger is the source of truth; the picture is generated
    // from it; the model proves the picture says the same thing — count, order, which button.
    const why = ["update the review action", "pin the deploy tool", "bump the cache step"];
    const ledger = [
      "| # | item | why | verify evidence | revert |",
      "|---|---|---|---|---|",
      ...why.map((w, i) => `| ${i + 1} | \`item/${i}\` | ${w} | verify green | \`abcdef${i}\` |`),
    ].join("\n");
    const log = `${"1".repeat(40)}\x00${"0".repeat(40)}\x00chore(platter): protected-path changes — x (#3711)\x00${ledger}\x1e`;
    const landing = findLanding(log, 3711);
    if (!landing) throw new Error("fixture landing not found");
    const m = diagramModel(landedPicture(landing));
    const items = childrenOf(m, "held");
    expect(items.map((n) => n.label?.replace(/<br\/>/g, " "))).toEqual(
      why.map((w, i) => `${i + 1} ${w}`),
    );
    expect(m.edges?.map((e) => e.label)).toEqual(["Squash and merge"]);
  });

  it("reads the delta grammar's stroke and an author's class off a flowchart", () => {
    const m = diagramModel(
      "flowchart LR\n  a ==> b\n  b -.-> c\n  c --> d\n  class b new-path\n  classDef new-path stroke-width:3px",
    );
    expect(m.edges?.map((e) => [`${e.from}→${e.to}`, e.stroke])).toEqual([
      ["a→b", "thick"],
      ["b→c", "dotted"],
      ["c→d", "normal"],
    ]);
    expect(m.nodes?.find((n) => n.id === "b")?.classes).toEqual(["new-path"]);
  });

  it("reads a state diagram's guarded transitions and composite parent", () => {
    const m = diagramModel(
      'stateDiagram-v2\n  state "ready to build" as ready\n  [*] --> ready\n  ready --> building: claimed\n  state building {\n    verify --> shipped\n  }',
    );
    expect(m.nodes?.find((n) => n.id === "ready")?.label).toBe("ready to build");
    expect(m.edges?.find((e) => e.from === "ready")).toMatchObject({
      to: "building",
      label: "claimed",
    });
    expect(childrenOf(m, "building").map((n) => n.id)).toEqual(["verify", "shipped"]);
  });

  it("reads a gitGraph's commits and parent links — a merge has two parents", () => {
    const m = diagramModel(
      'gitGraph TB:\n  commit id: "base"\n  branch item\n  commit id: "fix"\n  checkout main\n  merge item id: "land"',
    );
    expect(m.direction).toBe("TB");
    expect(m.branches).toEqual(["main", "item"]);
    expect(m.nodes?.map((n) => [n.id, n.kind, n.branch])).toEqual([
      ["base", "commit", "main"],
      ["fix", "commit", "item"],
      ["land", "merge", "main"],
    ]);
    expect(pairs(m)).toEqual(["base→fix", "base→land", "fix→land"]);
  });

  it("reads C4 elements, their boundary and every Rel — the storybook's claims", () => {
    const m = diagramModel(
      'C4Container\n  title Bots\n  Person(eric, "Eric")\n  System_Boundary(app, "Skynet") {\n    Container(web, "Web", "node")\n  }\n  System_Ext(gh, "GitHub")\n  Rel(eric, web, "reviews")\n  Rel(web, gh, "opens PRs", "REST")',
    );
    expect(m.title).toBe("Bots");
    expect(m.level).toBe("C4Container");
    expect(m.nodes?.map((n) => [n.id, n.kind, n.parent])).toEqual([
      ["app", "boundary:system", undefined],
      ["eric", "person", undefined],
      ["web", "container", "app"],
      ["gh", "external_system", undefined],
    ]);
    expect(m.edges).toEqual([
      { from: "eric", to: "web", label: "reviews", kind: "rel" },
      { from: "web", to: "gh", label: "opens PRs", kind: "rel", technology: "REST" },
    ]);
  });

  it("reads a sequence's messages and leaves notes and activations out", () => {
    const m = diagramModel(
      "sequenceDiagram\n  participant A as Alice\n  activate A\n  A->>B: ask\n  Note over A,B: aside\n  B-->>A: answer\n  deactivate A",
    );
    expect(ids(m)).toEqual(["A", "B"]);
    expect(m.edges?.map((e) => [e.from, e.to, e.label])).toEqual([
      ["A", "B", "ask"],
      ["B", "A", "answer"],
    ]);
  });

  it("reads architecture services inside their group and the edge between them", () => {
    const m = diagramModel(
      "architecture-beta\n  group api(cloud)[API]\n  service db(database)[DB] in api\n  service s(server)[S]\n  s:R -- L:db",
    );
    expect(m.nodes?.map((n) => [n.id, n.kind, n.parent])).toEqual([
      ["api", "group", undefined],
      ["db", "service", "api"],
      ["s", "service", undefined],
    ]);
    expect(pairs(m)).toEqual(["s→db"]);
  });

  it("answers null, never an empty list, for a type that is not a node/edge picture", () => {
    const m = diagramModel('pie\n  "a": 1');
    expect(m).toEqual({ type: "pie", nodes: null, edges: null });
  });

  it("refuses --ast without --json — the model is data, never a human report", () => {
    const r = spawnSync("node", ["scripts/mermaid-lint.mjs", "--stdin", "--ast"], {
      input: "```mermaid\nflowchart LR\n  a --> b\n```\n",
      encoding: "utf8",
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("--json");
  });

  it("throws on a block that does not parse — an unreadable claim is not an empty one", () => {
    expect(() => diagramModel("flowchart LR\n  A[foo(bar)] --> B")).toThrow(/does not lint/);
  });
});
