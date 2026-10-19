import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { TradeActivityRecord } from "../../src/observatory/activity-record.js";
import { InMemoryActivityStore } from "../../src/observatory/activity-store.js";
import type { CapitalFlow } from "../../src/observatory/capital-flow.js";
import {
  createBootCapitalFlowStore,
  JsonlCapitalFlowStore,
} from "../../src/observatory/capital-flow-store.js";
import { CapitalFlowWatch, restartBaseline } from "../../src/observatory/capital-flow-watch.js";
import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import type { ObservatoryEvent } from "../../src/observatory/events.js";
import type { EquitySample } from "../../src/observatory/history-record.js";
import { sampleAll } from "../../src/observatory/history-sampler.js";
import { JsonlHistoryStore } from "../../src/observatory/history-store.js";
import { InMemoryCapitalFlowStore } from "../../src/observatory/in-memory-capital-flow-store.js";
import { InMemoryHistoryStore } from "../../src/observatory/in-memory-history-store.js";
import { reduceObservatory } from "../../src/observatory/reduce.js";

const sample = (
  at: string,
  equity: number,
  cash: number,
  participantId = "human-dana",
): EquitySample => ({
  at,
  participantId,
  equity,
  cash,
  realizedPl: 0,
});

const flow = (participantId: string, amount: number): CapitalFlow => ({
  participantId,
  from: "2026-10-05T14:00:00.000Z",
  at: "2026-10-05T14:05:00.000Z",
  amount,
  direction: amount > 0 ? "added" : "removed",
  unexplainedCash: amount,
  basis: "inferred",
});

/** An activity store that counts reads, so the quiet-tick fast path is observable. */
class CountingActivityStore extends InMemoryActivityStore {
  reads = 0;
  override list(participantId?: string): Promise<TradeActivityRecord[]> {
    this.reads++;
    return super.list(participantId);
  }
}

describe("CapitalFlowWatch", () => {
  it("records a top-up durably between two samples, without a broker call", async () => {
    const flows = new InMemoryCapitalFlowStore();
    const watch = new CapitalFlowWatch({ activity: new InMemoryActivityStore(), flows });
    await watch.observe(sample("2026-10-05T14:00:00.000Z", 700_000, 200_000));
    const seen = await watch.observe(sample("2026-10-05T14:05:00.000Z", 1_000_000, 500_000));
    expect(seen?.amount).toBe(300_000);
    expect(await flows.list("human-dana")).toEqual([seen]);
  });

  it("baselines on the last sample from before the restart, so a reset in the gap is caught", async () => {
    const flows = new InMemoryCapitalFlowStore();
    const watch = new CapitalFlowWatch({
      activity: new InMemoryActivityStore(),
      flows,
      baseline: [sample("2026-10-05T14:00:00.000Z", 700_000, 200_000)],
    });
    await watch.observe(sample("2026-10-05T14:05:00.000Z", 1_000_000, 500_000));
    expect(await flows.list()).toHaveLength(1);
  });

  it("keeps each participant's previous sample apart", async () => {
    const flows = new InMemoryCapitalFlowStore();
    const watch = new CapitalFlowWatch({ activity: new InMemoryActivityStore(), flows });
    await watch.observe(sample("2026-10-05T14:00:00.000Z", 700_000, 200_000, "a"));
    await watch.observe(sample("2026-10-05T14:00:00.000Z", 1_000_000, 500_000, "b"));
    await watch.observe(sample("2026-10-05T14:05:00.000Z", 1_000_000, 500_000, "a"));
    await watch.observe(sample("2026-10-05T14:05:00.000Z", 1_000_050, 500_000, "b"));
    expect((await flows.list()).map((f) => [f.participantId, f.amount])).toEqual([["a", 300_000]]);
  });

  it("never reads the fill journal on a quiet tick", async () => {
    const activity = new CountingActivityStore();
    const watch = new CapitalFlowWatch({ activity, flows: new InMemoryCapitalFlowStore() });
    await watch.observe(sample("2026-10-05T14:00:00.000Z", 1_000_000, 500_000));
    await watch.observe(sample("2026-10-05T14:05:00.000Z", 1_000_200, 495_000));
    expect(activity.reads).toBe(0);
  });

  it("lets a journaled fill explain the move, so ordinary trading records nothing", async () => {
    const activity = new InMemoryActivityStore();
    // A $20k sell of a position that gained $10k in the same window: both numbers moved, the fill
    // explains the cash.
    await activity.record({
      orderId: "o1",
      participantId: "human-dana",
      symbol: "SPY",
      side: "sell",
      quantity: 40,
      filledQuantity: 40,
      price: 500,
      status: "filled",
      at: "2026-10-05T14:03:00.000Z",
      source: "stream",
    });
    const flows = new InMemoryCapitalFlowStore();
    const watch = new CapitalFlowWatch({ activity, flows });
    await watch.observe(sample("2026-10-05T14:00:00.000Z", 1_000_000, 500_000));
    await watch.observe(sample("2026-10-05T14:05:00.000Z", 1_010_000, 520_000));
    expect(await flows.list()).toEqual([]);
  });

  it("compares nothing until the boot reconcile has banked the broker window's fills", async () => {
    const activity = new InMemoryActivityStore();
    const flows = new InMemoryCapitalFlowStore();
    let bank: () => void = () => undefined;
    const ready = new Promise<void>((resolve) => {
      bank = resolve;
    });
    // A $300k sell made while the server was down: the boot sample shows the cash, and only the
    // reconcile puts the fill that explains it in the journal.
    const watch = new CapitalFlowWatch({
      activity,
      flows,
      baseline: [sample("2026-10-05T14:00:00.000Z", 1_000_000, 200_000)],
      ready,
    });
    const seen = watch.observe(sample("2026-10-05T14:20:00.000Z", 1_010_000, 500_000));
    await activity.record({
      orderId: "gap-1",
      participantId: "human-dana",
      symbol: "SPY",
      side: "sell",
      quantity: 600,
      filledQuantity: 600,
      price: 500,
      status: "filled",
      at: "2026-10-05T14:10:00.000Z",
      source: "broker",
    });
    bank();
    // Equity moved $10k (market) and the reconciled sell explains the cash: no flow.
    expect(await seen).toBeUndefined();
    expect(await flows.list()).toEqual([]);
  });
});

