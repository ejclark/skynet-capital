import { type DailyClose, dailyHighReading, underHigh } from "../../src/domain/daily-high.js";
import { DailyHighFeed } from "../../src/playbooks/daily-high-feed.js";

/**
 * The daily reading the long-LEAP play buys on (#6340): the last completed close and the highest
 * close of the 252 sessions ending there — the study's `drawdown`, closes only — and the cache that
 * keeps it fresh without the decision pass ever waiting on the network.
 */

const closes = (values: readonly number[]): DailyClose[] =>
  values.map((c) => ({ t: "2026-01-02T05:00:00Z", c }));
const year = (last: number, peak = 240): DailyClose[] => [
  ...closes(Array.from({ length: 251 }, (_, i) => (i === 100 ? peak : 150))),
  { t: "2026-10-29T04:00:00Z", c: last },
];

describe("dailyHighReading", () => {
  it("reads the last close and the highest close of the last 252 sessions", () => {
    const reading = dailyHighReading(year(200));
    expect(reading).toEqual({ session: "2026-10-29", close: 200, high: 240 });
    expect(underHigh(reading as NonNullable<typeof reading>)).toBeCloseTo(1 / 6);
  });

  it("forgets a high older than 252 sessions", () => {
    const bars = [{ t: "2025-01-02T05:00:00Z", c: 500 }, ...year(200)];
    expect(dailyHighReading(bars)?.high).toBe(240);
  });

  it("reads nothing from less than a year of sessions", () => {
    expect(dailyHighReading(year(200).slice(1))).toBeUndefined();
  });

  it("refuses a year with a broken close in it", () => {
    const bars = year(200);
    bars[50] = { t: "2026-03-01T05:00:00Z", c: 0 };
    expect(dailyHighReading(bars)).toBeUndefined();
  });
});

describe("DailyHighFeed", () => {
  function setup(answers: (readonly DailyClose[] | undefined)[] = [year(200)]) {
    let clock = Date.parse("2026-10-30T15:00:00Z");
    const calls: string[] = [];
    const lines: string[] = [];
    let i = 0;
    const feed = new DailyHighFeed(
      (symbol, start, end) => {
        calls.push(`${symbol} ${start}..${end}`);
        const answer = answers[Math.min(i, answers.length - 1)];
        i += 1;
        return Promise.resolve(answer);
      },
      { now: () => clock, log: (line) => lines.push(line) },
    );
    return { feed, calls, lines, advance: (ms: number) => (clock += ms) };
  }

  it("fetches nothing until a playbook asks for a ticker, then reads completed sessions only", async () => {
    const { feed, calls } = setup();
    await feed.refresh();
    expect(calls).toEqual([]);
    expect(feed.highOf("NVDA")).toBeUndefined();
    await feed.refresh();
    expect(calls).toEqual(["NVDA 2025-09-25..2026-10-29"]);
    expect(feed.highOf("NVDA")).toEqual({ session: "2026-10-29", close: 200, high: 240 });
  });

  it("reads a ticker again only after 30 minutes", async () => {
    const { feed, calls, advance } = setup();
    feed.highOf("NVDA");
    await feed.refresh();
    advance(29 * 60_000);
    await feed.refresh();
    expect(calls).toHaveLength(1);
    advance(60_000);
    await feed.refresh();
    expect(calls).toHaveLength(2);
  });

  it("keeps the last good reading through an outage, and says so once each way", async () => {
    const { feed, lines, advance } = setup([year(200), undefined, undefined, year(190)]);
    feed.highOf("NVDA");
    await feed.refresh();
    for (let n = 0; n < 2; n += 1) {
      advance(31 * 60_000);
      await feed.refresh();
    }
    expect(feed.highOf("NVDA")?.close).toBe(200);
    expect(lines).toEqual([
      "[daily-high] NVDA: no year of daily closes — keeping the last reading",
    ]);
    advance(31 * 60_000);
    await feed.refresh();
    expect(feed.highOf("NVDA")?.close).toBe(190);
    expect(lines.at(-1)).toBe("[daily-high] NVDA: daily closes readable again");
  });
});
