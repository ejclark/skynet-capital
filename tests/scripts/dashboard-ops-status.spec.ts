import type { TradeActivityRecord } from "../../src/observatory/activity-record.js";
import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import { InMemoryActivityStore } from "../../src/observatory/in-memory-activity-store.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import { lastBotActivityAt } from "../../src/scripts/dashboard-ops-status.js";
import { ObservatoryHub } from "../../src/server/observatory-hub.js";

const participant = (over: Partial<ParticipantSnapshot> = {}): ParticipantSnapshot => ({
  id: "bot-sauron",
  displayName: "Sauron",
  kind: "bot",
  cash: 5_000,
  equity: 12_000,
  positions: [],
  ...over,
});

const data = (participants: ParticipantSnapshot[]): DashboardData => ({
  generatedAt: "2026-10-05T00:00:00.000Z",
  participants,
  collisions: [],
});

const record = (over: Partial<TradeActivityRecord> = {}): TradeActivityRecord => ({
  orderId: "order-1",
  participantId: "bot-sauron",
  symbol: "AAPL",
  side: "buy",
  quantity: 1,
  filledQuantity: 1,
  status: "filled",
  at: "2026-10-05T00:00:00.000Z",
  source: "stream",
  ...over,
});

describe("lastBotActivityAt", () => {
  it("picks the newest timestamp among bot participants, ignoring humans", async () => {
    const hub = new ObservatoryHub(
      data([
        participant({ id: "bot-sauron", kind: "bot" }),
        participant({ id: "human-eric", kind: "human" }),
      ]),
    );
    const activity = new InMemoryActivityStore();
    await activity.record(record({ participantId: "bot-sauron", at: "2026-10-05T01:00:00.000Z" }));
    await activity.record(record({ participantId: "human-eric", at: "2026-10-05T02:00:00.000Z" }));

    expect(await lastBotActivityAt(hub, activity)).toBe("2026-10-05T01:00:00.000Z");
  });

  it("returns undefined when no bot has ever traded", async () => {
    const hub = new ObservatoryHub(data([participant()]));
    const activity = new InMemoryActivityStore();

    expect(await lastBotActivityAt(hub, activity)).toBeUndefined();
  });

  it("reads each bot's own latest line rather than the whole ledger (#4612 slice 7)", async () => {
    const hub = new ObservatoryHub(
      data([
        participant({ id: "bot-sauron" }),
        participant({ id: "bot-morgoth", displayName: "Morgoth" }),
      ]),
    );
    const activity = new InMemoryActivityStore();
    await activity.record(record({ participantId: "bot-sauron", at: "2026-10-05T01:00:00.000Z" }));
    await activity.record(record({ participantId: "bot-morgoth", at: "2026-10-05T03:00:00.000Z" }));
    const wholeLedgerRead = activity.list.bind(activity);
    activity.list = (participantId) => {
      if (participantId === undefined) throw new Error("must not read the whole ledger");
      return wholeLedgerRead(participantId);
    };

    expect(await lastBotActivityAt(hub, activity)).toBe("2026-10-05T03:00:00.000Z");
  });
});
