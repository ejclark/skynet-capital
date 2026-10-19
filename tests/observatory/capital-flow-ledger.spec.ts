import { type CapitalFlow, FLOWS_SHOWN_FROM } from "../../src/observatory/capital-flow.js";
import { CapitalFlowLedger } from "../../src/observatory/capital-flow-ledger.js";
import { InMemoryCapitalFlowStore } from "../../src/observatory/in-memory-capital-flow-store.js";

// #4563 slice 2 — the board reads flows on every /api/board request, so the durable ledger is held
// in memory too, and a newly recorded flow tells its listeners so an open board can re-read.

const flow = (participantId: string, at: string, amount = 300_000): CapitalFlow => ({
  participantId,
  from: at,
  at,
  amount,
  direction: amount >= 0 ? "added" : "removed",
  unexplainedCash: amount,
  basis: "inferred",
});

const SHOW_ALL = { shownFrom: "2026-01-01T00:00:00.000Z" };

describe("CapitalFlowLedger", () => {
  it("holds the durable lines from before this boot once loaded", async () => {
    const store = new InMemoryCapitalFlowStore();
    await store.record(flow("a", "2026-10-05T14:05:00.000Z"));
    const ledger = new CapitalFlowLedger(store, SHOW_ALL);
    expect(ledger.flowsFor("a")).toEqual([]);
    await ledger.load();
    expect(ledger.flowsFor("a").map((f) => f.at)).toEqual(["2026-10-05T14:05:00.000Z"]);
  });

  it("writes through to the store, keeps each participant's flows oldest first", async () => {
    const store = new InMemoryCapitalFlowStore();
    const ledger = new CapitalFlowLedger(store, SHOW_ALL);
    await ledger.record(flow("a", "2026-10-07T14:05:00.000Z"));
    await ledger.record(flow("a", "2026-10-05T14:05:00.000Z"));
    await ledger.record(flow("b", "2026-10-06T14:05:00.000Z"));
    expect(ledger.flowsFor("a").map((f) => f.at)).toEqual([
      "2026-10-05T14:05:00.000Z",
      "2026-10-07T14:05:00.000Z",
    ]);
    expect(await store.list("a")).toHaveLength(2);
    expect(await ledger.list()).toHaveLength(3);
  });

  it("tells each listener about a new flow, until it unsubscribes", async () => {
    const ledger = new CapitalFlowLedger(new InMemoryCapitalFlowStore(), SHOW_ALL);
    const heard: string[] = [];
    const off = ledger.subscribe((f) => heard.push(f.participantId));
    await ledger.record(flow("a", "2026-10-05T14:05:00.000Z"));
    off();
    await ledger.record(flow("b", "2026-10-06T14:05:00.000Z"));
    expect(heard).toEqual(["a"]);
  });

  it("holds nothing it failed to write — the durable ledger stays the source of truth", async () => {
    const failing = {
      record: () => Promise.reject(new Error("disk full")),
      list: () => Promise.resolve([]),
    };
    const ledger = new CapitalFlowLedger(failing, SHOW_ALL);
    await expect(ledger.record(flow("a", "2026-10-05T14:05:00.000Z"))).rejects.toThrow("disk full");
    expect(ledger.flowsFor("a")).toEqual([]);
  });

  it("records every flow but shows none while the marks are held back", async () => {
    const store = new InMemoryCapitalFlowStore();
    const ledger = new CapitalFlowLedger(store, { shownFrom: FLOWS_SHOWN_FROM });
    const heard: string[] = [];
    ledger.subscribe((f) => heard.push(f.participantId));
    await ledger.record(flow("a", "2026-10-19T14:05:00.000Z"));
    expect(FLOWS_SHOWN_FROM).toBeNull();
    expect(await store.list("a")).toHaveLength(1);
    expect(ledger.flowsFor("a")).toEqual([]);
    expect(heard).toEqual([]);
  });

  it("shows only the flows recorded from the tuned instant on, and tells listeners of those alone", async () => {
    const store = new InMemoryCapitalFlowStore();
    await store.record(flow("a", "2026-10-20T14:05:00.000Z"));
    const ledger = new CapitalFlowLedger(store, { shownFrom: "2026-10-26T00:00:00.000Z" });
    await ledger.load();
    const heard: string[] = [];
    ledger.subscribe((f) => heard.push(f.at));
    await ledger.record(flow("a", "2026-10-25T14:05:00.000Z"));
    await ledger.record(flow("a", "2026-10-27T14:05:00.000Z"));
    expect(ledger.flowsFor("a").map((f) => f.at)).toEqual(["2026-10-27T14:05:00.000Z"]);
    expect(heard).toEqual(["2026-10-27T14:05:00.000Z"]);
    expect(await store.list("a")).toHaveLength(3);
  });
});
