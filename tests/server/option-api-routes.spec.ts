import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveOptionApi } from "../../src/server/option-api-routes.js";

/**
 * The options ticket's JSON twins: the pure ticket rules answer the review with sentences, the
 * ladder gate refuses a locked play before any broker read (closes exempt), the submit seam gets
 * the SESSION's identity never the body's claim, and chain data degrades to honest notes.
 */

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

function post(body: unknown): IncomingMessage {
  const req = Readable.from([Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage;
  req.method = "POST";
  req.headers = { "content-type": "application/json" };
  return req;
}

function get(url: string): IncomingMessage {
  return { method: "GET", url, headers: {} } as unknown as IncomingMessage;
}

const ann = { email: "ann@x.com" } as never;
const stranger = { email: "stranger@x.com" } as never;

/** A desk with $50k cash and no positions, owned by ann's session. */
function config(overrides: Record<string, unknown> = {}): DashboardServerConfig {
  return {
    hub: { getState: () => ({ participants: [{ id: "human-ann", cash: 50_000, positions: [] }] }) },
    auth: {},
    resolveOwnerId: (email: string) => (email === "ann@x.com" ? "human-ann" : undefined),
    tradingEnabled: true,
    ...overrides,
  } as unknown as DashboardServerConfig;
}

/** Training wheels ON with only the stock rungs open — 201+ locked. */
const wheelsOn = {
  progression: {
    view: () => Promise.resolve({ wheels: true, unlocked: new Set(["101", "102"]) }),
  },
};

const openPut = (fields: Record<string, unknown> = {}) => ({
  kind: "open",
  participantId: "human-ann",
  code: "201",
  underlying: "NVDA",
  contracts: 1,
  strike: 40,
  expiration: "2026-09-18",
  orderType: "limit",
  limitPrice: 2,
  ...fields,
});

const review = async (body: unknown, cfg: DashboardServerConfig, session: unknown = ann) => {
  const { res, out } = fakeRes();
  await serveOptionApi(post(body), res, "/api/trade/option/review", cfg, session as never);
  return { out, parsed: JSON.parse(out.body ?? "{}") };
};

describe("serveOptionApi review", () => {
  it("refuses a cash-secured put the cash can't secure — the refusal is the lesson", async () => {
    const { parsed } = await review(openPut({ contracts: 10, strike: 100 }), config());
    expect(parsed.preview.ok).toBe(false);
    expect(parsed.preview.refusals.join(" ")).toContain("Cash-secured means the cash is there");
  });

  it("passes an affordable put with the payoff arithmetic attached", async () => {
    const { parsed } = await review(openPut(), config());
    expect(parsed.preview.ok).toBe(true);
    expect(parsed.preview.collateral).toBe(4_000); // strike 40 × 100 × 1 contract
    expect(parsed.preview.estNotional).toBe(200); // premium 2 × 100
    expect(parsed.preview.breakeven).toBe(38);
  });

  it("prepends the ladder refusal for a locked play and never asks the broker", async () => {
    const cfg = config({
      ...wheelsOn,
      optionsClientFor: () => {
        throw new Error("a locked review must not reach for a broker client");
      },
    });
    const { parsed } = await review(openPut(), cfg);
    expect(parsed.preview.ok).toBe(false);
    expect(parsed.preview.refusals[0]).toContain("Training wheels are on");
    expect(parsed.preview.refusals[0]).toContain("102"); // the rung that opens 201
  });

  it("leaves a CLOSE outside the ladder — an exit is never locked", async () => {
    const { parsed } = await review(
      { kind: "close", participantId: "human-ann", occSymbol: "NVDA260918P00100000" },
      config(wheelsOn),
    );
    const text = parsed.preview.refusals.join(" ");
    expect(text).toContain("You don't hold this contract");
    expect(text).not.toContain("Training wheels");
  });

  it("refuses a desk the session doesn't own through the pure rules", async () => {
    const { parsed } = await review(openPut(), config(), stranger);
    expect(parsed.preview.refusals).toContain("You can only trade your own account.");
  });

  it("400s a malformed body rather than coercing it into an order", async () => {
    const { out } = await review(openPut({ contracts: "ten" }), config());
    expect(out.status).toBe(400);
  });

  it("404s a desk that isn't on the board", async () => {
    const { out } = await review(openPut({ participantId: "human-ghost" }), config());
    expect(out.status).toBe(404);
  });
});

describe("serveOptionApi submit", () => {
  it("hands the seam the request with the SESSION's identity, never the body's claim", async () => {
    const calls: unknown[][] = [];
    const cfg = config({
      submitOptionTrade: (request: unknown, requesterId: unknown) => {
        calls.push([request, requesterId]);
        return Promise.resolve({ ok: true, orderId: "o-1", status: "accepted", symbol: "NVDA" });
      },
    });
    const { res, out } = fakeRes();
    await serveOptionApi(
      post(openPut({ participantId: "human-bob" })),
      res,
      "/api/trade/option/submit",
      cfg,
      ann,
    );
    expect(calls).toHaveLength(1);
    expect(calls[0]?.[1]).toBe("human-ann"); // the session's, not the body's desk claim
    expect(JSON.parse(out.body ?? "{}").ok).toBe(true);
  });

  it("refuses a locked play before the service sees it", async () => {
    const calls: unknown[] = [];
    const cfg = config({
      ...wheelsOn,
      submitOptionTrade: (request: unknown) => {
        calls.push(request);
        return Promise.resolve({ ok: true });
      },
    });
    const { res, out } = fakeRes();
    await serveOptionApi(post(openPut()), res, "/api/trade/option/submit", cfg, ann);
    expect(JSON.parse(out.body ?? "{}").refusals[0]).toContain("Training wheels are on");
    expect(calls).toEqual([]);
  });

  it("says plainly when no options execution path is wired", async () => {
    const { res, out } = fakeRes();
    await serveOptionApi(post(openPut()), res, "/api/trade/option/submit", config(), ann);
    expect(JSON.parse(out.body ?? "{}").refusals[0]).toContain(
      "No options execution path is wired up",
    );
  });
});

describe("serveOptionApi chain", () => {
  const chainConfig = (client: unknown) => config({ optionsClientFor: () => client });

  it("400s parameters that aren't a symbol and a side", async () => {
    const { res, out } = fakeRes();
    await serveOptionApi(
      get("/api/trade/chain?symbol=!!&type=put"),
      res,
      "/api/trade/chain",
      config(),
      ann,
    );
    expect(out.status).toBe(400);
  });

  it("tells an unlinked session the honest note instead of erroring", async () => {
    const { res, out } = fakeRes();
    await serveOptionApi(
      get("/api/trade/chain?symbol=NVDA&type=put"),
      res,
      "/api/trade/chain",
      config(),
      ann,
    );
    expect(JSON.parse(out.body ?? "{}").chainNote).toContain("isn't linked to one yet");
  });

  it("serves expirations, the requested expiration's rows, and the premium precomputed", async () => {
    const client = {
      getExpirations: () => Promise.resolve(["2026-09-18", "2026-10-16"]),
      getChain: () =>
        Promise.resolve([{ occSymbol: "NVDA261016P00100000", strike: 100, bid: 2, ask: 3 }]),
      getUnderlyingPrice: () => Promise.resolve(105),
    };
    const { res, out } = fakeRes();
    await serveOptionApi(
      get("/api/trade/chain?symbol=NVDA&type=put&exp=2026-10-16"),
      res,
      "/api/trade/chain",
      chainConfig(client),
      ann,
    );
    const body = JSON.parse(out.body ?? "{}");
    expect(body.expiration).toBe("2026-10-16");
    expect(body.spot).toBe(105);
    expect(body.rows[0].premium).toBe(2.5); // the bid/ask mid, computed server-side
  });

  it("degrades a chain failure to the honest can't-estimate note", async () => {
    const client = { getExpirations: () => Promise.reject(new Error("feed down")) };
    const { res, out } = fakeRes();
    await serveOptionApi(
      get("/api/trade/chain?symbol=NVDA&type=call"),
      res,
      "/api/trade/chain",
      chainConfig(client),
      ann,
    );
    expect(JSON.parse(out.body ?? "{}").chainNote).toContain("premiums just can't be estimated");
  });
});
