import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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

// Slice 2 (#3939 criteria 3–4): `--digest` — digest lines, the snapshot marker the next digest
// diffs against, and the two-scan auto-file. `--explain` never files; it returns the drafts.
describe("thrash-scan --digest — digest lines and the two-scan auto-file (#3939 slice 2)", () => {
  type Draft = {
    title: string;
    body: string;
    labels: string[];
    unit: { signal: string; key: string };
  };
  type Digest = {
    needsYou: string[];
    noise: string[];
    marker: string;
    baseline: boolean;
    repeats: number;
    drafts: Draft[];
    filed: unknown[];
  };
  const dir = mkdtempSync(join(tmpdir(), "thrash-digest-"));
  const digestRun = (state: unknown, prev: string, today = "2026-09-30"): Digest =>
    JSON.parse(
      execFileSync(
        "node",
        [
          "scripts/thrash-scan.mjs",
          "--explain",
          "--digest",
          "--json",
          "--file", // ignored under --explain: a spec must never POST
          "--since=2026-09-01",
          `--today=${today}`,
          `--prev=${prev}`,
        ],
        { input: JSON.stringify(state), encoding: "utf8" },
      ),
    );
  const prevDigest = (marker: string, date = "2026-09-29") => {
    const path = join(dir, `${date}.md`);
    writeFileSync(path, `# Digest — ${date}\n\n${marker}\n`);
    return path;
  };

  const storm = [1, 2, 3, 4, 5, 6].map((n) =>
    failedAgain(3720, 900 + n, `2026-09-2${n}T00:00:00Z`),
  );
  const dupes = [
    issue(1, "[event-research] opex-2027-01-15", "2026-09-20T00:00:00Z"),
    issue(2, "[event-research] opex-2027-01-15", "2026-09-21T00:00:00Z"),
    issue(3, "[event-research] fomc-2027-03-17", "2026-09-20T00:00:00Z"),
    issue(4, "[event-research] fomc-2027-03-17", "2026-09-22T00:00:00Z"),
  ];
  const plan = (n: number, at: string) =>
    issue(n, `plan ${n}`, at, {
      labels: ["plan"],
      body: "| | |\n|---|---|\n| **Surface** | `/accounts` |",
    });
  const state = {
    comments: storm,
    issues: [...dupes, plan(10, "2026-09-10T00:00:00Z"), plan(11, "2026-09-12T00:00:00Z")],
  };

  it("first scan sets a baseline: lines and a marker, nothing drafted", () => {
    const d = digestRun(state, "none");
    expect(d.baseline).toBe(true);
    expect(d.drafts).toEqual([]);
    expect(d.marker).toMatch(/^<!-- thrash-snapshot: [0-9a-f,]+ -->$/);
    expect(d.noise.join("\n")).toContain("T1 2026-09-26 #3720");
  });

  it("second scan drafts one issue per repeat — T2 folded per lane, T6 never", () => {
    const d = digestRun(state, prevDigest(digestRun(state, "none").marker));
    expect(d.repeats).toBe(2);
    expect(d.drafts.map((x) => [x.unit.signal, x.unit.key])).toEqual([
      ["T1", "#3720"],
      ["T2", "lane:event-research"],
    ]);
  });

  it("each draft is issue-lint clean as a `bottleneck`, with the hit's count as its Before", () => {
    const d = digestRun(state, prevDigest(digestRun(state, "none").marker));
    for (const x of d.drafts) {
      const lint = spawnSync(
        "node",
        [
          "scripts/issue-lint.mjs",
          "--stdin",
          "--json",
          "--title",
          x.title,
          "--labels",
          "bottleneck",
        ],
        {
          input: x.body,
          encoding: "utf8",
        },
      );
      expect(JSON.parse(lint.stdout).problems).toEqual([]);
    }
    expect(d.drafts[0]?.body).toMatch(/^- \*\*Before:\*\* 6 near-identical comments — 2026-09-30/m);
  });

  it("an open bottleneck carrying the key blocks the filing; one closed before the last hit does not", () => {
    const first = digestRun(state, "none");
    const prev = prevDigest(first.marker);
    const [t1] = digestRun(state, prev).drafts;
    const key = /<!-- thrash-key: [0-9a-f]+ -->/.exec(t1?.body ?? "")?.[0];
    const withOpen = { ...state, bottlenecks: [{ number: 99, state: "open", body: `x\n${key}` }] };
    expect(digestRun(withOpen, prev).drafts.map((x) => x.unit.signal)).toEqual(["T2"]);
    const closedAfter = {
      ...state,
      bottlenecks: [{ number: 99, state: "closed", closed_at: "2026-09-27T00:00:00Z", body: key }],
    };
    expect(digestRun(closedAfter, prev).drafts.map((x) => x.unit.signal)).toEqual(["T2"]);
    const closedBefore = {
      ...state,
      bottlenecks: [{ number: 99, state: "closed", closed_at: "2026-09-25T00:00:00Z", body: key }],
    };
    expect(digestRun(closedBefore, prev).drafts.map((x) => x.unit.signal)).toEqual(["T1", "T2"]);
  });

  it("caps a run at 3 filings and says what it deferred", () => {
    const many = {
      comments: [3720, 3721, 3722, 3723, 3724].flatMap((i) =>
        [1, 2, 3, 4, 5].map((n) => failedAgain(i, i * 10 + n, `2026-09-2${n}T00:00:00Z`)),
      ),
    };
    const d = digestRun(many, prevDigest(digestRun(many, "none").marker));
    expect(d.drafts).toHaveLength(3);
    expect(d.noise.join("\n")).toContain("2 over the 3-per-run cap");
  });

  it("a T3 burst goes to Needs you; hits older than the last digest are counted, not relisted", () => {
    const burst = {
      issues: Array.from({ length: 12 }, (_, n) =>
        issue(100 + n, `[event-research] e-${n}`, "2026-09-29T01:00:00Z"),
      ),
      comments: [1, 2, 3, 4, 5].map((n) => failedAgain(3720, n, `2026-09-0${n}T00:00:00Z`)),
    };
    const d = digestRun(burst, prevDigest("<!-- thrash-snapshot:  -->", "2026-09-28"));
    expect(d.needsYou.join("\n")).toContain("event-research burst on 2026-09-29");
    expect(d.noise[0]).toContain("2 hit(s), 1 new since 2026-09-28");
    expect(d.noise.join("\n")).not.toContain("#3720");
  });
});
