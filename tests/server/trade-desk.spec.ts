import type { IncomingMessage, ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import type { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import type { Participant } from "../../src/participants/participant.js";
import { resolveAuth } from "../../src/server/auth/resolve-auth.js";
import { type Session, signSession } from "../../src/server/auth/session.js";
import { createDashboardServer } from "../../src/server/dashboard-server.js";
import { ObservatoryHub } from "../../src/server/observatory-hub.js";
import { handleTrade } from "../../src/server/trade-routes.js";
import { createTradeService } from "../../src/server/trade-service.js";

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

describe("POST /trade — the review step", () => {
  const config = () => ({
    hub: new ObservatoryHub(board()),
    ...(auth ? { auth } : {}),
    tradingEnabled: true,
    submitTrade: async () => ({
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
        submitTrade: async () => {
          submitted += 1;
          return { ok: true as const, orderId: "o1", status: "accepted", symbol: "AAPL" };
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
        submitTrade: async (request) => {
          calls.push(request);
          return { ok: true as const, orderId: "o1", status: "accepted", symbol: "AAPL" };
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
          { participantId: "ann", symbol: "AAPL", quantity: 4, action: "sell" },
        ]);
      },
    );
  });

  it("shows the refusal instead of executing when the ticket rules say no", async () => {
    let submitted = 0;
    await withServer(
      {
        ...config(),
        submitTrade: async () => {
          submitted += 1;
          return { ok: true as const, orderId: "o1", status: "accepted", symbol: "AAPL" };
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

  it("refuses a GET — an order must never be a link", async () => {
    await withServer(config(), async (base) => {
      const res = await fetch(`${base}/trade`, {
        headers: { cookie: cookie() },
        redirect: "manual",
      });
      expect(res.status).toBe(405);
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
      { hub: new ObservatoryHub(board()), ...(auth ? { auth } : {}), tradingEnabled: false },
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

  it("answers a GET with 405 and an Allow header — an order is never a link", async () => {
    const { sent, res } = capture();
    await handleTrade({ method: "GET" } as IncomingMessage, res, deps);
    expect(sent.status).toBe(405);
    expect(sent.headers.allow).toBe("POST");
  });

  it("refuses with 403 when no identity resolved from the session", async () => {
    const { sent, res } = capture();
    await handleTrade({ method: "POST" } as IncomingMessage, res, {
      ...deps,
      requesterId: undefined,
    });
    expect(sent.status).toBe(403);
    expect(sent.body).toContain("Order refused");
  });
});

describe("desk tabs are served off the profile route", () => {
  it("serves the active-trades blotter at ?tab=positions", async () => {
    await withServer(
      { hub: new ObservatoryHub(board()), ...(auth ? { auth } : {}), tradingEnabled: false },
      async (base) => {
        const res = await fetch(`${base}/u/ann?tab=positions`, { headers: { cookie: cookie() } });
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain("Active trades");
        expect(html).toContain(">AAPL<");
      },
    );
  });

  it("falls back to the overview for an unknown tab", async () => {
    await withServer(
      { hub: new ObservatoryHub(board()), ...(auth ? { auth } : {}) },
      async (base) => {
        const res = await fetch(`${base}/u/ann?tab=wat`, { headers: { cookie: cookie() } });
        expect(await res.text()).toContain("desk");
        expect(res.status).toBe(200);
      },
    );
  });
});

describe("trade service — the server-side gate", () => {
  const participant: Participant = {
    id: "ann",
    displayName: "Ann",
    kind: "human",
    credentials: { apiKey: "k", apiSecret: "s", baseUrl: "https://paper" },
  };

  const client = (over: Partial<AlpacaTradingClient> = {}): AlpacaTradingClient =>
    ({
      getAccount: async () => ({
        id: "acct",
        cash: "5000",
        portfolio_value: "6200",
        status: "ACTIVE",
      }),
      getPositions: async () => [
        { symbol: "AAPL", qty: "10", avg_entry_price: "100", market_value: "1200" },
      ],
      isMarketOpen: async () => true,
      placeOrder: async () => ({
        id: "o1",
        symbol: "AAPL",
        qty: "4",
        side: "sell" as const,
        status: "accepted",
      }),
      ...over,
    }) as unknown as AlpacaTradingClient;

  const service = (over: { tradingEnabled?: boolean; client?: AlpacaTradingClient } = {}) =>
    createTradeService({
      findParticipant: (id) => (id === "ann" ? participant : undefined),
      clientFactory: () => over.client ?? client(),
      tradingEnabled: over.tradingEnabled ?? true,
    });

  const request = { participantId: "ann", symbol: "AAPL", quantity: 4, action: "sell" as const };

  it("places the order when everything checks out on fresh numbers", async () => {
    const result = await service()(request, "ann");
    expect(result).toEqual({ ok: true, orderId: "o1", status: "accepted", symbol: "AAPL" });
  });

  it("refuses to trade an account that isn't the requester's own", async () => {
    expect(await service()(request, "bob")).toEqual({
      ok: false,
      refusals: ["You can only trade your own account."],
    });
  });

  it("refuses when no identity resolved at all", async () => {
    expect(await service()(request, undefined)).toMatchObject({ ok: false });
  });

  it("refuses when desk trading is switched off, whoever is asking", async () => {
    expect(await service({ tradingEnabled: false })(request, "ann")).toMatchObject({ ok: false });
  });

  it("re-checks against the LIVE account, catching a position that shrank since review", async () => {
    const shrunk = client({ getPositions: async () => [] });
    const result = await service({ client: shrunk })(request, "ann");
    expect(result).toMatchObject({ ok: false });
    expect((result as { refusals: string[] }).refusals.join(" ")).toContain("short");
  });

  it("reports a broker rejection as a refusal rather than throwing", async () => {
    const angry = client({
      placeOrder: async () => {
        throw new Error("insufficient buying power");
      },
    });
    const result = await service({ client: angry })(request, "ann");
    expect(result).toMatchObject({ ok: false });
    expect((result as { refusals: string[] }).refusals.join(" ")).toContain("rejected the order");
  });

  it("still reviews the order when the market clock can't be read", async () => {
    const noClock = client({
      isMarketOpen: async () => {
        throw new Error("clock down");
      },
    });
    expect(await service({ client: noClock })(request, "ann")).toMatchObject({ ok: true });
  });
});
