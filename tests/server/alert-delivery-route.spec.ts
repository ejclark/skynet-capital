import { mkdtempSync, rmSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { JsonlAlertDeliveryStore } from "../../src/adapters/jsonl-alert-delivery-store.js";
import type { DeliveryMessage } from "../../src/alerts/alert-delivery.js";
import type { AlertDeliveryPort, DeliveryReceipt } from "../../src/ports/alert-delivery.js";
import {
  ALERT_DELIVERY_PATH,
  serveAlertDeliveryApi,
} from "../../src/server/alert-delivery-route.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";

/**
 * The member's own delivery switch (#3407 P4 slice 3). The behaviours worth a spec are the ones a
 * member or an attacker would notice: the destination comes off the SESSION and can never be named
 * in the request; another account's setting is not reachable; and every unavailable state answers
 * with a sentence rather than a silent drop.
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

function post(body: unknown): IncomingMessage {
  const req = Readable.from([JSON.stringify(body)]) as unknown as IncomingMessage;
  req.method = "POST";
  req.url = ALERT_DELIVERY_PATH;
  req.headers = { "content-type": "application/json" };
  return req;
}

const json = (out: { body?: string }): Record<string, unknown> => JSON.parse(out.body ?? "{}");

class FakeTransport implements AlertDeliveryPort {
  readonly channel = "email" as const;
  readonly from = "Skynet <alerts@x.com>";
  readonly sent: DeliveryMessage[] = [];
  constructor(private readonly receipt: DeliveryReceipt = { ok: true }) {}
  send(message: DeliveryMessage): Promise<DeliveryReceipt> {
    this.sent.push(message);
    return Promise.resolve(this.receipt);
  }
}

const ann = { email: "ann@x.com" } as never;
const loginOnly = { email: "annco" } as never;

describe("/api/trade/alerts/delivery", () => {
  let dir: string;
  let store: JsonlAlertDeliveryStore;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "delivery-route-"));
    store = new JsonlAlertDeliveryStore(dir);
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function config(over: Record<string, unknown> = {}): DashboardServerConfig {
    return {
      auth: {},
      resolveOwnerId: (email: string) => (email === "ann@x.com" ? "human-ann" : undefined),
      now: () => new Date("2026-10-02T14:00:00Z"),
      alertDeliveryStore: store,
      ...over,
    } as unknown as DashboardServerConfig;
  }

  const read = async (cfg: DashboardServerConfig, session = ann, id = "human-ann") => {
    const { res, out } = fakeRes();
    await serveAlertDeliveryApi(
      get(`${ALERT_DELIVERY_PATH}?participantId=${id}`),
      res,
      ALERT_DELIVERY_PATH,
      cfg,
      session,
    );
    return { status: out.status, body: json(out) };
  };

  const write = async (cfg: DashboardServerConfig, body: unknown, session = ann) => {
    const { res, out } = fakeRes();
    await serveAlertDeliveryApi(post(body), res, ALERT_DELIVERY_PATH, cfg, session);
    return { status: out.status, body: json(out) };
  };

  it("starts off, and turning it on records the SESSION's address, not one from the request", async () => {
    const transport = new FakeTransport();
    const cfg = config({ alertDelivery: transport });
    expect((await read(cfg)).body).toMatchObject({ available: true, channel: "off" });

    const saved = await write(cfg, {
      participantId: "human-ann",
      channel: "email",
      minPriority: "warning",
      // An attacker's own address, in the body. It must be ignored outright.
      destination: "attacker@evil.test",
    });
    expect(saved.body).toMatchObject({ ok: true, channel: "email", destination: "ann@x.com" });
    expect((await store.load("human-ann")).prefs.destination).toBe("ann@x.com");
    expect(transport.sent.map((m) => m.to)).toEqual(["ann@x.com"]);
  });

  it("sends one confirmation on opt-in, and reports a refused confirmation in words", async () => {
    const cfg = config({ alertDelivery: new FakeTransport({ ok: false, reason: "key rejected" }) });
    const saved = await write(cfg, {
      participantId: "human-ann",
      channel: "email",
      minPriority: "info",
    });
    expect(saved.body.ok).toBe(false);
    expect(String((saved.body.refusals as string[])[0])).toContain("key rejected");
    // The setting is still theirs — the failure was ours.
    expect((await store.load("human-ann")).prefs.channel).toBe("email");
  });

  it("turning it off saves without sending anything", async () => {
    const transport = new FakeTransport();
    const cfg = config({ alertDelivery: transport });
    await write(cfg, { participantId: "human-ann", channel: "email", minPriority: "info" });
    transport.sent.length = 0;
    const off = await write(cfg, {
      participantId: "human-ann",
      channel: "off",
      minPriority: "info",
    });
    expect(off.body).toMatchObject({ ok: true, channel: "off" });
    expect(transport.sent).toEqual([]);
    expect((await store.load("human-ann")).prefs.destination).toBeUndefined();
  });

  it("says in words that delivery is unconfigured, and refuses an opt-in, with no transport", async () => {
    const cfg = config();
    const body = (await read(cfg)).body;
    expect(body.available).toBe(false);
    expect(String(body.reason)).toContain("isn't configured on this deployment");
    const refused = await write(cfg, {
      participantId: "human-ann",
      channel: "email",
      minPriority: "info",
    });
    expect(refused.body.ok).toBe(false);
    expect(String((refused.body.refusals as string[])[0])).toContain("isn't configured");
  });

  it("says in words when the sign-in carried no email address", async () => {
    const cfg = config({
      alertDelivery: new FakeTransport(),
      resolveOwnerId: () => "human-ann",
    });
    const body = (await read(cfg, loginOnly)).body;
    expect(body.available).toBe(false);
    expect(String(body.reason)).toContain("didn't give us an email address");
  });

  it("does not answer for an account the session does not own", async () => {
    const cfg = config({ alertDelivery: new FakeTransport() });
    expect((await read(cfg, ann, "human-bob")).status).toBe(404);
    const refused = await write(cfg, {
      participantId: "human-bob",
      channel: "email",
      minPriority: "info",
    });
    expect(refused.body).toEqual({
      ok: false,
      refusals: ["You can only change delivery on your own account."],
    });
  });

  it("refuses a malformed body rather than storing a channel we do not offer", async () => {
    const cfg = config({ alertDelivery: new FakeTransport() });
    const bad = await write(cfg, {
      participantId: "human-ann",
      channel: "sms",
      minPriority: "info",
    });
    expect(bad.status).toBe(400);
    expect((await store.load("human-ann")).prefs.channel).toBe("off");
  });
});