// The samples are the hub's book, so the detector is only as honest as the reducer that folds a
// fill into it. Run a real option fill through reducer → sampler → watch, then the broker sync.
describe("CapitalFlowWatch over the live reducer", () => {
  const CALL = "SPY261218C00600000";
  const book = (cash: number, quantity: number): DashboardData => ({
    generatedAt: "2026-10-05T14:00:00.000Z",
    participants: [
      {
        id: "bot",
        displayName: "Bot",
        kind: "bot",
        cash,
        equity: cash + quantity * 500,
        positions:
          quantity > 0
            ? [{ symbol: CALL, quantity, avgPrice: 500, marketValue: quantity * 500 }]
            : [],
      },
    ],
    collisions: [],
  });

  it("records no flow when a bot trims an option position between broker syncs", async () => {
    const activity = new InMemoryActivityStore();
    const flows = new InMemoryCapitalFlowStore();
    const watch = new CapitalFlowWatch({ activity, flows });
    // 100 contracts at $5.00 a share ($50k held, $950k cash).
    let state = book(950_000, 100);
    await watch.observe(sampleAll(state, "2026-10-05T14:00:00.000Z")[0] as EquitySample);
    const trim: ObservatoryEvent = {
      type: "fill",
      participantId: "bot",
      symbol: CALL,
      side: "sell",
      quantity: 50,
      price: 5,
      at: "2026-10-05T14:02:00.000Z",
    };
    state = reduceObservatory(state, trim);
    await activity.record({
      orderId: "trim",
      participantId: "bot",
      symbol: CALL,
      side: "sell",
      quantity: 50,
      filledQuantity: 50,
      price: 5,
      status: "filled",
      at: "2026-10-05T14:02:00.000Z",
      source: "stream",
    });
    await watch.observe(sampleAll(state, "2026-10-05T14:05:00.000Z")[0] as EquitySample);
    // The broker sync replaces the book with the broker's own numbers.
    state = reduceObservatory(state, {
      type: "participant_updated",
      at: "2026-10-05T14:06:00.000Z",
      participant: book(975_000, 50).participants[0] as DashboardData["participants"][number],
    });
    await watch.observe(sampleAll(state, "2026-10-05T14:10:00.000Z")[0] as EquitySample);
    expect(await flows.list()).toEqual([]);
  });
});

describe("restartBaseline", () => {
  const prior = sample("2026-10-05T14:00:00.000Z", 700_000, 200_000);
  const row = (at: string) => ({
    orderId: at,
    symbol: "SPY",
    side: "buy",
    quantity: 1,
    filledQuantity: 1,
    price: 500,
    status: "filled",
    at,
  });
  const historyWith = async (...samples: EquitySample[]) => {
    const history = new InMemoryHistoryStore();
    for (const s of samples) await history.save(s);
    return history;
  };

  it("keeps the last sample from before the boot when the broker window covers the gap", async () => {
    const history = await historyWith(sample("2026-10-05T13:55:00.000Z", 690_000, 190_000), prior);
    const kept = await restartBaseline(history, [
      { id: "human-dana", activity: [row("2026-10-05T14:03:00.000Z")] },
    ]);
    expect(kept).toEqual([prior]);
  });

  it("drops a participant whose full broker window starts inside the gap", async () => {
    const history = await historyWith(prior);
    const full = Array.from({ length: 3 }, (_, i) => row(`2026-10-05T14:0${i + 1}:00.000Z`));
    expect(await restartBaseline(history, [{ id: "human-dana", activity: full }], 3)).toEqual([]);
    const reaching = [row("2026-10-05T13:59:00.000Z"), ...full.slice(1)];
    expect(await restartBaseline(history, [{ id: "human-dana", activity: reaching }], 3)).toEqual([
      prior,
    ]);
  });

  it("drops an account whose boot read failed, and one with no history yet", async () => {
    const history = await historyWith(prior);
    expect(
      await restartBaseline(history, [
        { id: "human-dana", error: "401", activity: [] },
        { id: "human-new", activity: [] },
      ]),
    ).toEqual([]);
  });
});

describe("JsonlCapitalFlowStore", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-flows-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("appends one line per flow and reads them back per participant", async () => {
    const store = new JsonlCapitalFlowStore(dir);
    await store.record(flow("human-dana", 300_000));
    await store.record(flow("human-eric", -50_000));
    expect(await store.list("human-dana")).toEqual([flow("human-dana", 300_000)]);
    expect(await store.list()).toHaveLength(2);
  });

  it("lives under the history directory without leaking into the equity samples", async () => {
    const flows = createBootCapitalFlowStore({ SKYNET_HISTORY_DIR: dir }, "live");
    await flows.record(flow("human-dana", 300_000));
    expect(await readdir(dir)).toEqual(["flows"]);
    expect(await new JsonlHistoryStore(dir).list()).toEqual([]);
  });

  it("stays in memory on an offline run, so a fixture replay never writes a fabricated flow", () => {
    expect(createBootCapitalFlowStore({ SKYNET_HISTORY_DIR: dir }, "offline")).toBeInstanceOf(
      InMemoryCapitalFlowStore,
    );
  });
});
