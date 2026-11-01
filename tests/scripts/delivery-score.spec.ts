import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import {
  agreement,
  buildsIssue,
  classify,
  cleanRate,
  contrastTable,
  DEFAULT_WINDOW_DAYS,
  renderTable,
  sinceOf,
} from "../../scripts/delivery-score.mjs";

// The instrument #3955's loop rows score #4056's calls with. The frozen cohort is the study's own
// output, so replaying it must reproduce the published numbers exactly — if it doesn't, the
// instrument is broken and no live score it prints can be trusted (#4056 slice 2's falsifier).
const cohort = JSON.parse(
  readFileSync("tests/fixtures/delivery/cohort-2026-09-29.json", "utf8"),
).rows;

const DAY = 24 * 3600e3;
const at = (d: number) => new Date(Date.parse("2026-09-01T00:00:00Z") + d * DAY).toISOString();
const pr = (number: number, o: Record<string, unknown>) => ({
  number,
  title: "feat(x): build it",
  body: "",
  head: "",
  state: "closed",
  created_at: at(1),
  merged_at: at(1),
  ...o,
});
const issue = (o: Record<string, unknown> = {}) => ({
  number: 500,
  state: "closed",
  state_reason: "completed",
  ...o,
});
const now = Date.parse(at(30));

describe("delivery score: the frozen cohort", () => {
  it("reproduces the study's size contrast exactly (84% at ≤3 PRs vs 68% at ≥4)", () => {
    const size = contrastTable(cohort).find((c) => c.name.startsWith("declared"));
    expect(size?.with).toEqual({ clean: 76, n: 90, pct: 84 });
    expect(size?.without).toEqual({ clean: 17, n: 25, pct: 68 });
  });

  it("renders one headline line and a row per contrast", () => {
    const table = renderTable(cohort, "Frozen");
    expect(table).toContain("**Frozen** · 159 issues · CLEAN 126");
    expect(table).toContain("| declared ≤3 PRs vs ≥4 | 84% (76/90) | 68% (17/25) |");
  });

  it("scores a clean rate as clean over n", () => {
    expect(cleanRate([{ outcome: "CLEAN" }, { outcome: "REWORKED" }])).toEqual({
      clean: 1,
      n: 2,
      pct: 50,
    });
    expect(cleanRate([])).toEqual({ clean: 0, n: 0, pct: 0 });
  });
});

describe("delivery score: which PRs build an issue", () => {
  it("counts a closing keyword, a branch named for it, #N in the title, or slice wording", () => {
    expect(buildsIssue(pr(1, { body: "Closes #500." }), 500)).toBe(true);
    expect(buildsIssue(pr(1, { head: "feedback/500" }), 500)).toBe(true);
    expect(buildsIssue(pr(1, { title: "feat(x): the row (#500 p2)" }), 500)).toBe(true);
    expect(buildsIssue(pr(1, { body: "Slice 2 of #500." }), 500)).toBe(true);
  });

  it("ignores a mere mention, a longer number, and a reference inside code", () => {
    expect(buildsIssue(pr(1, { body: "Context: see #500." }), 500)).toBe(false);
    expect(buildsIssue(pr(1, { body: "Closes #5001." }), 500)).toBe(false);
    expect(buildsIssue(pr(1, { body: "the text `Closes #500` is quoted" }), 500)).toBe(false);
  });
});

describe("delivery score: classifying an outcome", () => {
  const build = pr(10, { body: "Closes #500" });

  it("is CLEAN when closed completed with no rework signal", () => {
    expect(classify({ issue: issue(), prs: [build], now })?.outcome).toBe("CLEAN");
  });

  it("is outside the cohort when nothing merged builds it", () => {
    expect(classify({ issue: issue(), prs: [pr(10, { body: "see #500" })], now })).toBeNull();
  });

  it("is REWORKED by a fix PR building it within 7 days, but not by a planned slice", () => {
    const fix = pr(11, {
      title: "fix(x): the row",
      body: "Fixes #500",
      created_at: at(3),
      merged_at: at(3),
    });
    expect(classify({ issue: issue(), prs: [build, fix], now })?.outcome).toBe("REWORKED");
    const slice = pr(12, {
      title: "fix(x): slice 2",
      body: "Slice 2 of #500",
      created_at: at(3),
      merged_at: at(3),
    });
    expect(classify({ issue: issue(), prs: [build, slice], now })?.outcome).toBe("CLEAN");
  });

  it("does not count a fix elsewhere that only cites the issue as context", () => {
    const other = pr(11, {
      title: "fix(y): other",
      body: "context: #500",
      created_at: at(3),
      merged_at: at(3),
    });
    expect(classify({ issue: issue(), prs: [build, other], now })?.outcome).toBe("CLEAN");
  });

  it("is REWORKED when reopened, and ABANDONED when closed not planned", () => {
    const events = [{ event: "reopened", created_at: at(2) }];
    expect(classify({ issue: issue(), events, prs: [build], now })?.outcome).toBe("REWORKED");
    const dropped = issue({ state_reason: "not_planned" });
    expect(classify({ issue: dropped, prs: [build], now })?.outcome).toBe("ABANDONED");
  });

  it("is STALLED when the first build came more than 7 days after ready", () => {
    const events = [{ event: "labeled", label: { name: "ready" }, created_at: at(0) }];
    const late = pr(10, { body: "Closes #500", created_at: at(9), merged_at: at(9) });
    expect(classify({ issue: issue(), events, prs: [late], now })?.outcome).toBe("STALLED");
  });
});

