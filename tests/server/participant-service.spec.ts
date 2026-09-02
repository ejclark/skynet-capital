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

// Sibling: participant-service-rotate.spec.ts (split 2026-08-26 to stay under the per-file line
// cap) — that half covers ParticipantService.rotateCredentials in full, with its own copy of
// the fixtures below. This file keeps ParticipantService.addParticipant.

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

class RejectingTransport implements AlpacaTradingTransport {
  get(): Promise<JsonResponse> {
    return Promise.resolve({ status: 403, body: { message: "forbidden" } });
  }
  post(): Promise<JsonResponse> {
    return Promise.resolve({ status: 403, body: null });
  }
  delete(): Promise<JsonResponse> {
    return Promise.resolve({ status: 403, body: null });
  }
}

const emptyBoard = (): DashboardData => ({ generatedAt: "t0", participants: [], collisions: [] });

const okFactory = () =>
  new AlpacaTradingClient(
    new FixtureTradingTransport({
      account: { id: "x", cash: "1000000", portfolio_value: "1000000", status: "ACTIVE" },
    }),
  );

function makeService(overrides: {
  store?: MemStore;
  hub?: ObservatoryHub;
  factory?: () => AlpacaTradingClient;
  started?: Participant[];
  /** The env-configured roster, when the scenario has one. */
  roster?: Participant[];
  /** Emails on the env owner allowlist, when the scenario has OAuth owners. */
  owners?: string[];
}) {
  const store = overrides.store ?? new MemStore();
  const hub = overrides.hub ?? new ObservatoryHub(emptyBoard());
  const started = overrides.started ?? [];
  const roster = overrides.roster;
  const owners = overrides.owners;
  const seeds: Array<{ id: string; equity: number; at: string }> = [];
  const service = new ParticipantService({
    hub,
    store,
    clientFactory: overrides.factory ?? okFactory,
    startStream: (p) => started.push(p),
    recordSeedSample: (snapshot, at) =>
      seeds.push({ id: snapshot.id, equity: snapshot.equity, at }),
    now: () => new Date("2026-07-24T00:00:00.000Z"),
    ...(roster ? { findRosterParticipant: (id) => roster.find((p) => p.id === id) } : {}),
    ...(owners ? { isOwnerEmail: (email) => owners.includes(email) } : {}),
  });
  return { service, store, hub, started, seeds };
}

