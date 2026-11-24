import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { AlpacaApiError } from "../../src/alpaca/alpaca-trading-client.js";
import type { NewsArticle } from "../../src/news/alpaca-news-client.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import {
  HELD_NEWS_NOTES,
  HELD_NEWS_PATH,
  type HeldNewsAnswer,
  heldNewsFor,
  serveHeldNewsApi,
} from "../../src/server/held-news-route.js";

/**
 * GET /api/news/held (#8203 slice 2): news on the session's own held names, through its own
 * account's news client, cached 5 minutes per account, one 429 retry, the last good answer on a
 * failure. Account ids are made up; no member is named.
 */

const T0 = new Date("2026-11-24T14:05:00Z");

const story = (id: string, symbols: string[], at = "2026-11-24T13:58:00Z"): NewsArticle => ({
  id,
  headline: `Story ${id}`,
  summary: "",
  symbols,
  createdAt: at,
  url: `https://news.example.com/${id}`,
  source: "benzinga",
});

class FakeNews {
  calls: { symbols: readonly string[]; limit: number; start?: string }[] = [];
  answers: (NewsArticle[] | Error)[] = [];
  gate?: Promise<void>;
  async getNews(symbols: readonly string[], limit = 20, start?: string): Promise<NewsArticle[]> {
    this.calls.push({ symbols, limit, ...(start ? { start } : {}) });
    if (this.gate) await this.gate;
    const next = this.answers.shift() ?? [];
    if (next instanceof Error) throw next;
    return next;
  }
}

const pos = (symbol: string, marketValue: number) => ({
  symbol,
  quantity: 1,
  avgPrice: 1,
  marketValue,
});

function setup(positions: ReturnType<typeof pos>[] = [pos("NVDA", 5000), pos("SPY", 900)]) {
  let now = T0;
  const news = new FakeNews();
  const asked: string[] = [];
  const config = {
    hub: {
      getState: () => ({
        participants: [
          { id: "acct-1", kind: "human", cash: 0, positions },
          { id: "acct-2", kind: "human", cash: 0, positions: [] },
        ],
      }),
    },
    auth: {},
    resolveOwnerId: (email: string) =>
      ({ "one@example.com": "acct-1", "two@example.com": "acct-2" })[email],
    newsClientFor: (id: string) => {
      asked.push(id);
      return id === "acct-1" || id === "acct-2" ? news : undefined;
    },
    now: () => now,
  } as unknown as DashboardServerConfig;
  return { config, news, asked, advance: (ms: number) => (now = new Date(now.getTime() + ms)) };
}

const sleeps: number[] = [];
const sleep = (ms: number) => {
  sleeps.push(ms);
  return Promise.resolve();
};

function fakeRes() {
  const out: { status?: number; body?: string } = {};
  const res = {
    writeHead(status: number) {
      out.status = status;
      return res;
    },
    end(body?: string) {
      out.body = body ?? "";
    },
  } as unknown as ServerResponse;
  return { res, out };
}

function request(url = HELD_NEWS_PATH, method = "GET"): IncomingMessage {
  const req = Readable.from([]) as unknown as IncomingMessage;
  req.method = method;
  req.url = url;
  req.headers = {};
  return req;
}

async function call(config: DashboardServerConfig, session: unknown, url = HELD_NEWS_PATH) {
  const { res, out } = fakeRes();
  const answered = await serveHeldNewsApi(
    request(url),
    res,
    HELD_NEWS_PATH,
    config,
    session as never,
    {
      sleep,
    },
  );
  return { answered, status: out.status, body: JSON.parse(out.body ?? "{}") as HeldNewsAnswer };
}

beforeEach(() => {
  sleeps.length = 0;
});

