import { computeFunnel, type FunnelIntentRow } from "../../src/autonomous/decision-funnel.js";

/**
 * `computeFunnel` (#2287 PR 7b) — the decision funnel's pure tally: cycles → raw → survived
 * guards → placed → filled → closed, plus refusals by reason. `decision-db.spec.ts` covers the
 * SQL-backed `funnelFor` this feeds.
 */

const row = (over: Partial<FunnelIntentRow> = {}): FunnelIntentRow => ({
  guardReason: null,
  action: null,
  resultStatus: null,
  ...over,
});

describe("computeFunnel", () => {
  it("returns all zeros for no cycles at all", () => {
    expect(computeFunnel(0, 0, [])).toEqual({
      cycles: 0,
      rawIntents: 0,
      survivedGuards: 0,
      placed: 0,
      filled: 0,
      closed: 0,
      refusalsByReason: {},
    });
  });

  it("counts a refused intent as raw but never as surviving guards", () => {
    const funnel = computeFunnel(1, 0, [row({ guardReason: "s2-print" })]);
    expect(funnel).toMatchObject({ rawIntents: 1, survivedGuards: 0, placed: 0, filled: 0 });
    expect(funnel.refusalsByReason).toEqual({ "s2-print": 1 });
  });

  it("walks the full funnel: survived, placed, filled are each a strict subset of the last", () => {
    const rows = [
      row({ action: "placed", resultStatus: "filled" }), // survived + placed + filled
      row({ action: "placed", resultStatus: "rejected" }), // survived + placed, never filled
      row({ action: "observed" }), // survived only
      row({ guardReason: "insufficient-cash" }), // refused outright
    ];
    const funnel = computeFunnel(1, 0, rows);
    expect(funnel).toMatchObject({
      rawIntents: 4,
      survivedGuards: 3,
      placed: 2,
      filled: 1,
    });
    expect(funnel.refusalsByReason).toEqual({ "insufficient-cash": 1 });
  });

  it("tallies multiple refusal reasons independently, only including reasons that occurred", () => {
    const rows = [
      row({ guardReason: "s2-print" }),
      row({ guardReason: "s2-print" }),
      row({ guardReason: "ladder-block" }),
    ];
    const funnel = computeFunnel(1, 0, rows);
    expect(funnel.refusalsByReason).toEqual({ "s2-print": 2, "ladder-block": 1 });
    expect(funnel.refusalsByReason).not.toHaveProperty("e1-open");
  });

  it("carries cycles and closed through verbatim — they come from a different query, not the rows", () => {
    const funnel = computeFunnel(42, 7, []);
    expect(funnel.cycles).toBe(42);
    expect(funnel.closed).toBe(7);
  });
});
