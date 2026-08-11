import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import { sampleAll, startHistorySampler } from "../../src/observatory/history-sampler.js";
import { InMemoryHistoryStore } from "../../src/observatory/history-store.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";

const p = (over: Partial<ParticipantSnapshot>): ParticipantSnapshot => ({
  id: "x",
  displayName: "X",
  kind: "bot",
  cash: 0,
  equity: 0,
  positions: [],
  ...over,
});

const data = (participants: ParticipantSnapshot[]): DashboardData => ({
  generatedAt: "2026-07-26T15:00:00.000Z",
  participants,
  collisions: [],
});

describe("sampleAll", () => {
  it("maps each live participant to an equity sample (default realizedPl 0)", () => {
    const samples = sampleAll(
      data([
        p({ id: "human-eric", equity: 10_000, cash: 2_000, realizedPl: 500 }),
        p({ id: "news-fader", equity: 20_000, cash: 5_000 }),
      ]),
      "2026-07-26T15:00:00.000Z",
    );
    expect(samples).toEqual([
      {
        at: "2026-07-26T15:00:00.000Z",
        participantId: "human-eric",
        equity: 10_000,
        cash: 2_000,
        realizedPl: 500,
      },
      {
        at: "2026-07-26T15:00:00.000Z",
        participantId: "news-fader",
        equity: 20_000,
        cash: 5_000,
        realizedPl: 0,
      },
    ]);
  });

  it("skips error participants so a failed read never records a false $0 crash", () => {
    const samples = sampleAll(
      data([p({ id: "ok", equity: 100 }), p({ id: "down", error: "unreachable" })]),
      "t",
    );
    expect(samples.map((s) => s.participantId)).toEqual(["ok"]);
  });
});

describe("startHistorySampler", () => {
  it("derives ceremony transitions between consecutive ticks per participant", async () => {
    const store = new InMemoryHistoryStore();
    let state = data([p({ id: "a", equity: 10_000, cash: 5_000, realizedPl: 0 })]);
    const seen: string[] = [];
    let t = 0;
    const stop = startHistorySampler({
      getState: () => state,
      store,
      intervalMs: 10,
      now: () => new Date(Date.UTC(2026, 6, 26, 15, 0, t++)), // strictly increasing ticks
      onTransitions: (transitions) => seen.push(...transitions.map((tr) => tr.type)),
    });
    await new Promise((r) => setTimeout(r, 15)); // first tick: baseline, no transitions
    state = data([p({ id: "a", equity: 10_000, cash: 3_000, realizedPl: 400 })]);
    await new Promise((r) => setTimeout(r, 15)); // second tick: profit booked + capital deployed
    stop();
    expect(seen).toContain("took_profit");
    expect(seen).toContain("deployed_capital");
  });

  it("appends a sample per live participant on each tick, and stop() halts it", async () => {
    const store = new InMemoryHistoryStore();
    const state = data([p({ id: "a", equity: 1 }), p({ id: "b", equity: 2 })]);
    const stop = startHistorySampler({
      getState: () => state,
      store,
      intervalMs: 10,
      now: () => new Date("2026-07-26T15:00:00.000Z"),
    });
    await new Promise((r) => setTimeout(r, 35)); // ~3 ticks
    stop();
    const after = (await store.list()).length;
    expect(after).toBeGreaterThanOrEqual(4); // at least 2 ticks × 2 participants
    await new Promise((r) => setTimeout(r, 25));
    expect((await store.list()).length).toBe(after); // no growth after stop
  });
});
