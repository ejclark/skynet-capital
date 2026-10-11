import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import {
  extractJson,
  main,
  parseJsonl,
  projectSlug,
  readRun,
  tailTools,
} from "../../scripts/wf-read.mjs";

// #5194: one command for the orchestrating session to read a Workflow run — the runs, each agent's
// state and result, a task's result JSON, an agent's last tool calls. The fixture is a small run as
// Claude Code writes it, including a half-written journal line and a half-written transcript line
// (a live run is read mid-write).

const FIX = join(import.meta.dirname, "..", "fixtures", "wf-read");
const PROJECT = join(FIX, "projects", "-fixture-repo");
const RUN_NEW = join(PROJECT, "sess-new", "subagents", "workflows", "wf_new");
const wf = (...args: string[]) => main(["--project-dir", PROJECT, ...args]);

describe("wf-read", () => {
  it("WHEN run with no arguments, lists recent runs newest first: id · started · done of started", () => {
    const { code, out } = wf();
    expect(code).toBe(0);
    expect(out.split("\n")).toEqual([
      "wf_new · 2026-10-11T08:00:00.000Z · 2/3 done (1 failed)",
      "wf_old · 2026-10-09T10:00:00.000Z · 1/1 done",
    ]);
  });

  it("WHEN given --latest, prints one line per agent: label · phase · status · result head", () => {
    const [head, ...rows] = wf("--latest").out.split("\n");
    expect(head).toMatch(/^wf_new · /);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatch(/^review:bugs · Review · done · \{"findings":/);
    expect(rows[0]?.split(" · ")[3]).toHaveLength(100);
    // label and phase fall back to the agent's meta.json when the journal's started line lacks them
    expect(rows[1]).toBe("review:perf · Verify · running · —");
    expect(rows[2]).toBe("review:docs · Review · failed · agent exceeded its turn budget");
  });

  it("WHEN given a run id with --json, prints the full results", () => {
    const parsed = JSON.parse(wf("wf_old", "--json").out);
    expect(parsed.agents[0]).toMatchObject({
      label: "scan:old",
      status: "done",
      result: { findings: [] },
    });
  });

  it("WHEN given --task, extracts the result JSON from the task's .output file", () => {
    const { code, out } = wf("--task", "wtask1", "--tmp-dir", join(FIX, "tmp"), "--json");
    expect(code).toBe(0);
    expect(JSON.parse(out)).toEqual({
      confirmed: [{ file: "src/a.ts", title: "off-by-one", verdict: { isReal: true } }],
      dropped: 2,
    });
  });

  it("WHEN given --agent --tail N, prints the last N tool calls: tool · command head · outcome", () => {
    expect(wf("--agent", "a1", "--tail", "2").out.split("\n")).toEqual([
      "Read · /repo/src/missing.ts · error",
      "Grep · slice\\( · pending",
    ]);
    expect(wf("--agent", "a1").out.split("\n")[0]).toBe("Bash · git diff origin/main...HEAD · ok");
  });

  it("exits 2 with a reason when what was asked for is not there", () => {
    expect(wf("nope")).toMatchObject({ code: 2, out: expect.stringContaining("no run nope") });
    expect(wf("--agent", "zz").code).toBe(2);
    expect(main(["--project-dir", join(FIX, "absent")]).code).toBe(2);
  });
});

describe("the readers underneath", () => {
  it("skips partially written lines rather than failing", () => {
    expect(parseJsonl('{"a":1}\n{"b":\n\n{"c":3}')).toEqual([{ a: 1 }, { c: 3 }]);
    expect(readRun(RUN_NEW).agents.map((a) => a.key)).toEqual([
      "review:bugs",
      "review:perf",
      "review:docs",
    ]);
    expect(
      tailTools(
        '{"message":{"content":[{"type":"tool_use","id":"x","name":"Bash","input":{}}]}}\n{"mess',
        5,
      ),
    ).toHaveLength(1);
  });

  it("finds the largest JSON value in prose, past balanced brackets that are not JSON", () => {
    expect(extractJson('done {2 of 3}\nResult: [1, 2] and {"ok":true,"n":[1,2,3]} end')).toEqual({
      ok: true,
      n: [1, 2, 3],
    });
    expect(extractJson('{"bare":1}')).toEqual({ bare: 1 });
    expect(extractJson("no json here")).toBeNull();
  });

  it("derives Claude Code's project slug from the working directory", () => {
    expect(projectSlug("/home/runner/work/skynet-capital/skynet-capital")).toBe(
      "-home-runner-work-skynet-capital-skynet-capital",
    );
  });
});
