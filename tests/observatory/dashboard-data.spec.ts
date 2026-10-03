import { rstest } from "@rstest/core";
import { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { AlpacaTradingTransport } from "../../src/alpaca/trading-transport.js";
import type { JsonResponse } from "../../src/http/fetch-json.js";
import {
  buildDashboardData,
  SNAPSHOT_READ_TIMEOUT_MS,
} from "../../src/observatory/dashboard-data.js";
import type { Participant } from "../../src/participants/participant.js";

class FakeTransport implements AlpacaTradingTransport {
  constructor(private readonly responses: Record<string, JsonResponse>) {}
  get(path: string): Promise<JsonResponse> {
    return Promise.resolve(this.responses[path] ?? { status: 404, body: null });
  }
  post(path: string, _body: unknown): Promise<JsonResponse> {
    return Promise.resolve(this.responses[path] ?? { status: 404, body: null });
  }
  delete(path: string): Promise<JsonResponse> {
    return Promise.resolve(this.responses[path] ?? { status: 404, body: null });
  }
}

/** A broker that accepts the request and never answers — the 2026-10-03 outage shape (#4516). */
class StalledTransport implements AlpacaTradingTransport {
  /** Never settles. That is the fault being reproduced, not an unfinished fake. */
  private stall(): Promise<JsonResponse> {
    return new Promise<JsonResponse>(() => {
      // intentionally empty: no resolve, no reject
    });
  }
  get(_path: string): Promise<JsonResponse> {
    return this.stall();
  }
  post(_path: string, _body: unknown): Promise<JsonResponse> {
    return this.stall();
  }
  delete(_path: string): Promise<JsonResponse> {
    return this.stall();
  }
}

const healthy = (cash: string, equity: string, accountId = "a"): Record<string, JsonResponse> => ({
  "/v2/account": {
    status: 200,
    body: { id: accountId, cash, portfolio_value: equity, status: "ACTIVE" },
  },
  "/v2/positions": {
    status: 200,
    body: [{ symbol: "EEM", qty: "100", avg_entry_price: "42", market_value: "4300" }],
  },
});

const bot: Participant = {
  id: "news-fader",
  displayName: "The News Fader",
  kind: "bot",
  personaId: "news-fader",
  credentials: { apiKey: "k", apiSecret: "s" },
};
const human: Participant = {
  id: "eric",
  displayName: "Eric",
  kind: "human",
  credentials: { apiKey: "k", apiSecret: "s" },
};

describe("buildDashboardData", () => {
  it("aggregates bots and humans into one dated view", async () => {
    const clients: Record<string, AlpacaTradingClient> = {
      "news-fader": new AlpacaTradingClient(new FakeTransport(healthy("1000", "5000", "acct-1"))),
      eric: new AlpacaTradingClient(new FakeTransport(healthy("2000", "9000", "acct-2"))),
    };

    const data = await buildDashboardData([bot, human], {
      clientFactory: (p) => clients[p.id] as AlpacaTradingClient,
      now: () => new Date("2026-07-24T15:00:00Z"),
    });

    expect(data.generatedAt).toBe("2026-07-24T15:00:00.000Z");
    expect(data.participants.map((p) => p.kind)).toEqual(["bot", "human"]);
    const fader = data.participants[0];
    expect(fader?.equity).toBe(5000);
    expect(fader?.personaId).toBe("news-fader");
    expect(fader?.positions[0]).toEqual({
      symbol: "EEM",
      quantity: 100,
      avgPrice: 42,
      marketValue: 4300,
    });
    expect(data.collisions).toEqual([]);
  });

  it("flags two participants that resolve to the same Alpaca account", async () => {
    // The incident this guards against: two DIFFERENT credential pairs that happen to point at
    // the SAME underlying account — both authenticate fine, so nothing else would notice.
    const clients: Record<string, AlpacaTradingClient> = {
      "news-fader": new AlpacaTradingClient(new FakeTransport(healthy("1000", "5000", "acct-1"))),
      eric: new AlpacaTradingClient(new FakeTransport(healthy("2000", "9000", "acct-1"))),
    };

    const data = await buildDashboardData([bot, human], {
      clientFactory: (p) => clients[p.id] as AlpacaTradingClient,
      now: () => new Date("2026-07-24T15:00:00Z"),
    });

    expect(data.collisions).toEqual([{ accountId: "acct-1", ids: ["news-fader", "eric"] }]);
  });

  it("degrades a failing account to an error row instead of failing the whole build", async () => {
    const failing = new AlpacaTradingClient(
      new FakeTransport({ "/v2/account": { status: 401, body: { message: "bad key" } } }),
    );

    const data = await buildDashboardData([human], {
      clientFactory: () => failing,
      now: () => new Date("2026-07-24T15:00:00Z"),
    });

    expect(data.participants[0]?.error).toBeDefined();
    expect(data.participants[0]?.equity).toBe(0);
  });

  // The boot read gates `.listen()` in serve-dashboard.ts, so "never returns" is an outage, not
  // slowness: on 2026-10-03 it left the release serving nothing and rolled main's tip back (#4516).
  it("degrades a STALLED account to an error row instead of waiting on the broker forever", async () => {
    const stalled = new AlpacaTradingClient(new StalledTransport());

    const data = await buildDashboardData([human], {
      clientFactory: () => stalled,
      now: () => new Date("2026-07-24T15:00:00Z"),
      timeoutMs: 10,
    });

    expect(data.participants[0]?.error).toContain("timed out after 10ms");
    expect(data.participants[0]?.equity).toBe(0);
    expect(data.participants[0]?.positions).toEqual([]);
  });

  it("still returns the healthy accounts when one of them stalls", async () => {
    const clients: Record<string, AlpacaTradingClient> = {
      "news-fader": new AlpacaTradingClient(new StalledTransport()),
      eric: new AlpacaTradingClient(new FakeTransport(healthy("2000", "9000", "acct-2"))),
    };

    const data = await buildDashboardData([bot, human], {
      clientFactory: (p) => clients[p.id] as AlpacaTradingClient,
      now: () => new Date("2026-07-24T15:00:00Z"),
      timeoutMs: 10,
    });

    expect(data.participants[0]?.error).toBeDefined();
    expect(data.participants[1]?.error).toBeUndefined();
    expect(data.participants[1]?.equity).toBe(9000);
  });

  it("bounds the read by default, so no caller has to remember the deadline", async () => {
    rstest.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      const stalled = new AlpacaTradingClient(new StalledTransport());
      const pending = buildDashboardData([human], { clientFactory: () => stalled });
      await rstest.advanceTimersByTimeAsync(SNAPSHOT_READ_TIMEOUT_MS);
      const data = await pending;
      expect(data.participants[0]?.error).toContain(
        `timed out after ${SNAPSHOT_READ_TIMEOUT_MS}ms`,
      );
    } finally {
      rstest.useRealTimers();
    }
  });

  it("keeps the default deadline inside the smoke test's retry budget", () => {
    // scripts/smoke.sh gives a release 6 × (15s curl + 5s sleep) ≈ 115s to start serving. A boot
    // deadline above that is no deadline at all — the release fails before it can expire.
    expect(SNAPSHOT_READ_TIMEOUT_MS).toBeGreaterThan(0);
    expect(SNAPSHOT_READ_TIMEOUT_MS).toBeLessThan(115_000);
  });
});