describe("ParticipantService.addParticipant", () => {
  // Other people's credentials must never land on disk in the clear. When the store has no
  // encryption key, onboarding is refused up front — before a key is validated, streamed, or
  // stored — rather than degrading to a plaintext write.
  it("refuses onboarding entirely when the store cannot encrypt", async () => {
    const store = new MemStore();
    store.secure = false;
    const { service, started, hub } = makeService({ store });

    const result = await service.addParticipant({
      displayName: "Uncle Joe",
      apiKey: "PK-k",
      apiSecret: "s",
    });

    expect(result.ok).toBe(false);
    expect(store.items).toHaveLength(0);
    expect(started).toHaveLength(0);
    expect(hub.getState().participants).toHaveLength(0);
  });

  it("validates the key, stores, appends to the board live, and opens the stream", async () => {
    const { service, store, hub, started } = makeService({});
    const result = await service.addParticipant({
      displayName: "Uncle Joe",
      apiKey: "PK-k",
      apiSecret: "s",
    });

    expect(result).toEqual({ ok: true, id: "human-uncle_joe", displayName: "Uncle Joe" });
    expect(store.has("human-uncle_joe")).toBe(true);
    expect(hub.getState().participants.map((p) => p.id)).toContain("human-uncle_joe");
    expect(started).toHaveLength(1);
  });

  it("records the founding seed sample at onboarding — the doubling baseline", async () => {
    const { service, seeds } = makeService({});
    await service.addParticipant({ displayName: "Uncle Joe", apiKey: "PK-k", apiSecret: "s" });

    expect(seeds).toEqual([
      { id: "human-uncle_joe", equity: 1_000_000, at: "2026-07-24T00:00:00.000Z" },
    ]);
  });

  it("rejects a key Alpaca refuses — nothing is stored or shown", async () => {
    const { service, store, hub, seeds } = makeService({
      factory: () => new AlpacaTradingClient(new RejectingTransport()),
    });
    const result = await service.addParticipant({
      displayName: "Bad",
      apiKey: "PK-k",
      apiSecret: "s",
    });

    expect(result.ok).toBe(false);
    expect(store.items).toHaveLength(0);
    expect(hub.getState().participants).toHaveLength(0);
    expect(seeds).toHaveLength(0); // no founding record for a rejected key
  });

  it("rejects blank fields", async () => {
    const { service } = makeService({});
    expect(
      (await service.addParticipant({ displayName: "", apiKey: "PK-k", apiSecret: "s" })).ok,
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
      apiKey: "PK-k",
      apiSecret: "s",
    });
    expect(result.ok).toBe(false);
  });

  it("refuses an id colliding with an env-configured (roster) account, not just the store", async () => {
    // Otherwise a self-service row's owner link could resolve trade requests that
    // `findParticipant`'s roster-wins precedence then executes against the ROSTER
    // account's real credentials — a takeover chain, not just a display-name clash.
    const { service, store } = makeService({
      roster: [
        {
          id: "human-eric_clark",
          displayName: "Eric Clark",
          kind: "human",
          credentials: { apiKey: "env-k", apiSecret: "env-s" },
        },
      ],
    });
    const result = await service.addParticipant({
      displayName: "Eric Clark",
      apiKey: "PK-k",
      apiSecret: "s",
    });
    expect(result.ok).toBe(false);
    expect(store.items).toHaveLength(0);
  });

  it("requires a personaId for bot accounts", async () => {
    const { service } = makeService({});
    const result = await service.addParticipant({
      displayName: "A Bot",
      apiKey: "PK-k",
      apiSecret: "s",
      kind: "bot",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a timezone outside the controlled list — a raw POST bypassing the <select>", async () => {
    const { service } = makeService({});
    const result = await service.addParticipant({
      displayName: "Uncle Joe",
      apiKey: "PK-k",
      apiSecret: "s",
      timezone: "Not/AZone",
    });
    expect(result.ok).toBe(false);
  });

  it("accepts an offered timezone", async () => {
    const { service } = makeService({});
    const result = await service.addParticipant({
      displayName: "Uncle Joe",
      apiKey: "PK-k",
      apiSecret: "s",
      timezone: "America/Chicago",
    });
    expect(result.ok).toBe(true);
  });

  // The forms only offer registry classes, but the submitted personaId BECOMES the participant
  // id — a raw POST bypassing the radios could otherwise mint an account under an arbitrary
  // slug no persona will ever drive (found by the phase-9c security review, 2026-08-28).
  it("refuses a personaId outside the persona registry — a raw POST bypassing the class picker", async () => {
    const { service, store } = makeService({});
    const result = await service.addParticipant({
      displayName: "A Bot",
      apiKey: "PK-k",
      apiSecret: "s",
      kind: "bot",
      personaId: "not-a-class",
    });
    expect(result.ok).toBe(false);
    expect(store.items).toHaveLength(0);
  });

  it("accepts a registry personaId — the class becomes the participant id", async () => {
    const { service, store } = makeService({});
    const result = await service.addParticipant({
      displayName: "JARVIS",
      apiKey: "PK-k",
      apiSecret: "s",
      kind: "bot",
      personaId: "day-trader",
    });
    expect(result).toEqual({ ok: true, id: "day-trader", displayName: "JARVIS" });
    expect(store.items[0]?.personaId).toBe("day-trader");
  });

  // Without the stamp a member-added bot is unclaimed, and refuseRotation's store tier lets ANY
  // signed-in member rotate an unclaimed account — a silent credential swap of somebody else's
  // bot (same review, 2026-08-28). The adder owns their bot, exactly as they own their human row.
  it("stamps the adder as owner on a bot account, same as a human", async () => {
    const { service, store } = makeService({});
    await service.addParticipant({
      displayName: "JARVIS",
      apiKey: "PK-k",
      apiSecret: "s",
      kind: "bot",
      personaId: "day-trader",
      ownerEmail: "adder@example.com",
    });
    expect(store.items[0]?.ownerEmail).toBe("adder@example.com");
  });

  it("refuses a SECOND member's rotation of a member-added bot — the adder owns it", async () => {
    const { service, store } = makeService({});
    await service.addParticipant({
      displayName: "JARVIS",
      apiKey: "PK-k",
      apiSecret: "s",
      kind: "bot",
      personaId: "day-trader",
      ownerEmail: "adder@example.com",
    });
    const result = await service.rotateCredentials({
      id: "day-trader",
      apiKey: "stolen-key",
      apiSecret: "stolen-secret",
      requesterEmail: "second-member@example.com",
    });
    expect(result.ok).toBe(false);
    expect(store.items[0]?.credentials.apiKey).toBe("PK-k");
  });

  // A raw exception can carry internals — hostnames, proxy banners — that don't belong in
  // member-facing copy. The unreachable arm answers with a fixed sentence instead.
  it("keeps exception internals out of the Alpaca-unreachable error", async () => {
    const { service } = makeService({
      factory: () => {
        throw new Error("connect ECONNREFUSED internal-proxy.corp:8080");
      },
    });
    const result = await service.addParticipant({
      displayName: "Uncle Joe",
      apiKey: "PK-k",
      apiSecret: "s",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).not.toContain("internal-proxy");
      expect(result.error).toContain("Could not reach Alpaca");
    }
  });
  // The two onboarding gates the design added (2026-09-02, "Alpaca onboarding process
  // streamline"): a live key is named as such before Alpaca is ever called, and a valid key on a
  // paper account that isn't at the league's $1,000,000 starting line is refused with the number
  // the member has to fix — nothing stored, streamed, or seeded in either case.
  it("refuses a live key (no PK prefix) before touching Alpaca", async () => {
    let called = 0;
    const { service, store, started } = makeService({
      factory: () => {
        called++;
        return okFactory();
      },
    });
    const result = await service.addParticipant({
      displayName: "Live Larry",
      apiKey: "AK-live",
      apiSecret: "s",
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.error).toContain("start with PK");
    expect(called).toBe(0);
    expect(store.items).toHaveLength(0);
    expect(started).toHaveLength(0);
  });

  it("refuses a paper account that isn't at the $1,000,000 starting line, naming the balance found", async () => {
    const { service, store, started, seeds, hub } = makeService({
      factory: () =>
        new AlpacaTradingClient(
          new FixtureTradingTransport({
            account: { id: "x", cash: "100000", portfolio_value: "100000", status: "ACTIVE" },
          }),
        ),
    });
    const result = await service.addParticipant({
      displayName: "Default Dan",
      apiKey: "PK-k",
      apiSecret: "s",
    });

    expect(result).toEqual({
      ok: false,
      reason: "balance",
      found: 100_000,
      error: expect.stringContaining("$100,000.00"),
    });
    expect(result.ok ? "" : result.error).toContain("$1,000,000.00");
    expect(store.items).toHaveLength(0);
    expect(started).toHaveLength(0);
    expect(seeds).toEqual([]);
    expect(hub.getState().participants).toHaveLength(0);
  });

  it("accepts the starting line to the cent — Alpaca's string balances round-trip exactly", async () => {
    const { service } = makeService({
      factory: () =>
        new AlpacaTradingClient(
          new FixtureTradingTransport({
            account: {
              id: "x",
              cash: "1000000.00",
              portfolio_value: "1000000.00",
              status: "ACTIVE",
            },
          }),
        ),
    });
    const result = await service.addParticipant({
      displayName: "Exact Eve",
      apiKey: "PK-k",
      apiSecret: "s",
    });
    expect(result.ok).toBe(true);
  });
});
