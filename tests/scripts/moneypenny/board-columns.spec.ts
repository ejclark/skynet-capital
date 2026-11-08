import { describe, expect, it } from "@rstest/core";
import fc from "fast-check";
import {
  admitBuild,
  pullQueue,
  readInFlight,
  readOpenIssues,
  readOpenPlans,
  waitingPlans,
} from "../../../scripts/moneypenny/admission.mjs";
import { withoutOpenPr } from "../../../scripts/moneypenny/index.mjs";
import { openPrsByIssue, platterClosesByIssue } from "../../../scripts/moneypenny/pr-issues.mjs";
import {
  BUILDING,
  dialSentences,
  NEXT_QUEUED,
  STATUS_OPTIONS,
} from "../../../scripts/moneypenny/projects.mjs";
import {
  type RestIssue,
  sweepContext,
  wantedStatusOf,
} from "../../../scripts/moneypenny/projects-reconcile.mjs";
import {
  localParentOf,
  openPrMaps,
  readOpenSubIssuesOf,
  wantedColumn,
} from "../../../scripts/moneypenny/projects-sync.mjs";
import { loadWorkModeConfig } from "../../../scripts/moneypenny/work-mode.mjs";

// #6871 slice 2 — THE BOARD SHOWS EXACTLY WHAT THE BUILD LANES PULL (the 2026-11-05 design, call 2:
// "each column agrees with the code at the last sync"). The columns are computed from labels by
// `statusForIssue`; the lanes pull through `readInFlight`, `waitingPlans` and the sweep's pool. A
// spec that compared the board with itself would be true by definition, so this one builds a random
// label snapshot, feeds it to the LANES' OWN READS through fake REST answers, and checks the board's
// columns against what those reads return:
//   - Building now      = `readInFlight()` — the in-flight cap's count
//   - Next part queued  = `waitingPlans(readOpenPlans())` — the started-plan cap's count
//   - Ready + the pullable cards of Next part queued = the unattended sweep's pool, after
//     `withoutOpenPr` and the platter screen (`boardedOn`). Holds (`sweepHold`) are asked at the
//     pick, after this pool, so a held card stays in its column and the pick steps past it.
// A reordering of `statusForIssue` that moved a seat, or a Ready that admitted a card the sweep
// refuses, turns this red on a generated case and prints it.

const LABEL_POOL = [
  "ready",
  "plan",
  "next-slice",
  "in-progress",
  "needs-eric",
  "needs-info",
  "needs-design",
  "needs-session",
  "hold-merge",
  "fast-track",
  "bug",
  "idea",
  "feedback",
];
const CALLOUT = "> [!IMPORTANT]\n> **Needs from you**\n> 1. Pick A or B?";
const REPO = "https://api.github.com/repos/ejclark/skynet-capital/issues/";

const issueArb = fc.record({
  labels: fc.subarray(LABEL_POOL),
  blocked: fc.boolean(),
  callout: fc.boolean(),
  parentPick: fc.option(fc.nat(30), { nil: undefined }),
  closedChildren: fc.nat(2),
  pr: fc.constantFrom("none", "none", "none", "open", "platter"),
});

type Spec = typeof issueArb extends fc.Arbitrary<infer T> ? T : never;
type Pr = { number: number; title: string; body: string; head: { ref: string } };

/** A snapshot's REST rows, sub-issue summaries consistent with the parent links, and its open PRs. */
function snapshot(specs: Spec[]) {
  const rows: (RestIssue & { parent_issue_url?: string })[] = [];
  const plansSoFar: number[] = [];
  specs.forEach((s, k) => {
    const number = 100 + k;
    const parent =
      s.parentPick !== undefined && plansSoFar.length
        ? plansSoFar[s.parentPick % plansSoFar.length]
        : undefined;
    rows.push({
      number,
      state: "open",
      labels: s.labels.map((name) => ({ name })),
      body: s.callout ? CALLOUT : "",
      user: { login: "someone" },
      issue_dependencies_summary: { blocked_by: s.blocked ? 1 : 0 },
      ...(parent ? { parent_issue_url: `${REPO}${parent}` } : {}),
    });
    if (s.labels.includes("plan")) plansSoFar.push(number);
  });
  for (const [k, row] of rows.entries()) {
    const open = rows.filter((r) => r.parent_issue_url === `${REPO}${row.number}`).length;
    const closed = specs[k]?.closedChildren ?? 0;
    row.sub_issues_summary = { total: open + closed, completed: closed };
  }
  const prs: Pr[] = [];
  specs.forEach((s, k) => {
    const n = 100 + k;
    if (s.pr === "open")
      prs.push({ number: 9000 + k, title: `fix: x (#${n})`, body: "", head: { ref: "feat/x" } });
    if (s.pr === "platter")
      prs.push({
        number: 9000 + k,
        title: "platter",
        body: `Closes #${n}`,
        head: { ref: "platter/a" },
      });
  });
  return { rows, prs };
}

