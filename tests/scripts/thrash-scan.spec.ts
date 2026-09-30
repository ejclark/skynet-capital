import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Thrash scan (#3939 slice 1) — driven through the real entrypoint via `--explain`, same pattern as
// latency-scan.spec.ts: state goes in as JSON on stdin, so this runs offline.
type Hit = { signal: string; key: string; date: string; count: number; autoFile: boolean };
type Out = { summary: { total: number; bySignal: Record<string, number> }; hits: Hit[] };

const scan = (state: unknown, since: string, today: string): Out =>
  JSON.parse(
    execFileSync(
      "node",
      ["scripts/thrash-scan.mjs", "--explain", "--json", `--since=${since}`, `--today=${today}`],
      { input: JSON.stringify(state), encoding: "utf8" },
    ),
  );

const of = (out: Out, signal: string) => out.hits.filter((h) => h.signal === signal);

const issue = (number: number, title: string, createdAt: string, extra = {}) => ({
  number,
  title,
  labels: [] as string[],
  createdAt,
  isPr: false,
  ...extra,
});

const failedAgain = (issueNo: number, run: number, at: string, step = "Deploy to Fly") => ({
  issue: issueNo,
  author: "github-actions[bot]",
  body: `Failed again — run [${run}](https://github.com/o/r/actions/runs/${run}), step \`${step}\`. Same signature, so this is a recurrence, not a new fault.`,
  createdAt: at,
});

describe("thrash-scan — the backtest (#3939 criteria 1–2, real 2026-09 extract)", () => {
  const fixture = JSON.parse(readFileSync("tests/fixtures/thrash/backtest-2026-09.json", "utf8"));
  const out = scan(fixture, "2026-09-09", "2026-09-28");

  it("reports T1 on #3720 — 78 'Failed again' comments that differ only by run id", () => {
    const t1 = of(out, "T1").find((h) => h.key === "#3720");
    expect(t1?.count).toBe(78);
  });

  it("reports T3 on 2026-09-09 — the 398-filing research burst", () => {
    expect(of(out, "T3").map((h) => h.key)).toContain("event-research@2026-09-09");
  });

  it("does not report the research/* pulse PRs — repetition with state change is not thrash", () => {
    const pulse = fixture.issues.filter((i: { branch?: string }) =>
      i.branch?.startsWith("research/"),
    );
    expect(pulse.length).toBeGreaterThan(5);
    const keys = out.hits.map((h) => h.key);
    for (const pr of pulse) expect(keys.some((k) => k.includes(`#${pr.number}`))).toBe(false);
  });
});

describe("thrash-scan — each signal's edges", () => {
  it("T1: needs 5 repeats, and a different step is a different comment", () => {
    const comments = [
      ...[1, 2, 3, 4].map((n) => failedAgain(7, 100 + n, `2026-09-10T0${n}:00:00Z`)),
      failedAgain(7, 200, "2026-09-10T06:00:00Z", "Run tests"),
    ];
    expect(of(scan({ comments }, "2026-09-01", "2026-09-30"), "T1")).toEqual([]);
    comments.push(failedAgain(7, 300, "2026-09-10T07:00:00Z"));
    expect(of(scan({ comments }, "2026-09-01", "2026-09-30"), "T1")[0]?.count).toBe(5);
  });

  it("T2: a same-title issue within 14 days fires; 15 days apart or a PR does not", () => {
    const issues = [
      issue(1, "[ci] Pipeline — deploy", "2026-09-01T00:00:00Z"),
      issue(2, "[ci]  pipeline — DEPLOY", "2026-09-10T00:00:00Z"),
      issue(3, "[event-research] opex-2027-01-15", "2026-09-01T00:00:00Z"),
      issue(4, "[event-research] opex-2027-01-15", "2026-09-16T00:00:00Z"),
      issue(5, "docs(research): pulse", "2026-09-02T00:00:00Z", { isPr: true }),
      issue(6, "docs(research): pulse", "2026-09-03T00:00:00Z", { isPr: true }),
    ];
    const t2 = of(scan({ issues }, "2026-09-01", "2026-09-30"), "T2");
    expect(t2.map((h) => h.key)).toEqual(["[ci] pipeline — deploy"]);
  });

  it("T3: a burst over a zero baseline still needs the floor of 10", () => {
    const burst = (n: number) =>
      Array.from({ length: n }, (_, i) => issue(i + 1, `[x] ${i}`, "2026-09-20T12:00:00Z"));
    expect(of(scan({ issues: burst(9) }, "2026-09-15", "2026-09-30"), "T3")).toEqual([]);
    expect(of(scan({ issues: burst(10) }, "2026-09-15", "2026-09-30"), "T3")[0]?.key).toBe(
      "x@2026-09-20",
    );
  });

  it("T4: a status label toggled 3× fires; the in-progress lease never does", () => {
    const ev = (label: string, event: string, h: number) => ({
      issue: 9,
      label,
      event,
      createdAt: `2026-09-10T1${h}:00:00Z`,
    });
    const events = [
      ...["labeled", "unlabeled", "labeled", "unlabeled"].map((e, h) => ev("in-progress", e, h)),
      ...["labeled", "unlabeled", "labeled"].map((e, h) => ev("needs-eric", e, h)),
    ];
    expect(of(scan({ events }, "2026-09-01", "2026-09-30"), "T4").map((h) => h.key)).toEqual([
      "#9:needs-eric",
    ]);
  });

  it("T5: a revert naming the plan issue resolves to the merged PR that cites it", () => {
    const pr = (n: number, title: string, at: string, mergedAt: string | null, refs: number[]) =>
      issue(n, title, at, { isPr: true, mergedAt, refs });
    const issues = [
      pr(
        3563,
        "feat(playbooks): add requireWarmup",
        "2026-09-22T10:00:00Z",
        "2026-09-22T10:56:20Z",
        [3543],
      ),
      pr(
        3567,
        "revert(playbooks): scrap the requireWarmup opt-in (#3543)",
        "2026-09-22T11:30:48Z",
        "2026-09-22T11:32:58Z",
        [],
      ),
      pr(10, "feat: old thing", "2026-08-01T00:00:00Z", "2026-08-01T01:00:00Z", []),
      pr(11, 'Revert "feat: old thing"', "2026-09-10T00:00:00Z", null, []),
    ];
    const t5 = of(scan({ issues }, "2026-09-01", "2026-09-30"), "T5");
    expect(t5.map((h) => h.key)).toEqual(["#3563"]);
  });

  it("T6: a same-surface plan that cites nothing fires, digest-only; citing the earlier one clears it", () => {
    const plan = (n: number, surface: string, at: string, cites = "") =>
      issue(n, `plan ${n}`, at, {
        labels: ["plan"],
        body: `| | |\n|---|---|\n| **Surface** | ${surface} |\n\n${cites}`,
      });
    const issues = [
      plan(2953, "`/accounts` (only)", "2026-09-11T00:00:00Z"),
      plan(3186, "`/app/accounts`", "2026-09-16T00:00:00Z"),
      plan(3190, "`/app/accounts`", "2026-09-17T00:00:00Z", "Supersedes #2953 and #3186."),
      plan(3200, "`/trade`, `src/trading`", "2026-09-18T00:00:00Z"),
    ];
    const t6 = of(scan({ issues }, "2026-09-01", "2026-09-30"), "T6");
    expect(t6.map((h) => [h.key, h.autoFile])).toEqual([["#3186", false]]);
  });
});

describe("thrash-scan — loud failure", () => {
  it("rejects a malformed --today instead of scanning an unknown window", () => {
    const r = spawnSync("node", ["scripts/thrash-scan.mjs", "--explain", "--today=Sept"], {
      input: "{}",
      encoding: "utf8",
    });
    expect(r.status).not.toBe(0);
  });
});
