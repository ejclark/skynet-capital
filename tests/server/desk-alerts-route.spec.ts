import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { InMemoryAlertDismissals } from "../../src/adapters/in-memory-alert-dismissals.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveDeskAlertsApi } from "../../src/server/desk-alerts-route.js";

/**
 * The desk's alerts API (#3407 P4 slice 1): derived from the own account's option positions on
 * every read, loudest first, minus what the member dismissed; identity is the session's; without a
 * dismissals port the list still answers and says dismissals are off.
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

function get(url: string): IncomingMessage {
  const req = Readable.from([]) as unknown as IncomingMessage;
  req.method = "GET";
  req.url = url;
  req.headers = {};
  return req;
}

function post(url: string, body: unknown): IncomingMessage {
  const req = Readable.from([JSON.stringify(body)]) as unknown as IncomingMessage;
  req.method = "POST";
  req.url = url;
  req.headers = { "content-type": "application/json" };
  return req;
}

const json = (out: { body?: string }): Record<string, unknown> => JSON.parse(out.body ?? "{}");

// A long put a week out (7.25 days — the month rung) and a written call in the money three days out.
const desk = {
  id: "human-ann",
  cash: 1_000,
  positions: [
    { symbol: "MSFT260908P00420000", quantity: 2, avgPrice: 10.7, marketValue: 2_400 },
    { symbol: "NVDA260904C00180000", quantity: -1, avgPrice: 4.1, marketValue: -600 },
    { symbol: "AAPL", quantity: 100, avgPrice: 140, marketValue: 15_000 },
  ],
};

const client = {
  getContractSnapshots: () => Promise.resolve(new Map()),
  getUnderlyingPrice: (u: string) =>
    Promise.resolve(u === "MSFT" ? 410 : u === "NVDA" ? 186 : undefined),
};

function config(over: Record<string, unknown> = {}): DashboardServerConfig {
  return {
    hub: { getState: () => ({ participants: [desk] }) },
    auth: {},
    resolveOwnerId: (email: string) => (email === "ann@x.com" ? "human-ann" : undefined),
    now: () => new Date("2026-09-01T14:00:00Z"),
    optionsClientFor: () => client,
    ...over,
  } as unknown as DashboardServerConfig;
}

const ann = { email: "ann@x.com" } as never;

async function list(cfg: DashboardServerConfig, id = "human-ann") {
  const { res, out } = fakeRes();
  await serveDeskAlertsApi(
    get(`/api/trade/alerts?participantId=${id}`),
    res,
    "/api/trade/alerts",
    cfg,
    ann,
  );
  return {
    status: out.status,
    body: json(out) as {
      alerts: Record<string, unknown>[];
      dismissable: boolean;
      available: boolean;
    },
  };
}

describe("GET /api/trade/alerts", () => {
  it("derives the own account's alerts from its positions, loudest first, with fingerprints", async () => {
    const { status, body } = await list(config({ alertDismissals: new InMemoryAlertDismissals() }));
    expect(status).toBe(200);
    expect(body.available).toBe(true);
    expect(body.dismissable).toBe(true);
    expect(body.alerts.map((a) => [a.priority, a.dedupeKey])).toEqual([
      ["critical", "assignment:NVDA260904C00180000"],
      ["warning", "expiry:NVDA260904C00180000:week"],
      // Sep 8 at the 4 pm close is 7.25 days from Sep 1 14:00Z — a month-rung reminder, not a week.
      ["info", "expiry:MSFT260908P00420000:month"],
    ]);
    for (const alert of body.alerts) expect(typeof alert.fingerprint).toBe("string");
  });

  it("subtracts what the member dismissed, and a dismissal is one POST by fingerprint", async () => {
    const cfg = config({ alertDismissals: new InMemoryAlertDismissals() });
    const before = await list(cfg);
    const target = before.body.alerts[0];
    if (!target) throw new Error("expected an alert");
    const { res, out } = fakeRes();
    await serveDeskAlertsApi(
      post("/api/trade/alerts/dismiss", {
        participantId: "human-ann",
        fingerprint: target.fingerprint,
      }),
      res,
      "/api/trade/alerts/dismiss",
      cfg,
      ann,
    );
    expect(json(out)).toEqual({ ok: true });
    const after = await list(cfg);
    expect(after.body.alerts.map((a) => a.dedupeKey)).toEqual([
      "expiry:NVDA260904C00180000:week",
      "expiry:MSFT260908P00420000:month",
    ]);
  });

  it("still lists without a dismissals port, says so, and refuses the dismissal in words", async () => {
    const { body } = await list(config());
    expect(body.alerts).toHaveLength(3);
    expect(body.dismissable).toBe(false);
    const { res, out } = fakeRes();
    await serveDeskAlertsApi(
      post("/api/trade/alerts/dismiss", { participantId: "human-ann", fingerprint: "x" }),
      res,
      "/api/trade/alerts/dismiss",
      config(),
      ann,
    );
    expect(json(out)).toMatchObject({ ok: false });
    expect(String((json(out) as { refusals: string[] }).refusals[0])).toContain("aren't stored");
  });

  it("404s an account the session doesn't own, says unlinked without a client, and rejects a malformed dismiss", async () => {
    const stranger = await list(config(), "human-bob");
    expect(stranger.status).toBe(404);
    const unlinked = await list(config({ optionsClientFor: () => undefined }));
    expect(unlinked.body).toMatchObject({ available: false, reason: "unlinked", alerts: [] });
    const { res, out } = fakeRes();
    await serveDeskAlertsApi(
      post("/api/trade/alerts/dismiss", { participantId: "human-ann" }),
      res,
      "/api/trade/alerts/dismiss",
      config({ alertDismissals: new InMemoryAlertDismissals() }),
      ann,
    );
    expect(out.status).toBe(400);
  });

  it("claims only its two paths", async () => {
    const { res } = fakeRes();
    expect(
      await serveDeskAlertsApi(get("/api/trade/quote"), res, "/api/trade/quote", config(), ann),
    ).toBe(false);
  });
});
