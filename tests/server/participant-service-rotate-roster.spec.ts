import { FixtureTradingTransport } from "../../src/adapters/fixture-trading-transport.js";
import { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import type { Participant } from "../../src/participants/participant.js";
import type {
  ParticipantStore,
  StoredParticipant,
} from "../../src/participants/participant-store.js";
import { ObservatoryHub } from "../../src/server/observatory-hub.js";
import { ParticipantService } from "../../src/server/participant-service.js";

// Sibling of participant-service-rotate.spec.ts (split 2026-08-26 to stay under the per-file
// line cap) — this half covers env-roster rotation targets specifically, with its own copy of
// the shared fixtures. The rest of ParticipantService.rotateCredentials lives in the sibling.

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
  const service = new ParticipantService({
    hub,
    store,
    clientFactory: overrides.factory ?? okFactory,
    startStream: (p) => started.push(p),
    recordSeedSample: () => {
      // Seed samples aren't asserted on in this file — the sibling spec covers them.
    },
    now: () => new Date("2026-07-24T00:00:00.000Z"),
    ...(roster ? { findRosterParticipant: (id) => roster.find((p) => p.id === id) } : {}),
    ...(owners ? { isOwnerEmail: (email) => owners.includes(email) } : {}),
  });
  return { service, store, hub, started };
}

describe("ParticipantService.rotateCredentials", () => {
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

    // 2026-08-26: a roster BOT is claimable too (claim-form.ts is explicit about this) — its
    // linked member's session resolves requesterId to the bot's own id, same shape as a human's
    // link. `self` used to also require kind === "human", so this member — despite resolving to
    // exactly this account — fell through to the owner-only check and was refused.
    it("lets a roster BOT's linked member rotate it without being an owner", async () => {
      const { service } = makeService({ roster: [sauronEnv], owners: ["someone@else.com"] });

      const result = await service.rotateCredentials({
        id: "sauron",
        apiKey: "fresh-key",
        apiSecret: "fresh-secret",
        requesterId: "sauron",
        requesterEmail: "handler@example.com",
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
