import { describe, expect, it } from "@rstest/core";
import {
  batchSize,
  decide,
  main,
  pickCandidates,
  pullableCount,
  render,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/flip-due.mjs";
import {
  flipYield,
  readiedRows,
  recentlyRefused,
  refusalRows,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/flip-refusals.mjs";

// #7311 slice 3. The flip starts itself when the lanes run dry. These pin the plan's criterion: WHEN
// the lanes' pullable count is below the work dial's inFlightCap, list up to 6 top-ranked unready
// `feedback` issues not refused by a flip in the last 7 days (halved under conserve, nothing under
// halt); otherwise `due: false`. And a failed read is never a quiet `due: false`.

const NOW = Date.parse("2026-11-10T12:00:00Z");
const DAY = 86_400_000;

type Over = {
  labels?: string[];
  state?: string;
  blockedBy?: number;
  pr?: boolean;
  subs?: { total: number; completed: number };
};
const issue = (number: number, over: Over = {}) => ({
  number,
  title: `issue ${number}`,
  body: "",
  state: over.state ?? "open",
  labels: (over.labels ?? ["feedback"]).map((name) => ({ name })),
  issue_dependencies_summary: { blocked_by: over.blockedBy ?? 0, blocking: 0 },
  ...(over.subs ? { sub_issues_summary: over.subs } : {}),
  ...(over.pr ? { pull_request: {} } : {}),
});
const readyIssue = (n: number, extra: string[] = []) =>
  issue(n, { labels: ["feedback", "ready", ...extra] });

const gate = (position = "normal", cap = 3, dispatch = true) => ({
  dispatch,
  position,
  caps: { inFlightCap: cap },
  reason: dispatch ? `cleared: work-mode is ${position}` : `refused: work-mode is ${position}`,
});

describe("what the lanes can pull right now", () => {
  it("counts a ready issue and leaves out parked, in-progress, blocked, closed and pull requests", () => {
    const rows = [
      readyIssue(1),
      readyIssue(2, ["needs-eric"]),
      readyIssue(3, ["in-progress"]),
      { ...readyIssue(4), issue_dependencies_summary: { blocked_by: 1, blocking: 0 } },
      { ...readyIssue(5), state: "closed" },
      { ...readyIssue(6), pull_request: {} },
      readyIssue(7, ["next-slice"]),
    ];
    expect(pullableCount(rows)).toBe(2); // #1, and #7 (ready + next-slice is legal)
  });
});

describe("which unready feedback issues are worth judging", () => {
  it("lists only open, unready, unparked, unblocked feedback issues, top-ranked first", () => {
    const rows = [
      issue(10, { labels: ["feedback", "idea"] }), // P3
      issue(11), // P2
      issue(12, { labels: ["feedback", "bug"] }), // P1
      issue(13, { labels: ["feedback", "bug", "fast-track"] }), // P0
      readyIssue(14), // already ready
      issue(15, { labels: ["feedback", "needs-eric"] }),
      issue(16, { labels: ["feedback", "in-progress"] }),
      issue(17, { blockedBy: 2 }),
      issue(18, { labels: ["enhancement"] }), // not feedback
      issue(19, { pr: true }),
      issue(20, { state: "closed" }),
      issue(21, { subs: { total: 3, completed: 1 } }), // its work lives in sub-issues
    ];
    expect(pickCandidates(rows, { now: NOW }).ranked).toEqual([13, 12, 11, 10]);
  });

  it("leaves out an issue a flip refused in the last 7 days and says how many", () => {
    const rows = [issue(30), issue(31), issue(32)];
    const out = pickCandidates(rows, { refused: new Set([31]), now: NOW });
    expect(out).toEqual({ ranked: [30, 32], skippedRefused: 1 });
  });
});

describe("the refusal record", () => {
  it("records each refuted and not-clear issue once, and never a survivor", () => {
    const result = {
      survivors: [{ issue: 1 }],
      refuted: [{ issue: 2 }, { issue: 3 }],
      notClear: [{ issue: 3 }, { issue: 4 }, { issue: "x" }, {}],
    };
    expect(refusalRows(result, "2026-11-10T12:00:00Z")).toEqual([
      { at: "2026-11-10T12:00:00Z", issue: 2, kind: "refuted" },
      { at: "2026-11-10T12:00:00Z", issue: 3, kind: "refuted" },
      { at: "2026-11-10T12:00:00Z", issue: 4, kind: "notClear" },
    ]);
    expect(refusalRows({}, "2026-11-10T12:00:00Z")).toEqual([]);
  });

  it("reads back only the refusals inside the window, and skips a line that is not JSON", () => {
    const row = (issue: number, ageDays: number) =>
      JSON.stringify({ at: new Date(NOW - ageDays * DAY).toISOString(), issue, kind: "refuted" });
    const body = [row(1, 1), row(2, 6.9), row(3, 7.1), "not json", row(4, 30)].join("\n");
    expect([...recentlyRefused(body, NOW)].sort()).toEqual([1, 2]);
    expect(recentlyRefused("", NOW).size).toBe(0);
    expect(recentlyRefused(undefined, NOW).size).toBe(0);
  });
});

// #7311 slice 4. The flip's yield is the number the newsletter prints beside its falsifier: of the
// issues a flip judged in the week, how many it readied. A readied row shares the refusals file but
// never keeps an issue out of the next list.
describe("the flip's yield", () => {
  const WEEK_FROM = Date.parse("2026-11-09T00:00:00Z");
  const WEEK_TO = Date.parse("2026-11-16T00:00:00Z");
  const row = (at: string, issue: number, kind: string) => JSON.stringify({ at, issue, kind });

  it("records one readied row per distinct posted issue, and nothing for junk", () => {
    expect(readiedRows([5, 5, 6, 0, "x"], "2026-11-10T12:00:00Z")).toEqual([
      { at: "2026-11-10T12:00:00Z", issue: 5, kind: "readied" },
      { at: "2026-11-10T12:00:00Z", issue: 6, kind: "readied" },
    ]);
    expect(readiedRows([], "2026-11-10T12:00:00Z")).toEqual([]);
  });

  it("counts readied of judged inside the week, an issue readied after a refusal as readied", () => {
    const body = [
      row("2026-11-10T01:00:00Z", 1, "readied"),
      row("2026-11-10T01:00:00Z", 2, "refuted"),
      row("2026-11-10T01:00:00Z", 3, "notClear"),
      row("2026-11-10T01:00:00Z", 4, "refuted"),
      row("2026-11-12T01:00:00Z", 4, "readied"),
      row("2026-11-02T01:00:00Z", 9, "refuted"), // last week
      "not json",
    ].join("\n");
    expect(flipYield(body, WEEK_FROM, WEEK_TO)).toEqual({
      judged: 4,
      readied: 2,
      refused: 2,
      readiedShare: 0.5,
    });
  });

  it("reads unknown, never 0%, in a week no flip ran", () => {
    const none = { judged: null, readied: null, refused: null, readiedShare: null };
    expect(flipYield("", WEEK_FROM, WEEK_TO)).toEqual(none);
    expect(flipYield(undefined, WEEK_FROM, WEEK_TO)).toEqual(none);
    expect(flipYield(row("2026-11-02T01:00:00Z", 9, "readied"), WEEK_FROM, WEEK_TO)).toEqual(none);
  });

  it("does not let a readied row keep an issue out of the next flip list", () => {
    const at = new Date(NOW - DAY).toISOString();
    const body = [row(at, 1, "readied"), row(at, 2, "refuted")].join("\n");
    expect([...recentlyRefused(body, NOW)]).toEqual([2]);
  });
});

describe("whether a flip is due", () => {
  const candidates = (n: number, skippedRefused = 0) => ({
    ranked: Array.from({ length: n }, (_, i) => 100 + i),
    skippedRefused,
  });

  it("is due when fewer issues are pullable than the cap, listing up to 6", () => {
    const v = decide({
      gate: gate("normal", 3),
      ready: [readyIssue(1)],
      candidates: candidates(9, 2),
    });
    expect(v).toMatchObject({ due: true, pullable: 1, cap: 3, refusedRecently: 2, waiting: 3 });
    expect(v.issues).toEqual([100, 101, 102, 103, 104, 105]);
  });

  it("is not due once the pullable count reaches the cap", () => {
    const ready = [readyIssue(1), readyIssue(2), readyIssue(3)];
    const v = decide({ gate: gate("normal", 3), ready, candidates: candidates(5) });
    expect(v.due).toBe(false);
    expect(v.why).toContain("fed");
  });

  it("halves the batch under conserve, and lists nothing under halt", () => {
    const conserve = decide({ gate: gate("conserve", 1), ready: [], candidates: candidates(9) });
    expect(conserve.issues).toEqual([100, 101, 102]);
    const halt = decide({ gate: gate("halt", 0, false), ready: [], candidates: candidates(9) });
    expect(halt).toMatchObject({ due: false, why: "refused: work-mode is halt" });
    expect(batchSize(5, "conserve")).toBe(3);
    expect(batchSize(1, "conserve")).toBe(1);
  });

  it("is not due, and says why, when the lanes are starved but nothing is worth judging", () => {
    const v = decide({ gate: gate(), ready: [], candidates: candidates(0, 4) });
    expect(v.due).toBe(false);
    expect(v.why).toContain("no unready feedback issue");
  });

  it("prints the run line a Routine follows, and a one-line reason when not due", () => {
    const due = render(
      decide({ gate: gate(), ready: [], candidates: { ranked: [7, 8], skippedRefused: 1 } }),
    );
    expect(due).toContain("due: true");
    expect(due).toContain('{"issues":[7,8]}');
    expect(due).toContain("clear-path-post.mjs");
    expect(render(decide({ gate: gate("halt", 0, false), ready: [] }))).toBe(
      "due: false · refused: work-mode is halt",
    );
  });
});

describe("the CLI", () => {
  const seams = (over: Record<string, unknown> = {}) => {
    const reads = { ready: 0, feedback: 0, refusals: 0 };
    return {
      reads,
      io: {
        gate: () => gate("normal", 3),
        token: () => undefined,
        now: () => NOW,
        readReady: () => {
          reads.ready++;
          return [readyIssue(1)];
        },
        readFeedback: () => {
          reads.feedback++;
          return [issue(40), issue(41), issue(42)];
        },
        readRefusals: () => {
          reads.refusals++;
          return JSON.stringify({
            at: new Date(NOW - DAY).toISOString(),
            issue: 41,
            kind: "refuted",
          });
        },
        ...over,
      },
    };
  };

  it("lists the starved queue's candidates, minus the one refused yesterday", () => {
    const { io } = seams();
    const v = JSON.parse(main(["--json"], io));
    expect(v).toMatchObject({ due: true, pullable: 1, issues: [40, 42], refusedRecently: 1 });
  });

  it("costs one read when the lanes are fed: no feedback list, no refusals file", () => {
    const { io, reads } = seams({ readReady: () => [readyIssue(1), readyIssue(2), readyIssue(3)] });
    expect(main([], io)).toContain("due: false");
    expect(reads.feedback + reads.refusals).toBe(0);
  });

  it("reads nothing but the dial under halt", () => {
    const { io, reads } = seams({ gate: () => gate("halt", 0, false) });
    expect(main([], io)).toBe("due: false · refused: work-mode is halt");
    expect(reads).toEqual({ ready: 0, feedback: 0, refusals: 0 });
  });

  it("throws, rather than print due: false, when a read fails", () => {
    const boom = () => {
      throw new Error("HTTP 502");
    };
    expect(() => main([], seams({ readReady: boom }).io)).toThrow("502");
    expect(() => main([], seams({ readFeedback: boom }).io)).toThrow("502");
    expect(() => main([], seams({ readRefusals: boom }).io)).toThrow("502");
    expect(() => main([], seams({ gate: boom }).io)).toThrow("502");
  });

  it("refuses a --max over the workflow's cap of 6", () => {
    expect(() => main(["--max", "7"], seams().io)).toThrow("--max");
    expect(() => main(["--max", "0"], seams().io)).toThrow("--max");
    expect(JSON.parse(main(["--json", "--max", "1"], seams().io)).issues).toEqual([40]);
  });
});