/** The lanes' REST reads, answered from the snapshot: `gh api` for the label lists, `ghRestAll`
 *  for the plan list and each plan's sub-issues. */
function lanesReads(rows: RestIssue[]) {
  const labelled = (label: string) =>
    rows.filter((r) => (r.labels ?? []).some((l) => typeof l !== "string" && l.name === label));
  const exec = (_cmd: string, argv: readonly string[]) => {
    const label = /labels=([^&]+)/.exec(String(argv[1]))?.[1] ?? "";
    return JSON.stringify(labelled(label).sort((a, b) => a.number - b.number));
  };
  const readAll = (path: string) => {
    if (path === "issues?state=open&labels=plan") return labelled("plan");
    const parent = /^issues\/(\d+)\/sub_issues$/.exec(path)?.[1];
    if (parent) return rows.filter((r) => r.parent_issue_url === `${REPO}${parent}`);
    throw new Error(`unexpected read ${path}`);
  };
  return { exec, readAll };
}

const quiet = <T>(fn: () => T): T => {
  const log = console.log;
  console.log = () => undefined;
  try {
    return fn();
  } finally {
    console.log = log;
  }
};

describe("board columns agree with what the build lanes pull (#6871 call 2)", () => {
  it("for any label snapshot: Building now, Next part queued and Ready match the lanes' reads", () => {
    fc.assert(
      fc.property(fc.array(issueArb, { minLength: 1, maxLength: 25 }), (specs) => {
        const { rows, prs } = snapshot(specs);
        const { exec, readAll } = lanesReads(rows);
        const context = sweepContext(rows, { readAll, readPulls: () => prs, log: () => undefined });
        const column = new Map(
          rows.map((r) => [r.number, wantedStatusOf(r, STATUS_OPTIONS, context)]),
        );
        const inColumn = (name: string) =>
          [...column]
            .filter(([, c]) => c === name)
            .map(([n]) => n)
            .sort((a, b) => a - b);

        // Building now = the in-flight cap's list.
        expect(inColumn(BUILDING).length).toBe(readInFlight(exec).length);

        // Next part queued = the started-plan cap's list.
        const waiting = waitingPlans(readOpenPlans(readAll)).map((p) => Number(p.number));
        expect(inColumn(NEXT_QUEUED)).toEqual(waiting.sort((a, b) => a - b));

        // Ready + the pullable queued plans = the unattended sweep's pool.
        const pool = quiet(() =>
          pullQueue(withoutOpenPr(readOpenIssues("ready", exec), openPrsByIssue(prs)), {
            boardedOn: platterClosesByIssue(prs),
          }),
        ).map((i) => i.number);
        const ready = inColumn("Ready");
        for (const n of ready) expect(pool).toContain(n);
        const queuedPullable = inColumn(NEXT_QUEUED).filter((n) => pool.includes(n));
        expect([...ready, ...queuedPullable].sort((a, b) => a - b)).toEqual(
          [...pool].sort((a, b) => a - b),
        );

        // The one-issue sync (its own reads) lands every card where the sweep does.
        const prMaps = openPrMaps({ read: () => prs });
        for (const r of rows) {
          const own = wantedColumn(r, {
            openSubIssuesOf: (i) => readOpenSubIssuesOf(i, readAll),
            prMaps,
          });
          expect([r.number, own]).toEqual([r.number, column.get(r.number)]);
        }
      }),
      { numRuns: 300 },
    );
  });

  it("a child whose parent lives in another repo is never grouped under a local namesake", () => {
    const local: RestIssue = {
      number: 12,
      state: "open",
      labels: [{ name: "plan" }],
      sub_issues_summary: { total: 2, completed: 1 },
    };
    const own = { number: 13, state: "open", labels: [], parent_issue_url: `${REPO}12` };
    const foreign = {
      number: 14,
      state: "open",
      labels: [{ name: "ready" }],
      parent_issue_url: "https://api.github.com/repos/ejclark/other/issues/12",
    };
    const context = sweepContext([local, own, foreign], { readAll: () => [], readPulls: () => [] });
    expect(context.openSubIssuesOf?.(local)?.map((s) => s.number)).toEqual([13]);
    expect(wantedStatusOf(local, STATUS_OPTIONS, context)).toBe("Next part needs approval");
    expect(localParentOf(foreign)).toBeNull();
    expect(localParentOf(own)).toBe(12);
  });

  it("a plan whose sub-issue lives in another repo is read directly, so the column keeps agreeing", () => {
    const plan: RestIssue = {
      number: 1,
      state: "open",
      labels: [{ name: "plan" }],
      sub_issues_summary: { total: 2, completed: 1 },
    };
    const reads: string[] = [];
    const readAll = (path: string) => {
      reads.push(path);
      return [{ number: 77, state: "open", labels: [{ name: "ready" }] }];
    };
    const context = sweepContext([plan], { readAll, readPulls: () => [] });
    expect(wantedStatusOf(plan, STATUS_OPTIONS, context)).toBe(NEXT_QUEUED);
    expect(reads).toEqual(["issues/1/sub_issues"]);
  });
});

