import type { ServerResponse } from "node:http";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import {
  HORIZON_DAYS,
  pagesForHorizon,
  parseOutlook,
  serveStructures,
} from "../../src/server/structures-route.js";

/**
 * The outlook route, degrading exactly as `serveQuote` and `serveBars` degrade: a view the engine
 * does not accept 400s, an unlinked session gets an honest note instead of an error, and an
 * unreachable feed never surfaces as an error — only a `note`.
 *
 * Two things specific to this route are pinned because they are the ones that could lie:
 * - **The horizon is refused, never clamped.** Serving a 400-day "view" as a 45-day one would answer
 *   a forecast nobody stated.
 * - **The call budget is a ceiling, not a typical case** — `pagesForHorizon` is bounded both ways, so
 *   no horizon can turn one pane load into an unbounded fan of broker calls.
 */

const NOW = new Date("2026-10-02T15:30:00Z");

function fakeRes() {
  const out: { status?: number; body?: string } = {};
  const res = {
    writeHead: (status: number) => {
      out.status = status;
      return res;
    },
    end: (body?: string) => {
      out.body = body;
    },
  } as unknown as ServerResponse;
  return { res, out };
}

const config = (client: unknown): DashboardServerConfig =>
  ({ optionsClientFor: () => client, now: () => NOW }) as unknown as DashboardServerConfig;

const VIEW = "symbol=NVDA&direction=bullish&magnitude=moderate&horizon=30";

/** A chain reader that records every call, so the budget can be counted rather than asserted. */
function recordingClient(options?: { readonly spot?: number; readonly expirations?: string[] }) {
  const calls: string[] = [];
  const client = {
    getUnderlyingPrice: (symbol: string) => {
      calls.push(`spot:${symbol}`);
      return Promise.resolve(options?.spot);
    },
    getExpirations: (symbol: string, today: string, max: number) => {
      calls.push(`expirations:${symbol}:${today}:${max}`);
      return Promise.resolve((options?.expirations ?? []).slice(0, max));
    },
    getChain: (_symbol: string, expiration: string, kind: string) => {
      calls.push(`chain:${expiration}:${kind}`);
      return Promise.resolve([]);
    },
  };
  return { client, calls };
}

describe("parseOutlook", () => {
  const parse = (query: string) => parseOutlook(new URLSearchParams(query));

  it("reads a complete, accepted view", () => {
    expect(parse(VIEW)).toEqual({
      symbol: "NVDA",
      direction: "bullish",
      magnitude: "moderate",
      horizonDays: 30,
    });
  });

  it("upper-cases the symbol", () => {
    expect(parse("symbol=nvda&direction=neutral&magnitude=strong&horizon=7")?.symbol).toBe("NVDA");
  });

  it("refuses a symbol that fails the underlying pattern", () => {
    expect(parse("symbol=!!&direction=bullish&magnitude=moderate&horizon=30")).toBeUndefined();
  });

  it("refuses a direction or magnitude the engine has no structures for", () => {
    expect(parse("symbol=NVDA&direction=sideways&magnitude=moderate&horizon=30")).toBeUndefined();
    expect(parse("symbol=NVDA&direction=bullish&magnitude=huge&horizon=30")).toBeUndefined();
  });

  it("refuses a horizon off the offered set rather than clamping it", () => {
    expect(parse("symbol=NVDA&direction=bullish&magnitude=moderate&horizon=400")).toBeUndefined();
    expect(parse("symbol=NVDA&direction=bullish&magnitude=moderate&horizon=31")).toBeUndefined();
  });

  it("refuses a view missing any one of its parts", () => {
    expect(parse("symbol=NVDA&direction=bullish&magnitude=moderate")).toBeUndefined();
    expect(parse("direction=bullish&magnitude=moderate&horizon=30")).toBeUndefined();
  });
});

describe("pagesForHorizon", () => {
  it("asks for enough expirations to reach past the horizon", () => {
    expect(pagesForHorizon(30)).toBeGreaterThanOrEqual(Math.ceil(30 / 7));
    expect(pagesForHorizon(45)).toBeGreaterThanOrEqual(Math.ceil(45 / 7));
  });

  it("is bounded both ways, so the stated call budget is a real ceiling", () => {
    for (const days of HORIZON_DAYS) {
      expect(pagesForHorizon(days)).toBeGreaterThanOrEqual(4);
      expect(pagesForHorizon(days)).toBeLessThanOrEqual(10);
    }
    expect(pagesForHorizon(3650)).toBe(10);
    expect(pagesForHorizon(1)).toBe(4);
  });

  it("keeps the worst-case load inside the 22 broker calls the route states", () => {
    const worst = 2 + 2 * pagesForHorizon(Math.max(...HORIZON_DAYS));
    expect(worst).toBeLessThanOrEqual(22);
  });
});

