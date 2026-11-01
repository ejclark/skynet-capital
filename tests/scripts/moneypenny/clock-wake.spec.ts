import { describe, expect, it } from "@rstest/core";
import {
  clockWake,
  EVENTS_RUNS_PATH,
  hoursSinceNewestRun,
  QUIET_HOURS,
  readDue,
} from "../../../scripts/moneypenny/clock-wake.mjs";
import { peekNext } from "../../../scripts/moneypenny/index.mjs";
import { issue, mode, noContinuation } from "../../support/admission-fixtures.js";

// THE CLOCK WAKES THE LANES (2026-11-01, #6470's study). Lanes wake only on pushes, issue events
// and freed build slots; when all three stop, main can sit for days with work waiting (75.8h from
// 2026-10-27). On the 15-minute clock, when the events workflow has not run in QUIET_HOURS, the
// dial is not halt, and the sweep's peek or the due list names something admissible, this
// dispatches one scan. Every read is injected: no gh, no network.

const NOW = Date.parse("2026-11-01T12:00:00Z");
const ranAgo = (hours: number) => [{ created_at: new Date(NOW - hours * 3_600_000).toISOString() }];

type Deps = Parameters<typeof clockWake>[0];

/** One tick with counters on every read and the dispatch; an override is counted too. */
function tick(overrides: NonNullable<Deps> = {}) {
  const calls = { runs: 0, dial: 0, peek: 0, due: 0, dispatch: 0 };
  const warnings: string[] = [];
  const counted =
    <A extends unknown[], R>(name: keyof typeof calls, fn: (...args: A) => R) =>
    (...args: A): R => {
      calls[name] += 1;
      return fn(...args);
    };
  const result = clockWake({
    now: NOW,
    readRuns: counted("runs", overrides.readRuns ?? (() => ranAgo(3))),
    readDial: counted("dial", overrides.readDial ?? (() => mode("normal"))),
    peek: counted("peek", overrides.peek ?? (() => ({ number: 4616 }))),
    due: counted("due", overrides.due ?? (() => [])),
    dispatch: counted("dispatch", overrides.dispatch ?? (() => undefined)),
    log: (l: string) => {
      warnings.push(l);
    },
  });
  return { result, calls, warnings };
}

describe("hoursSinceNewestRun", () => {
  it("reads the newest run's age, and no run at all as null", () => {
    expect(hoursSinceNewestRun(ranAgo(2.5), NOW)).toBeCloseTo(2.5, 3);
    expect(hoursSinceNewestRun([], NOW)).toBeNull();
    expect(hoursSinceNewestRun(null, NOW)).toBeNull();
    expect(hoursSinceNewestRun([{ created_at: "nonsense" }], NOW)).toBeNull();
  });

  it("asks for one run of the events workflow, any event, any status", () => {
    expect(EVENTS_RUNS_PATH).toBe("actions/workflows/moneypenny-events.yml/runs?per_page=1");
  });
});

describe("the common case costs one read and dispatches nothing", () => {
  it("stops at the run list when the events workflow ran inside the window", () => {
    const { result, calls } = tick({ readRuns: () => ranAgo(0.25) });
    expect(result.dispatched).toBe(false);
    expect(result.line).toContain("ran 0.3h ago");
    expect(calls).toEqual({ runs: 1, dial: 0, peek: 0, due: 0, dispatch: 0 });
  });

  it(`a dispatch this clock made 15 minutes ago is a run too, so at most one per ${QUIET_HOURS}h`, () => {
    const { result } = tick({ readRuns: () => ranAgo(QUIET_HOURS - 0.01) });
    expect(result.dispatched).toBe(false);
  });
});

describe("a quiet repo", () => {
  it("dispatches the scan when the peek names an admissible issue", () => {
    const { result, calls } = tick();
    expect(result.dispatched).toBe(true);
    expect(result.admissible).toBe(true);
    expect(result.line).toContain("quiet=3h admissible=yes (#4616) dial=normal dispatched=yes");
    expect(calls.dispatch).toBe(1);
    expect(calls.due).toBe(0);
  });

  it("dispatches when the peek names nothing but research is due", () => {
    const { result, calls } = tick({ peek: () => null, due: () => [{ id: "nvda-print" }] });
    expect(result.dispatched).toBe(true);
    expect(result.line).toContain("1 due event(s)");
    expect(calls.dispatch).toBe(1);
  });

  it("dispatches nothing when nothing is admissible, and says so with the numbers", () => {
    const { result, calls } = tick({ peek: () => null });
    expect(result.dispatched).toBe(false);
    expect(result.admissible).toBe(false);
    expect(result.line).toBe("clock-wake: quiet=3h admissible=no dial=normal; no dispatch");
    expect(calls.dispatch).toBe(0);
  });

  it("never dispatches under halt, and never asks the queue there", () => {
    const { result, calls } = tick({ readDial: () => mode("halt") });
    expect(result.dispatched).toBe(false);
    expect(result.line).toContain("dial=halt");
    expect(calls).toMatchObject({ dial: 1, peek: 0, due: 0, dispatch: 0 });
  });

  it("treats no run on record as quiet", () => {
    const { result } = tick({ readRuns: () => [] });
    expect(result.dispatched).toBe(true);
    expect(result.line).toContain("quiet=no run on record");
  });
});

