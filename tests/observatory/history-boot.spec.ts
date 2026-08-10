import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import {
  bootSamples,
  createBootHistoryStore,
  latestByParticipant,
  rehydrateHistory,
  seedRealizedPl,
  seedSampleRecorder,
} from "../../src/observatory/history-boot.js";
import {
  type EquitySample,
  InMemoryHistoryStore,
  JsonlHistoryStore,
} from "../../src/observatory/history-store.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";

const snapshot = (over: Partial<ParticipantSnapshot> = {}): ParticipantSnapshot => ({
  id: "human-eric",
  displayName: "Eric",
  kind: "human",
  cash: 5_000,
  equity: 12_000,
  positions: [],
  ...over,
});

const data = (participants: ParticipantSnapshot[]): DashboardData => ({
  generatedAt: "2026-08-10T00:00:00.000Z",
  participants,
});

const sample = (over: Partial<EquitySample> = {}): EquitySample => ({
  at: "2026-08-09T23:55:00.000Z",
  participantId: "human-eric",
  equity: 12_000,
  cash: 5_000,
  realizedPl: 420,
  ...over,
});

describe("when the dashboard boots with durable history", () => {
  it("seeds cumulative realized P/L from the newest sample", async () => {
    const store = new InMemoryHistoryStore();
    await store.save(sample({ at: "2026-08-09T20:00:00.000Z", realizedPl: 100 }));
    await store.save(sample({ at: "2026-08-09T23:55:00.000Z", realizedPl: 420 }));

    const seeded = await rehydrateHistory(store, data([snapshot()]), () => new Date("2026-08-10"));

    expect(seeded.participants[0]?.realizedPl).toBe(420);
  });

  it("picks the newest sample by timestamp, not by position (list order is not guaranteed)", () => {
    const latest = latestByParticipant([
      sample({ at: "2026-08-09T23:55:00.000Z", realizedPl: 420 }),
      sample({ at: "2026-08-09T20:00:00.000Z", realizedPl: 100 }),
    ]);

    expect(latest.get("human-eric")?.realizedPl).toBe(420);
  });

  it("leaves realized P/L at the honest default when a participant has no history", async () => {
    const seeded = await rehydrateHistory(new InMemoryHistoryStore(), data([snapshot()]));

    expect(seeded.participants[0]?.realizedPl).toBeUndefined();
  });

  it("keeps a value the snapshot already carries — a folded fill is fresher than any sample", () => {
    const seeded = seedRealizedPl(data([snapshot({ realizedPl: 999 })]), [
      sample({ realizedPl: 420 }),
    ]);

    expect(seeded.participants[0]?.realizedPl).toBe(999);
  });

  it("writes one synchronization sample per participant as the fresh baseline", async () => {
    const store = new InMemoryHistoryStore();
    await store.save(sample({ realizedPl: 420 }));

    await rehydrateHistory(store, data([snapshot()]), () => new Date("2026-08-10T00:05:00.000Z"));
    const written = await store.list("human-eric");

    expect(written.at(-1)).toMatchObject({ at: "2026-08-10T00:05:00.000Z", realizedPl: 420 });
  });

  it("skips error snapshots so a failed account read never records a false $0", () => {
    const samples = bootSamples(
      data([snapshot(), snapshot({ id: "bot-sauron", error: "read failed" })]),
      "2026-08-10T00:05:00.000Z",
    );

    expect(samples.map((s) => s.participantId)).toEqual(["human-eric"]);
  });

  it("carries no realized-P/L cliff across a restart", async () => {
    const store = new InMemoryHistoryStore();
    // First run books realized profit; the sampler records it.
    await store.save(sample({ at: "2026-08-09T23:55:00.000Z", realizedPl: 420 }));

    // The restart: a fresh Alpaca read carries no realizedPl at all.
    const rebooted = await rehydrateHistory(
      store,
      data([snapshot()]),
      () => new Date("2026-08-10"),
    );
    const recorded = (await store.list("human-eric")).map((s) => s.realizedPl);

    expect(rebooted.participants[0]?.realizedPl).toBe(420);
    expect(recorded).not.toContain(0);
  });
});

describe("when a participant re-onboards after their history survived a store wipe", () => {
  it("does not write a zero seed sample over their existing record", async () => {
    const store = new InMemoryHistoryStore();
    await store.save(sample({ realizedPl: 420 }));

    seedSampleRecorder(store)(snapshot(), "2026-08-10T01:00:00.000Z");
    await new Promise((resolve) => setImmediate(resolve));

    expect((await store.list("human-eric")).map((s) => s.realizedPl)).toEqual([420]);
  });

  it("records the founding sample for a genuinely new participant", async () => {
    const store = new InMemoryHistoryStore();

    seedSampleRecorder(store)(snapshot({ id: "human-bob" }), "2026-08-10T01:00:00.000Z");
    await new Promise((resolve) => setImmediate(resolve));

    expect(await store.list("human-bob")).toHaveLength(1);
  });
});

describe("when the server runs offline against looping fixtures", () => {
  it("uses an in-memory store so replayed sells never compound into durable history", async () => {
    const store = createBootHistoryStore({ SKYNET_HISTORY_DIR: "data/history" }, "offline");

    expect(store).toBeInstanceOf(InMemoryHistoryStore);
    expect(await store.list()).toEqual([]);
  });

  it("uses the durable store in live mode", () => {
    const store = createBootHistoryStore({ SKYNET_HISTORY_DIR: "data/history" }, "live");

    expect(store).toBeInstanceOf(JsonlHistoryStore);
  });

  it("renders identical realized P/L on two consecutive boots", async () => {
    const boot = async () => {
      const store = createBootHistoryStore({}, "offline");
      const seeded = await rehydrateHistory(store, data([snapshot({ realizedPl: 230 })]));
      return seeded.participants[0]?.realizedPl;
    };

    expect(await boot()).toBe(await boot());
  });
});
