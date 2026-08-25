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
}

const emptyBoard = (): DashboardData => ({ generatedAt: "t0", participants: [], collisions: [] });

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
      apiKey: "k",
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
      apiKey: "k",
      apiSecret: "s",
    });

    expect(result).toEqual({ ok: true, id: "human-uncle_joe", displayName: "Uncle Joe" });
    expect(store.has("human-uncle_joe")).toBe(true);
    expect(hub.getState().participants.map((p) => p.id)).toContain("human-uncle_joe");
    expect(started).toHaveLength(1);
  });

  it("records the founding seed sample at onboarding — the doubling baseline", async () => {
    const { service, seeds } = makeService({});
    await service.addParticipant({ displayName: "Uncle Joe", apiKey: "k", apiSecret: "s" });

    expect(seeds).toEqual([
      { id: "human-uncle_joe", equity: 1000, at: "2026-07-24T00:00:00.000Z" },
    ]);
  });

  it("rejects a key Alpaca refuses — nothing is stored or shown", async () => {
    const { service, store, hub, seeds } = makeService({
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
    expect(seeds).toHaveLength(0); // no founding record for a rejected key
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
      apiKey: "k",
      apiSecret: "s",
    });
    expect(result.ok).toBe(false);
    expect(store.items).toHaveLength(0);
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

  it("rejects a timezone outside the controlled list — a raw POST bypassing the <select>", async () => {
    const { service } = makeService({});
    const result = await service.addParticipant({
      displayName: "Uncle Joe",
      apiKey: "k",
      apiSecret: "s",
      timezone: "Not/AZone",
    });
    expect(result.ok).toBe(false);
  });

  it("accepts an offered timezone", async () => {
    const { service } = makeService({});
    const result = await service.addParticipant({
      displayName: "Uncle Joe",
      apiKey: "k",
      apiSecret: "s",
      timezone: "America/Chicago",
    });
    expect(result.ok).toBe(true);
  });
});