describe("GET /api/news/held", () => {
  it("answers only its own path and only GET", async () => {
    const { config } = setup();
    const { res } = fakeRes();
    expect(await serveHeldNewsApi(request(), res, "/api/quests", config, undefined)).toBe(false);
    const post = fakeRes();
    await serveHeldNewsApi(request(HELD_NEWS_PATH, "POST"), post.res, HELD_NEWS_PATH, config, {
      email: "one@example.com",
    } as never);
    expect(post.out.status).toBe(405);
  });

  it("returns stories on held names, newest first, on the session's own account", async () => {
    const { config, news, asked } = setup();
    news.answers.push([
      story("1", ["SPY"], "2026-11-23T10:00:00Z"),
      story("2", ["NVDA"]),
      story("3", ["TSLA"]),
    ]);
    const { status, body } = await call(config, { email: "one@example.com" });
    expect(status).toBe(200);
    expect(asked).toEqual(["acct-1"]);
    expect(news.calls[0]?.symbols).toEqual(["NVDA", "SPY"]);
    expect(news.calls[0]?.start).toBe("2026-11-17T14:05:00.000Z");
    expect(body).toEqual({
      asOf: T0.toISOString(),
      held: ["NVDA", "SPY"],
      namesLeftOut: 0,
      items: [
        expect.objectContaining({ id: "alpaca-2", symbols: ["NVDA"] }),
        expect.objectContaining({ id: "alpaca-1", symbols: ["SPY"] }),
      ],
    });
  });

  // Criterion 10: the request names nothing.
  it("ignores any symbol or account named in the request", async () => {
    const { config, news, asked } = setup();
    await call(
      config,
      { email: "one@example.com" },
      `${HELD_NEWS_PATH}?symbols=TSLA&account=acct-2`,
    );
    expect(asked).toEqual(["acct-1"]);
    expect(news.calls[0]?.symbols).toEqual(["NVDA", "SPY"]);
  });

  // Criterion 2.
  it("searches an option contract's underlying", async () => {
    const { config, news } = setup([pos("AAPL261218C00200000", 800)]);
    news.answers.push([story("9", ["AAPL"])]);
    const { body } = await call(config, { email: "one@example.com" });
    expect(news.calls[0]?.symbols).toEqual(["AAPL"]);
    expect(body.items[0]?.symbols).toEqual(["AAPL"]);
  });

  // Criterion 5.
  it("searches the 30 largest names by absolute market value and counts the rest", async () => {
    const many = Array.from({ length: 33 }, (_, n) => pos(`T${n}`, n % 2 ? -n * 100 : n * 100));
    const { config, news } = setup(many);
    const { body } = await call(config, { email: "one@example.com" });
    expect(news.calls[0]?.symbols).toHaveLength(30);
    expect(news.calls[0]?.symbols[0]).toBe("T32");
    expect(news.calls[0]?.symbols).not.toContain("T0");
    expect(body.namesLeftOut).toBe(3);
  });

  // Criterion 6.
  it("makes no feed read for a session with no linked account, and says so", async () => {
    const { config, news } = setup();
    const { status, body } = await call(config, { email: "nobody@example.com" });
    expect(status).toBe(200);
    expect(body).toMatchObject({ items: [], held: [], note: HELD_NEWS_NOTES.unlinked });
    expect(news.calls).toHaveLength(0);
  });

  it("makes no feed read for an account that holds nothing, and says so", async () => {
    const { config, news } = setup();
    const { body } = await call(config, { email: "two@example.com" });
    expect(body).toMatchObject({ items: [], note: HELD_NEWS_NOTES.empty });
    expect(news.calls).toHaveLength(0);
  });

  // Criterion 11: without auth wired there is no session to trust, so no read.
  it("makes no feed read without a session", async () => {
    const { config, news } = setup();
    const { body } = await call(config, undefined);
    expect(body.note).toBe(HELD_NEWS_NOTES.unlinked);
    expect(news.calls).toHaveLength(0);
  });

  it("says plainly when nothing in 7 days names a held name", async () => {
    const { config, news } = setup();
    news.answers.push([story("3", ["TSLA"])]);
    const { body } = await call(config, { email: "one@example.com" });
    expect(body).toMatchObject({ items: [], note: HELD_NEWS_NOTES.quiet });
  });

  // Criterion 12, at the route.
  it("carries no score, stance or suggested action", async () => {
    const { config, news } = setup();
    news.answers.push([story("2", ["NVDA"])]);
    const { body } = await call(config, { email: "one@example.com" });
    expect(Object.keys(body).sort()).toEqual(["asOf", "held", "items", "namesLeftOut"]);
    expect(Object.keys(body.items[0] ?? {}).sort()).toEqual([
      "at",
      "evidence",
      "headline",
      "id",
      "source",
      "symbols",
      "url",
    ]);
  });
});

