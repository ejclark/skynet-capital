import { FixtureTradingTransport } from "../../src/adapters/fixture-trading-transport.js";
import { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import type { Participant } from "../../src/participants/participant.js";
import type {
  ParticipantStore,
  StoredParticipant,
} from "../../src/participants/participant-store.js";
import { ObservatoryHub } from "../../src/server/observatory-hub.js";
import { CONNECT_FAILED, ParticipantService } from "../../src/server/participant-service.js";

/**
 * ParticipantService.addConnectedParticipant (#8250) — the Connect-with-Alpaca door. Same checks
 * as a pasted key except the `PK` shape test (a token has no key to read), and the stored
 * credential is the token with key and secret blank.
 */

class MemStore implements ParticipantStore {
  items: StoredParticipant[] = [];
  secure = true;
  canStoreSecurely(): boolean {
    return this.secure;
  }
  load(): StoredParticipant[] {
    return this.items;
  }
  has(id: string): boolean {
    return this.items.some((p) => p.id === id);
  }
  add(participant: StoredParticipant): void {
    this.items = [...this.items.filter((p) => p.id !== participant.id), participant];
  }
  remove(id: string): boolean {
    const before = this.items.length;
    this.items = this.items.filter((p) => p.id !== id);
    return this.items.length < before;
  }
}

const emptyBoard = (): DashboardData => ({ generatedAt: "t0", participants: [], collisions: [] });

const atEquity = (equity: string) => () =>
  new AlpacaTradingClient(
    new FixtureTradingTransport({
      account: { id: "x", cash: equity, portfolio_value: equity, status: "ACTIVE" },
    }),
  );

function makeService(factory = atEquity("1000000")) {
  const store = new MemStore();
  const started: Participant[] = [];
  const seen: Participant[] = [];
  const service = new ParticipantService({
    hub: new ObservatoryHub(emptyBoard()),
    store,
    clientFactory: (p) => {
      seen.push(p);
      return factory();
    },
    startStream: (p) => started.push(p),
    baseUrl: "https://paper-api.alpaca.markets",
    now: () => new Date("2026-11-24T00:00:00.000Z"),
  });
  return { service, store, started, seen };
}

const input = {
  displayName: "Pat",
  timezone: "America/New_York",
  ownerEmail: "member@example.com",
  accessToken: "tok-123",
};

describe("ParticipantService.addConnectedParticipant", () => {
  it("stores the token as the credential, key and secret blank, owned by the session email", async () => {
    const { service, store, started, seen } = makeService();
    const result = await service.addConnectedParticipant(input);
    expect(result).toEqual({ ok: true, id: "human-pat", displayName: "Pat" });
    const stored = store.items[0];
    expect(stored?.credentials).toEqual({
      apiKey: "",
      apiSecret: "",
      accessToken: "tok-123",
      baseUrl: "https://paper-api.alpaca.markets",
    });
    expect(stored?.ownerEmail).toBe("member@example.com");
    expect(stored?.kind).toBe("human");
    expect(stored?.timezone).toBe("America/New_York");
    // Verified on the token itself, then its fill stream opened.
    expect(seen[0]?.credentials.accessToken).toBe("tok-123");
    expect(started.map((p) => p.id)).toEqual(["human-pat"]);
  });

  it("refuses an account off the starting line, names the balance, and says how to fix it", async () => {
    const { service, store } = makeService(atEquity("100000"));
    const result = await service.addConnectedParticipant(input);
    expect(result).toMatchObject({ ok: false, reason: "balance", found: 100_000 });
    const error = result.ok ? "" : result.error;
    expect(error).toContain("$100,000.00");
    expect(error).toContain(
      "open a new paper account at $1,000,000.00 in Alpaca, then connect that one",
    );
    expect(store.items).toEqual([]);
  });

  it("a token Alpaca rejects adds nothing and says try again", async () => {
    const rejecting = () =>
      new AlpacaTradingClient({
        get: () => Promise.resolve({ status: 401, body: { message: "unauthorized" } }),
        post: () => Promise.resolve({ status: 401, body: null }),
        delete: () => Promise.resolve({ status: 401, body: null }),
      });
    const { service, store, started } = makeService(rejecting);
    expect(await service.addConnectedParticipant(input)).toEqual({
      ok: false,
      error: CONNECT_FAILED,
    });
    expect(store.items).toEqual([]);
    expect(started).toEqual([]);
  });

  it("refuses an empty token without a network call", async () => {
    const { service, seen } = makeService();
    expect(await service.addConnectedParticipant({ ...input, accessToken: "" })).toEqual({
      ok: false,
      error: CONNECT_FAILED,
    });
    expect(seen).toEqual([]);
  });

  it("keeps the add door's checks: encryption, timezone and name collisions", async () => {
    const { service, store } = makeService();
    store.secure = false;
    expect((await service.addConnectedParticipant(input)).ok).toBe(false);
    store.secure = true;
    const badZone = await service.addConnectedParticipant({ ...input, timezone: "Mars/Olympus" });
    expect(badZone).toMatchObject({ ok: false });
    await service.addConnectedParticipant(input);
    const again = await service.addConnectedParticipant(input);
    expect(again.ok ? "" : again.error).toContain("already on the board");
  });
});

describe("ParticipantService.refuseConnectStart", () => {
  it("runs the network-free checks before the member leaves for Alpaca", async () => {
    const { service, seen } = makeService();
    expect(service.refuseConnectStart({ displayName: "Pat" })).toBeUndefined();
    expect(service.refuseConnectStart({ displayName: "  " })).toMatchObject({ ok: false });
    await service.addConnectedParticipant(input);
    expect(service.refuseConnectStart({ displayName: "Pat" })).toMatchObject({ ok: false });
    expect(seen.length).toBe(1);
  });
});
