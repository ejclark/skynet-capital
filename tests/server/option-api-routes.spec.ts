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

  it("previews a close off your own desk against an empty book — holds never echo", async () => {
    const cfg = config({
      hub: {
        getState: () => ({
          participants: [
            {
              id: "human-bob",
              cash: 1_000,
              positions: [{ symbol: "NVDA260918P00100000", quantity: -3, marketValue: -600 }],
            },
          ],
        }),
      },
    });
    const { parsed } = await review(
      { kind: "close", participantId: "human-bob", occSymbol: "NVDA260918P00100000" },
      cfg,
    );
    expect(parsed.preview.refusals).toContain("You can only trade your own account.");
    expect(parsed.preview.refusals.join(" ")).toContain("You don't hold this contract");
    expect(parsed.preview.contracts).toBe(0); // bob's 3 held contracts never reach the answer
    expect(parsed.preview.estPremium).toBeUndefined();
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
  // The chain's own degrade paths (bad params, no client, broker failure) are
  // option-chain-route.spec.ts's job now that serveChain lives in its own module — this is just the
  // wiring: GET /api/trade/chain actually reaches it.
  it("routes GET /api/trade/chain to the chain handler", async () => {
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

  it("names the feedback gate as the remedy when it holds, not the rung below", async () => {
    const { parsed } = await review(
      openPut(),
      config({
        progression: {
          view: () =>
            Promise.resolve({ wheels: true, unlocked: new Set(), ladderGate: "first-feedback" }),
        },
      }),
    );
    expect(parsed.preview.refusals[0]).toContain("first feedback filing");
    expect(parsed.preview.refusals[0]).not.toContain("first filled");
  });
});
