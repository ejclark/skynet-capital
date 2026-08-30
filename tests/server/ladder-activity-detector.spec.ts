import type { TradeActivityRecord } from "../../src/observatory/activity-record.js";
import { InMemoryActivityStore } from "../../src/observatory/in-memory-activity-store.js";
import {
  detectAndRecordLadderProgress,
  detectLadderProgress,
  FIRST_OTM_EXPIRY_MILESTONE,
  FIRST_REALIZED_PROFIT_MILESTONE,
} from "../../src/server/ladder-activity-detector.js";
import { earliestPerMilestone } from "../../src/server/ladder-progress-log.js";
import { InMemoryLadderProgressLogStore } from "../../src/server/ladder-progress-log-memory-store.js";

const record = (overrides: Partial<TradeActivityRecord> = {}): TradeActivityRecord => ({
  orderId: "order-1",
  participantId: "member-a",
  symbol: "AAPL",
  side: "buy",
  quantity: 10,
  filledQuantity: 10,
  price: 100,
  status: "filled",
  at: "2026-08-01T12:00:00.000Z",
  source: "stream",
  ...overrides,
});

const noneLogged: ReadonlySet<string> = new Set();

describe("detectLadderProgress — OTM expiry", () => {
  it("detects the milestone from the earliest OPEXP activity, carrying its order id as evidence", () => {
    const records = [
      record({
        orderId: "lifecycle:act-2",
        symbol: "AAPL260220P00200000",
        status: "expired worthless",
        at: "2026-09-01T00:00:00.000Z",
      }),
      record({
        orderId: "lifecycle:act-1",
        symbol: "MSFT260220P00400000",
        status: "expired worthless",
        at: "2026-08-01T00:00:00.000Z",
      }),
    ];

    const detections = detectLadderProgress(records, noneLogged);

    expect(detections).toContainEqual({
      milestoneId: FIRST_OTM_EXPIRY_MILESTONE,
      evidence: { kind: "otm-expiry", orderId: "lifecycle:act-1" },
      at: "2026-08-01T00:00:00.000Z",
    });
  });

  it("never fires on an ordinary fill — only a real OPEXP activity counts", () => {
    const detections = detectLadderProgress([record()], noneLogged);
    expect(detections.find((d) => d.milestoneId === FIRST_OTM_EXPIRY_MILESTONE)).toBeUndefined();
  });

  it("does not re-detect once the milestone is already logged", () => {
    const records = [record({ orderId: "lifecycle:act-1", status: "expired worthless" })];
    const detections = detectLadderProgress(records, new Set([FIRST_OTM_EXPIRY_MILESTONE]));
    expect(detections.find((d) => d.milestoneId === FIRST_OTM_EXPIRY_MILESTONE)).toBeUndefined();
  });
});

describe("detectLadderProgress — first realized profit", () => {
  it("detects the first closed round trip with realized > 0, evidenced by the closing order id", () => {
    const records = [
      record({ orderId: "order-buy", side: "buy", price: 100, at: "2026-08-01T00:00:00.000Z" }),
      record({
        orderId: "order-sell",
        side: "sell",
        price: 110,
        at: "2026-08-05T00:00:00.000Z",
      }),
    ];

    const detections = detectLadderProgress(records, noneLogged);

    expect(detections).toContainEqual({
      milestoneId: FIRST_REALIZED_PROFIT_MILESTONE,
      evidence: { kind: "realized-profit", orderId: "order-sell" },
      at: "2026-08-05T00:00:00.000Z",
    });
  });

  it("never fires on a losing round trip", () => {
    const records = [
      record({ orderId: "order-buy", side: "buy", price: 100, at: "2026-08-01T00:00:00.000Z" }),
      record({
        orderId: "order-sell",
        side: "sell",
        price: 90,
        at: "2026-08-05T00:00:00.000Z",
      }),
    ];

    const detections = detectLadderProgress(records, noneLogged);
    expect(
      detections.find((d) => d.milestoneId === FIRST_REALIZED_PROFIT_MILESTONE),
    ).toBeUndefined();
  });

  it("picks the FIRST profitable trip closed, not a later one", () => {
    const records = [
      // A loss, closed first.
      record({ orderId: "b1", side: "buy", price: 100, at: "2026-08-01T00:00:00.000Z" }),
      record({ orderId: "s1", side: "sell", price: 90, at: "2026-08-02T00:00:00.000Z" }),
      // Then a win.
      record({ orderId: "b2", side: "buy", price: 100, at: "2026-08-03T00:00:00.000Z" }),
      record({ orderId: "s2", side: "sell", price: 120, at: "2026-08-04T00:00:00.000Z" }),
      // Then another, later win — must not be the one picked.
      record({ orderId: "b3", side: "buy", price: 100, at: "2026-08-05T00:00:00.000Z" }),
      record({ orderId: "s3", side: "sell", price: 150, at: "2026-08-06T00:00:00.000Z" }),
    ];

    const detections = detectLadderProgress(records, noneLogged);
    const profit = detections.find((d) => d.milestoneId === FIRST_REALIZED_PROFIT_MILESTONE);
    expect(profit?.evidence).toEqual({ kind: "realized-profit", orderId: "s2" });
  });

  it("does not re-detect once the milestone is already logged", () => {
    const records = [
      record({ orderId: "order-buy", side: "buy", price: 100, at: "2026-08-01T00:00:00.000Z" }),
      record({ orderId: "order-sell", side: "sell", price: 110, at: "2026-08-05T00:00:00.000Z" }),
    ];
    const detections = detectLadderProgress(records, new Set([FIRST_REALIZED_PROFIT_MILESTONE]));
    expect(
      detections.find((d) => d.milestoneId === FIRST_REALIZED_PROFIT_MILESTONE),
    ).toBeUndefined();
  });
});

