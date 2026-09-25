import { ScriptedAtmQuotes } from "../../src/adapters/scripted-atm-quotes.js";
import { InMemoryIvHistory } from "../../src/research/in-memory-iv-history.js";
import { JsonlIvHistoryStore } from "../../src/research/iv-history-store.js";
import type { IvTickReport } from "../../src/research/iv-instrument.js";
import { createIvHistoryStore, sampleDue, startIvSampler } from "../../src/research/iv-sampler.js";

/**
 * The IV clock: one sample per trading day, in the session's last half hour — never twice a day,
 * never outside the session, and never onto a disk the next deploy erases.
 */

const at = (iso: string) => new Date(iso);

describe("sampleDue", () => {
  it("falls due in the last half hour of a regular session", () => {
    expect(sampleDue(at("2026-09-25T19:40:00Z"), undefined)).toBe(true); // 3:40 PM ET
  });

  it("is not due earlier in the day, after the bell, or on a weekend", () => {
    expect(sampleDue(at("2026-09-25T19:00:00Z"), undefined)).toBe(false); // 3:00 PM ET
    expect(sampleDue(at("2026-09-25T20:10:00Z"), undefined)).toBe(false); // 4:10 PM ET
    expect(sampleDue(at("2026-09-26T19:40:00Z"), undefined)).toBe(false); // Saturday
  });

  it("follows an early close without a second copy of the calendar", () => {
    // 2026-11-27 closes at 1:00 PM ET: due at 12:40, not at 3:40.
    expect(sampleDue(at("2026-11-27T17:40:00Z"), undefined)).toBe(true);
    expect(sampleDue(at("2026-11-27T20:40:00Z"), undefined)).toBe(false);
  });

  it("is not due again once today is recorded", () => {
    expect(sampleDue(at("2026-09-25T19:50:00Z"), "2026-09-25")).toBe(false);
    expect(sampleDue(at("2026-09-28T19:50:00Z"), "2026-09-25")).toBe(true);
  });
});

describe("createIvHistoryStore", () => {
  it("has no relative default — unset means the clock is off, with the reason", () => {
    const resolved = createIvHistoryStore({});
    expect("reason" in resolved && resolved.reason).toMatch(/unset/);
  });

  it("refuses a directory off the Fly volume", () => {
    const resolved = createIvHistoryStore({
      FLY_APP_NAME: "skynet",
      SKYNET_IV_HISTORY_DIR: "data/iv-history",
    });
    expect("reason" in resolved && resolved.reason).toMatch(/off the \/data volume/);
  });

  it("opens the JSONL store on the volume", () => {
    const resolved = createIvHistoryStore({
      FLY_APP_NAME: "skynet",
      SKYNET_IV_HISTORY_DIR: "/data/iv-history",
    });
    expect("store" in resolved && resolved.store).toBeInstanceOf(JsonlIvHistoryStore);
  });
});

describe("startIvSampler", () => {
  const quotes = new ScriptedAtmQuotes([
    { symbol: "CRWV", spot: 100, strike: 100, daysToExpiry: 30, type: "call", midPrice: 9 },
  ]);

  async function until(done: () => boolean, ms = 500): Promise<void> {
    const end = Date.now() + ms;
    while (!done() && Date.now() < end) await new Promise((r) => setTimeout(r, 5));
  }

  it("records the day once, however many checks land in the window", async () => {
    const store = new InMemoryIvHistory();
    const ticks: IvTickReport[] = [];
    const stop = startIvSampler({
      quotes,
      store,
      intervalMs: 5,
      now: () => at("2026-09-25T19:40:00Z"),
      onTick: (r) => ticks.push(r),
    });
    await until(() => ticks.length > 0);
    await new Promise((r) => setTimeout(r, 40));
    stop();
    expect(ticks).toHaveLength(1);
    expect((await store.list("CRWV")).map((s) => s.symbol)).toEqual(["CRWV"]);
  });

  it("does not re-record a day already in the store after a restart", async () => {
    const store = new InMemoryIvHistory();
    await store.save({
      at: "2026-09-25T19:35:00.000Z",
      symbol: "CRWV",
      atmIv: 0.8,
      spot: 100,
      daysToExpiry: 30,
    });
    const ticks: IvTickReport[] = [];
    const stop = startIvSampler({
      quotes,
      store,
      intervalMs: 5,
      now: () => at("2026-09-25T19:50:00Z"),
      onTick: (r) => ticks.push(r),
    });
    await new Promise((r) => setTimeout(r, 40));
    stop();
    expect(ticks).toHaveLength(0);
    expect(await store.list("CRWV")).toHaveLength(1);
  });

  it("retries a tick that recorded nothing instead of writing the day off", async () => {
    const store = new InMemoryIvHistory();
    const ticks: IvTickReport[] = [];
    const stop = startIvSampler({
      quotes: new ScriptedAtmQuotes([]),
      store,
      intervalMs: 5,
      now: () => at("2026-09-25T19:40:00Z"),
      onTick: (r) => ticks.push(r),
    });
    await until(() => ticks.length >= 2);
    stop();
    expect(ticks.length).toBeGreaterThanOrEqual(2);
    expect(ticks[0]?.unquoted.length).toBeGreaterThan(0);
  });
});
