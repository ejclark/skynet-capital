import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveTradeApi } from "../../src/server/trade-api-routes.js";

/**
 * The trade API's contract: strict shape gate, session-only identity, and pass-through to the
 * execution seam that re-checks everything anyway. Every refusal path answers with a rendered
 * explanation; nothing malformed is ever coerced into an order.
 */

interface Answer {
  status?: number;
  body?: string;
}

function fakeRes(): { res: ServerResponse; out: Answer } {
  const out: Answer = {};
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

function post(body: unknown, contentType = "application/json"): IncomingMessage {
  const req = Readable.from([
    typeof body === "string" ? body : JSON.stringify(body),
  ]) as unknown as IncomingMessage;
  req.method = "POST";
  req.headers = { "content-type": contentType };
  return req;
}

const snapshot = {
  id: "human-eric",
  displayName: "Eric",
  kind: "human" as const,
  cash: 10_000,
  equity: 20_000,
  positions: [{ symbol: "AAPL", quantity: 10, avgPrice: 100, marketValue: 1_500 }],
  activity: [],
};

function configWith(over: Partial<DashboardServerConfig> = {}): DashboardServerConfig {
  return {
    hub: { getState: () => ({ generatedAt: "t", participants: [snapshot], collisions: [] }) },
    tradingEnabled: true,
    auth: { providerIds: ["google"] },
    resolveOwnerId: () => "human-eric",
    ...over,
  } as unknown as DashboardServerConfig;
}

const session = { email: "eric@example.com" } as never;

const ticket = { participantId: "human-eric", symbol: "AAPL", quantity: 10, action: "sell" };

describe("serveTradeApi", () => {
  it("claims only its two paths", async () => {
    const { res } = fakeRes();
    expect(await serveTradeApi(post(ticket), res, "/api/board", configWith(), session)).toBe(false);
  });

  it("refuses non-POST with 405 and a plain answer", async () => {
    const { res, out } = fakeRes();
    const req = post(ticket);
    req.method = "GET";
    expect(await serveTradeApi(req, res, "/api/trade/review", configWith(), session)).toBe(true);
    expect(out.status).toBe(405);
  });

  it("refuses a non-JSON content type — the CSRF seam", async () => {
    const { res, out } = fakeRes();
    const req = post(ticket, "application/x-www-form-urlencoded");
    await serveTradeApi(req, res, "/api/trade/review", configWith(), session);
    expect(out.status).toBe(415);
  });

  it("refuses a malformed body with 400, never coercing it into an order", async () => {
    for (const bad of ["not json", { ...ticket, quantity: "5" }, { ...ticket, action: "steal" }]) {
      const { res, out } = fakeRes();
      await serveTradeApi(post(bad), res, "/api/trade/review", configWith(), session);
      expect(out.status).toBe(400);
    }
  });

  it("reviews with the pure ticket rules — a self sell previews ok", async () => {
    const { res, out } = fakeRes();
    await serveTradeApi(post(ticket), res, "/api/trade/review", configWith(), session);
    expect(out.status).toBe(200);
    const preview = JSON.parse(out.body ?? "{}").preview;
    expect(preview.ok).toBe(true);
    expect(preview.warnings.join(" ")).toContain("closes the position");
  });

  it("reviews a stranger's desk honestly — refused, with the reason rendered", async () => {
    const { res, out } = fakeRes();
    const config = configWith({ resolveOwnerId: () => undefined } as never);
    await serveTradeApi(post(ticket), res, "/api/trade/review", config, session);
    const preview = JSON.parse(out.body ?? "{}").preview;
    expect(preview.ok).toBe(false);
    expect(preview.refusals.join(" ")).toContain("your own account");
  });

  it("passes submit to the execution seam with the SESSION identity, not the body's claim", async () => {
    const seen: unknown[] = [];
    const config = configWith({
      submitTrade: (request: unknown, requesterId: unknown) => {
        seen.push(request, requesterId);
        return Promise.resolve({ ok: true, orderId: "o1", status: "accepted", symbol: "AAPL" });
      },
    } as never);
    const { res, out } = fakeRes();
    await serveTradeApi(post(ticket), res, "/api/trade/submit", config, session);
    expect(JSON.parse(out.body ?? "{}").ok).toBe(true);
    expect(seen[1]).toBe("human-eric");
  });

  it("says plainly when no execution seam is wired", async () => {
    const { res, out } = fakeRes();
    const config = configWith();
    await serveTradeApi(post(ticket), res, "/api/trade/submit", config, session);
    const body = JSON.parse(out.body ?? "{}");
    expect(body.ok).toBe(false);
    expect(body.refusals.join(" ")).toContain("isn't wired");
  });

  // The feedback gate (#1119): a BUY opens a position and is refused while the gate holds; a SELL
  // is an exit and never is.
  const gated = {
    progression: {
      view: () =>
        Promise.resolve({ wheels: true, unlocked: new Set(), ladderGate: "first-feedback" }),
    },
  } as unknown as Partial<DashboardServerConfig>;

  it("prepends the feedback-gate refusal to a gated buy's review", async () => {
    const { res, out } = fakeRes();
    await serveTradeApi(
      post({ ...ticket, action: "buy" }),
      res,
      "/api/trade/review",
      configWith(gated),
      session,
    );
    const body = JSON.parse(out.body ?? "{}");
    expect(body.preview.ok).toBe(false);
    expect(body.preview.refusals[0]).toContain("first feedback filing");
  });

  it("refuses a gated buy at submit before the seam sees it", async () => {
    const { res, out } = fakeRes();
    let seen = 0;
    await serveTradeApi(
      post({ ...ticket, action: "buy" }),
      res,
      "/api/trade/submit",
      configWith({
        ...gated,
        submitTrade: () => {
          seen++;
          return Promise.resolve({ ok: true, orderId: "x", status: "accepted", symbol: "AAPL" });
        },
      } as unknown as Partial<DashboardServerConfig>),
      session,
    );
    expect(JSON.parse(out.body ?? "{}").ok).toBe(false);
    expect(seen).toBe(0);
  });

  it("leaves a sell outside the gate — an exit is never locked", async () => {
    const { res, out } = fakeRes();
    await serveTradeApi(post(ticket), res, "/api/trade/review", configWith(gated), session);
    const body = JSON.parse(out.body ?? "{}");
    expect(body.preview.refusals.some((r: string) => r.includes("feedback"))).toBe(false);
  });
});