describe("detectLadderProgress — never self-marked", () => {
  it("an unfilled order proves no realized profit, no matter how it's priced", () => {
    const records = [
      record({ orderId: "b1", side: "buy", filledQuantity: 0, price: 100 }),
      record({ orderId: "s1", side: "sell", filledQuantity: 0, price: 200 }),
    ];
    const detections = detectLadderProgress(records, noneLogged);
    expect(
      detections.find((d) => d.milestoneId === FIRST_REALIZED_PROFIT_MILESTONE),
    ).toBeUndefined();
  });
});

describe("detectAndRecordLadderProgress", () => {
  it("records newly detected milestones for the participant, evidence and all", async () => {
    const activity = new InMemoryActivityStore();
    const progress = new InMemoryLadderProgressLogStore();
    await activity.record(
      record({
        orderId: "lifecycle:act-1",
        status: "expired worthless",
        at: "2026-08-01T00:00:00.000Z",
      }),
    );
    await activity.record(
      record({ orderId: "order-buy", side: "buy", price: 100, at: "2026-08-02T00:00:00.000Z" }),
    );
    await activity.record(
      record({ orderId: "order-sell", side: "sell", price: 110, at: "2026-08-03T00:00:00.000Z" }),
    );

    const recorded = await detectAndRecordLadderProgress(progress, activity, "member-a");

    expect(recorded.map((r) => r.milestoneId).sort()).toEqual(
      [FIRST_OTM_EXPIRY_MILESTONE, FIRST_REALIZED_PROFIT_MILESTONE].sort(),
    );
    const logged = await progress.list("member-a");
    expect(logged).toHaveLength(2);
  });

  it("is idempotent — a second pass over the same activity logs nothing new", async () => {
    const activity = new InMemoryActivityStore();
    const progress = new InMemoryLadderProgressLogStore();
    await activity.record(record({ orderId: "lifecycle:act-1", status: "expired worthless" }));

    await detectAndRecordLadderProgress(progress, activity, "member-a");
    const second = await detectAndRecordLadderProgress(progress, activity, "member-a");

    expect(second).toHaveLength(0);
    expect(await progress.list("member-a")).toHaveLength(1);
  });

  it("keeps the earliest logged row on read even if a race double-writes one milestone", async () => {
    const activity = new InMemoryActivityStore();
    const progress = new InMemoryLadderProgressLogStore();
    await activity.record(
      record({
        orderId: "lifecycle:act-1",
        status: "expired worthless",
        at: "2026-08-01T00:00:00.000Z",
      }),
    );

    // Simulate two concurrent detector passes racing before either has recorded.
    const [a, b] = await Promise.all([
      detectAndRecordLadderProgress(progress, activity, "member-a"),
      detectAndRecordLadderProgress(progress, activity, "member-a"),
    ]);
    expect(a.length + b.length).toBeGreaterThanOrEqual(1);

    const logged = await progress.list("member-a");
    const byMilestone = earliestPerMilestone(logged);
    expect(byMilestone.get(FIRST_OTM_EXPIRY_MILESTONE)?.evidence).toEqual({
      kind: "otm-expiry",
      orderId: "lifecycle:act-1",
    });
  });

  it("scopes detection and recording to the given participant only", async () => {
    const activity = new InMemoryActivityStore();
    const progress = new InMemoryLadderProgressLogStore();
    await activity.record(
      record({
        participantId: "member-a",
        orderId: "lifecycle:act-1",
        status: "expired worthless",
      }),
    );
    await activity.record(
      record({
        participantId: "member-b",
        orderId: "lifecycle:act-2",
        status: "expired worthless",
      }),
    );

    await detectAndRecordLadderProgress(progress, activity, "member-a");

    expect(await progress.list("member-a")).toHaveLength(1);
    expect(await progress.list("member-b")).toHaveLength(0);
  });
});
