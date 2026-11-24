import { execFileSync } from "node:child_process";
import {
  declaredEdges,
  EXEMPT_FROM,
  findUndeclared,
  importEdges,
  ownership,
  parityStale,
} from "../../scripts/arch-boundaries.mjs";
import { advisoryScan } from "../support/advisory-scan.js";
import { diagramModel } from "../support/diagram.js";

// The drawn container boundaries as an import gate (plan #3748 slice 8, #4340). The diagram says
// which container talks to which (`Rel`); the code roots say where each container lives; this holds
// the real imports to both. Findings are advisory until the corpus is clean (the plan's settled
// fork), so the live scan below never fails — what is hard here is that the compiler is right.

const DRAWING = `C4Container
    Person(p, "Member")
    System_Boundary(s, "S") {
        Container(web, "Web", "ts", "the shell")
        Container(api, "Api", "ts", "the server")
        Container(bots, "Bots", "ts", "the trader")
        ContainerDb(vol, "Volume", "fs", "the app volume")
        Container(tests, "Tests", "rstest", "the specs")
    }
    Rel(p, web, "Uses")
    Rel(web, api, "Calls")
    BiRel(api, bots, "Talk")
    Rel(api, vol, "Writes")
    Rel(tests, api, "Imports")`;

const CONTAINERS = [
  { id: "web", code_roots: ["app/src"] },
  { id: "api", code_roots: ["src/server", "src/shared", "src/alpaca"] },
  { id: "bots", code_roots: ["src/autonomous", "src/alpaca", "src/scripts/run-*.ts"] },
  { id: "vol", code_roots: ["src/server/stores"] },
  { id: "tests", code_roots: ["tests"] },
];

const ids = CONTAINERS.map((c) => c.id);
const { drawn, declared, writers } = declaredEdges([diagramModel(DRAWING)], ids);
const owner = ownership(CONTAINERS, drawn);
const crossing = (from: string, to: string) =>
  findUndeclared([{ from, to }], owner, declared, writers).map((f) => `${f.from} → ${f.to}`);

describe("the drawing compiles to an allowed-import matrix", () => {
  it("reads each Rel as one direction and a BiRel as both, skipping people", () => {
    expect([...declared].sort()).toEqual(
      ["web>api", "api>bots", "bots>api", "api>vol", "tests>api"].sort(),
    );
  });

  it("names the volume's writers: whoever draws a Rel into it", () => {
    expect([...(writers.get("vol") ?? [])]).toEqual(["api"]);
  });

  it("refuses a diagram that draws none of the map's containers", () => {
    expect(() => declaredEdges([diagramModel('C4Context\n    Person(p, "P")')], ids)).toThrow(
      /no C4Container diagram/,
    );
  });
});

describe("ownership — the most specific root wins", () => {
  it("gives a file to the longest root naming it", () => {
    expect(owner("src/server/stores/a.ts")).toEqual(["vol"]);
    expect(owner("src/server/route.ts")).toEqual(["api"]);
  });

  it("shares a file two containers name equally, and honours a glob root", () => {
    expect(owner("src/alpaca/client.ts").sort()).toEqual(["api", "bots"]);
    expect(owner("src/scripts/run-autonomous.ts")).toEqual(["bots"]);
    expect(owner("src/scripts/other.ts")).toEqual([]);
  });
});

describe("findUndeclared — an import that crosses with no Rel drawn that way", () => {
  it("passes a drawn direction and names the undrawn one", () => {
    expect(crossing("app/src/a.ts", "src/server/b.ts")).toEqual([]);
    expect(crossing("src/server/b.ts", "app/src/a.ts")).toEqual(["api → web"]);
  });

  it("treats a BiRel as both ways", () => {
    expect(crossing("src/server/a.ts", "src/autonomous/b.ts")).toEqual([]);
    expect(crossing("src/autonomous/b.ts", "src/server/a.ts")).toEqual([]);
  });

  it("never counts a shared root, or neutral ground, as a crossing", () => {
    expect(crossing("app/src/a.ts", "src/alpaca/c.ts")).toEqual([]); // web → api+bots, api drawn
    expect(crossing("src/autonomous/b.ts", "src/math/num.ts")).toEqual([]);
  });

  it("lets a volume's code import as its writer does, and names the edge into it", () => {
    expect(crossing("src/server/stores/a.ts", "src/autonomous/b.ts")).toEqual([]); // api>bots
    expect(crossing("src/autonomous/b.ts", "src/server/stores/a.ts")).toEqual(["bots → vol"]);
  });

  it("exempts the specs, which prove the runtime rather than ship in it", () => {
    expect(EXEMPT_FROM).toContain("tests");
    expect(crossing("tests/a.spec.ts", "app/src/a.ts")).toEqual([]);
  });

  it("groups by direction, counts, and keeps three examples", () => {
    const edges = Array.from({ length: 5 }, (_, i) => ({
      from: `src/server/f${i}.ts`,
      to: `app/src/g${i}.ts`,
    }));
    const [group] = findUndeclared(edges, owner, declared, writers);
    expect(group).toMatchObject({ from: "api", to: "web", count: 5 });
    expect(group?.examples).toHaveLength(3);
  });
});

describe("importEdges — first-party imports from a dependency-cruiser report", () => {
  it("drops npm, core and unresolved dependencies", () => {
    const report = {
      modules: [
        {
          source: "src/a.ts",
          dependencies: [
            { resolved: "src/b.ts" },
            { resolved: "node_modules/x/index.js" },
            { resolved: "fs", coreModule: true },
            { resolved: "src/c.ts", couldNotResolve: true },
          ],
        },
      ],
    };
    expect(importEdges(report)).toEqual([{ from: "src/a.ts", to: "src/b.ts" }]);
  });
});

describe("parityStale — Graphify notes must name containers the diagram draws", () => {
  const parity = {
    graphify_communities: [
      { mapped_to_container: "runtime:api (src/server)" },
      { mapped_to_container: "shared kernel — runtime:bots ∩ runtime:gone" },
    ],
    containers_with_no_code: ["runtime:vol — zero presence"],
  };

  it("returns the ids a note names that the drawing does not", () => {
    expect(parityStale(parity, "runtime", drawn)).toEqual(["gone"]);
  });

  it("is clean on the committed parity notes", () => {
    const out = JSON.parse(
      execFileSync("node", ["scripts/arch-boundaries.mjs", "--json"], {
        encoding: "utf8",
        maxBuffer: 64 << 20,
      }),
    ) as { map: string; stale: string[] }[];
    expect(out.flatMap((r) => r.stale)).toEqual([]);
  });
});

describe("the live scan (advisory)", () => {
  it("reports the committed drawing's undeclared edges without blocking CI", () => {
    advisoryScan("scripts/arch-boundaries.mjs", undefined, ["--check"]);
  });

  // An advisory wrapper swallows a crash the way it swallows a finding (#4771): the scan running is
  // not advisory.
  it("produces a parseable report over the runtime map", () => {
    const [runtime] = JSON.parse(
      execFileSync("node", ["scripts/arch-boundaries.mjs", "--json"], {
        encoding: "utf8",
        maxBuffer: 64 << 20,
      }),
    ) as { map: string; containers: number; total: number }[];
    expect(runtime).toMatchObject({ map: "runtime", containers: 7 });
    expect(typeof runtime?.total).toBe("number");
  });
});
