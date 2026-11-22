import { describe, expect, it } from "@rstest/core";
import { everyPage, protectedTest, sweep } from "../../scripts/platter-sweep.mjs";

// platter-sweep.mjs (#7939) against a stubbed `gh api`: the reads it makes and the JSON it prints.
// The one network rule pinned here is #7711's: pages are read by `&page=N`, never `--paginate`,
// whose Link header names the repo by numeric id and is refused by the cloud proxy.

type Routes = Record<string, unknown>;

function stub(routes: Routes) {
  const calls: string[][] = [];
  const exec = (cmd: string, args: string[]) => {
    calls.push([cmd, ...args]);
    const path = (args[1] ?? "").replace("repos/{owner}/{repo}/", "");
    if (!(path in routes)) throw new Error(`unstubbed ${path}`);
    return JSON.stringify(routes[path]);
  };
  return { exec, calls };
}

const pr = (number: number, ref: string, labels: string[], login = "ejclark") => ({
  number,
  title: `t${number}`,
  state: "open",
  draft: false,
  mergeable: true,
  body: "",
  labels: labels.map((name) => ({ name })),
  user: { login },
  head: { ref, sha: `sha${number}` },
  base: { ref: "main" },
});
const runs = {
  check_runs: [
    { name: "verify", status: "completed", conclusion: "success" },
    { name: "integration tests", status: "completed", conclusion: "success" },
  ],
};
const page = (path: string, n = 1) =>
  `${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${n}`;

const platter = { ...pr(7424, "platter/2026-11-11", ["hold-merge", "conflict-flagged"]) };
const settings = pr(7737, "ccr-31486dd4-vizc66", ["hold-merge"]);
const ui = pr(7672, "claude/trading-ui-scenarios-07042p", ["hold-merge"]);
const routes: Routes = {
  [page("pulls?state=open")]: [platter, settings, ui, pr(7000, "feat/plain", [])],
  "pulls/7424": platter,
  "pulls/7737": settings,
  "pulls/7672": ui,
  [page("pulls/7737/files")]: [{ filename: ".claude/settings.json" }],
  [page("pulls/7672/files")]: [{ filename: "app/src/routes/trade.tsx" }],
  [page("commits/sha7737/check-runs")]: runs,
  [page("commits/sha7672/check-runs")]: runs,
};
const isProtected = (p: string) => p === ".claude/settings.json";

describe("platter-sweep — the adoptable list and the platter to rebuild", () => {
  it("lists #7737 to adopt, refuses #7672, and names #7424 for a rebuild", () => {
    const { exec } = stub(routes);
    const out = sweep({ exec, isProtected });
    expect(out.adoptable?.map((v) => v.number)).toEqual([7737]);
    expect(out.refused?.map((v) => [v.number, v.reason])).toEqual([
      [7672, "it touches no protected path, so protection is not why it waits"],
    ]);
    expect(out.rebuild?.number).toBe(7424);
    expect(out.platter?.branch).toBe("platter/2026-11-11");
  });

  it("judges one PR with --pr, and still reports the open platter", () => {
    const { exec } = stub(routes);
    const out = sweep({ exec, isProtected, only: 7737 });
    expect(out.verdict?.adopt).toBe(true);
    expect(out.platter?.rebuild).toBe(true);
  });

  it("reads by page number and never asks gh to follow Link headers", () => {
    const { exec, calls } = stub(routes);
    sweep({ exec, isProtected });
    expect(calls.every((c) => c[0] === "gh" && c[1] === "api")).toBe(true);
    expect(calls.flat()).not.toContain("--paginate");
    expect(calls.some((c) => /pulls\?state=open&per_page=100&page=1$/.test(c[2] ?? ""))).toBe(true);
  });

  it("follows a full page to the next, and stops at the first short one", () => {
    const full = Array.from({ length: 100 }, (_, i) => ({ filename: `f${i}` }));
    const { exec, calls } = stub({
      [page("pulls/1/files", 1)]: full,
      [page("pulls/1/files", 2)]: [{ filename: "last" }],
    });
    expect(everyPage(exec, "pulls/1/files")).toHaveLength(101);
    expect(calls).toHaveLength(2);
  });

  it("answers protection from the real envelope.json", () => {
    const test = protectedTest();
    expect(test(".github/workflows/pipeline.yml")).toBe(true);
    expect(test("docs/process/LOOPS-ROUTINE.md")).toBe(false);
  });
});
