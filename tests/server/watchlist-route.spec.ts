import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { WatchlistPort } from "../../src/ports/watchlist.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveWatchlistApi, WATCHLIST_PATH } from "../../src/server/watchlist-route.js";
import { foldWatchlistLines, WATCHLIST_LIMIT } from "../../src/trading/watchlist.js";

/**
 * The watchlist API (#3407 P4 / #4332): identity is the session's and there is no parameter for
 * it, a toggle sends the desired STATE so a double tap is idempotent, every answer carries the
 * whole list, the cap refuses in words, and an unwired deployment says so rather than accepting
 * names it cannot keep.
 */

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

function get(url = WATCHLIST_PATH): IncomingMessage {
  const req = Readable.from([]) as unknown as IncomingMessage;
  req.method = "GET";
  req.url = url;
  req.headers = {};
  return req;
}

function post(body: unknown): IncomingMessage {
  const req = Readable.from([JSON.stringify(body)]) as unknown as IncomingMessage;
  req.method = "POST";
  req.url = WATCHLIST_PATH;
  req.headers = { "content-type": "application/json" };
  return req;
}

const json = (out: { body?: string }): Record<string, unknown> => JSON.parse(out.body ?? "{}");
const symbols = (out: { body?: string }): string[] =>
  ((json(out).watching ?? []) as { symbol: string }[]).map((row) => row.symbol);

/** An append-only ledger in memory, folded by the same function the durable store uses — so this
 *  fake can't diverge from the real adapter's read semantics. */
function fakeStore(seed: readonly string[] = []) {
  const lines: { symbol: string; at: string; removed?: boolean }[] = seed.map((symbol) => ({
    symbol,
    at: "2026-10-01T00:00:00.000Z",
  }));
  const port: WatchlistPort = {
    load: (memberId) => Promise.resolve(memberId === "human-ann" ? foldWatchlistLines(lines) : []),
    add: (_memberId, symbol) => {
      lines.push({ symbol, at: "2026-10-04T14:00:00.000Z" });
      return Promise.resolve();
    },
    remove: (_memberId, symbol) => {
      lines.push({ symbol, at: "2026-10-04T14:00:00.000Z", removed: true });
      return Promise.resolve();
    },
  };
  return { port, lines };
}

function config(over: Record<string, unknown> = {}): DashboardServerConfig {
  return {
    auth: {},
    resolveOwnerId: (email: string) => (email === "ann@x.com" ? "human-ann" : undefined),
    now: () => new Date("2026-10-04T14:00:00Z"),
    ...over,
  } as unknown as DashboardServerConfig;
}

const ann = { email: "ann@x.com" } as never;
const stranger = { email: "nobody@x.com" } as never;

