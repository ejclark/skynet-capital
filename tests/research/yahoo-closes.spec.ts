import { closesFor, dailyCloses, type FetchLike } from "../../src/research/yahoo-closes.js";

// #8252: the one Yahoo fetch the edition's two writers share. A bar is dated by its New York day,
// a 429 is waited out, and a close that did not come back is an error naming it, never a gap.

/** 2026-11-23 and 2026-11-24 at 9:30 AM ET (14:30 UTC), as Yahoo stamps a daily bar. */
const MON = Date.parse("2026-11-23T14:30:00Z") / 1000;
const TUE = Date.parse("2026-11-24T14:30:00Z") / 1000;

const chart = (close: (number | null)[]) =>
  new Response(
    JSON.stringify({
      chart: { result: [{ timestamp: [MON, TUE], indicators: { quote: [{ close }] } }] },
    }),
  );

const noWait = async (): Promise<void> => undefined;

describe("dailyCloses", () => {
  it("reads one close per New York day, rounded to cents", async () => {
    const fetchImpl: FetchLike = async () => chart([100.123, 101.456]);
    expect(await dailyCloses("NVDA", ["2026-11-23", "2026-11-24"], fetchImpl, noWait)).toEqual({
      "2026-11-23": 100.12,
      "2026-11-24": 101.46,
    });
  });

  it("waits out a 429 and retries", async () => {
    let calls = 0;
    const fetchImpl: FetchLike = async () =>
      ++calls < 3 ? new Response("", { status: 429 }) : chart([1, 2]);
    await dailyCloses("NVDA", ["2026-11-24"], fetchImpl, noWait);
    expect(calls).toBe(3);
  });

  it("names the symbol and the day when a close is missing", async () => {
    const fetchImpl: FetchLike = async () => chart([100, null]);
    await expect(
      dailyCloses("SMH", ["2026-11-23", "2026-11-24"], fetchImpl, noWait),
    ).rejects.toThrow("SMH: no close on 2026-11-24");
  });
});

describe("closesFor", () => {
  it("tries every symbol and names every failure at once", async () => {
    const fetchImpl: FetchLike = async (url) =>
      url.includes("/AMD?") ? new Response("", { status: 404 }) : chart([1, 2]);
    const got = await closesFor(["NVDA", "AMD", "MU"], ["2026-11-24"], fetchImpl, noWait);
    expect(Object.keys(got.closes)).toEqual(["NVDA", "MU"]);
    expect(got.failed).toEqual([expect.stringMatching(/^AMD: .* -> 404$/)]);
  });
});
