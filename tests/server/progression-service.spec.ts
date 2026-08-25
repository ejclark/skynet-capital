import type { TradeActivityRecord } from "../../src/observatory/activity-store.js";
import type { OrderAuditRecord } from "../../src/server/order-audit-log.js";
import {
  createProgressionService,
  type ParticipantProgression,
} from "../../src/server/progression-service.js";

const journalLine = (over: Partial<TradeActivityRecord>): TradeActivityRecord => ({
  orderId: "o1",
  participantId: "ann",
  symbol: "AAPL",
  side: "buy",
  quantity: 10,
  filledQuantity: 10,
  status: "filled",
  at: "2026-08-25T14:00:00.000Z",
  source: "stream",
  ...over,
});

const tagLine = (over: Partial<OrderAuditRecord>): OrderAuditRecord => ({
  participantId: "ann",
  orderId: "o1",
  at: "2026-08-25T13:59:59.000Z",
  ...over,
});

function service(journal: TradeActivityRecord[], tags: OrderAuditRecord[] = []) {
  return createProgressionService({
    readFills: () => Promise.resolve(journal),
    readTags: () => Promise.resolve(tags),
  });
}

describe("progression service — the ledgers ARE the progress", () => {
  it("derives earned milestones, points, rank and the ladder from the two ledgers", async () => {
    const view: ParticipantProgression = await service(
      [
        journalLine({ orderId: "b1" }),
        journalLine({ orderId: "s1", side: "sell", at: "2026-08-25T15:00:00.000Z" }),
      ],
      [tagLine({ orderId: "b1", code: "101", intent: "open", side: "buy" })],
    ).view("ann");
    expect(view.earned.map((m) => m.milestoneId)).toEqual(["first-buy", "first-sell"]);
    expect(view.points).toBe(50);
    expect(view.rank.title).toBe("Trader");
    expect(view.unlocked.has("201")).toBe(true);
    expect(view.unlocked.has("202")).toBe(false);
    expect(view.nextUp).toBe("201");
    expect(view.unlockedLevels.has(200)).toBe(true);
    expect(view.earnedByCode.get("101")?.orderId).toBe("b1");
  });

  it("collapses the journal per order — a partial fill line never double-earns or fake-earns", async () => {
    // The same order journaled new → filled: only the collapsed (filled) state counts, once.
    const view = await service([
      journalLine({ orderId: "b1", filledQuantity: 0, status: "new" }),
      journalLine({
        orderId: "b1",
        filledQuantity: 10,
        status: "filled",
        at: "2026-08-25T14:05:00.000Z",
      }),
    ]).view("ann");
    expect(view.earned).toHaveLength(1);
    expect(view.earned[0]?.milestoneId).toBe("first-buy");
  });

  it("answers a clean zero for a participant with no history", async () => {
    const view = await service([]).view("ann");
    expect(view.earned).toEqual([]);
    expect(view.points).toBe(0);
    expect(view.rank.title).toBe("Observer");
    expect([...view.unlocked]).toEqual(["101"]);
    expect(view.nextUp).toBe("101");
  });

  it("celebrates nothing and reports wheels off until the preference store lands", async () => {
    const view = await service([journalLine({})]).view("ann");
    expect(view.wheels).toBe(false);
    expect(view.celebrating).toEqual([]);
  });
});