describe("serveWatchlistApi", () => {
  it("claims only its own path", async () => {
    const { res } = fakeRes();
    expect(
      await serveWatchlistApi(get("/api/trade/quote"), res, "/api/trade/quote", config(), ann),
    ).toBe(false);
  });

  it("lists the member's own names, with the cap beside them", async () => {
    const { res, out } = fakeRes();
    const store = fakeStore(["NVDA", "AAPL"]);
    await serveWatchlistApi(get(), res, WATCHLIST_PATH, config({ watchlist: store.port }), ann);
    expect(out.status).toBe(200);
    expect(json(out).available).toBe(true);
    expect(json(out).limit).toBe(WATCHLIST_LIMIT);
    expect(symbols(out)).toEqual(["NVDA", "AAPL"]);
  });

  it("says in words that nothing is stored, rather than listing an empty list as if it were one", async () => {
    const { res, out } = fakeRes();
    await serveWatchlistApi(get(), res, WATCHLIST_PATH, config(), ann);
    expect(json(out).available).toBe(false);
    expect(String(json(out).reason)).toMatch(/aren't stored/);
  });

  it("says in words when the session is linked to no account", async () => {
    const { res, out } = fakeRes();
    const store = fakeStore(["NVDA"]);
    await serveWatchlistApi(
      get(),
      res,
      WATCHLIST_PATH,
      config({ watchlist: store.port }),
      stranger,
    );
    expect(json(out).available).toBe(false);
    expect(String(json(out).reason)).toMatch(/isn't linked/);
    expect(symbols(out)).toEqual([]);
  });

  it("adds a name and answers with the whole list", async () => {
    const { res, out } = fakeRes();
    const store = fakeStore(["NVDA"]);
    await serveWatchlistApi(
      post({ symbol: "tsla", watching: true }),
      res,
      WATCHLIST_PATH,
      config({ watchlist: store.port }),
      ann,
    );
    expect(json(out).ok).toBe(true);
    expect(symbols(out)).toEqual(["NVDA", "TSLA"]);
    // Normalized before it is stored, so the ledger holds one spelling of a name.
    expect(store.lines.at(-1)).toMatchObject({ symbol: "TSLA" });
  });

  it("removes a name on the same verb, sending the state the member wants", async () => {
    const { res, out } = fakeRes();
    const store = fakeStore(["NVDA", "AAPL"]);
    await serveWatchlistApi(
      post({ symbol: "NVDA", watching: false }),
      res,
      WATCHLIST_PATH,
      config({ watchlist: store.port }),
      ann,
    );
    expect(json(out).ok).toBe(true);
    expect(symbols(out)).toEqual(["AAPL"]);
    expect(store.lines.at(-1)).toMatchObject({ symbol: "NVDA", removed: true });
  });

  it("writes nothing on a second tap for the state already held", async () => {
    const store = fakeStore(["NVDA"]);
    const before = store.lines.length;
    const { res, out } = fakeRes();
    await serveWatchlistApi(
      post({ symbol: "NVDA", watching: true }),
      res,
      WATCHLIST_PATH,
      config({ watchlist: store.port }),
      ann,
    );
    expect(json(out).ok).toBe(true);
    expect(symbols(out)).toEqual(["NVDA"]);
    expect(store.lines).toHaveLength(before);
  });

  it("refuses past the cap in words, and leaves the list as it was", async () => {
    const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const full = Array.from({ length: WATCHLIST_LIMIT }, (_, i) => `${alpha[i]}X`);
    const store = fakeStore(full);
    const { res, out } = fakeRes();
    await serveWatchlistApi(
      post({ symbol: "NVDA", watching: true }),
      res,
      WATCHLIST_PATH,
      config({ watchlist: store.port }),
      ann,
    );
    expect(json(out).ok).toBe(false);
    expect(String((json(out).refusals as string[])[0])).toContain(String(WATCHLIST_LIMIT));
    expect(symbols(out)).toEqual(full);
    expect(store.lines).toHaveLength(WATCHLIST_LIMIT);
  });

  it("refuses a symbol that isn't a ticker, and still answers with the REAL list", async () => {
    // Every refusal's `watching` is applied verbatim by the client (that is why it is echoed), so
    // one carrying an empty list would read as "and your list is now empty".
    const store = fakeStore(["NVDA", "AAPL"]);
    const { res, out } = fakeRes();
    await serveWatchlistApi(
      post({ symbol: "nope!", watching: true }),
      res,
      WATCHLIST_PATH,
      config({ watchlist: store.port }),
      ann,
    );
    expect(json(out).ok).toBe(false);
    expect(symbols(out)).toEqual(["NVDA", "AAPL"]);
    expect(store.lines).toHaveLength(2);
  });

  it("rejects a malformed body rather than guessing a direction", async () => {
    for (const body of [{ symbol: "NVDA" }, { watching: true }, { symbol: 7, watching: true }]) {
      const { res, out } = fakeRes();
      await serveWatchlistApi(
        post(body),
        res,
        WATCHLIST_PATH,
        config({ watchlist: fakeStore().port }),
        ann,
      );
      expect(out.status).toBe(400);
    }
  });

  it("never honours an account named in the request — the session decides whose list it is", async () => {
    const store = fakeStore(["NVDA"]);
    const { res, out } = fakeRes();
    await serveWatchlistApi(
      post({ symbol: "TSLA", watching: true, participantId: "human-bob" }),
      res,
      WATCHLIST_PATH,
      config({ watchlist: store.port }),
      ann,
    );
    // Ann's own list, because `resolveOwnerId` is the only source of the id.
    expect(json(out).ok).toBe(true);
    expect(symbols(out)).toEqual(["NVDA", "TSLA"]);
  });
});
