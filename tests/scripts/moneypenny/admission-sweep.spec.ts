import {
  type ClaimCtx,
  claimNext,
  peekNext,
  SWEEP_HELD_SKIPS,
  withoutOpenPr,
} from "../../../scripts/moneypenny/index.mjs";
import {
  issue,
  mode,
  noContinuation,
  noHold,
  noOpenPlans,
  noOpenPrs,
} from "../../support/admission-fixtures.js";

// The retry sweep's specs (claimNext / peekNext). Every `deps` injects the "reads nothing live"
// defaults from tests/support/admission-fixtures.ts — see the comments there for why.

describe("claimNext — the retry sweep hands the pick to its own lane's claim", () => {
  const setup = (ready: ReturnType<typeof issue>[], inFlight: ReturnType<typeof issue>[] = []) => {
    const called: Array<{ lane: string; ctx: unknown }> = [];
    const fake = (lane: string) => (ctx: ClaimCtx) => {
      called.push({ lane, ctx });
      return { claimed: true, reason: "claimed", number: ctx.payload?.issue?.number };
    };
    const deps = {
      readMode: () => ({ ...mode("normal"), until: null, reason: "set to normal" }),
      readReady: () => ready,
      readInFlight: () => inFlight,
      claims: { plan: fake("plan"), feedback: fake("feedback") },
      continuation: noContinuation,
      readPrIssues: noOpenPrs,
      readPlans: noOpenPlans,
      readHold: noHold,
    };
    return { deps, called };
  };
  const at = (i: ReturnType<typeof issue>, createdAt: string) => ({ ...i, createdAt });

  it("claims the oldest admissible ready issue through its lane, as a labeled:ready event", () => {
    const { deps, called } = setup([
      at(issue(8, "a", ["ready", "feedback"]), "2026-09-29T00:00:00Z"),
      at(issue(6, "b", ["ready", "plan"]), "2026-09-28T00:00:00Z"),
    ]);
    const r = claimNext(0, "abc", deps);
    expect(r).toMatchObject({ claimed: true, lane: "plan", number: 6 });
    expect(called).toHaveLength(1);
    expect(called[0]?.ctx).toMatchObject({
      payload: { action: "labeled", label: { name: "ready" } },
    });
  });

  it("routes a feedback issue to the feedback lane", () => {
    const { deps, called } = setup([issue(8, "a", ["ready", "feedback"])]);
    expect(claimNext(0, "abc", deps).lane).toBe("feedback");
    expect(called[0]?.lane).toBe("feedback");
  });

  // #5332: #5164/#5165/#5175/#5266 sat ready 2–3 days because no lane read `bug`.
  it("claims a ready bug with no feedback label through the feedback lane", () => {
    const { deps, called } = setup([issue(5164, "a", ["ready", "bug", "fast-track"])]);
    const r = claimNext(0, "abc", deps);
    expect(r).toMatchObject({ claimed: true, lane: "feedback", number: 5164 });
    expect(called[0]?.lane).toBe("feedback");
  });

  it("hands a bug that is also a plan to the plan lane", () => {
    const { deps, called } = setup([issue(9, "a", ["ready", "bug", "plan"])]);
    expect(claimNext(0, "abc", deps).lane).toBe("plan");
    expect(called[0]?.lane).toBe("plan");
  });

  // #4953/#4201: readied through the clear-path door as `ready` + `enhancement`, admitted by
  // `--check`, and claimed by nobody until `feedback` was hand-added. Ready means a lane builds it.
  it("claims a ready enhancement with no feedback label through the feedback lane", () => {
    const { deps, called } = setup([issue(4953, "a", ["ready", "enhancement"])]);
    const r = claimNext(0, "abc", deps);
    expect(r).toMatchObject({ claimed: true, lane: "feedback", number: 4953 });
    expect(called[0]?.lane).toBe("feedback");
  });

  it("a failed plan read costs the tick no feedback pick — the cap only governs fresh plans", () => {
    const { deps, called } = setup([issue(8, "a", ["ready", "feedback"])]);
    const r = claimNext(0, "abc", {
      ...deps,
      readPlans: () => {
        throw new Error("HTTP 502");
      },
    });
    expect(r).toMatchObject({ claimed: true, lane: "feedback", number: 8 });
    expect(called).toHaveLength(1);
  });

  it("claims nothing when the cap is full", () => {
    const { deps, called } = setup(
      [issue(8, "z", ["ready", "plan"])],
      [issue(1, "a"), issue(2, "b"), issue(3, "c")],
    );
    const r = claimNext(0, "abc", deps);
    expect(r.claimed).toBe(false);
    expect(r.reason).toContain("1 ready, 3 in flight, 0 plans waiting, work-mode=normal");
    expect(called).toEqual([]);
  });
});