// The registry's "Format stays out of ready" row names bare `npm run delivery:score`, and the
// push-tick check runs a row's command with no arguments — so with no default the posted check
// could only ever read "did not finish" (loop census, 2026-10-31). The default is a window ending
// today, and the heading says which date it chose, so the posted output names its own cohort.
describe("delivery score: the default window", () => {
  const now = Date.parse("2026-11-03T15:00:00Z");

  it("reads back the window a caller names", () => {
    expect(sinceOf(["--since", "2026-10-01"], now)).toEqual({
      since: "2026-10-01",
      defaulted: false,
    });
  });

  it("falls back to the window ending today, and says it did", () => {
    const { since, defaulted } = sinceOf([], now);
    expect(defaulted).toBe(true);
    expect(Date.parse(`${since}T15:00:00Z`)).toBe(now - DEFAULT_WINDOW_DAYS * DAY);
  });

  it("refuses a malformed date rather than scoring since the epoch", () => {
    expect(() => sinceOf(["--since", "yesterday"], now)).toThrow(/usage/);
    expect(() => sinceOf(["--since", "2026-13-45"], now)).toThrow(/usage/);
    expect(() => sinceOf(["--since"], now)).toThrow(/usage/);
  });
});

// The wiring, driven through a stub `curl` (ghRest's one shell-out): the CLI with no argument
// must exit 0 and name its window, and an issue nothing merged builds must cost no events read —
// that read was one REST call per issue, which is what made the live score too slow for the
// push tick's command budget.
describe("delivery score: the CLI with no argument, against a stub GitHub", () => {
  const STUB_CURL = `#!/usr/bin/env bash
url="\${@: -1}"
echo "$url" >> "$STUB/calls"
case "$url" in
*/pulls?*) cat "$STUB/pulls.json" ;;
*/issues?*) cat "$STUB/issues.json" ;;
*/events?*) echo '[]' ;;
*) echo '[]' ;;
esac
`;
  const run = (args: string[], { pulls = [], issues = [] }: Record<string, unknown[]> = {}) => {
    const dir = mkdtempSync(join(tmpdir(), "delivery-score-"));
    try {
      writeFileSync(join(dir, "curl"), STUB_CURL, { mode: 0o755 });
      writeFileSync(join(dir, "pulls.json"), JSON.stringify(pulls));
      writeFileSync(join(dir, "issues.json"), JSON.stringify(issues));
      writeFileSync(join(dir, "calls"), "");
      let out = "";
      let status = 0;
      try {
        out = execFileSync("node", ["scripts/delivery-score.mjs", ...args], {
          encoding: "utf8",
          stdio: "pipe",
          env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, STUB: dir, GH_TOKEN: "stub" },
        });
      } catch (err) {
        status = (err as { status: number }).status;
        out = String((err as { stdout?: string }).stdout ?? "");
      }
      return { out, status, calls: readFileSync(join(dir, "calls"), "utf8").trim().split("\n") };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };

  it("exits 0 with no argument and names the window it scored", () => {
    // Read the clock on both sides of the run, so a midnight rollover between them cannot flake.
    const before = sinceOf([], Date.now()).since;
    const { out, status } = run([]);
    const after = sinceOf([], Date.now()).since;
    expect(status).toBe(0);
    const heading = (since: string) =>
      `**Handed off since ${since} (the default: ${DEFAULT_WINDOW_DAYS} days back), scored live**`;
    expect(out.includes(heading(before)) || out.includes(heading(after))).toBe(true);
  });

  it("reads events only for an issue something merged builds", () => {
    const since = sinceOf([], Date.now()).since;
    const recent = new Date(Date.parse(since) + 2 * DAY).toISOString();
    const pulls = [
      pr(10, { body: "Closes #500", created_at: recent, merged_at: recent, head: { ref: "x" } }),
    ];
    const issues = [
      {
        number: 500,
        state: "closed",
        state_reason: "completed",
        labels: [],
        created_at: recent,
        body: "",
      },
      { number: 501, state: "open", labels: [], created_at: recent, body: "" },
    ];
    const { status, calls } = run([], { pulls, issues });
    expect(status).toBe(0);
    expect(calls.some((u) => u.includes("issues/500/events"))).toBe(true);
    expect(calls.some((u) => u.includes("issues/501/events"))).toBe(false);
  });
});

describe("delivery score: agreement with the frozen cohort", () => {
  it("compares only the issues both sides scored", () => {
    expect(
      agreement({ 1: "CLEAN", 2: "REWORKED" }, { 1: "CLEAN", 2: "CLEAN", 3: "CLEAN" }),
    ).toEqual({
      shared: 2,
      same: 1,
      pct: 50,
    });
  });
});
