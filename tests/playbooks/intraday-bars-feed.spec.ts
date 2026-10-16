import type { IntradayBar } from "../../src/domain/intraday-bar.js";
import { IntradayBarsFeed } from "../../src/playbooks/intraday-bars-feed.js";

/**
 * The cache behind the dark playbooks' bar reads (#5489): fetches only what a playbook asked for,
 * on its own clock, and keeps the last good bars through an outage.
 */

const bar = (minutes: number): IntradayBar => ({
  date: "2026-10-02",
  minutes,
  open: 1,
  high: 2,
  low: 0.5,
  close: 1.5,
  volume: 10,
});

function setup(answers: Record<string, (readonly IntradayBar[] | undefined)[]> = {}) {
  let clock = Date.parse("2026-10-02T15:00:00Z");
  const calls: string[] = [];
  const lines: string[] = [];
  const seen: Record<string, number> = {};
  const feed = new IntradayBarsFeed(
    (symbol, start, end) => {
      calls.push(`${symbol} ${start}..${end}`);
      const list = answers[symbol] ?? [[bar(570)]];
      const i = seen[symbol] ?? 0;
      seen[symbol] = i + 1;
      return Promise.resolve(list[Math.min(i, list.length - 1)]);
    },
    { now: () => clock, log: (line) => lines.push(line) },
  );
  return {
    feed,
    calls,
    lines,
    advance: (ms: number) => {
      clock += ms;
    },
  };
}

describe("IntradayBarsFeed", () => {
  it("fetches nothing until a playbook asks for a ticker", async () => {
    const { feed, calls } = setup();
    await feed.refresh();
    expect(calls).toEqual([]);
    expect(feed.symbols()).toEqual([]);
  });

  it("answers undefined to the first ask, then the bars once a refresh has run", async () => {
    const { feed, calls } = setup();
    expect(feed.barsOf("MU")).toBeUndefined();
    await feed.refresh();
    expect(feed.barsOf("MU")).toEqual([bar(570)]);
    expect(calls).toHaveLength(1);
    expect(feed.symbols()).toEqual(["MU"]);
  });

  it("asks for about a month of calendar days ending today (UTC date)", async () => {
    const { feed, calls } = setup();
    feed.barsOf("MU");
    await feed.refresh();
    expect(calls).toEqual(["MU 2026-08-31..2026-10-02"]);
  });

  it("reads each asked-for ticker, one at a time, and no others", async () => {
    const { feed, calls } = setup();
    feed.barsOf("MU");
    feed.barsOf("NBIS");
    await feed.refresh();
    expect(calls.map((c) => c.split(" ")[0])).toEqual(["MU", "NBIS"]);
  });

  it("does not read a ticker again before its refresh interval, and does after", async () => {
    const { feed, calls, advance } = setup();
    feed.barsOf("MU");
    await feed.refresh();
    advance(30_000);
    await feed.refresh();
    expect(calls).toHaveLength(1);
    advance(31_000);
    await feed.refresh();
    expect(calls).toHaveLength(2);
  });

  it("shares one run between overlapping refreshes", async () => {
    const { feed, calls } = setup();
    feed.barsOf("MU");
    await Promise.all([feed.refresh(), feed.refresh(), feed.refresh()]);
    expect(calls).toHaveLength(1);
  });

  it("keeps the last good bars through an outage and says so once", async () => {
    const { feed, lines, advance } = setup({ MU: [[bar(570)], undefined, undefined] });
    feed.barsOf("MU");
    await feed.refresh();
    advance(61_000);
    await feed.refresh();
    advance(61_000);
    await feed.refresh();
    expect(feed.barsOf("MU")).toEqual([bar(570)]);
    expect(lines).toEqual(["[intraday-bars] MU: feed unreadable — keeping the last bars it read"]);
  });

  it("says once when the feed comes back, and takes the new bars", async () => {
    const { feed, lines, advance } = setup({ MU: [undefined, [bar(570), bar(575)]] });
    feed.barsOf("MU");
    await feed.refresh();
    expect(feed.barsOf("MU")).toBeUndefined();
    advance(61_000);
    await feed.refresh();
    expect(feed.barsOf("MU")).toEqual([bar(570), bar(575)]);
    expect(lines).toEqual([
      "[intraday-bars] MU: feed unreadable — keeping the last bars it read",
      "[intraday-bars] MU: feed readable again",
    ]);
  });

  it("treats a fetcher that throws as an unreadable feed, never as a failed cycle", async () => {
    const feed = new IntradayBarsFeed(() => Promise.reject(new Error("boom")), {
      log: () => undefined,
    });
    feed.barsOf("MU");
    await expect(feed.refresh()).resolves.toBeUndefined();
    expect(feed.barsOf("MU")).toBeUndefined();
  });

  it("takes an empty answer as a real one: no bars today, not an outage", async () => {
    const { feed, lines } = setup({ MU: [[]] });
    feed.barsOf("MU");
    await feed.refresh();
    expect(feed.barsOf("MU")).toEqual([]);
    expect(lines).toEqual([]);
  });
});
