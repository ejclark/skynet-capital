import { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { AlpacaTradingTransport } from "../../src/alpaca/trading-transport.js";
import type { JsonResponse } from "../../src/http/fetch-json.js";
import { createBrokerSync, reconciledSnapshot } from "../../src/observatory/broker-sync.js";
import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import type { ObservatoryEvent } from "../../src/observatory/events.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import type { Participant } from "../../src/participants/participant.js";

const snapshot = (over: Partial<ParticipantSnapshot> = {}): ParticipantSnapshot => ({
  id: "tony",
  displayName: "Tony",
  kind: "human",
  cash: 100_000,
  equity: 100_000,
  positions: [],
  ...over,
});

const smci = {
  symbol: "SMCI",
  quantity: 1000,
  avgPrice: 38.02,
  marketValue: 38_500,
};

describe("reconciledSnapshot", () => {
  it("adopts holdings the board never saw, so a fill the stream missed still appears", () => {
    const merged = reconciledSnapshot(
      snapshot({ positions: [] }),
      snapshot({ positions: [smci], cash: 61_980, equity: 100_480 }),
    );

    expect(merged.positions).toEqual([smci]);
    expect(merged.cash).toBe(61_980);
    expect(merged.equity).toBe(100_480);
  });

  it("keeps the previous snapshot when the broker read failed, rather than blanking to zeros", () => {
    const current = snapshot({ positions: [smci] });

    const merged = reconciledSnapshot(
      current,
      snapshot({ cash: 0, equity: 0, positions: [], error: "fetch failed" }),
    );

    expect(merged).toBe(current);
  });

  it("carries realized P/L forward — the broker read does not report it", () => {
    const merged = reconciledSnapshot(
      snapshot({ realizedPl: 1_250 }),
      snapshot({ positions: [smci] }),
    );

    expect(merged.realizedPl).toBe(1_250);
  });

  it("returns the same reference when nothing moved, so unchanged accounts push nothing", () => {
    const current = snapshot({ positions: [smci] });

    expect(reconciledSnapshot(current, snapshot({ positions: [{ ...smci }] }))).toBe(current);
  });

  it("pushes an unchanged-looking read when it clears an error, so the desk stops saying unreachable", () => {
    const current = snapshot({ error: "fetch failed" });

    const merged = reconciledSnapshot(current, snapshot());

    expect(merged).not.toBe(current);
    expect(merged.error).toBeUndefined();
  });
});

class CountingTransport implements AlpacaTradingTransport {
  reads = 0;
  constructor(private readonly responses: Record<string, JsonResponse>) {}
  get(path: string): Promise<JsonResponse> {
    if (path === "/v2/positions") this.reads += 1;
    return Promise.resolve(this.responses[path] ?? { status: 404, body: null });
  }
  post(path: string): Promise<JsonResponse> {
    return Promise.resolve(this.responses[path] ?? { status: 404, body: null });
  }
}

const participant: Participant = {
  id: "tony",
  displayName: "Tony",
  kind: "human",
  credentials: { apiKey: "k", apiSecret: "s" },
};

const brokerHolding = {
  "/v2/account": {
    status: 200,
    body: { id: "acct-1", cash: "61980", portfolio_value: "100480", status: "ACTIVE" },
  },
  "/v2/positions": {
    status: 200,
    body: [
      {
        symbol: "SMCI",
        qty: "1000",
        avg_entry_price: "38.02",
        market_value: "38500",
        lastday_price: "37.50",
      },
    ],
  },
} satisfies Record<string, JsonResponse>;

/** A one-account board wired to a counting transport, so both the fold and the read count show. */
function harness(initial: ParticipantSnapshot = snapshot()) {
  const transport = new CountingTransport(brokerHolding);
  const events: ObservatoryEvent[] = [];
  const clock = { ms: Date.parse("2026-08-25T13:09:00.000Z") };
  let state: DashboardData = {
    generatedAt: "2026-08-25T13:00:00.000Z",
    participants: [initial],
    collisions: [],
  };
  const sync = createBrokerSync({
    getState: () => state,
    apply: (event) => {
      events.push(event);
      if (event.type === "participant_updated") {
        state = { ...state, participants: [event.participant] };
      }
    },
    findParticipant: (id) => (id === participant.id ? participant : undefined),
    clientFactory: () => new AlpacaTradingClient(transport),
    now: () => new Date(clock.ms),
  });
  return { transport, events, clock, sync };
}

describe("createBrokerSync", () => {
  it("puts a broker-confirmed holding on the board when the fill stream never delivered it", async () => {
    const h = harness();

    await h.sync.syncParticipant("tony");

    const updated = h.events[0];
    expect(updated?.type).toBe("participant_updated");
    expect(
      updated?.type === "participant_updated"
        ? updated.participant.positions[0]?.symbol
        : undefined,
    ).toBe("SMCI");
  });

  it("refuses a second read of the same account inside the rate-limit window", async () => {
    const h = harness();

    await h.sync.syncParticipant("tony");
    await h.sync.syncParticipant("tony");

    expect(h.transport.reads).toBe(1);
  });

  it("reads again once the window has passed", async () => {
    const h = harness();

    await h.sync.syncParticipant("tony");
    h.clock.ms += 20_000;
    await h.sync.syncParticipant("tony");

    expect(h.transport.reads).toBe(2);
  });

  it("ignores an id that is not on the board", async () => {
    const h = harness();

    await h.sync.syncParticipant("nobody");

    expect(h.transport.reads).toBe(0);
    expect(h.events).toHaveLength(0);
  });

  it("syncAll sweeps every account on the board", async () => {
    const h = harness();

    await h.sync.syncAll();

    expect(h.transport.reads).toBe(1);
    expect(h.events).toHaveLength(1);
  });
});