describe("heldNewsFor's cache and failures", () => {
  // Criterion 7.
  it("answers from cache within 5 minutes for the same names, and reads again after", async () => {
    const { config, news, advance } = setup();
    news.answers.push([story("2", ["NVDA"])], [story("4", ["NVDA"])]);
    const first = await heldNewsFor(config, "acct-1", { sleep });
    advance(4 * 60_000);
    const second = await heldNewsFor(config, "acct-1", { sleep });
    expect(news.calls).toHaveLength(1);
    expect(second).toEqual(first);
    advance(61_000);
    const third = await heldNewsFor(config, "acct-1", { sleep });
    expect(news.calls).toHaveLength(2);
    expect(third.items[0]?.id).toBe("alpaca-4");
  });

  it("shares one read between overlapping requests for one account", async () => {
    const { config, news } = setup();
    let open: () => void = () => undefined;
    news.gate = new Promise((resolve) => {
      open = resolve;
    });
    news.answers.push([story("2", ["NVDA"])]);
    const a = heldNewsFor(config, "acct-1", { sleep });
    const b = heldNewsFor(config, "acct-1", { sleep });
    open();
    const [ra, rb] = await Promise.all([a, b]);
    expect(news.calls).toHaveLength(1);
    expect(rb).toEqual(ra);
  });

  // Criterion 8.
  it("retries a 429 once after 1.1s, and never again", async () => {
    const { config, news } = setup();
    news.answers.push(new AlpacaApiError(429, {}), [story("2", ["NVDA"])]);
    const ok = await heldNewsFor(config, "acct-1", { sleep });
    expect(news.calls).toHaveLength(2);
    expect(sleeps).toEqual([1100]);
    expect(ok.items).toHaveLength(1);

    const fresh = setup();
    fresh.news.answers.push(new AlpacaApiError(429, {}), new AlpacaApiError(429, {}), []);
    const failed = await heldNewsFor(fresh.config, "acct-1", { sleep });
    expect(fresh.news.calls).toHaveLength(2);
    expect(failed.note).toBe(HELD_NEWS_NOTES.failed);
  });

  it("does not retry a failure that is not a 429", async () => {
    const { config, news } = setup();
    news.answers.push(new AlpacaApiError(403, {}), []);
    await heldNewsFor(config, "acct-1", { sleep });
    expect(news.calls).toHaveLength(1);
    expect(sleeps).toEqual([]);
  });

  // Criterion 9.
  it("serves the last good answer marked stale, with its own asOf, when a read fails", async () => {
    const { config, news, advance } = setup();
    news.answers.push([story("2", ["NVDA"])], new Error("network down"));
    const good = await heldNewsFor(config, "acct-1", { sleep });
    advance(6 * 60_000);
    const stale = await heldNewsFor(config, "acct-1", { sleep });
    expect(stale).toEqual({ ...good, stale: true });
    expect(stale.asOf).toBe(T0.toISOString());
  });

  it("says the read failed in words when nothing was cached", async () => {
    const { config, news } = setup();
    news.answers.push(new Error("network down"));
    const answer = await heldNewsFor(config, "acct-1", { sleep });
    expect(answer).toMatchObject({ items: [], note: HELD_NEWS_NOTES.failed });
    expect(answer).not.toHaveProperty("stale");
  });

  // Criterion 13.
  it("shares its cache with the route", async () => {
    const { config, news } = setup();
    news.answers.push([story("2", ["NVDA"])]);
    const direct = await heldNewsFor(config, "acct-1", { sleep });
    const { body } = await call(config, { email: "one@example.com" });
    expect(news.calls).toHaveLength(1);
    expect(body).toEqual(direct);
  });
});
