import { marketClockView, tableDays } from "../../../src/domain/market-clock";
import {
  currentMarketClock,
  parseMarketClock,
  refreshMarketClock,
  resetMarketClock,
} from "../../src/live/market-clock";

/**
 * The shell's one read of `GET /api/market/clock` (#8248 PR 2): a half-read answer is no answer,
 * and the read repeats when the broker's phase ends or 15 minutes pass, whichever is first.
 */

const NOW = new Date("2026-11-24T15:00:00Z"); // Tue 10:00 AM ET
const view = (phaseUntil?: string) => ({
  ...marketClockView(tableDays("2026-11-24", "2026-12-24"), NOW, "broker"),
  ...(phaseUntil ? { phase: "core" as const, phaseUntil } : {}),
});

describe("parseMarketClock", () => {
  it("takes the route's body", () => {
    expect(parseMarketClock(view())?.days[0]?.date).toBe("2026-11-24");
  });

  it("refuses anything not that shape, whole", () => {
    expect(parseMarketClock({})).toBeUndefined();
    expect(parseMarketClock({ ...view(), source: "guess" })).toBeUndefined();
    const days = [
      ...view().days,
      { date: "2026-12-25", openAt: "x", closeAt: "y", halfDay: false },
    ];
    expect(parseMarketClock({ ...view(), days })).toBeUndefined();
  });
});

describe("refreshMarketClock", () => {
  const realFetch = globalThis.fetch;
  let calls = 0;
  let body: unknown;
  beforeEach(() => {
    resetMarketClock();
    calls = 0;
    globalThis.fetch = (() => {
      calls += 1;
      return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
    }) as typeof fetch;
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
  });
  const settle = () => new Promise((done) => setTimeout(done, 0));
  const t = NOW.getTime();

  it("reads once, then again when the phase ends", async () => {
    body = view(new Date(t + 5 * 60_000).toISOString());
    refreshMarketClock(t);
    refreshMarketClock(t); // one read in flight
    await settle();
    expect(calls).toBe(1);
    expect(currentMarketClock()?.source).toBe("broker");
    refreshMarketClock(t + 4 * 60_000);
    expect(calls).toBe(1);
    refreshMarketClock(t + 6 * 60_000); // the phase ended
    await settle();
    expect(calls).toBe(2);
  });

  it("reads again after 15 minutes when no phase was given", async () => {
    body = view();
    refreshMarketClock(t);
    await settle();
    refreshMarketClock(t + 14 * 60_000);
    expect(calls).toBe(1);
    refreshMarketClock(t + 16 * 60_000);
    await settle();
    expect(calls).toBe(2);
  });

  it("keeps the last good answer through a failed read, and waits a minute to try again", async () => {
    body = view();
    refreshMarketClock(t);
    await settle();
    body = { not: "a clock" };
    refreshMarketClock(t + 16 * 60_000);
    await settle();
    expect(calls).toBe(2);
    expect(currentMarketClock()?.source).toBe("broker");
    refreshMarketClock(t + 16 * 60_000 + 30_000); // inside the minute's back-off
    expect(calls).toBe(2);
    refreshMarketClock(t + 17 * 60_000 + 1);
    await settle();
    expect(calls).toBe(3);
  });
});
