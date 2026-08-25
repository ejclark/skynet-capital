import type { IncomingMessage, ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import type { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { TradeTypeCode } from "../../src/domain/trade-types.js";
import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import type { Participant } from "../../src/participants/participant.js";
import { resolveAuth } from "../../src/server/auth/resolve-auth.js";
import { type Session, signSession } from "../../src/server/auth/session.js";
import { createDashboardServer } from "../../src/server/dashboard-server.js";
import { ObservatoryHub } from "../../src/server/observatory-hub.js";
import type { OrderAuditRecord } from "../../src/server/order-audit-log.js";
import type {
  ParticipantProgression,
  ProgressionService,
} from "../../src/server/progression-service.js";
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

describe("the training-wheels gate — the ladder is enforced server-side, not by the picker", () => {
  const progressionStub = (
    over: Partial<ParticipantProgression> = {},
    wheelsLog: string[] = [],
    ackLog: string[] = [],
  ): ProgressionService => ({
    view: () =>
      Promise.resolve({
        wheels: true,
        earned: [],
        earnedByCode: new Map(),
        unlocked: new Set<TradeTypeCode>(["101"]),
        nextUp: "101",
        points: 0,
        rank: { title: "Observer", atPoints: 0 },
        unlockedLevels: new Set<100 | 200 | 300>([100]),
        celebrating: [],
        ...over,
      }),
    setWheels: (id, on) => {
      wheelsLog.push(`${id}:${on}`);
      return Promise.resolve();
    },
    acknowledge: (id, ids) => {
      ackLog.push(`${id}:${ids.join("+")}`);
      return Promise.resolve();
    },
  });

  const gateConfig = (
    progression: ProgressionService,
    counters: { stock: number; option: number },
  ) => ({
    hub: new ObservatoryHub(board()),
    ...(auth ? { auth } : {}),
    resolveOwnerId,
    tradingEnabled: true,
    progression,
    submitTrade: () => {
      counters.stock += 1;
      return Promise.resolve({
        ok: true as const,
        orderId: "o1",
        status: "accepted",
        symbol: "AAPL",
      });
    },
    submitOptionTrade: () => {
      counters.option += 1;
      return Promise.resolve({ ok: true as const, orderId: "o2", status: "accepted", symbol: "X" });
    },
  });

  const counters = () => ({ stock: 0, option: 0 });

  it("GET of a locked play renders the honest locked panel, never an actionable ticket", async () => {
    await withServer(gateConfig(progressionStub(), counters()), async (base) => {
      const res = await fetch(`${base}/trade?play=201`, { headers: { cookie: cookie() } });
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("is still locked");
      expect(html).not.toContain("2 · Shape it");
    });
  });

  it("refuses a POST for a locked option play with 403 — nothing reaches the desk", async () => {
    const c = counters();
    await withServer(gateConfig(progressionStub(), c), async (base) => {
      const res = await post(
        base,
        {
          play: "201",
          symbol: "MSFT",
          contracts: "1",
          strike: "420",
          exp: "2026-09-18",
          confirm: "1",
        },
        { cookie: cookie() },
      );
      expect(res.status).toBe(403);
      expect(await res.text()).toContain("Training wheels are on");
      expect(c.option).toBe(0);
    });
  });

  it("never gates an equity sell — exiting shares is an exit, even with 102 still locked", async () => {
    // A member can hold shares with no journaled fill (assignment, pre-ledger history); the desk
    // never shorts, so any accepted sell is a close — restricting it would lock them into a position.
    await withServer(gateConfig(progressionStub(), counters()), async (base) => {
      const res = await post(
        base,
        { symbol: "AAPL", quantity: "1", action: "sell" },
        { cookie: cookie() },
      );
      expect(res.status).toBe(200);
      expect(await res.text()).toContain("Review order");
    });
  });

  it("lets the unlocked rung straight through to the normal review", async () => {
    await withServer(gateConfig(progressionStub(), counters()), async (base) => {
      const res = await post(
        base,
        { symbol: "AAPL", quantity: "1", action: "buy" },
        { cookie: cookie() },
      );
      expect(res.status).toBe(200);
      expect(await res.text()).toContain("Review order");
    });
  });

  it("never gates a close — exiting a position is always allowed with wheels on", async () => {
    await withServer(gateConfig(progressionStub(), counters()), async (base) => {
      const res = await post(base, { close: "MSFT260918P00420000" }, { cookie: cookie() });
      expect(res.status).toBe(200); // the review pipeline answers (it will refuse: no holding)
      expect(await res.text()).not.toContain("Training wheels are on");
    });
  });

  it("does not restrict anything with the wheels off, whatever the ladder says", async () => {
    const c = counters();
    await withServer(gateConfig(progressionStub({ wheels: false }), c), async (base) => {
      const res = await post(
        base,
        { symbol: "AAPL", quantity: "1", action: "sell" },
        { cookie: cookie() },
      );
      expect(res.status).toBe(200);
      expect(await res.text()).toContain("Review order");
    });
  });

  it("persists the toggle for the requester only, then returns to the ticket it came from", async () => {
    const log: string[] = [];
    await withServer(gateConfig(progressionStub({}, log), counters()), async (base) => {
      const res = await post(
        base,
        { wheels: "off", back: "/trade?play=102&symbol=AAPL" },
        { cookie: cookie() },
      );
      expect(res.status).toBe(303);
      expect(res.headers.get("location")).toBe("/trade?play=102&symbol=AAPL");
      expect(log).toEqual(["ann:false"]);
    });
  });

  it("never open-redirects the toggle's return path — double-slash and backslash alike", async () => {
    await withServer(gateConfig(progressionStub(), counters()), async (base) => {
      // %0a decodes to \n — an unrejected control char makes writeHead throw, not redirect.
      for (const back of [
        "//evil.example",
        "/\\evil.example",
        "https://evil.example",
        "\\x",
        "/x\ny",
      ]) {
        const res = await post(base, { wheels: "on", back }, { cookie: cookie() });
        expect(res.status).toBe(303);
        expect(res.headers.get("location")).toBe("/trade");
      }
    });
  });

  it("shows the unlock banner for a fresh earn, and the Claim POST banks it", async () => {
    const acks: string[] = [];
    const celebrating = [
      {
        milestoneId: "first-buy",
        code: "101" as const,
        orderId: "o1",
        at: "2026-08-25T14:00:00.000Z",
      },
    ];
    await withServer(
      gateConfig(progressionStub({ celebrating }, [], acks), counters()),
      async (base) => {
        const page = await fetch(`${base}/trade`, { headers: { cookie: cookie() } });
        const html = await page.text();
        expect(html).toContain("Milestone unlocked");
        expect(html).toContain("102 — Sell stock</b> is now open");

        const claim = await post(base, { ack: "first-buy", back: "/learn" }, { cookie: cookie() });
        expect(claim.status).toBe(303);
        expect(claim.headers.get("location")).toBe("/learn");
        expect(acks).toEqual(["ann:first-buy"]);
      },
    );
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
    ownerEmail: "ann@gmail.com",
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

  const service = (
    over: {
      tradingEnabled?: boolean;
      client?: AlpacaTradingClient;
      recordAudit?: (entry: OrderAuditRecord) => Promise<void>;
    } = {},
  ) =>
    createTradeService({
      findParticipant: (id) => (id === "ann" ? participant : undefined),
      clientFactory: () => over.client ?? client(),
      tradingEnabled: over.tradingEnabled ?? true,
      ...(over.recordAudit ? { recordAudit: over.recordAudit } : {}),
      now: () => new Date("2026-08-21T00:00:00.000Z"),
    });

  const request = { participantId: "ann", symbol: "AAPL", quantity: 4, action: "sell" as const };

  it("places the order when everything checks out on fresh numbers", async () => {
    const result = await service()(request, "ann");
    expect(result).toEqual({ ok: true, orderId: "o1", status: "accepted", symbol: "AAPL" });
  });

  it("appends an audit line naming the account, its owner, and the order (#466)", async () => {
    const audited: OrderAuditRecord[] = [];
    await service({ recordAudit: (entry) => Promise.resolve(void audited.push(entry)) })(
      request,
      "ann",
    );
    expect(audited).toEqual([
      {
        participantId: "ann",
        ownerEmail: "ann@gmail.com",
        orderId: "o1",
        at: "2026-08-21T00:00:00.000Z",
        // tag-at-entry: a share sell is course 102, an exit — milestone derivation reads this.
        code: "102",
        intent: "close",
        side: "sell",
        symbol: "AAPL",
      },
    ]);
  });

  it("tags a share buy as course 101, an open (tag-at-entry)", async () => {
    const audited: OrderAuditRecord[] = [];
    await service({ recordAudit: (entry) => Promise.resolve(void audited.push(entry)) })(
      { ...request, action: "buy" },
      "ann",
    );
    expect(audited[0]).toMatchObject({ code: "101", intent: "open", side: "buy" });
  });

  it("never audits a refused order", async () => {
    const audited: OrderAuditRecord[] = [];
    await service({
      tradingEnabled: false,
      recordAudit: (entry) => Promise.resolve(void audited.push(entry)),
    })(request, "ann");
    expect(audited).toEqual([]);
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
      placeOrder: () => Promise.reject(new Error("insufficient buying power")),
    });
    const result = await service({ client: angry })(request, "ann");
    expect(result).toMatchObject({ ok: false });
    expect((result as { refusals: string[] }).refusals.join(" ")).toContain("rejected the order");
  });

  it("still reviews the order when the market clock can't be read", async () => {
    const noClock = client({ isMarketOpen: () => Promise.reject(new Error("clock down")) });
    expect(await service({ client: noClock })(request, "ann")).toMatchObject({ ok: true });
  });
});
