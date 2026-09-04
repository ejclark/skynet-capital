import type { IncomingMessage, ServerResponse } from "node:http";
import { CeremonyChannel } from "../../src/observatory/ceremony-channel.js";
import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import {
  createBoardChannel,
  driveBoardChannel,
  serveBoardFrame,
  streamBoardPatches,
} from "../../src/server/board-patch-routes.js";
import { ObservatoryHub } from "../../src/server/observatory-hub.js";

/**
 * The wire itself: what a fresh connection is told, what a reconnecting one is replayed, and what
 * the stream refuses to carry (HTML — the thing that used to wipe the page four times a second).
 */

const pos = (symbol: string, quantity: number, avgPrice: number, marketValue: number) => ({
  symbol,
  quantity,
  avgPrice,
  marketValue,
});

function snap(over: Partial<ParticipantSnapshot> = {}): ParticipantSnapshot {
  return {
    id: over.id ?? "human-eric",
    displayName: over.displayName ?? "Eric",
    kind: over.kind ?? "human",
    cash: over.cash ?? 50_000,
    equity: over.equity ?? 150_000,
    positions: over.positions ?? [pos("NVDA", 100, 500, 60_000)],
  };
}

const data = (...participants: ParticipantSnapshot[]): DashboardData => ({
  generatedAt: "2026-08-26T15:00:00.000Z",
  participants,
  collisions: [],
});

function fakeResponse(): {
  res: ServerResponse;
  out: { status?: number; headers?: Record<string, string>; chunks: string[] };
} {
  const out: { status?: number; headers?: Record<string, string>; chunks: string[] } = {
    chunks: [],
  };
  const res = {
    writeHead(status: number, headers?: Record<string, string>) {
      out.status = status;
      out.headers = headers;
      return res;
    },
    write(chunk: string) {
      out.chunks.push(chunk);
      return true;
    },
    end(chunk?: string) {
      if (chunk) out.chunks.push(chunk);
    },
  } as unknown as ServerResponse;
  return { res, out };
}

const request = (headers: Record<string, string> = {}): IncomingMessage =>
  ({ headers, on: () => undefined }) as unknown as IncomingMessage;

/** Every `data:` payload the stream wrote, parsed, tagged with its `event:` name. */
function frames(chunks: string[]): Array<{ event: string; data: Record<string, unknown> }> {
  return chunks.map((chunk) => {
    const event = /event: (\w+)/.exec(chunk)?.[1] ?? "message";
    const payload = /data: (.*)\n\n$/s.exec(chunk)?.[1] ?? "{}";
    return { event, data: JSON.parse(payload) as Record<string, unknown> };
  });
}

describe("driveBoardChannel", () => {
  it("numbers one patch per hub change, no matter how many viewers are watching", () => {
    const hub = new ObservatoryHub(data(snap()));
    const channel = createBoardChannel();
    driveBoardChannel(hub, channel);
    hub.apply({ type: "price", symbol: "NVDA", price: 700, at: "2026-08-26T15:00:01.000Z" });
    expect(channel.head).toBe(1);
  });

  it("carries the state PAIR, so each viewer can format its own metric on replay", () => {
    const hub = new ObservatoryHub(data(snap()));
    const channel = createBoardChannel();
    driveBoardChannel(hub, channel);
    hub.apply({ type: "price", symbol: "NVDA", price: 700, at: "2026-08-26T15:00:01.000Z" });
    const replay = channel.since(0);
    expect(replay.ok && replay.patches[0]?.context.prev).not.toBe(
      replay.ok && replay.patches[0]?.context.next,
    );
  });

  it("rides ceremony transitions on the same seq run as a fire-once cue", () => {
    const hub = new ObservatoryHub(data(snap()));
    const ceremonies = new CeremonyChannel();
    const channel = createBoardChannel();
    driveBoardChannel(hub, channel, ceremonies);
    const transition = {
      id: "took_profit:human-eric:t1:t2",
      type: "took_profit",
      participantId: "human-eric",
      realized: 420,
      at: "2026-08-26T15:00:02.000Z",
    } as const;
    ceremonies.emit(transition);
    ceremonies.emit(transition);
    expect(channel.head).toBe(1);
    const replay = channel.since(0);
    expect(replay.ok && replay.patches[0]?.ops[0]).toMatchObject({
      kind: "cue",
      cue: { id: transition.id, detail: { realized: 420 } },
    });
  });

  it("flattens a graduated ceremony to a cue carrying the course level (#469 slice 4)", () => {
    const hub = new ObservatoryHub(data(snap()));
    const ceremonies = new CeremonyChannel();
    const channel = createBoardChannel();
    driveBoardChannel(hub, channel, ceremonies);
    const transition = {
      id: "graduated:human-eric:200",
      type: "graduated",
      participantId: "human-eric",
      level: 200,
      at: "2026-08-26T15:00:02.000Z",
    } as const;
    ceremonies.emit(transition);
    const replay = channel.since(0);
    expect(replay.ok && replay.patches[0]?.ops[0]).toMatchObject({
      kind: "cue",
      cue: { id: transition.id, type: "graduated", detail: { level: 200 } },
    });
  });

  it("stops folding once unsubscribed", () => {
    const hub = new ObservatoryHub(data(snap()));
    const channel = createBoardChannel();
    driveBoardChannel(hub, channel)();
    hub.apply({ type: "price", symbol: "NVDA", price: 700, at: "2026-08-26T15:00:01.000Z" });
    expect(channel.head).toBe(0);
  });
});

