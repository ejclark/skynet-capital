import type { AddressInfo } from "node:net";
import type { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import { resolveAuth } from "../../src/server/auth/resolve-auth.js";
import { type Session, signSession } from "../../src/server/auth/session.js";
import { createDashboardServer } from "../../src/server/dashboard-server.js";
import { ObservatoryHub } from "../../src/server/observatory-hub.js";

// Sibling of trade-desk.spec.ts (split 2026-08-27 to stay under the per-file line cap) — the
// Open Orders panel on GET /trade and its Cancel button (#674 slice 4), with its own copy of the
// shared HTTP fixtures below.

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

const resolveOwnerId = (email: string): string | undefined =>
  email === "ann@gmail.com" ? "ann" : undefined;

describe("the Open Orders panel on GET /trade, and its Cancel button", () => {
  const fakeClient = (over: Partial<AlpacaTradingClient> = {}): AlpacaTradingClient =>
    ({
      listOrders: () =>
        Promise.resolve([
          {
            id: "o1",
            symbol: "AAPL",
            qty: "5",
            side: "buy",
            status: "new",
            type: "limit",
            limit_price: "118",
          },
        ]),
      cancelOrder: () => Promise.resolve(),
      ...over,
    }) as unknown as AlpacaTradingClient;

  it("renders open orders straight off the live trading client, on the ticket GET", async () => {
    await withServer(
      {
        hub: new ObservatoryHub(board()),
        ...(auth ? { auth } : {}),
        resolveOwnerId,
        tradingEnabled: true,
        tradingClientFor: () => fakeClient(),
      },
      async (base) => {
        const res = await fetch(`${base}/trade`, { headers: { cookie: cookie() } });
        const html = await res.text();
        expect(html).toContain("Open orders");
        expect(html).toContain("limit $118.00");
        expect(html).toContain('name="cancelOrder" value="o1"');
      },
    );
  });

  it("omits the panel entirely with no trading client wired for the viewer", async () => {
    await withServer(
      {
        hub: new ObservatoryHub(board()),
        ...(auth ? { auth } : {}),
        resolveOwnerId,
        tradingEnabled: true,
      },
      async (base) => {
        const res = await fetch(`${base}/trade`, { headers: { cookie: cookie() } });
        expect(await res.text()).not.toContain("Open orders");
      },
    );
  });

  it("cancels through the live client and redirects back on POST cancelOrder", async () => {
    const canceled: string[] = [];
    await withServer(
      {
        hub: new ObservatoryHub(board()),
        ...(auth ? { auth } : {}),
        resolveOwnerId,
        tradingEnabled: true,
        tradingClientFor: () =>
          fakeClient({
            cancelOrder: (id: string) => {
              canceled.push(id);
              return Promise.resolve();
            },
          }),
      },
      async (base) => {
        const res = await post(base, { cancelOrder: "o1" }, { cookie: cookie() });
        expect(res.status).toBe(303);
        expect(canceled).toEqual(["o1"]);
      },
    );
  });

  it("swallows a broker rejection (already filled) rather than erroring the page", async () => {
    await withServer(
      {
        hub: new ObservatoryHub(board()),
        ...(auth ? { auth } : {}),
        resolveOwnerId,
        tradingEnabled: true,
        tradingClientFor: () =>
          fakeClient({
            cancelOrder: () => Promise.reject(new Error('order is already in "filled" state')),
          }),
      },
      async (base) => {
        const res = await post(base, { cancelOrder: "o1" }, { cookie: cookie() });
        expect(res.status).toBe(303);
      },
    );
  });
});
