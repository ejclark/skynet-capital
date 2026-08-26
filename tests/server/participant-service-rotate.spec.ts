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

// Sibling of participant-service.spec.ts and participant-service-rotate-roster.spec.ts (split
// 2026-08-26 to stay under the per-file line cap) — this file covers
// ParticipantService.rotateCredentials for store/direct targets; env-roster targets live in the
// roster sibling. addParticipant lives in participant-service.spec.ts. All three hold their own
// copy of the fixtures below.

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
    // A CLAIMED account (ownerEmail on file) — the scenario this whole describe block guards.
    // An UNCLAIMED one is a different, newer scenario: see "auto-claim on rotate" below.
    const humanExisting: StoredParticipant = {
      id: "human-uncle_joe",
      displayName: "Uncle Joe",
      kind: "human",
      credentials: { apiKey: "old-key", apiSecret: "old-secret" },
      ownerEmail: "uncle_joe@example.com",
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

    it("does not enforce the check against an UNCLAIMED bot — nothing to match against yet", async () => {
      const store = new MemStore();
      store.items = [existing]; // kind: "bot", no ownerEmail
      const { service } = makeService({ store });

      const result = await service.rotateCredentials({
        id: "day-trader",
        apiKey: "new-key",
        apiSecret: "new-secret",
        requesterId: "human-someone_else",
      });

      expect(result.ok).toBe(true);
    });

    // 2026-08-26: a bot could never carry ownerEmail before /claim (#546) learned to link any
    // kind, so this check read `kind === "human"` and exempted bots outright — stale once a bot
    // can be claimed. A claimed bot exempted from this is rotatable, credentials swapped, by any
    // signed-in member with no check at all.
    const claimedBot: StoredParticipant = {
      id: "day-trader",
      displayName: "JARVIS",
      kind: "bot",
      personaId: "day-trader",
      credentials: { apiKey: "old-key", apiSecret: "old-secret" },
      ownerEmail: "handler@example.com",
    };

    it("refuses a CLAIMED bot target when the requester resolves to a DIFFERENT id", async () => {
      const store = new MemStore();
      store.items = [claimedBot];
      const { service } = makeService({ store });

      const result = await service.rotateCredentials({
        id: "day-trader",
        apiKey: "attacker-key",
        apiSecret: "attacker-secret",
        requesterId: "human-someone_else",
      });

      expect(result.ok).toBe(false);
      expect(store.items[0]?.credentials).toEqual(claimedBot.credentials);
    });

    it("allows a CLAIMED bot target when the requester resolves to THAT SAME id", async () => {
      const store = new MemStore();
      store.items = [claimedBot];
      const { service } = makeService({ store });

      const result = await service.rotateCredentials({
        id: "day-trader",
        apiKey: "new-key",
        apiSecret: "new-secret",
        requesterId: "day-trader",
      });

      expect(result.ok).toBe(true);
    });
  });

  // 2026-08-25 (Eric: "does rotating a key automatically connect an account?"): yes, for a
  // store account nobody has claimed — a verified new key IS the proof of ownership #547 already
  // accepted for /add, so a legacy row with no ownerEmail on file (added pre-OAuth, or before a
  // session existed to stamp one) adopts whoever successfully rotates it. This also closes a
  // real gap the old requesterId-only check left open: an unclaimed row had no ownerEmail to
  // match against, so `input.requesterId !== existing.id` was true for EVERY signed-in member
  // (their id, if any, is never this unclaimed one) EXCEPT one with no linked account at all —
  // for THAT member the check was vacuously skipped, silently permitting an anonymous rotation.
  // Naming the rotator as owner turns that same action into an accountable, intentional claim.
  describe("auto-claim on rotate (an unclaimed store account adopts its rotator)", () => {
    const unclaimed: StoredParticipant = {
      id: "human-legacy",
      displayName: "Legacy Account",
      kind: "human",
      credentials: { apiKey: "old-key", apiSecret: "old-secret" },
      // No ownerEmail — this is the whole point of the fixture.
    };

    it("stamps the rotator's session email as owner on success", async () => {
      const store = new MemStore();
      store.items = [unclaimed];
      const { service } = makeService({ store });

      const result = await service.rotateCredentials({
        id: "human-legacy",
        apiKey: "new-key",
        apiSecret: "new-secret",
        requesterEmail: "finder@example.com",
      });

      expect(result.ok).toBe(true);
      expect(store.items[0]?.ownerEmail).toBe("finder@example.com");
    });

    it("does not require the rotator to already own some OTHER account", async () => {
      const store = new MemStore();
      store.items = [unclaimed];
      const { service } = makeService({ store });

      const result = await service.rotateCredentials({
        id: "human-legacy",
        apiKey: "new-key",
        apiSecret: "new-secret",
        requesterId: "human-someone_else", // owns a different account — irrelevant here
        requesterEmail: "finder@example.com",
      });

      expect(result.ok).toBe(true);
      expect(store.items[0]?.ownerEmail).toBe("finder@example.com");
    });

    it("does not auto-claim in password mode — no identity exists to stamp", async () => {
      const store = new MemStore();
      store.items = [unclaimed];
      const { service } = makeService({ store });

      const result = await service.rotateCredentials({
        id: "human-legacy",
        apiKey: "new-key",
        apiSecret: "new-secret",
      });

      expect(result.ok).toBe(true);
      expect(store.items[0]?.ownerEmail).toBeUndefined();
    });

    it("never stamps ownerEmail onto a bot — bots aren't claimable", async () => {
      const store = new MemStore();
      store.items = [existing]; // kind: "bot", no ownerEmail
      const { service } = makeService({ store });

      const result = await service.rotateCredentials({
        id: "day-trader",
        apiKey: "new-key",
        apiSecret: "new-secret",
        requesterEmail: "finder@example.com",
      });

      expect(result.ok).toBe(true);
      expect(store.items[0]?.ownerEmail).toBeUndefined();
    });

    // Stamping ownerEmail onto a roster id's STORE row would be a silent no-op — mergeRoster
    // always keeps the env row's ownerEmail on a collision — so it must never even try, or a
    // future refactor could make that stamp start "working" in a way nobody reviewed.
    it("never stamps a roster id's store row — mergeRoster would ignore it anyway", async () => {
      const unownedRosterHuman: Participant = {
        id: "human-eric",
        displayName: "Eric",
        kind: "human",
        credentials: { apiKey: "revoked", apiSecret: "revoked" },
        // No ownerEmail, no SKYNET_HUMAN_ERIC_EMAIL — an owner-configured account nobody linked.
      };
      const { service, store } = makeService({
        roster: [unownedRosterHuman],
        owners: ["eric@example.com"],
      });

      const result = await service.rotateCredentials({
        id: "human-eric",
        apiKey: "new-key",
        apiSecret: "new-secret",
        requesterEmail: "eric@example.com", // owner — refuseRotation's roster branch allows it
      });

      expect(result.ok).toBe(true);
      expect(store.items[0]?.ownerEmail).toBeUndefined();
    });
  });
});

// Env-roster rotation targets (the 2026-08-25 dead-key trap, plus their own ownership/claim
// coverage) live in participant-service-rotate-roster.spec.ts.
