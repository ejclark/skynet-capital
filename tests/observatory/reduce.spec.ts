import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import type { ObservatoryEvent } from "../../src/observatory/events.js";
import { reduceObservatory } from "../../src/observatory/reduce.js";

const baseState = (): DashboardData => ({
  generatedAt: "2026-07-24T15:00:00.000Z",
  participants: [
    {
      id: "news-fader",
      displayName: "The News Fader",
      kind: "bot",
      personaId: "news-fader",
      cash: 1_000_000,
      equity: 1_100_000,
      positions: [{ symbol: "EEM", quantity: 1_000, avgPrice: 100, marketValue: 100_000 }],
    },
    {
      id: "eric",
      displayName: "Eric",
      kind: "human",
      cash: 50_000,
      equity: 50_000,
      positions: [],
    },
  ],
  collisions: [],
});

const fold = (events: ObservatoryEvent[]): DashboardData =>
  events.reduce(reduceObservatory, baseState());

describe("reduceObservatory", () => {
  it("snapshot replaces the whole state", () => {
    const replacement: DashboardData = { generatedAt: "later", participants: [], collisions: [] };
    expect(reduceObservatory(baseState(), { type: "snapshot", data: replacement })).toBe(
      replacement,
    );
  });

  describe("participant_added", () => {
    it("appends a new participant without disturbing the others", () => {
      const state = reduceObservatory(baseState(), {
        type: "participant_added",
        at: "2026-07-24T16:00:00.000Z",
        participant: {
          id: "human-joe",
          displayName: "Joe",
          kind: "human",
          cash: 5,
          equity: 5,
          positions: [],
        },
      });
      expect(state.participants.map((p) => p.id)).toEqual(["news-fader", "eric", "human-joe"]);
      expect(state.generatedAt).toBe("2026-07-24T16:00:00.000Z");
    });

    it("is a no-op (same identity) when the id already exists", () => {
      const start = baseState();
      const next = reduceObservatory(start, {
        type: "participant_added",
        at: "later",
        participant: {
          id: "eric",
          displayName: "Eric",
          kind: "human",
          cash: 0,
          equity: 0,
          positions: [],
        },
      });
      expect(next).toBe(start);
    });
  });

  describe("price", () => {
    it("re-marks a held position and recomputes equity", () => {
      const state = fold([
        { type: "price", symbol: "EEM", price: 110, at: "2026-07-24T15:01:00.000Z" },
      ]);
      const fader = state.participants[0];
      expect(fader?.positions[0]?.marketValue).toBe(110_000);
      expect(fader?.equity).toBe(1_110_000); // 1,000,000 cash + 110,000
      expect(state.generatedAt).toBe("2026-07-24T15:01:00.000Z");
    });

    it("leaves state identity untouched when nobody holds the symbol", () => {
      const start = baseState();
      const next = reduceObservatory(start, {
        type: "price",
        symbol: "TSLA",
        price: 400,
        at: "later",
      });
      expect(next).toBe(start);
    });

    it("carries lastdayPrice through a re-mark, so the day-change column stays measurable", () => {
      const start = baseState();
      const withLastday: DashboardData = {
        ...start,
        participants: start.participants.map((p) =>
          p.id === "news-fader"
            ? {
                ...p,
                positions: [
                  {
                    symbol: "EEM",
                    quantity: 1_000,
                    avgPrice: 100,
                    marketValue: 100_000,
                    lastdayPrice: 105,
                  },
                ],
              }
            : p,
        ),
      };
      const next = reduceObservatory(withLastday, {
        type: "price",
        symbol: "EEM",
        price: 110,
        at: "2026-07-24T15:01:00.000Z",
      });
      expect(next.participants[0]?.positions[0]?.lastdayPrice).toBe(105);
    });
  });

  describe("fill", () => {
    it("a buy reduces cash and opens/increases the position", () => {
      const state = fold([
        {
          type: "fill",
          participantId: "eric",
          symbol: "VWO",
          side: "buy",
          quantity: 100,
          price: 50,
          at: "2026-07-24T15:02:00.000Z",
        },
      ]);
      const eric = state.participants[1];
      expect(eric?.cash).toBe(45_000); // 50,000 - 5,000
      expect(eric?.positions[0]).toMatchObject({ symbol: "VWO", quantity: 100, avgPrice: 50 });
      expect(eric?.equity).toBe(50_000); // 45,000 + 5,000
    });

    it("a full sell closes the position and returns cash", () => {
      const state = fold([
        {
          type: "fill",
          participantId: "news-fader",
          symbol: "EEM",
          side: "sell",
          quantity: 1_000,
          price: 105,
          at: "2026-07-24T15:03:00.000Z",
        },
      ]);
      const fader = state.participants[0];
      expect(fader?.positions).toHaveLength(0);
      expect(fader?.cash).toBe(1_105_000);
      expect(fader?.equity).toBe(1_105_000);
    });

    it("books realized P/L on a sell (sale − avg cost × qty), and accumulates across sells", () => {
      const state = fold([
        // EEM held at avg 100; sell 400 @ 105 → +2,000 realized, 600 left.
        {
          type: "fill",
          participantId: "news-fader",
          symbol: "EEM",
          side: "sell",
          quantity: 400,
          price: 105,
          at: "2026-07-24T15:03:00.000Z",
        },
        // Sell the remaining 600 @ 95 → −3,000 realized; cumulative = −1,000.
        {
          type: "fill",
          participantId: "news-fader",
          symbol: "EEM",
          side: "sell",
          quantity: 600,
          price: 95,
          at: "2026-07-24T15:04:00.000Z",
        },
      ]);
      expect(state.participants[0]?.realizedPl).toBe(-1_000);
    });

    it("a buy leaves realized P/L untouched", () => {
      const state = fold([
        {
          type: "fill",
          participantId: "eric",
          symbol: "VWO",
          side: "buy",
          quantity: 100,
          price: 50,
          at: "2026-07-24T15:02:00.000Z",
        },
      ]);
      expect(state.participants[1]?.realizedPl).toBeUndefined();
    });
  });
});
