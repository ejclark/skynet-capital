import type { TradeActivityRecord } from "../../src/observatory/activity-store.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import { buildWirePnlRows, buildWireTradeRows } from "../../src/observatory/wire-data.js";

const record = (overrides: Partial<TradeActivityRecord> = {}): TradeActivityRecord => ({
  orderId: "ord-1",
  participantId: "sauron",
  symbol: "NVDA",
  side: "buy",
  quantity: 10,
  filledQuantity: 10,
  price: 120,
  status: "filled",
  at: "2026-08-19T14:30:00.000Z",
  source: "stream",
  ...overrides,
});

const snapshot = (overrides: Partial<ParticipantSnapshot> = {}): ParticipantSnapshot => ({
  id: "sauron",
  displayName: "Sauron",
  kind: "bot",
  cash: 1000,
  equity: 5000,
  positions: [],
  ...overrides,
});

describe("buildWireTradeRows", () => {
  it("joins a participant's display name and kind onto each collapsed row, newest first", () => {
    const records = [
      record({ orderId: "ord-1", at: "2026-08-19T14:00:00.000Z" }),
      record({ orderId: "ord-2", at: "2026-08-20T14:00:00.000Z", side: "sell" }),
    ];
    const rows = buildWireTradeRows(records, [snapshot()], 10);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      participantId: "sauron",
      participantName: "Sauron",
      kind: "bot",
      side: "sell",
    });
  });

  it("falls back to the raw participant id when no snapshot matches", () => {
    const rows = buildWireTradeRows([record({ participantId: "ghost" })], [snapshot()], 10);
    expect(rows[0]?.participantName).toBe("ghost");
    expect(rows[0]?.kind).toBe("human");
  });

  it("drops unfilled orders — a submitted order is not a trade", () => {
    const rows = buildWireTradeRows([record({ filledQuantity: 0 })], [snapshot()], 10);
    expect(rows).toHaveLength(0);
  });

  it("flags a backfilled/broker-window row as reconstructed, never a stream-captured one", () => {
    const rows = buildWireTradeRows(
      [
        record({ orderId: "a", source: "stream", at: "2026-08-19T14:00:00.000Z" }),
        record({ orderId: "b", source: "backfill", at: "2026-08-19T15:00:00.000Z" }),
      ],
      [snapshot()],
      10,
    );
    expect(rows.find((r) => r.at === "2026-08-19T14:00:00.000Z")?.reconstructed).toBe(false);
    expect(rows.find((r) => r.at === "2026-08-19T15:00:00.000Z")?.reconstructed).toBe(true);
  });

  it("bounds the result to `limit`", () => {
    const many = Array.from({ length: 5 }, (_, i) =>
      record({ orderId: `ord-${i}`, at: `2026-08-${10 + i}T00:00:00.000Z` }),
    );
    expect(buildWireTradeRows(many, [snapshot()], 2)).toHaveLength(2);
  });
});

describe("buildWirePnlRows", () => {
  it("sorts richest realized P&L first", () => {
    const rows = buildWirePnlRows([
      snapshot({ id: "a", displayName: "A", realizedPl: 100 }),
      snapshot({ id: "b", displayName: "B", realizedPl: 500 }),
    ]);
    expect(rows.map((r) => r.participantId)).toEqual(["b", "a"]);
  });

  it("omits a participant with no realizedPl rather than rendering a misleading $0", () => {
    const rows = buildWirePnlRows([snapshot({ id: "a", realizedPl: undefined })]);
    expect(rows).toHaveLength(0);
  });
});
