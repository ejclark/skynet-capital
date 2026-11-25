import type { ServerResponse } from "node:http";
import type { Bar } from "../../src/alpaca/alpaca-options-client.js";
import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import {
  buildPuzzle,
  moveAround,
  PUZZLE_QUESTION,
  PuzzleCache,
  puzzlePrints,
  servePracticePuzzle,
} from "../../src/server/practice-puzzle.js";

/**
 * The newcomer puzzle (#8250): every digit from the calendar and the bars, the move spanning the
 * right two sessions, and the answer the largest move either way.
 */

const bar = (t: string, c: number): Bar => ({ t: `${t}T04:00:00Z`, o: c, h: c, l: c, c, v: 1 });
const print = (symbol: string, date: string, source = "IR: after the close"): EarningsPrint => ({
  symbol,
  date,
  status: "confirmed",
  source,
});

describe("moveAround", () => {
  it("after the close: the report day's close against the next session's", () => {
    const name = moveAround(print("NVDA", "2026-11-17"), [
      bar("2026-11-14", 90),
      bar("2026-11-17", 100),
      bar("2026-11-18", 108),
      bar("2026-11-20", 110),
    ]);
    expect(name).toMatchObject({
      beforeDate: "2026-11-17",
      beforeClose: 100,
      afterDate: "2026-11-18",
      afterClose: 108,
      movePct: 8,
      timing: "after-close",
      lastClose: 110,
      lastCloseDate: "2026-11-20",
    });
  });

  it("before the open: the prior session's close against the report day's", () => {
    const name = moveAround(print("X", "2026-11-17", "IR: results before the market open"), [
      bar("2026-11-13", 50),
      bar("2026-11-16", 50),
      bar("2026-11-17", 45),
    ]);
    expect(name).toMatchObject({ beforeDate: "2026-11-16", afterDate: "2026-11-17", movePct: -10 });
  });

  it("is undefined when a session is missing — never a guessed move", () => {
    expect(moveAround(print("NVDA", "2026-11-17"), [bar("2026-11-17", 100)])).toBeUndefined();
    expect(moveAround(print("NVDA", "2026-11-17"), [bar("2026-11-18", 100)])).toBeUndefined();
  });
});

describe("puzzlePrints", () => {
  it("takes the latest confirmed, already-reported print per campaign name, newest first", () => {
    const prints = puzzlePrints("2026-11-24", [
      print("NVDA", "2026-08-26"),
      print("NVDA", "2026-11-17"),
      print("MSFT", "2026-10-28"),
      { ...print("AVGO", "2026-09-02"), status: "estimate" },
      print("AAPL", "2026-10-29"),
      print("MU", "2026-12-17"),
    ]);
    expect(prints.map((p) => `${p.symbol} ${p.date}`)).toEqual([
      "NVDA 2026-11-17",
      "MSFT 2026-10-28",
    ]);
  });
});

describe("buildPuzzle", () => {
  const bars: Record<string, Bar[]> = {
    AMZN: [bar("2026-10-29", 200), bar("2026-10-30", 218)],
    GOOG: [bar("2026-10-28", 180), bar("2026-10-29", 187.2)],
    META: [bar("2026-10-21", 600), bar("2026-10-22", 576)],
    MSFT: [bar("2026-10-28", 400), bar("2026-10-29", 406)],
  };
  const data = {
    source: "test bars",
    bars: (symbol: string) => Promise.resolve(bars[symbol]),
  };

  it("names the largest move either way, lists names alphabetically, and cites the source", async () => {
    const puzzle = await buildPuzzle(data, new Date("2026-11-09T14:00:00Z"));
    expect(puzzle?.question).toBe(PUZZLE_QUESTION);
    expect(puzzle?.names.map((n) => n.symbol)).toEqual(["AMZN", "GOOG", "META", "MSFT"]);
    expect(puzzle?.answer).toBe("AMZN");
    expect(puzzle?.source).toBe("test bars");
    expect(puzzle?.readAt).toBe("2026-11-09T14:00:00.000Z");
  });

  it("is undefined with fewer than three names on the feed", async () => {
    const thin = {
      source: "s",
      bars: (s: string) => Promise.resolve(s === "AMZN" ? bars.AMZN : undefined),
    };
    expect(await buildPuzzle(thin, new Date("2026-11-09T14:00:00Z"))).toBeUndefined();
  });

  it("caches one read per day and retries after a failed one", async () => {
    let reads = 0;
    let fail = true;
    const counted = {
      source: "s",
      bars: (s: string) => {
        reads += 1;
        return Promise.resolve(fail ? undefined : bars[s]);
      },
    };
    const cache = new PuzzleCache();
    const day = new Date("2026-11-09T14:00:00Z");
    expect(await cache.read(counted, day)).toBeUndefined();
    await Promise.resolve();
    fail = false;
    expect(await cache.read(counted, day)).toBeDefined();
    const after = reads;
    await cache.read(counted, day);
    expect(reads).toBe(after);
  });
});

describe("servePracticePuzzle", () => {
  function fakeRes() {
    const out: { body?: string } = {};
    const res = {
      writeHead: () => res,
      end: (body?: string) => {
        out.body = body;
      },
    } as unknown as ServerResponse;
    return { res, out };
  }

  it("answers an honest note when no data login is wired", async () => {
    const { res, out } = fakeRes();
    expect(await servePracticePuzzle(res, "/api/practice/puzzle", {})).toBe(true);
    expect(JSON.parse(out.body ?? "{}").note).toContain("isn't available");
  });

  it("ignores other paths", async () => {
    expect(await servePracticePuzzle(fakeRes().res, "/api/join", {})).toBe(false);
  });
});
