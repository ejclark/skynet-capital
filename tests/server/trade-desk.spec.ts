import type { IncomingMessage, ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { Readable } from "node:stream";
import type { AlpacaOptionsClient } from "../../src/alpaca/alpaca-options-client.js";
import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import { resolveAuth } from "../../src/server/auth/resolve-auth.js";
import { type Session, signSession } from "../../src/server/auth/session.js";
import { createDashboardServer } from "../../src/server/dashboard-server.js";
import { ObservatoryHub } from "../../src/server/observatory-hub.js";
import { handleTrade } from "../../src/server/trade-routes.js";

// Siblings, each split off to stay under the per-file line cap, each with its own copy of the
// shared HTTP fixtures below: trade-desk-gate.spec.ts (2026-08-26 — training-wheels ladder gate,
// trade service server-side checks) and trade-desk-open-orders.spec.ts (2026-08-27 — the Open
// Orders panel and its Cancel button). This file keeps the review-step routing, the isolated
// handleTrade contract, and the desk tabs.

const SECRET = "sess";
const auth = resolveAuth({
  SKYNET_SESSION_SECRET: SECRET,
  SKYNET_GOOGLE_CLIENT_ID: "gid",
  SKYNET_GOOGLE_CLIENT_SECRET: "gsecret",
  SKYNET_ALLOWED_EMAILS: "ann@gmail.com",
});

const cookie = (email = "ann@gmail.com"): string => {
  const session: Session = { email, provider: "google", exp: Date.now() + 60_000 };
  return `skynet_session=${encodeURIComponent(signSession(session, SECRET))}`;
};

const ann: ParticipantSnapshot = {
  id: "ann",
  displayName: "Ann",
  kind: "human",
  cash: 5_000,
  equity: 6_200,
  positions: [{ symbol: "AAPL", quantity: 10, avgPrice: 100, marketValue: 1_200 }],
  activity: [],
};

const board = (): DashboardData => ({
  generatedAt: "2026-08-13T14:00:00.000Z",
  participants: [ann],
  collisions: [],
});

async function withServer(
  config: Parameters<typeof createDashboardServer>[0],
  run: (base: string) => Promise<void>,
): Promise<void> {
  const server = createDashboardServer(config);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

const post = (base: string, body: Record<string, string>, headers: Record<string, string> = {}) =>
  fetch(`${base}/trade`, {
    method: "POST",
    redirect: "manual",
    headers: { "content-type": "application/x-www-form-urlencoded", ...headers },
    body: new URLSearchParams(body).toString(),
  });

// The session's email owns "ann" — mirrors resolveOwnerId's real wiring in serve-dashboard.ts.
const resolveOwnerId = (email: string): string | undefined =>
  email === "ann@gmail.com" ? "ann" : undefined;

describe("POST /trade — the review step", () => {
  const config = () => ({
    hub: new ObservatoryHub(board()),
    ...(auth ? { auth } : {}),
    resolveOwnerId,
    tradingEnabled: true,
    submitTrade: () =>
      Promise.resolve({
        ok: true as const,
        orderId: "o1",
        status: "accepted",
        symbol: "AAPL",
      }),
  });

  it("renders a review screen — and sends nothing — on the first post", async () => {
    let submitted = 0;
    await withServer(
      {
        ...config(),
        submitTrade: () => {
          submitted += 1;
          return Promise.resolve({
            ok: true as const,
            orderId: "o1",
            status: "accepted",
            symbol: "AAPL",
          });
        },
      },
      async (base) => {
        const res = await post(
          base,
          { symbol: "AAPL", quantity: "4", action: "sell" },
          { cookie: cookie() },
        );
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain("Review order");
        expect(html).toContain("Estimated proceeds");
        expect(html).toContain('name="confirm" value="1"');
        expect(submitted).toBe(0);
      },
    );
  });

  it("executes only when the confirm step comes back", async () => {
    const calls: unknown[] = [];
    await withServer(
      {
        ...config(),
        submitTrade: (request) => {
          calls.push(request);
          return Promise.resolve({
            ok: true as const,
            orderId: "o1",
            status: "accepted",
            symbol: "AAPL",
          });
        },
      },
      async (base) => {
        const res = await post(
          base,
          { symbol: "AAPL", quantity: "4", action: "sell", confirm: "1" },
          { cookie: cookie() },
        );
        expect(res.status).toBe(303);
        expect(res.headers.get("location")).toBe("/u/ann?tab=positions&n=submitted");
        expect(calls).toEqual([
          {
            participantId: "ann",
            symbol: "AAPL",
            quantity: 4,
            action: "sell",
            orderType: "market",
          },
        ]);
      },
    );
  });

  it("threads a limit order's type and price through review and confirm", async () => {
    const calls: unknown[] = [];
    await withServer(
      {
        ...config(),
        submitTrade: (request) => {
          calls.push(request);
          return Promise.resolve({
            ok: true as const,
            orderId: "o1",
            status: "accepted",
            symbol: "AAPL",
          });
        },
      },
      async (base) => {
        const review = await post(
          base,
          { symbol: "AAPL", quantity: "4", action: "sell", ordertype: "limit", price: "118" },
          { cookie: cookie() },
        );
        expect(await review.text()).toContain("limit $118.00/sh");

        const res = await post(
          base,
          {
            symbol: "AAPL",
            quantity: "4",
            action: "sell",
            ordertype: "limit",
            price: "118",
            confirm: "1",
          },
          { cookie: cookie() },
        );
        expect(res.status).toBe(303);
        expect(calls).toEqual([
          {
            participantId: "ann",
            symbol: "AAPL",
            quantity: 4,
            action: "sell",
            orderType: "limit",
            limitPrice: 118,
          },
        ]);
      },
    );
  });

  it("refuses a limit order with no price before ever reaching submitTrade", async () => {
    let submitted = 0;
    await withServer(
      {
        ...config(),
        submitTrade: () => {
          submitted += 1;
          return Promise.resolve({
            ok: true as const,
            orderId: "o1",
            status: "accepted",
            symbol: "AAPL",
          });
        },
      },
      async (base) => {
        const res = await post(
          base,
          { symbol: "AAPL", quantity: "4", action: "sell", ordertype: "limit", confirm: "1" },
          { cookie: cookie() },
        );
        expect(res.status).toBe(200);
        expect(await res.text()).toContain("limit price");
        expect(submitted).toBe(0);
      },
    );
  });

  it("shows the refusal instead of executing when the ticket rules say no", async () => {
    let submitted = 0;
    await withServer(
      {
        ...config(),
        submitTrade: () => {
          submitted += 1;
          return Promise.resolve({
            ok: true as const,
            orderId: "o1",
            status: "accepted",
            symbol: "AAPL",
          });
        },
      },
      async (base) => {
        const res = await post(
          base,
          { symbol: "AAPL", quantity: "999", action: "sell", confirm: "1" },
          { cookie: cookie() },
        );
        expect(res.status).toBe(200);
        expect(await res.text()).toContain("You hold 10 shares");
        expect(submitted).toBe(0);
      },
    );
  });

  it("serves the ticket VIEW on GET — a read, never an order (those move only by POST)", async () => {
    await withServer(config(), async (base) => {
      const res = await fetch(`${base}/trade`, {
        headers: { cookie: cookie() },
        redirect: "manual",
      });
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("New order");
      expect(html).toContain("Review order");
    });
  });

  it("refuses when the session resolves to no account on the board", async () => {
    await withServer(
      {
        hub: new ObservatoryHub({ ...board(), participants: [] }),
        ...(auth ? { auth } : {}),
        tradingEnabled: true,
      },
      async (base) => {
        const res = await post(
          base,
          { symbol: "AAPL", quantity: "1", action: "buy" },
          { cookie: cookie() },
        );
        expect(res.status).toBe(403);
        expect(await res.text()).toContain("Order refused");
      },
    );
  });

  it("still refuses at the review step when desk trading is switched off", async () => {
    await withServer(
      {
        hub: new ObservatoryHub(board()),
        ...(auth ? { auth } : {}),
        resolveOwnerId,
        tradingEnabled: false,
      },
      async (base) => {
        const res = await post(
          base,
          { symbol: "AAPL", quantity: "1", action: "sell", confirm: "1" },
          { cookie: cookie() },
        );
        expect(res.status).toBe(200);
        expect(await res.text()).toContain("switched off for this deployment");
      },
    );
  });
});

describe("handleTrade — the route contract in isolation", () => {
  const capture = () => {
    const sent = { status: 0, headers: {} as Record<string, string>, body: "" };
    const res = {
      writeHead(status: number, headers: Record<string, string>) {
        sent.status = status;
        sent.headers = headers;
      },
      end(body?: string) {
        sent.body = body ?? "";
      },
    } as unknown as ServerResponse;
    return { sent, res };
  };
  const deps = {
    snapshotFor: () => ann,
    requesterId: "ann",
    tradingEnabled: true,
    nav: { active: "you" as const, canAdd: false, authed: true },
    document: (_title: string, body: string) => body,
  };

  it("serves the ticket view on GET — orders themselves still only move by POST", async () => {
    const { sent, res } = capture();
    await handleTrade({ method: "GET" } as IncomingMessage, res, "/trade", deps);
    expect(sent.status).toBe(200);
    expect(sent.body).toContain("New order");
    expect(sent.body).toContain("Review order");
  });

  it("answers other methods with 405 and an Allow header — an order is never a link", async () => {
    const { sent, res } = capture();
    await handleTrade({ method: "PUT" } as IncomingMessage, res, "/trade", deps);
    expect(sent.status).toBe(405);
    expect(sent.headers.allow).toBe("GET, POST");
  });

  it("refuses with 403 when no identity resolved from the session", async () => {
    const { sent, res } = capture();
    await handleTrade({ method: "POST" } as IncomingMessage, res, "/trade", {
      ...deps,
      requesterId: undefined,
    });
    expect(sent.status).toBe(403);
    expect(sent.body).toContain("Order refused");
  });

  // The review step's whole job is telling you what the trade is worth BEFORE you confirm, and
  // an unheld symbol has no position mark to read — so the route fetches the latest price once,
  // on the member's own connected account, and the screen prices the order off it.
  const orderForm = (over: Record<string, string> = {}): IncomingMessage => {
    const body = new URLSearchParams({
      symbol: "MSFT",
      quantity: "100",
      action: "buy",
      ...over,
    }).toString();
    const req = Readable.from([body]) as IncomingMessage;
    req.method = "POST";
    return req;
  };

  it("quotes an unheld symbol so the review screen can size the trade in dollars", async () => {
    const { sent, res } = capture();
    await handleTrade(orderForm(), res, "/trade", {
      ...deps,
      optionsClientFor: () =>
        ({ getUnderlyingPrice: async () => 512.5 }) as unknown as AlpacaOptionsClient,
    });
    expect(sent.status).toBe(200);
    expect(sent.body).toContain("≈ $51,250");
    expect(sent.body).toContain("at the latest market price of $512.50");
  });

  it("still says the cost is unknown when no quote can be had — never invents one", async () => {
    const { sent, res } = capture();
    await handleTrade(orderForm(), res, "/trade", deps);
    expect(sent.status).toBe(200);
    expect(sent.body).toContain("unknown until it fills");
  });

  // Starter plays live on their own ?starter= param — never ?play=, whose codes are the desk's
  // course catalog the academy links against (Eric's call, 2026-08-25).
  it("pre-fills the stock ticket from ?starter= — symbol, size, and the active chip", async () => {
    const { sent, res } = capture();
    await handleTrade({ method: "GET" } as IncomingMessage, res, "/trade?starter=spy100", deps);
    expect(sent.status).toBe(200);
    expect(sent.body).toContain('value="SPY"');
    expect(sent.body).toContain('value="100"');
    expect(sent.body).toContain('class="st-chip sel"');
  });

  it("lets explicit params beat the starter preset", async () => {
    const { sent, res } = capture();
    await handleTrade(
      { method: "GET" } as IncomingMessage,
      res,
      "/trade?starter=qqq25&symbol=NVDA&qty=3",
      deps,
    );
    expect(sent.body).toContain('value="NVDA"');
    expect(sent.body).toContain('value="3"');
  });

  it("ignores an unknown starter token and leaves ?play= untouched by the whole feature", async () => {
    const { sent, res } = capture();
    await handleTrade({ method: "GET" } as IncomingMessage, res, "/trade?starter=yolo9000", deps);
    expect(sent.status).toBe(200);
    expect(sent.body).not.toContain('class="st-chip sel"');

    const academy = capture();
    await handleTrade({ method: "GET" } as IncomingMessage, academy.res, "/trade?play=201", deps);
    expect(academy.sent.body).toContain("cash-secured put");
  });
});

describe("desk tabs are served off the profile route", () => {
  it("redirects the tabs into the shell desk — active and unknown alike (phase 9a)", async () => {
    await withServer(
      { hub: new ObservatoryHub(board()), ...(auth ? { auth } : {}), tradingEnabled: false },
      async (base) => {
        const positions = await fetch(`${base}/u/ann?tab=positions`, {
          headers: { cookie: cookie() },
          redirect: "manual",
        });
        expect(positions.status).toBe(302);
        expect(positions.headers.get("location")).toBe("/app/u/ann");
        const typo = await fetch(`${base}/u/ann?tab=wat`, {
          headers: { cookie: cookie() },
          redirect: "manual",
        });
        expect(typo.headers.get("location")).toBe("/app/u/ann");
      },
    );
  });
});
