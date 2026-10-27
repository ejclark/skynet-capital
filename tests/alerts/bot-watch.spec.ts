import { alertFingerprint } from "../../src/alerts/alert.js";
import {
  BOT_STALL_AFTER_MS,
  BOT_WATCH_SOURCE,
  type BotWatchInput,
  botAlerts,
  durationWords,
} from "../../src/alerts/bot-watch.js";

/**
 * Bot watch (the 2026-10-18 runtime census): a bot that stops cycling, or sits halted by a
 * breaker, during market hours raises one critical alert its owner can be mailed. A closed market
 * raises nothing, a fresh bot raises nothing, and the same stall read twice is the same alert.
 */

const ET_OFFSET_MS = 4 * 3_600_000; // EDT in October
/** Wednesday 2026-10-14, a regular session, at `hh:mm` on New York's clock. */
const wed = (hh: number, mm: number): number => Date.UTC(2026, 9, 14, hh, mm) + ET_OFFSET_MS;
const MIN = 60_000;

const bot = (records: BotWatchInput["records"], over: Partial<BotWatchInput> = {}) => ({
  botId: "sauron",
  name: "Sauron",
  records,
  ...over,
});

describe("botAlerts — a stalled loop during market hours", () => {
  it("raises one critical alert naming the bot and how long it has been quiet", () => {
    const alerts = botAlerts([bot([{ at: wed(10, 45) }])], wed(11, 0));
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      source: BOT_WATCH_SOURCE,
      priority: "critical",
      title: "Sauron has not finished a decision cycle in 15 min",
      data: { botId: "sauron", lastPassAt: wed(10, 45), quietMs: 15 * MIN },
    });
    expect(alerts[0]?.symbol).toBeUndefined();
  });

  it("raises nothing for a bot that passed inside the window, whatever order the records are in", () => {
    const records = [{ at: wed(9, 50) }, { at: wed(10, 58) }, { at: wed(10, 30) }];
    expect(botAlerts([bot(records)], wed(11, 0))).toEqual([]);
    const edge = wed(11, 0) - BOT_STALL_AFTER_MS + 1;
    expect(botAlerts([bot([{ at: edge }])], wed(11, 0))).toEqual([]);
  });

  it("does not count the overnight gap: the clock starts at the open", () => {
    const yesterday = [{ at: Date.UTC(2026, 9, 13, 15, 59) + ET_OFFSET_MS }];
    expect(botAlerts([bot(yesterday)], wed(9, 35))).toEqual([]);
    const [alert] = botAlerts([bot(yesterday)], wed(9, 45));
    expect(alert?.title).toBe(
      "Sauron has not finished a decision cycle since the open, 15 min ago",
    );
  });

  it("makes no claim about a bot with no records at all", () => {
    expect(botAlerts([bot([])], wed(11, 0))).toEqual([]);
  });
});

describe("botAlerts — outside market hours", () => {
  it("raises nothing for a stale or halted bot after the close or on a weekend", () => {
    const stale = bot([{ at: wed(12, 0), halted: "daily-loss" }]);
    expect(botAlerts([stale], wed(17, 0))).toEqual([]);
    const saturday = Date.UTC(2026, 9, 17, 11, 0) + ET_OFFSET_MS;
    expect(botAlerts([stale], saturday)).toEqual([]);
  });
});

describe("botAlerts — a halted safety controller", () => {
  it.each([
    ["daily-loss", "the daily-loss breaker"],
    ["order-rate", "the order-rate breaker"],
    ["errors", "the errors breaker"],
    ["data-gap", "the data-gap breaker"],
    ["manual", "the kill switch"],
  ])("names the %s breaker", (reason, words) => {
    const alerts = botAlerts([bot([{ at: wed(10, 59), halted: reason }])], wed(11, 0));
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      source: BOT_WATCH_SOURCE,
      priority: "critical",
      title: `Sauron is halted by ${words}, so it places no orders`,
      data: { botId: "sauron", breaker: reason },
    });
  });

  it("raises nothing for an owner's own suspend, which is not a breaker", () => {
    const suspended = [{ at: wed(10, 59), halted: "suspended by owner" }];
    expect(botAlerts([bot(suspended)], wed(11, 0))).toEqual([]);
  });

  it("raises both alerts when the newest pass was halted and has gone quiet", () => {
    const alerts = botAlerts([bot([{ at: wed(10, 30), halted: "errors" }])], wed(11, 0));
    expect(alerts.map((a) => a.dedupeKey)).toEqual([
      `stalled:sauron:${wed(10, 30)}`,
      "halted:sauron:errors:2026-10-14",
    ]);
  });
});

describe("botAlerts — dedupe across reads", () => {
  it("keeps ids and fingerprints stable while the same stall or halt stands", () => {
    const stalled = bot([{ at: wed(10, 30) }]);
    const [a] = botAlerts([stalled], wed(11, 0));
    const [b] = botAlerts([stalled], wed(12, 0));
    if (!(a && b)) throw new Error("expected alerts");
    expect(a.id).toBe(b.id);
    expect(alertFingerprint(a)).toBe(alertFingerprint(b));
    // The title carries the growing duration; the fingerprint must not.
    expect(a.title).not.toBe(b.title);

    const [h1] = botAlerts([bot([{ at: wed(10, 59), halted: "data-gap" }])], wed(11, 0));
    const [h2] = botAlerts([bot([{ at: wed(14, 59), halted: "data-gap" }])], wed(15, 0));
    if (!(h1 && h2)) throw new Error("expected alerts");
    expect(h1.id).toBe(h2.id);
    expect(alertFingerprint(h1)).toBe(alertFingerprint(h2));
  });

  it("gives a new stall, a new bot or a new breaker its own alert, so none is silenced", () => {
    const first = botAlerts([bot([{ at: wed(10, 0) }])], wed(10, 30))[0];
    const second = botAlerts([bot([{ at: wed(13, 0) }])], wed(13, 30))[0];
    const other = botAlerts([bot([{ at: wed(10, 0) }], { botId: "gandalf" })], wed(10, 30))[0];
    if (!(first && second && other)) throw new Error("expected alerts");
    const prints = new Set([first, second, other].map(alertFingerprint));
    expect(prints.size).toBe(3);

    const [loss] = botAlerts([bot([{ at: wed(10, 59), halted: "daily-loss" }])], wed(11, 0));
    const [rate] = botAlerts([bot([{ at: wed(10, 59), halted: "order-rate" }])], wed(11, 0));
    if (!(loss && rate)) throw new Error("expected alerts");
    expect(alertFingerprint(loss)).not.toBe(alertFingerprint(rate));
  });
});

describe("durationWords", () => {
  it("rounds down to whole minutes and switches to hours past sixty", () => {
    expect(durationWords(10 * MIN + 59_000)).toBe("10 min");
    expect(durationWords(60 * MIN)).toBe("1 h");
    expect(durationWords(65 * MIN)).toBe("1 h 5 min");
  });
});
