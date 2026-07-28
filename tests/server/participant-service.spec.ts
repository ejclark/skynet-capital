import { FixtureTradingTransport } from "../../src/adapters/fixture-trading-transport.js";
import { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { AlpacaTradingTransport } from "../../src/alpaca/trading-transport.js";
import type { JsonResponse } from "../../src/http/fetch-json.js";
import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import type { Participant } from "../../src/participants/participant.js";
import type {
  ParticipantStore,
  StoredParticipant,
} from "../../src/participants/participant-store.js";
import { ObservatoryHub } from "../../src/server/observatory-hub.js";
import { ParticipantService } from "../../src/server/participant-service.js";

class MemStore implements ParticipantStore {
  items: StoredParticipant[] = [];
  load(): StoredParticipant[] {
    return this.items;
  }
  has(id: string): boolean {
    return this.items.some((p) => p.id === id);
  }
  add(participant: StoredParticipant): void {
    this.items = [...this.items.filter((p) => p.id !== participant.id), participant];
  }
}

class RejectingTransport implements AlpacaTradingTransport {
  get(): Promise<JsonResponse> {
    return Promise.resolve({ status: 403, body: { message: "forbidden" } });
  }
  post(): Promise<JsonResponse> {
    return Promise.resolve({ status: 403, body: null });
  }
}

const emptyBoard = (): DashboardData => ({ generatedAt: "t0", participants: [] });

const okFactory = () =>
  new AlpacaTradingClient(
    new FixtureTradingTransport({
      account: { id: "x", cash: "1000", portfolio_value: "1000", status: "ACTIVE" },
    }),
  );

function makeService(overrides: {
  store?: MemStore;
  hub?: ObservatoryHub;
  factory?: () => AlpacaTradingClient;
  started?: Participant[];
}) {
  const store = overrides.store ?? new MemStore();
  const hub = overrides.hub ?? new ObservatoryHub(emptyBoard());
  const started = overrides.started ?? [];
  const service = new ParticipantService({
    hub,
    store,
    clientFactory: overrides.factory ?? okFactory,
    startStream: (p) => started.push(p),
    now: () => new Date("2026-07-24T00:00:00.000Z"),
  });
  return { service, store, hub, started };
}

describe("ParticipantService.addParticipant", () => {
  it("validates the key, stores, appends to the board live, and opens the stream", async () => {
    const { service, store, hub, started } = makeService({});
    const result = await service.addParticipant({
      displayName: "Uncle Joe",
      apiKey: "k",
      apiSecret: "s",
    });

    expect(result).toEqual({ ok: true, id: "human-uncle_joe", displayName: "Uncle Joe" });
    expect(store.has("human-uncle_joe")).toBe(true);
    expect(hub.getState().participants.map((p) => p.id)).toContain("human-uncle_joe");
    expect(started).toHaveLength(1);
  });

  it("rejects a key Alpaca refuses — nothing is stored or shown", async () => {
    const { service, store, hub } = makeService({
      factory: () => new AlpacaTradingClient(new RejectingTransport()),
    });
    const result = await service.addParticipant({
      displayName: "Bad",
      apiKey: "k",
      apiSecret: "s",
    });

    expect(result.ok).toBe(false);
    expect(store.items).toHaveLength(0);
    expect(hub.getState().participants).toHaveLength(0);
  });

  it("rejects blank fields", async () => {
    const { service } = makeService({});
    expect(
      (await service.addParticipant({ displayName: "", apiKey: "k", apiSecret: "s" })).ok,
    ).toBe(false);
    expect(
      (await service.addParticipant({ displayName: "A", apiKey: "", apiSecret: "s" })).ok,
    ).toBe(false);
  });

  it("rejects a duplicate id", async () => {
    const store = new MemStore();
    store.add({
      id: "human-uncle_joe",
      displayName: "Uncle Joe",
      kind: "human",
      credentials: { apiKey: "a", apiSecret: "b" },
    });
    const { service } = makeService({ store });
    const result = await service.addParticipant({
      displayName: "Uncle Joe",
      apiKey: "k",
      apiSecret: "s",
    });
    expect(result.ok).toBe(false);
  });

  it("requires a personaId for bot accounts", async () => {
    const { service } = makeService({});
    const result = await service.addParticipant({
      displayName: "A Bot",
      apiKey: "k",
      apiSecret: "s",
      kind: "bot",
    });
    expect(result.ok).toBe(false);
  });
});
