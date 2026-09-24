import type { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import type { ObservatoryEvent } from "../../src/observatory/events.js";
import { createMonthReturnSync, lastFinite } from "../../src/observatory/month-return-sync.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import { reduceObservatory } from "../../src/observatory/reduce.js";
import { standingsBoardView } from "../../src/observatory/standings-board-view.js";
import {
  metricText,
  parseLeaderMetric,
  rankValue,
  UNKNOWN_RANK,
} from "../../src/observatory/standings-metric.js";
import type { Participant } from "../../src/participants/participant.js";

/**
 * The league's "1M return" (#3689 follow-up): a flow-adjusted month return synced onto each
 * snapshot, ranked like any other metric — and an account the sync hasn't reached ranks last and
 * reads "—", never a false 0%.
 */

const snap = (id: string, monthReturnPct?: number): ParticipantSnapshot => ({
  id,
  displayName: id,
  kind: "human",
  cash: 10_000,
  equity: 100_000,
  positions: [],
  ...(monthReturnPct === undefined ? {} : { monthReturnPct }),
});

const board = (...participants: ParticipantSnapshot[]): DashboardData => ({
  generatedAt: "2026-09-24T15:00:00.000Z",
  participants,
  collisions: [],
});

describe("the 1M metric", () => {
  it("parses ?by=month", () => {
    expect(parseLeaderMetric("month")).toBe("month");
  });

  it("formats a synced value as a signed percent and an unsynced one as a dash", () => {
    expect(metricText(snap("a", 3.456), "month")).toBe("+3.46%");
    expect(metricText(snap("a", -1.2), "month")).toBe("-1.20%");
    expect(metricText(snap("a"), "month")).toBe("—");
  });

  it("ranks an unsynced account below every real value, even a loss", () => {
    expect(rankValue(snap("a"), "month")).toBe(UNKNOWN_RANK);
    expect(rankValue(snap("a", -40), "month")).toBeGreaterThan(UNKNOWN_RANK);
  });

  it("orders the board by the month, with unsynced rows last", () => {
    const view = standingsBoardView(
      board(snap("low", -2), snap("none"), snap("high", 4.5)),
      "month",
    );
    expect(view.rows.map((r) => r.key)).toEqual(["high", "low", "none"]);
    expect(view.rows.at(-1)?.value).toBe("—");
  });
});

describe("the reducer", () => {
  it("carries the month return across a snapshot rebuild that doesn't know it", () => {
    const state = reduceObservatory(board(snap("a", 2.5)), {
      type: "participant_updated",
      participant: { ...snap("a"), equity: 101_000 },
      at: "2026-09-24T15:01:00.000Z",
    });
    expect(state.participants[0]?.monthReturnPct).toBe(2.5);
    expect(state.participants[0]?.equity).toBe(101_000);
  });
});

describe("createMonthReturnSync", () => {
  const participant = { id: "a" } as Participant;

  function harness(pct: (number | null)[] | Error, start = board(snap("a"))) {
    let state = start;
    const events: ObservatoryEvent[] = [];
    const sync = createMonthReturnSync({
      getState: () => state,
      apply: (e) => {
        events.push(e);
        state = reduceObservatory(state, e);
      },
      findParticipant: () => participant,
      clientFactory: () =>
        ({
          getPortfolioHistory: () =>
            pct instanceof Error ? Promise.reject(pct) : Promise.resolve({ profit_loss_pct: pct }),
        }) as unknown as AlpacaTradingClient,
    });
    return { sync, events, state: () => state };
  }

  it("writes the last finite 1M return, as a percent", async () => {
    const h = harness([0.01, 0.0345, null]);
    await h.sync.syncAll();
    expect(h.state().participants[0]?.monthReturnPct).toBe(3.45);
  });

  it("applies nothing when the value didn't move", async () => {
    const h = harness([0.0345], board(snap("a", 3.45)));
    await h.sync.syncAll();
    expect(h.events).toHaveLength(0);
  });

  it("leaves the last good value standing when the broker read fails", async () => {
    const h = harness(new Error("timeout"), board(snap("a", 1.5)));
    await h.sync.syncAll();
    expect(h.state().participants[0]?.monthReturnPct).toBe(1.5);
  });

  it("writes nothing for a history with no finite value", async () => {
    const h = harness([null, null]);
    await h.sync.syncAll();
    expect(h.events).toHaveLength(0);
    expect(lastFinite([null, null])).toBeUndefined();
  });
});