// 2026-10-01: #3960's lease outlived its successful build, and every tick for ~2h stopped at
// "held by a live claim" without trying the next ready issue. The sweep now steps past a held pick.
describe("claimNext — a lease-held pick does not block the rest of the queue", () => {
  const sweep = (held: number[], ready: ReturnType<typeof issue>[]) => {
    const tried: number[] = [];
    const claim = (ctx: ClaimCtx) => {
      const n = ctx.payload?.issue?.number ?? -1;
      tried.push(n);
      return held.includes(n)
        ? { claimed: false, reason: "held by a live claim (112m old)" }
        : { claimed: true, reason: "claimed", number: n };
    };
    const deps = {
      readMode: () => ({ ...mode("normal"), until: null, reason: "set to normal" }),
      readReady: () => ready,
      readInFlight: () => [],
      claims: { plan: claim, feedback: claim },
      continuation: noContinuation,
      readPrIssues: noOpenPrs,
      readPlans: noOpenPlans,
      readHold: noHold,
    };
    return { r: claimNext(0, "abc", deps), tried };
  };
  const at = (n: number, day: number) => ({
    ...issue(n, `t${n}`, ["ready", "plan"]),
    createdAt: `2026-09-${String(day).padStart(2, "0")}T00:00:00Z`,
  });

  it("claims the next admissible issue when the top pick is held", () => {
    const { r, tried } = sweep([1], [at(1, 1), at(2, 2)]);
    expect(r).toMatchObject({ claimed: true, number: 2, lane: "plan" });
    expect(tried).toEqual([1, 2]);
  });

  it("stops at a refusal that is not a lease, rather than walking the queue", () => {
    const tried: number[] = [];
    const deps = {
      readMode: () => ({ ...mode("normal"), until: null, reason: "set to normal" }),
      readReady: () => [at(1, 1), at(2, 2)],
      readInFlight: () => [],
      claims: {
        plan: (ctx: ClaimCtx) => {
          tried.push(ctx.payload?.issue?.number ?? -1);
          return { claimed: false, reason: "parked" };
        },
        feedback: () => ({ claimed: false, reason: "unused" }),
      },
      continuation: noContinuation,
      readPrIssues: noOpenPrs,
      readPlans: noOpenPlans,
      readHold: noHold,
    };
    expect(claimNext(0, "abc", deps)).toMatchObject({ claimed: false, reason: "parked" });
    expect(tried).toEqual([1]);
  });

  it("gives up for the tick after a bounded number of held picks", () => {
    const all = Array.from({ length: SWEEP_HELD_SKIPS + 2 }, (_, k) => at(k + 1, k + 1));
    const { r, tried } = sweep(
      all.map((i) => i.number),
      all,
    );
    expect(r.claimed).toBe(false);
    expect(r.reason).toContain("held by live claims");
    expect(tried).toHaveLength(SWEEP_HELD_SKIPS);
  });

  it("reports nothing admissible once every candidate was held", () => {
    const { r, tried } = sweep([1], [at(1, 1)]);
    expect(r).toMatchObject({ claimed: false });
    expect(r.reason).toContain("nothing admissible (0 ready");
    expect(tried).toEqual([1]);
  });
});

describe("peekNext — the push pass asks, and claims nothing", () => {
  const deps = (ready: ReturnType<typeof issue>[]) => ({
    readMode: () => ({ ...mode("normal"), until: null, reason: "set to normal" }),
    readReady: () => ready,
    readInFlight: () => [],
    continuation: noContinuation,
    readPrIssues: noOpenPrs,
    readPlans: noOpenPlans,
    readHold: noHold,
  });

  it("returns the pick claimNext would take, without taking a lease", () => {
    const pick = peekNext(deps([issue(8, "a", ["ready", "plan"])]));
    expect(pick?.number).toBe(8);
  });

  it("sees a ready bug with no feedback label as something to claim (#5332)", () => {
    expect(peekNext(deps([issue(5165, "a", ["ready", "bug", "fast-track"])]))?.number).toBe(5165);
  });

  it("sees a ready enhancement with no feedback label as something to claim (#4953)", () => {
    expect(peekNext(deps([issue(4201, "a", ["ready", "enhancement"])]))?.number).toBe(4201);
  });

  it("returns null when nothing is admissible", () => {
    expect(peekNext(deps([issue(8, "a", ["enhancement"])]))).toBeNull();
    expect(peekNext(deps([]))).toBeNull();
  });
});