describe("ParticipantService.rotateCredentials", () => {
  const existing: StoredParticipant = {
    id: "day-trader",
    displayName: "JARVIS",
    kind: "bot",
    personaId: "day-trader",
    credentials: { apiKey: "old-key", apiSecret: "old-secret" },
  };

  // The gap this closes (docs/LESSONS.md, 2026-08-11): a regenerated key previously had no
  // sanctioned home, since addParticipant refuses a duplicate id outright.
  it("refuses to rotate an id that was never added — this is not a back door around addParticipant", async () => {
    const { service, store, hub } = makeService({});
    const result = await service.rotateCredentials({
      id: "day-trader",
      apiKey: "new-key",
      apiSecret: "new-secret",
    });

    expect(result.ok).toBe(false);
    expect(store.items).toHaveLength(0);
    expect(hub.getState().participants).toHaveLength(0);
  });

  it("swaps only the credentials, preserving displayName/kind/personaId", async () => {
    const store = new MemStore();
    store.items = [existing];
    // The board's live state is rehydrated from the store at boot (serve-dashboard.ts) — a
    // rotated participant is already ON the board, not just in the store, so seed both here.
    const boardHub = new ObservatoryHub({
      generatedAt: "t0",
      participants: [
        {
          id: "day-trader",
          displayName: "JARVIS",
          kind: "bot",
          personaId: "day-trader",
          cash: 900,
          equity: 1000,
          positions: [],
        },
      ],
      collisions: [],
    });
    const { service, hub } = makeService({ store, hub: boardHub });

    const result = await service.rotateCredentials({
      id: "day-trader",
      apiKey: "new-key",
      apiSecret: "new-secret",
    });

    expect(result).toEqual({ ok: true, id: "day-trader", displayName: "JARVIS" });
    const stored = store.items.find((p) => p.id === "day-trader");
    expect(stored?.credentials).toEqual({ apiKey: "new-key", apiSecret: "new-secret" });
    expect(stored?.displayName).toBe("JARVIS");
    expect(stored?.personaId).toBe("day-trader");
    // Same array position, new balances — not appended as a second entry.
    expect(hub.getState().participants).toHaveLength(1);
  });

  it("verifies the NEW key against Alpaca before storing anything", async () => {
    const store = new MemStore();
    store.items = [existing];
    const { service, hub } = makeService({
      store,
      factory: () => new AlpacaTradingClient(new RejectingTransport()),
    });

    const result = await service.rotateCredentials({
      id: "day-trader",
      apiKey: "bad-key",
      apiSecret: "bad-secret",
    });

    expect(result.ok).toBe(false);
    // The old, working credentials are untouched.
    expect(store.items[0]?.credentials).toEqual(existing.credentials);
    expect(hub.getState().participants).toHaveLength(0);
  });

  it("reopens the account's stream with the new credentials", async () => {
    const store = new MemStore();
    store.items = [existing];
    const { service, started } = makeService({ store });

    await service.rotateCredentials({
      id: "day-trader",
      apiKey: "new-key",
      apiSecret: "new-secret",
    });

    expect(started).toHaveLength(1);
    expect(started[0]?.credentials).toEqual({ apiKey: "new-key", apiSecret: "new-secret" });
  });

  it("refuses onboarding when the store cannot encrypt", async () => {
    const store = new MemStore();
    store.items = [existing];
    store.secure = false;
    const { service } = makeService({ store });

    const result = await service.rotateCredentials({
      id: "day-trader",
      apiKey: "new-key",
      apiSecret: "new-secret",
    });

    expect(result.ok).toBe(false);
  });

  describe("ownership check (2026-08-11: rotate must not let one member hijack another's account)", () => {
    const humanExisting: StoredParticipant = {
      id: "human-uncle_joe",
      displayName: "Uncle Joe",
      kind: "human",
      credentials: { apiKey: "old-key", apiSecret: "old-secret" },
    };

    it("refuses a human target when the requester resolves to a DIFFERENT id", async () => {
      const store = new MemStore();
      store.items = [humanExisting];
      const { service } = makeService({ store });

      const result = await service.rotateCredentials({
        id: "human-uncle_joe",
        apiKey: "attacker-key",
        apiSecret: "attacker-secret",
        requesterId: "human-someone_else",
      });

      expect(result.ok).toBe(false);
      expect(store.items[0]?.credentials).toEqual(humanExisting.credentials);
    });

    it("allows a human target when the requester resolves to THAT SAME id", async () => {
      const store = new MemStore();
      store.items = [humanExisting];
      const { service } = makeService({ store });

      const result = await service.rotateCredentials({
        id: "human-uncle_joe",
        apiKey: "new-key",
        apiSecret: "new-secret",
        requesterId: "human-uncle_joe",
      });

      expect(result.ok).toBe(true);
    });

    it("does not enforce the check when requesterId is absent — no OAuth configured", async () => {
      const store = new MemStore();
      store.items = [humanExisting];
      const { service } = makeService({ store });

      const result = await service.rotateCredentials({
        id: "human-uncle_joe",
        apiKey: "new-key",
        apiSecret: "new-secret",
      });

      expect(result.ok).toBe(true);
    });

    it("does not enforce the check against a bot target — bots have no session identity", async () => {
      const store = new MemStore();
      store.items = [existing]; // kind: "bot"
      const { service } = makeService({ store });

      const result = await service.rotateCredentials({
        id: "day-trader",
        apiKey: "new-key",
        apiSecret: "new-secret",
        requesterId: "human-someone_else",
      });

      expect(result.ok).toBe(true);
    });
  });

  // 2026-08-25: regenerating a key in Alpaca REVOKES the old pair instantly, so an env-declared
  // account's credential dies with no self-service fix — /rotate previously refused anything not
  // in the store, leaving "update the host env and redeploy" as the only path back to syncing.
  describe("env-roster targets (the 2026-08-25 dead-key trap)", () => {
    const ericEnv: Participant = {
      id: "human-eric",
      displayName: "Eric",
      kind: "human",
      credentials: { apiKey: "revoked-key", apiSecret: "revoked-secret" },
      ownerEmail: "eric@example.com",
    };
    const sauronEnv: Participant = {
      id: "sauron",
      displayName: "Sauron",
      kind: "bot",
      personaId: "sauron",
      credentials: { apiKey: "revoked-key", apiSecret: "revoked-secret" },
    };

    it("rotates a roster account into the store — the merge layer then overrides the dead env pair", async () => {
      const { service, store, started } = makeService({
        roster: [ericEnv],
        owners: ["eric@example.com"],
      });

      const result = await service.rotateCredentials({
        id: "human-eric",
        apiKey: "fresh-key",
        apiSecret: "fresh-secret",
        requesterId: "human-eric",
        requesterEmail: "eric@example.com",
      });

      expect(result).toEqual({ ok: true, id: "human-eric", displayName: "Eric" });
      expect(store.items.find((p) => p.id === "human-eric")?.credentials.apiKey).toBe("fresh-key");
      expect(started[0]?.credentials.apiKey).toBe("fresh-key");
    });

    it("lets an owner rotate a roster BOT'S key — env bots are the owner's own accounts", async () => {
      const { service } = makeService({ roster: [sauronEnv], owners: ["eric@example.com"] });

      const result = await service.rotateCredentials({
        id: "sauron",
        apiKey: "fresh-key",
        apiSecret: "fresh-secret",
        requesterEmail: "eric@example.com",
      });

      expect(result.ok).toBe(true);
    });

    it("lets the linked member rotate their own roster account without being an owner", async () => {
      const { service } = makeService({ roster: [ericEnv], owners: ["someone@else.com"] });

      const result = await service.rotateCredentials({
        id: "human-eric",
        apiKey: "fresh-key",
        apiSecret: "fresh-secret",
        requesterId: "human-eric",
        requesterEmail: "eric@example.com",
      });

      expect(result.ok).toBe(true);
    });

    it("refuses a signed-in NON-owner whose session doesn't resolve to the target", async () => {
      const { service, store } = makeService({ roster: [ericEnv], owners: ["eric@example.com"] });

      const result = await service.rotateCredentials({
        id: "human-eric",
        apiKey: "attacker-key",
        apiSecret: "attacker-secret",
        requesterEmail: "member@example.com",
      });

      expect(result.ok).toBe(false);
      expect(store.items).toHaveLength(0);
    });

    it("keeps the stricter gate after a FIRST rotation left a store row under the roster id", async () => {
      // The id's tier must never downgrade to store rules just because a rotation happened —
      // otherwise the hijack window reopens one rotation later.
      const store = new MemStore();
      store.items = [{ ...ericEnv, credentials: { apiKey: "rotated", apiSecret: "rotated" } }];
      const { service } = makeService({ store, roster: [ericEnv], owners: ["eric@example.com"] });

      const result = await service.rotateCredentials({
        id: "human-eric",
        apiKey: "attacker-key",
        apiSecret: "attacker-secret",
        requesterEmail: "member@example.com",
      });

      expect(result.ok).toBe(false);
    });

    it("allows roster rotation in password mode — no emails exist, the password gate is the boundary", async () => {
      const { service } = makeService({ roster: [sauronEnv] });

      const result = await service.rotateCredentials({
        id: "sauron",
        apiKey: "fresh-key",
        apiSecret: "fresh-secret",
      });

      expect(result.ok).toBe(true);
    });
  });
});
