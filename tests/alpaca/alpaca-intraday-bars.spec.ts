import { alpacaIntradayBars } from "../../src/alpaca/alpaca-intraday-bars.js";
import type { JsonResponse } from "../../src/http/fetch-json.js";

/**
 * The 5-minute bar read (#5489): Alpaca's data host, the free IEX feed, regular hours in ET. A fake
 * transport that can ONLY `get` — the reader is handed no other verb.
 */

const bar = (t: string, o = 100, h = 101, l = 99, c = 100.5, v = 1000) => ({ t, o, h, l, c, v });

function transport(pages: readonly (JsonResponse | Error)[]) {
  const paths: string[] = [];
  let next = 0;
  return {
    paths,
    get: (path: string): Promise<JsonResponse> => {
      paths.push(path);
      const page = pages[Math.min(next, pages.length - 1)];
      next += 1;
      if (page instanceof Error) return Promise.reject(page);
      if (!page) return Promise.reject(new Error("no page"));
      return Promise.resolve(page);
    },
  };
}

const ok = (bars: unknown[], next_page_token: string | null = null): JsonResponse => ({
  status: 200,
  body: { bars, next_page_token },
});

describe("alpacaIntradayBars", () => {
  it("asks the data host for 5-minute IEX bars, split-adjusted, oldest first", async () => {
    const t = transport([ok([])]);
    await alpacaIntradayBars(t)("MU", "2026-09-15", "2026-10-16");
    const url = new URL(`https://data.test${t.paths[0]}`);
    expect(url.pathname).toBe("/v2/stocks/MU/bars");
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      timeframe: "5Min",
      feed: "iex",
      adjustment: "split",
      sort: "asc",
      start: "2026-09-15T00:00:00Z",
      end: "2026-10-16T23:59:59Z",
    });
  });

  it("builds ET date and start minutes from the UTC stamp, across a clock change", async () => {
    const t = transport([
      ok([bar("2026-10-02T13:30:00Z"), bar("2026-12-02T14:30:00Z"), bar("2026-12-02T14:35:00Z")]),
    ]);
    const bars = await alpacaIntradayBars(t)("MU", "2026-10-01", "2026-12-03");
    expect(bars?.map((b) => [b.date, b.minutes])).toEqual([
      ["2026-10-02", 570],
      ["2026-12-02", 570],
      ["2026-12-02", 575],
    ]);
    expect(bars?.[0]).toEqual({
      date: "2026-10-02",
      minutes: 570,
      open: 100,
      high: 101,
      low: 99,
      close: 100.5,
      volume: 1000,
    });
  });

  it("keeps regular hours only: nothing before 9:30, nothing from 16:00", async () => {
    const t = transport([
      ok([
        bar("2026-10-02T13:25:00Z"), // 9:25 pre-market
        bar("2026-10-02T13:30:00Z"), // 9:30 first bar
        bar("2026-10-02T19:55:00Z"), // 15:55 last bar
        bar("2026-10-02T20:00:00Z"), // 16:00 after-market
      ]),
    ]);
    const bars = await alpacaIntradayBars(t)("MU", "2026-10-02", "2026-10-02");
    expect(bars?.map((b) => b.minutes)).toEqual([570, 955]);
  });

  it("drops a bar missing any field whole, never completing it from a neighbour", async () => {
    const t = transport([
      ok([
        bar("2026-10-02T13:30:00Z"),
        { t: "2026-10-02T13:35:00Z", o: 100, h: 101, l: 99, c: 100 }, // no volume
        { t: "2026-10-02T13:40:00Z", o: 100, h: "101", l: 99, c: 100, v: 5 }, // high not a number
        { o: 100, h: 101, l: 99, c: 100, v: 5 }, // no time
        bar("not a time"),
        bar("2026-10-02T13:45:00Z"),
      ]),
    ]);
    const bars = await alpacaIntradayBars(t)("MU", "2026-10-02", "2026-10-02");
    expect(bars?.map((b) => b.minutes)).toEqual([570, 585]);
  });

  it("follows the page token to the newest bars and returns the whole window sorted", async () => {
    const t = transport([
      ok([bar("2026-10-02T13:30:00Z")], "tok-1"),
      ok([bar("2026-10-02T13:35:00Z")]),
    ]);
    const bars = await alpacaIntradayBars(t)("MU", "2026-10-02", "2026-10-02");
    expect(bars?.map((b) => b.minutes)).toEqual([570, 575]);
    expect(t.paths).toHaveLength(2);
    expect(new URL(`https://data.test${t.paths[1]}`).searchParams.get("page_token")).toBe("tok-1");
  });

  it("calls a window it could not read to the end unreadable, not a window that stops short", async () => {
    const t = transport([ok([bar("2026-10-02T13:30:00Z")], "again")]);
    expect(await alpacaIntradayBars(t)("MU", "2026-10-02", "2026-10-02")).toBeUndefined();
    expect(t.paths).toHaveLength(3);
  });

  it("answers an empty list for a real answer of no bars, and undefined for an unreadable feed", async () => {
    expect(await alpacaIntradayBars(transport([ok([])]))("MU", "2026-10-02", "2026-10-02")).toEqual(
      [],
    );
    expect(
      await alpacaIntradayBars(transport([{ status: 200, body: null }]))("MU", "a", "b"),
    ).toEqual([]);
    expect(
      await alpacaIntradayBars(transport([{ status: 429, body: {} }]))("MU", "a", "b"),
    ).toBeUndefined();
    expect(
      await alpacaIntradayBars(transport([new Error("socket hang up")]))("MU", "a", "b"),
    ).toBeUndefined();
  });

  it("is handed a read and nothing else: no verb that places an order exists on its seam", async () => {
    // A transport whose every other verb explodes — the reader would fail if it ever reached one.
    const guarded = {
      get: () => Promise.resolve(ok([bar("2026-10-02T13:30:00Z")])),
      post: () => {
        throw new Error("post");
      },
      delete: () => {
        throw new Error("delete");
      },
      patch: () => {
        throw new Error("patch");
      },
    };
    const bars = await alpacaIntradayBars(guarded)("MU", "2026-10-02", "2026-10-02");
    expect(bars).toHaveLength(1);
  });
});