// 2026-10-05: #3959's lane stripped `in-progress` at the end of a session while its slice PR #4605
// sat open and held, and the sweep dispatched the plan twice that day into "nothing to build". An
// open PR naming the issue is the in-flight evidence, so it counts even after the label is gone.
describe("the sweep skips an issue an open PR already names", () => {
  const deps = (ready: ReturnType<typeof issue>[], named: [number, number][]) => {
    const tried: number[] = [];
    const claim = (ctx: ClaimCtx) => {
      const n = ctx.payload?.issue?.number ?? -1;
      tried.push(n);
      return { claimed: true, reason: "claimed", number: n };
    };
    return {
      tried,
      deps: {
        readMode: () => ({ ...mode("normal"), until: null, reason: "set to normal" }),
        readReady: () => ready,
        readInFlight: () => [],
        readPrIssues: () => new Map(named),
        readPlans: noOpenPlans,
        readHold: noHold,
        claims: { plan: claim, feedback: claim },
        continuation: noContinuation,
      },
    };
  };
  const at = (n: number, day: number, lane = "plan") => ({
    ...issue(n, `t${n}`, ["ready", lane]),
    createdAt: `2026-09-${String(day).padStart(2, "0")}T00:00:00Z`,
  });

  it("claims the next ready issue, not the one whose held slice PR is still open", () => {
    const { deps: d, tried } = deps([at(3959, 1), at(42, 2)], [[3959, 4605]]);
    expect(claimNext(0, "abc", d)).toMatchObject({ claimed: true, number: 42 });
    expect(tried).toEqual([42]);
  });

  it("applies to the feedback lane too — an open PR is that build's in-flight evidence", () => {
    const { deps: d, tried } = deps([at(7, 1, "feedback")], [[7, 70]]);
    expect(claimNext(0, "abc", d).claimed).toBe(false);
    expect(tried).toEqual([]);
  });

  it("peeks nothing when the only ready issue is named by an open PR", () => {
    const { deps: d } = deps([at(3959, 1)], [[3959, 4605]]);
    expect(peekNext(d)).toBeNull();
  });

  it("withoutOpenPr keeps every issue no open PR names", () => {
    const pool = [at(1, 1), at(2, 2)];
    expect(withoutOpenPr(pool, new Map([[2, 9]])).map((i) => i.number)).toEqual([1]);
    expect(withoutOpenPr(pool)).toEqual(pool);
  });
});

// #5707: #4808's block read `Next pickup: none buildable now`, and the sweep claimed it twice into
// "nothing to build". A plan whose block names nothing is stepped past, never claimed or peeked.
describe("the sweep steps past a plan whose state block names nothing to build", () => {
  const at = (n: number, day: number, lane = "plan") => ({
    ...issue(n, `t${n}`, ["ready", lane]),
    createdAt: `2026-09-${String(day).padStart(2, "0")}T00:00:00Z`,
  });
  const deps = (ready: ReturnType<typeof at>[], held: number[]) => {
    const tried: number[] = [];
    const claim = (ctx: ClaimCtx) => {
      const n = ctx.payload?.issue?.number ?? -1;
      tried.push(n);
      return { claimed: true, reason: "claimed", number: n };
    };
    return {
      tried,
      deps: {
        readMode: () => ({ ...mode("normal"), until: null, reason: "set to normal" }),
        readReady: () => ready,
        readInFlight: () => [],
        readPrIssues: noOpenPrs,
        readPlans: noOpenPlans,
        readHold: (i: { number?: number }) =>
          held.includes(i.number ?? -1) ? "its state block names no next pickup" : null,
        claims: { plan: claim, feedback: claim },
        continuation: noContinuation,
      },
    };
  };

  it("claims the next ready issue instead of the held plan", () => {
    const { deps: d, tried } = deps([at(4808, 1), at(42, 2, "feedback")], [4808]);
    expect(claimNext(0, "abc", d)).toMatchObject({ claimed: true, number: 42 });
    expect(tried).toEqual([42]);
  });

  it("claims nothing, and says so, when the held plan is the only ready issue", () => {
    const { deps: d, tried } = deps([at(4808, 1)], [4808]);
    const r = claimNext(0, "abc", d);
    expect(r).toMatchObject({ claimed: false });
    expect(r.reason).toContain("nothing admissible (0 ready");
    expect(tried).toEqual([]);
  });

  it("peeks nothing when the only ready plan is held — no empty session is dispatched", () => {
    const { deps: d } = deps([at(4808, 1)], [4808]);
    expect(peekNext(d)).toBeNull();
  });

  it("peeks the plan once its block names a slice again", () => {
    const { deps: d } = deps([at(4808, 1)], []);
    expect(peekNext(d)?.number).toBe(4808);
  });
});
