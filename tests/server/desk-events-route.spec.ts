import { EventEmitter } from "node:events";
import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { ActivityEvent, PublishedListener } from "../../src/observatory/activity-event.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { deskOrderEvent, serveDeskEventsApi } from "../../src/server/desk-events-route.js";

/**
 * The desk's own event stream (#3407 P4 slice 1): owned accounts only, an honest JSON absence
 * when no bus is wired, a hello on open, one `order` frame per bus event for THIS actor in the
 * owner's tiers and nothing for anyone else's, and the subscription released when the client
 * goes away.
 */

function fakeRes() {
  const out: {
    status?: number;
    headers?: Record<string, string>;
    chunks: string[];
    body?: string;
  } = { chunks: [] };
  const emitter = new EventEmitter();
  const res = Object.assign(emitter, {
    writeHead(status: number, headers?: Record<string, string>) {
      out.status = status;
      out.headers = headers;
      return res;
    },
    write(chunk: string) {
      out.chunks.push(chunk);
      return true;
    },
    end(body?: string) {
      out.body = body ?? "";
    },
  }) as unknown as ServerResponse;
  return { res, out };
}

function get(url: string): IncomingMessage {
  const req = Readable.from([]) as unknown as IncomingMessage;
  req.method = "GET";
  req.url = url;
  req.headers = {};
  return req;
}

function fakeBus() {
  const listeners = new Set<PublishedListener>();
  return {
    listeners,
    subscribe(listener: PublishedListener) {
      listeners.add(listener);
      return { unsubscribe: () => listeners.delete(listener) };
    },
    emit(event: ActivityEvent) {
      for (const l of listeners) l(event);
    },
  };
}

const fill = (participantId: string, over: Partial<ActivityEvent> = {}): ActivityEvent => ({
  id: "o-1:order.filled:t:5",
  eventType: "order.filled",
  actor: { participantId },
  target: { kind: "order", id: "o-1" },
  at: "2026-09-22T14:00:00Z",
  correlationId: "o-1",
  source: "stream",
  outcome: "success",
  visibility: "public",
  payload: { symbol: "NVDA", side: "buy", quantity: 5, filledQuantity: 5, status: "filled" },
  ...over,
});

function configWith(over: Partial<DashboardServerConfig> = {}): DashboardServerConfig {
  return {
    hub: { getState: () => ({ generatedAt: "t", participants: [], collisions: [] }) },
    auth: { providerIds: ["google"] },
    resolveOwnerId: () => "human-eric",
    ...over,
  } as unknown as DashboardServerConfig;
}
const session = { email: "eric@example.com" } as never;
const frames = (chunks: string[]) =>
  chunks.filter((c) => c.startsWith("event:") || c.startsWith("id:"));

describe("serveDeskEventsApi", () => {
  it("claims only its path and refuses an account the session doesn't own", () => {
    const { res, out } = fakeRes();
    expect(
      serveDeskEventsApi(get("/api/trade/orders"), res, "/api/trade/orders", configWith(), session),
    ).toBe(false);
    const url = "/api/trade/events?participantId=human-ann";
    expect(serveDeskEventsApi(get(url), res, "/api/trade/events", configWith(), session)).toBe(
      true,
    );
    expect(out.status).toBe(404);
  });

  it("answers JSON, not an empty stream, when no bus is wired", () => {
    const { res, out } = fakeRes();
    const url = "/api/trade/events?participantId=human-eric";
    serveDeskEventsApi(get(url), res, "/api/trade/events", configWith(), session);
    expect(out.status).toBe(200);
    expect(JSON.parse(out.body ?? "{}")).toEqual({ available: false, reason: "unwired" });
  });

  it("opens the stream with a hello and relays only this actor's owner-visible events", () => {
    const bus = fakeBus();
    const { res, out } = fakeRes();
    const req = get("/api/trade/events?participantId=human-eric");
    serveDeskEventsApi(req, res, "/api/trade/events", configWith({ activityEvents: bus }), session);
    expect(out.status).toBe(200);
    expect(out.headers?.["content-type"]).toBe("text/event-stream");
    expect(out.chunks[0]).toContain("event: hello");
    expect(bus.listeners.size).toBe(1);

    bus.emit(fill("human-eric"));
    bus.emit(fill("human-ann", { id: "other" }));
    bus.emit(fill("human-eric", { id: "admin", visibility: "admin-only" }));
    const order = frames(out.chunks).filter((c) => c.includes("event: order"));
    expect(order).toHaveLength(1);
    expect(order[0]).toContain("id: o-1:order.filled:t:5");
    const data = JSON.parse((order[0] ?? "").split("data: ")[1] ?? "{}");
    expect(data).toMatchObject({
      eventType: "order.filled",
      orderId: "o-1",
      outcome: "success",
      payload: { symbol: "NVDA", filledQuantity: 5 },
    });

    req.emit("close");
    expect(bus.listeners.size).toBe(0);
    bus.emit(fill("human-eric", { id: "late" }));
    expect(frames(out.chunks).filter((c) => c.includes("event: order"))).toHaveLength(1);
  });

  it("shapes the wire event from the envelope's own fields", () => {
    expect(deskOrderEvent(fill("x"))).toEqual({
      id: "o-1:order.filled:t:5",
      eventType: "order.filled",
      orderId: "o-1",
      at: "2026-09-22T14:00:00Z",
      outcome: "success",
      payload: { symbol: "NVDA", side: "buy", quantity: 5, filledQuantity: 5, status: "filled" },
    });
  });
});