describe("a read that fails costs one tick, never a dispatch and never a throw", () => {
  it("on the run list", () => {
    const { result, calls, warnings } = tick({
      readRuns: () => {
        throw new Error("HTTP 502");
      },
    });
    expect(result.dispatched).toBe(false);
    expect(calls.dispatch).toBe(0);
    expect(warnings[0]).toMatch(
      /^::warning::clock-wake: the run list could not be read \(HTTP 502\)/,
    );
  });

  it("on the queue", () => {
    const { result, calls, warnings } = tick({
      peek: () => {
        throw new Error("rate limited");
      },
    });
    expect(result.dispatched).toBe(false);
    expect(calls.dispatch).toBe(0);
    expect(warnings[0]).toContain("the queue could not be read");
  });

  it("a run list that is not a list is unknown, not quiet", () => {
    const { result, calls } = tick({ readRuns: () => null });
    expect(result.dispatched).toBe(false);
    expect(calls.dispatch).toBe(0);
  });

  it("a dispatch that fails throws — a wake that silently did not happen is the failure", () => {
    expect(() =>
      tick({
        dispatch: () => {
          throw new Error("dispatch refused");
        },
      }),
    ).toThrow(/dispatch refused/);
  });
});

// THE RETRY LIMIT IS WHAT MAKES THIS SAFE (#6526). The peek is the sweep's own dry run, holds
// included: an issue with three `in-progress` starts today and nothing merged is not a pick, so a
// build that fails every time is not re-dispatched by the clock all night. Driven through the real
// peekNext with the hold's reads injected.
describe("a failed build is not re-dispatched: the peek carries the per-issue retry limit", () => {
  const startsToday = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      event: "labeled",
      label: { name: "in-progress" },
      created_at: new Date(NOW - (i + 1) * 600_000).toISOString(),
    }));
  const peekWith = (events: unknown[]) => () =>
    peekNext({
      readMode: () => mode("normal"),
      readReady: () => [issue(4621, "the surface", ["ready", "feedback"])],
      readInFlight: () => [],
      readPrIssues: () => new Map(),
      readPlans: () => [],
      continuation: noContinuation,
      holdReads: { now: NOW, readAll: () => events, read: () => [], log: () => undefined },
    });

  it("holds an issue started three times today with nothing merged: no pick, no dispatch", () => {
    const { result, calls } = tick({ peek: peekWith(startsToday(3)) });
    expect(result.dispatched).toBe(false);
    expect(calls.dispatch).toBe(0);
  });

  it("still picks the same issue after two starts — the third try is the sweep's own pace", () => {
    const { result } = tick({ peek: peekWith(startsToday(2)) });
    expect(result.dispatched).toBe(true);
    expect(result.line).toContain("#4621");
  });
});

describe("readDue — the route job's own filter, at the dial's research cap", () => {
  it("drops events whose research PR is open and caps at the dial's number", () => {
    const run = () =>
      JSON.stringify([
        { id: "a", impact: "high", date: "2026-11-05", status: "confirmed" },
        { id: "b", impact: "high", date: "2026-11-05", status: "confirmed" },
        { id: "c", impact: "high", date: "2026-11-05", status: "confirmed" },
      ]);
    const rest = () => [{ head: { ref: "research/a" } }, { head: { ref: "feedback/1" } }];
    const out = readDue({ caps: { researchPerTick: 1 } }, { run, rest });
    expect(out).toHaveLength(1);
    expect(out.map((e) => (e as { id: string }).id)).not.toContain("a");
  });

  it("reads no PRs at all when nothing is due", () => {
    let prReads = 0;
    const out = readDue(mode("normal"), {
      run: () => "[]",
      rest: () => {
        prReads += 1;
        return [];
      },
    });
    expect(out).toEqual([]);
    expect(prReads).toBe(0);
  });
});