// The dial sentences (#6871 §3) — each pinned to `admitBuild`, so the number a column prints is the
// number the gate enforces at every dial position in work-mode.json. A sentence that drifts from the
// gate, or a cap edited in work-mode.json, turns this red.
describe("the dial sentences say what admitBuild does", () => {
  const config = loadWorkModeConfig();
  const issue = (n: number, labels: string[] = []) => ({ number: n, labels, body: "" });
  const busy = (k: number) => Array.from({ length: k }, (_, i) => issue(500 + i));
  const fresh = (labels: string[] = []) => issue(1, ["plan", "ready", ...labels]);
  const waitingOf = (k: number) => Array.from({ length: k }, (_, i) => issue(600 + i, ["plan"]));
  const numberIn = (text: string, pattern: RegExp) => Number(pattern.exec(text)?.[1]);

  for (const [position, caps] of Object.entries(config.positions)) {
    it(`${position}: Building now and Next part queued match the gate`, () => {
      const mode = { position, caps };
      const sentences = dialSentences(mode);
      if (!sentences) throw new Error("a readable dial always has sentences");
      const building = sentences[BUILDING];
      const queued = sentences[NEXT_QUEUED];
      const admits = (i: object, inFlight: object[], waiting?: object[]) =>
        admitBuild({
          issue: i as never,
          inFlight: inFlight as never,
          mode: mode as never,
          waiting: waiting as never,
        }).admit;

      if (position === "halt") {
        expect(building).toBe("Stopped: nothing new starts");
        expect(admits(issue(1), [])).toBe(false);
        expect(admits(issue(1, ["fast-track"]), [])).toBe(false);
        expect(queued).toMatch(/Nothing starts while stopped/);
        return;
      }
      // "one fast-track card … over": past the cap, a fast-track card is admitted only while no
      // other fast-track card is in flight (#6871 call 6).
      const urgentBusy = (k: number) => [...busy(k - 1), issue(499, ["fast-track"])];
      if (position === "conserve") {
        expect(building).toMatch(/^Only fast-track cards start: up to \d+, plus one over$/);
        const n = numberIn(building, /up to (\d+),/);
        expect(n).toBe(caps.inFlightCap);
        expect(admits(issue(1), [])).toBe(false);
        expect(admits(issue(1, ["fast-track"]), busy(n))).toBe(true);
        expect(admits(issue(1, ["fast-track"]), urgentBusy(n))).toBe(false);
      } else {
        const n = numberIn(building, /up to (\d+);/);
        expect(n).toBe(caps.inFlightCap);
        expect(building).toMatch(/; one fast-track card and hand-started sessions may add more$/);
        expect(admits(issue(1), busy(n - 1))).toBe(true);
        expect(admits(issue(1), busy(n))).toBe(false);
        expect(admits(issue(1, ["fast-track"]), busy(n))).toBe(true);
        expect(admits(issue(1, ["fast-track"]), urgentBusy(n))).toBe(false);
      }

      const m = numberIn(queued, /At (\d+) here/);
      expect(m).toBe(caps.startedPlanCap);
      expect(admits(fresh(), [], waitingOf(m))).toBe(false);
      expect(admits(fresh(["fast-track"]), [], waitingOf(m))).toBe(true);
      if (position !== "conserve") expect(admits(fresh(), [], waitingOf(m - 1))).toBe(true);
    });
  }

  it("an unreadable dial prints no sentence — a fallback is not a reading", () => {
    expect(
      dialSentences({ position: "conserve", unreadable: true, caps: { inFlightCap: 1 } }),
    ).toBe(null);
    expect(dialSentences(null)).toBe(null);
  });
});