describe("streamBoardPatches", () => {
  it("opens an event stream and tells a fresh client where the run stands", () => {
    const channel = createBoardChannel();
    const { res, out } = fakeResponse();
    streamBoardPatches(request(), res, channel, "equity", {});
    expect(out.headers).toMatchObject({ "content-type": "text/event-stream" });
    expect(frames(out.chunks)[0]).toEqual({ event: "hello", data: { seq: 0 } });
  });

  it("never carries HTML — only seq-numbered ops", () => {
    const hub = new ObservatoryHub(data(snap()));
    const channel = createBoardChannel();
    driveBoardChannel(hub, channel);
    const { res, out } = fakeResponse();
    streamBoardPatches(request(), res, channel, "equity", {});
    hub.apply({ type: "price", symbol: "NVDA", price: 700, at: "2026-08-26T15:00:01.000Z" });

    const wire = out.chunks.join("");
    expect(wire).not.toContain("<div");
    expect(wire).not.toContain("<li");
    const patch = frames(out.chunks).find((f) => f.event === "patch");
    expect(patch?.data.seq).toBe(1);
    expect(patch?.data.ops).toEqual(expect.any(Array));
  });

  it("stamps an id: on every patch so the browser can resume by Last-Event-ID", () => {
    const hub = new ObservatoryHub(data(snap()));
    const channel = createBoardChannel();
    driveBoardChannel(hub, channel);
    const { res, out } = fakeResponse();
    streamBoardPatches(request(), res, channel, "equity", {});
    hub.apply({ type: "price", symbol: "NVDA", price: 700, at: "2026-08-26T15:00:01.000Z" });
    expect(out.chunks.join("")).toContain("id: 1\n");
  });

  it("replays exactly what a reconnecting client missed", () => {
    const hub = new ObservatoryHub(data(snap()));
    const channel = createBoardChannel();
    driveBoardChannel(hub, channel);
    hub.apply({ type: "price", symbol: "NVDA", price: 700, at: "2026-08-26T15:00:01.000Z" });
    hub.apply({ type: "price", symbol: "NVDA", price: 800, at: "2026-08-26T15:00:02.000Z" });

    const { res, out } = fakeResponse();
    streamBoardPatches(request({ "last-event-id": "1" }), res, channel, "equity", {});
    const wire = frames(out.chunks);
    expect(wire[0]).toEqual({ event: "hello", data: { seq: 1 } });
    expect(wire.slice(1).map((f) => f.data.seq)).toEqual([2]);
  });

  it("tells a client whose position fell out of the buffer to resync rather than half-patching", () => {
    const channel = createBoardChannel();
    const { res, out } = fakeResponse();
    streamBoardPatches(request({ "last-event-id": "42" }), res, channel, "equity", {});
    expect(frames(out.chunks)[0]).toEqual({ event: "resync", data: { seq: 0 } });
  });
});

describe("serveBoardFrame", () => {
  it("re-serves the standings content whole, uncached, for the patch fallback", () => {
    const hub = new ObservatoryHub(data(snap()));
    const { res, out } = fakeResponse();
    serveBoardFrame(res, hub, { active: "board", canAdd: false, authed: true }, "equity", {});
    expect(out.status).toBe(200);
    expect(out.headers).toMatchObject({ "cache-control": "no-store" });
    expect(out.chunks.join("")).toContain('data-field-key="human-eric"');
  });
});
