import {
  DEFAULT_WHIPSAW_THRESHOLDS,
  whipsawStatsByPlaybook,
} from "../../src/trading/playbook-whipsaw.js";
import type { RoundTrip } from "../../src/trading/round-trips.js";

/**
 * #3543 slice 1: a whipsaw is a closed round-trip that lost money and closed fast — both legs,
 * never one alone (a fast winner is the tranching design working; a slow loser is just a thesis
 * that didn't pay off). Computed only from `RoundTrip[]`, which by construction only ever holds
 * CLOSED trips — there is no way to feed this an open position's not-yet-realized outcome.
 */
function trip(overrides: Partial<RoundTrip> & { playbookId?: string } = {}): RoundTrip {
  return {
    symbol: "NVDA",
    quantity: 10,
    entryPrice: 100,
    exitPrice: 100,
    openedAt: "2026-09-22T14:00:00.000Z",
    closedAt: "2026-09-22T14:05:00.000Z",
    realized: 0,
    returnPct: 0,
    holdMs: 5 * 60 * 1000,
    ...overrides,
  };
}

describe("whipsawStatsByPlaybook", () => {
  it("counts a fast loser as a whipsaw", () => {
    const trips = Array.from({ length: 5 }, () =>
      trip({ playbookId: "S1-NVDA", realized: -10, holdMs: 60_000 }),
    );
    const [stats] = whipsawStatsByPlaybook(trips);
    expect(stats).toEqual({
      playbookId: "S1-NVDA",
      roundTrips: 5,
      whipsaws: 5,
      measured: true,
      whipsawRate: 1,
    });
  });

  it("does not count a fast winner as a whipsaw", () => {
    const trips = Array.from({ length: 5 }, () =>
      trip({ playbookId: "S1-NVDA", realized: 10, holdMs: 60_000 }),
    );
    expect(whipsawStatsByPlaybook(trips)[0]).toMatchObject({ whipsaws: 0, whipsawRate: 0 });
  });

  it("does not count a slow loser as a whipsaw", () => {
    const trips = Array.from({ length: 5 }, () =>
      trip({ playbookId: "S1-NVDA", realized: -10, holdMs: 60 * 60 * 1000 }),
    );
    expect(whipsawStatsByPlaybook(trips)[0]).toMatchObject({ whipsaws: 0, whipsawRate: 0 });
  });

  it("reports 'not yet measured' below the minimum sample size, and no rate at all", () => {
    const trips = [trip({ playbookId: "S1-NVDA", realized: -10, holdMs: 60_000 })];
    expect(whipsawStatsByPlaybook(trips)).toEqual([
      { playbookId: "S1-NVDA", roundTrips: 1, whipsaws: 1, measured: false },
    ]);
  });

  it("groups by playbookId and ignores trips with none", () => {
    const trips = [
      ...Array.from({ length: 5 }, () => trip({ playbookId: "S1-NVDA", realized: -10 })),
      ...Array.from({ length: 5 }, () => trip({ playbookId: "G1-GOOG", realized: 10 })),
      trip({ realized: -10 }), // no playbookId: a manual desk order
    ];
    const stats = whipsawStatsByPlaybook(trips);
    expect(stats.map((s) => s.playbookId)).toEqual(["G1-GOOG", "S1-NVDA"]);
    expect(stats.every((s) => s.roundTrips === 5)).toBe(true);
  });

  it("honors custom thresholds over the defaults", () => {
    const trips = Array.from({ length: 2 }, () =>
      trip({ playbookId: "S1-NVDA", realized: -10, holdMs: 20 * 60 * 1000 }),
    );
    const stats = whipsawStatsByPlaybook(trips, { maxHoldMs: 30 * 60 * 1000, minSampleSize: 2 });
    expect(stats[0]).toEqual({
      playbookId: "S1-NVDA",
      roundTrips: 2,
      whipsaws: 2,
      measured: true,
      whipsawRate: 1,
    });
  });

  it("returns nothing for an empty ledger", () => {
    expect(whipsawStatsByPlaybook([])).toEqual([]);
  });

  it("keeps the default max hold comfortably above the 5-minute order cooldown", () => {
    expect(DEFAULT_WHIPSAW_THRESHOLDS.maxHoldMs).toBeGreaterThan(5 * 60 * 1000);
  });
});