describe("serveStructures", () => {
  it("400s a view it cannot accept, and names what it wants", async () => {
    const { res, out } = fakeRes();
    await serveStructures(res, "/x?symbol=NVDA", config(undefined), "human-ann");
    expect(out.status).toBe(400);
    expect(JSON.parse(out.body ?? "{}").error).toContain("direction=");
  });

  it("tells an unlinked session the honest note instead of erroring", async () => {
    const { res, out } = fakeRes();
    await serveStructures(res, `/x?${VIEW}`, config(undefined), "human-ann");
    expect(out.status).toBe(200);
    expect(JSON.parse(out.body ?? "{}").note).toContain("isn't linked to one yet");
  });

  it("never reaches a broker for a session with no requester id — identity is the session's only", async () => {
    const { client, calls } = recordingClient({ spot: 180 });
    const { res, out } = fakeRes();
    await serveStructures(res, `/x?${VIEW}`, config(client), undefined);
    expect(JSON.parse(out.body ?? "{}").note).toContain("isn't linked to one yet");
    expect(calls).toHaveLength(0);
  });

  it("answers a chain it could not assemble with a note, never a throw or a 500", async () => {
    const { client } = recordingClient({ spot: undefined });
    const { res, out } = fakeRes();
    await serveStructures(res, `/x?${VIEW}`, config(client), "human-ann");
    expect(out.status).toBe(200);
    expect(JSON.parse(out.body ?? "{}").note).toContain("can be marked honestly");
  });

  it("answers a broker that throws with a note, never an error", async () => {
    const client = {
      getUnderlyingPrice: () => Promise.reject(new Error("429")),
      getExpirations: () => Promise.resolve([]),
      getChain: () => Promise.resolve([]),
    };
    const { res, out } = fakeRes();
    await serveStructures(res, `/x?${VIEW}`, config(client), "human-ann");
    expect(out.status).toBe(200);
    expect(JSON.parse(out.body ?? "{}").note.length).toBeGreaterThan(10);
  });

  // The honesty line: `assembleChain` swallows a broker throw and returns undefined exactly as it
  // does for an unsolvable chain, so a note that BLAMED the listing would be a false claim about it
  // whenever the real cause was a rate limit. Both failures reach the same note, and that note
  // asserts neither cause.
  it("never blames the listing for a failure that may have been the broker's", async () => {
    const rateLimited = {
      getUnderlyingPrice: () => Promise.reject(new Error("429")),
      getExpirations: () => Promise.resolve([]),
      getChain: () => Promise.resolve([]),
    };
    const { client: noSpot } = recordingClient({ spot: undefined });
    for (const client of [rateLimited, noSpot]) {
      const { res, out } = fakeRes();
      await serveStructures(res, `/x?${VIEW}`, config(client), "human-ann");
      const { note } = JSON.parse(out.body ?? "{}");
      // Both causes are offered, neither asserted — the "or" is the load-bearing word.
      expect(note).toContain("the broker may not have answered, or no contract's premium solved");
    }
  });

  it("asks the broker for the day the server's own clock says, and for the horizon's pages", async () => {
    const { client, calls } = recordingClient({ spot: 180 });
    const { res } = fakeRes();
    await serveStructures(res, `/x?${VIEW}`, config(client), "human-ann");
    expect(calls).toContain(`expirations:NVDA:2026-10-02:${pagesForHorizon(30)}`);
  });

  it("serves the ranked answer with a spot and an as-of stamp beside it", async () => {
    const strikes = [160, 170, 180, 190, 200, 210];
    const client = {
      getUnderlyingPrice: () => Promise.resolve(180),
      getExpirations: () => Promise.resolve(["2026-11-06", "2026-11-13", "2026-11-20"]),
      getChain: () =>
        Promise.resolve(strikes.map((strike) => ({ strike, bid: 4, ask: 4.4, close: 4.2 }))),
    };
    const { res, out } = fakeRes();
    await serveStructures(res, `/x?${VIEW}`, config(client), "human-ann");
    const body = JSON.parse(out.body ?? "{}");
    expect(out.status).toBe(200);
    expect(body.spot).toBe(180);
    expect(body.asOf).toBe(NOW.toISOString());
    expect(body.recommendation.outlook).toEqual({
      symbol: "NVDA",
      direction: "bullish",
      magnitude: "moderate",
      horizonDays: 30,
    });
    expect(body.recommendation.disclosure).toContain("paper trading only");
  });

  it("drops no structure in silence — every bullish kind is ranked or named absent", async () => {
    const client = {
      getUnderlyingPrice: () => Promise.resolve(180),
      getExpirations: () => Promise.resolve(["2026-11-06", "2026-11-13", "2026-11-20"]),
      getChain: () =>
        Promise.resolve([160, 170, 180, 190, 200].map((strike) => ({ strike, bid: 4, ask: 4.4 }))),
    };
    const { res, out } = fakeRes();
    await serveStructures(res, `/x?${VIEW}`, config(client), "human-ann");
    const { recommendation } = JSON.parse(out.body ?? "{}");
    const named = [
      ...recommendation.ranked.map((c: { kind: string }) => c.kind),
      ...recommendation.absent.map((a: { kind: string }) => a.kind),
    ];
    for (const kind of ["long-call", "bull-call-spread", "short-put-spread"]) {
      expect(named).toContain(kind);
    }
    for (const absent of recommendation.absent) {
      expect(absent.reason).toBeTruthy();
    }
  });
});
