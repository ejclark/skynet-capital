import { FixtureTradingTransport } from "../../src/adapters/fixture-trading-transport.js";
import { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import type {
  ParticipantStore,
  StoredParticipant,
} from "../../src/participants/participant-store.js";
import { createAccountService } from "../../src/server/account-service.js";
import { ObservatoryHub } from "../../src/server/observatory-hub.js";

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

const ann: StoredParticipant = {
  id: "human-ann",
  displayName: "Ann",
  kind: "human",
  credentials: { apiKey: "k", apiSecret: "s" },
  timezone: "America/New_York",
};

const bot: StoredParticipant = {
  id: "sauron",
  displayName: "Sauron",
  kind: "bot",
  personaId: "sauron",
  credentials: { apiKey: "bk", apiSecret: "bs" },
};

const board = (): DashboardData => ({
  generatedAt: "t0",
  participants: [
    { id: "human-ann", displayName: "Ann", kind: "human", cash: 10, equity: 10, positions: [] },
    { id: "sauron", displayName: "Sauron", kind: "bot", cash: 10, equity: 10, positions: [] },
  ],
  collisions: [],
});

const okFactory = () =>
  new AlpacaTradingClient(
    new FixtureTradingTransport({
      account: { id: "x", cash: "1000", portfolio_value: "1000", status: "ACTIVE" },
    }),
  );

function makeService(
  overrides: { store?: MemStore; roster?: StoredParticipant[]; owners?: string[] } = {},
) {
  const store = overrides.store ?? new MemStore();
  if (!overrides.store) store.items = [ann, bot];
  const hub = new ObservatoryHub(board());
  const stopped: string[] = [];
  const roster = overrides.roster;
  const owners = overrides.owners;
  const service = createAccountService({
    hub,
    store,
    clientFactory: okFactory,
    stopStream: (id) => stopped.push(id),
    now: () => new Date("2026-08-19T00:00:00.000Z"),
    ...(roster ? { findRosterParticipant: (id) => roster.find((p) => p.id === id) } : {}),
    ...(owners ? { isOwnerEmail: (email) => owners.includes(email) } : {}),
  });
  return { service, store, hub, stopped };
}

const selfInput = { requesterId: "human-ann", sessionNames: ["ann"], authConfigured: true };

describe("account service — updateProfile", () => {
  it("refuses everything when the store cannot encrypt", async () => {
    const { service, store } = makeService();
    store.secure = false;
    const result = await service.updateProfile({ id: "human-ann", ...selfInput });
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.error).toContain("SKYNET_STORE_SECRET");
  });

  it("refuses an env-configured account with an honest reason, and a rotateId to act on", async () => {
    const { service } = makeService({ roster: [{ ...ann, id: "env-human" }] });
    const result = await service.updateProfile({ id: "env-human", ...selfInput });
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) {
      expect(result.error).toContain("configured on the host");
      expect(result.rotateId).toBe("env-human");
    }
  });

  it("refuses an id that isn't on the board at all, distinctly from a host-configured one", async () => {
    const { service } = makeService();
    const result = await service.updateProfile({ id: "nobody-here", ...selfInput });
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) {
      expect(result.error).toContain("No self-service account");
      expect(result.error).not.toContain("configured on the host");
      expect(result.rotateId).toBeUndefined();
    }
  });

  // Eric, 2026-08-26: hit this on his own roster account and the message told him to "ask Eric" —
  // absurd when he IS the operator. An owner gets the honest, actionable reason instead.
  it("tells an OWNER who hits a host-configured wall the real reason, not to ask themselves", async () => {
    const { service } = makeService({
      roster: [{ ...ann, id: "env-human" }],
      owners: ["eric@example.com"],
    });
    const result = await service.updateProfile({
      id: "env-human",
      requesterId: "env-human",
      requesterEmail: "eric@example.com",
      authConfigured: true,
    });
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) {
      expect(result.error).toContain("even to you, the operator");
      expect(result.error).toContain("/rotate");
      expect(result.error).not.toContain("ask Eric");
    }
  });

  it("refuses a timezone edit on a roster bot with a rotation store row (the /account sibling of the removal hole)", async () => {
    const store = new MemStore();
    store.items = [{ ...bot, credentials: { apiKey: "rotated", apiSecret: "rotated" } }];
    const { service, store: s } = makeService({ store, roster: [bot] });
    const result = await service.updateProfile({
      id: "sauron",
      timezone: "America/Chicago",
      requesterId: "human-ann",
      authConfigured: true,
    });
    expect(result).toMatchObject({ ok: false });
    expect(s.items[0]?.timezone).toBeUndefined();
  });

  it("refuses to edit ANOTHER human's profile, and an unresolved session too", async () => {
    const { service, store } = makeService();
    const other = await service.updateProfile({
      id: "human-ann",
      timezone: "UTC",
      requesterId: "human-joe",
      sessionNames: ["joe"],
      authConfigured: true,
    });
    expect(other).toMatchObject({ ok: false });
    // The /trade posture, not /rotate's: no resolved identity = no edit. An unresolved authed
    // member must not be able to touch a human account (rename-takeover, docs/LESSONS.md).
    const unresolved = await service.updateProfile({
      id: "human-ann",
      timezone: "UTC",
      sessionNames: ["ann"],
      authConfigured: true,
    });
    expect(unresolved).toMatchObject({ ok: false });
    expect(store.items.find((p) => p.id === "human-ann")?.timezone).toBe("America/New_York");
  });

  it("refuses a human rename that would break the session link", async () => {
    const { service, store } = makeService();
    const result = await service.updateProfile({
      id: "human-ann",
      displayName: "Annie Oakley",
      ...selfInput,
    });
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.error).toContain("linked to this account by display name");
    expect(store.items.find((p) => p.id === "human-ann")?.displayName).toBe("Ann");
  });

  it("renames a human to a name their session still resolves to, and shows it on the board", async () => {
    const { service, store, hub } = makeService();
    const result = await service.updateProfile({
      id: "human-ann",
      displayName: "ann",
      requesterId: "human-ann",
      sessionNames: ["ann", "ann.smith"],
      authConfigured: true,
    });
    expect(result).toEqual({ ok: true, id: "human-ann", displayName: "ann" });
    expect(store.items.find((p) => p.id === "human-ann")?.displayName).toBe("ann");
    const row = hub.getState().participants.find((p) => p.id === "human-ann");
    expect(row?.displayName).toBe("ann");
  });

  it("allows any rename when no OAuth is configured (no session link exists to protect)", async () => {
    const { service, store } = makeService();
    const result = await service.updateProfile({
      id: "human-ann",
      displayName: "Someone Entirely New",
      authConfigured: false,
    });
    expect(result).toMatchObject({ ok: true });
    expect(store.items.find((p) => p.id === "human-ann")?.displayName).toBe("Someone Entirely New");
  });

  it("refuses to rename a bot (remove + re-add is the sanctioned path)", async () => {
    const { service } = makeService();
    // The bot's own linked owner, so this hits the rename ban specifically — not the ownership
    // gate a non-owner would hit first.
    const result = await service.updateProfile({
      id: "sauron",
      displayName: "The Eye",
      requesterId: "sauron",
      authConfigured: true,
    });
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.error).toContain("can't be renamed");
  });

  // 2026-08-26: this used to read `existing.kind === "human"`, exempting every bot outright —
  // correct back when a bot could never carry a resolved identity, stale once /claim (#546)
  // linked one to sauron's fixture below. A bot exempted from this check is editable by ANY
  // signed-in member with no ownership check at all — the same gap closed in rotate's
  // participant-service.ts.
  it("lets the bot's linked owner set its timezone", async () => {
    const { service, store } = makeService();
    const result = await service.updateProfile({
      id: "sauron",
      timezone: "America/Chicago",
      requesterId: "sauron", // resolved via /claim's OwnerLinkStore, same shape as a human's link
      authConfigured: true,
    });
    expect(result).toMatchObject({ ok: true });
    expect(store.items.find((p) => p.id === "sauron")?.timezone).toBe("America/Chicago");
  });

  it("refuses a bot timezone edit from a member who isn't its linked owner", async () => {
    const { service, store } = makeService();
    const result = await service.updateProfile({
      id: "sauron",
      timezone: "America/Chicago",
      requesterId: "human-ann",
      sessionNames: ["ann"],
      authConfigured: true,
    });
    expect(result).toMatchObject({ ok: false });
    expect(store.items.find((p) => p.id === "sauron")?.timezone).toBeUndefined();
  });

  it("validates the timezone and can clear it with an empty value", async () => {
    const { service, store } = makeService();
    const bad = await service.updateProfile({
      id: "human-ann",
      timezone: "Mars/Olympus",
      ...selfInput,
    });
    expect(bad).toMatchObject({ ok: false });
    const cleared = await service.updateProfile({ id: "human-ann", timezone: "", ...selfInput });
    expect(cleared).toMatchObject({ ok: true });
    expect(store.items.find((p) => p.id === "human-ann")?.timezone).toBeUndefined();
  });

  it("keeps credentials untouched through a profile edit", async () => {
    const { service, store } = makeService();
    await service.updateProfile({ id: "human-ann", timezone: "UTC", ...selfInput });
    expect(store.items.find((p) => p.id === "human-ann")?.credentials).toEqual({
      apiKey: "k",
      apiSecret: "s",
    });
  });
});

describe("account service — removeAccount", () => {
  const confirm = { confirmName: "Ann", ...selfInput };

  it("refuses when the store cannot encrypt (the blob can't be rewritten safely)", async () => {
    const { service, store } = makeService();
    store.secure = false;
    const result = await service.removeAccount({ id: "human-ann", ...confirm });
    expect(result).toMatchObject({ ok: false });
  });

  it("refuses an env-configured account with an honest reason, and a rotateId to act on", async () => {
    const { service } = makeService({ roster: [{ ...ann, id: "env-human" }] });
    const result = await service.removeAccount({
      id: "env-human",
      confirmName: "Env Human",
      ...selfInput,
    });
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) {
      expect(result.error).toContain("configured on the host");
      expect(result.rotateId).toBe("env-human");
    }
  });

  it("refuses an id that isn't on the board at all, distinctly from a host-configured one", async () => {
    const { service } = makeService();
    const result = await service.removeAccount({
      id: "nobody-here",
      confirmName: "Whoever",
      ...selfInput,
    });
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) {
      expect(result.error).toContain("No self-service account");
      expect(result.error).not.toContain("configured on the host");
    }
  });

  it("refuses to remove another human's account, and an unresolved session too", async () => {
    const { service, store, stopped } = makeService();
    const other = await service.removeAccount({
      id: "human-ann",
      confirmName: "Ann",
      requesterId: "human-joe",
      authConfigured: true,
    });
    expect(other).toMatchObject({ ok: false });
    const unresolved = await service.removeAccount({
      id: "human-ann",
      confirmName: "Ann",
      authConfigured: true,
    });
    expect(unresolved).toMatchObject({ ok: false });
    expect(store.items).toHaveLength(2);
    expect(stopped).toEqual([]);
  });

  it("refuses when the typed confirmation doesn't match the display name", async () => {
    const { service, store } = makeService();
    const result = await service.removeAccount({
      id: "human-ann",
      confirmName: "Anne",
      requesterId: "human-ann",
      authConfigured: true,
    });
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.error).toContain("nothing was removed");
    expect(store.items).toHaveLength(2);
  });

  it("removes your own account: store entry gone, stream stopped, board row dropped", async () => {
    const { service, store, hub, stopped } = makeService();
    const result = await service.removeAccount({ id: "human-ann", ...confirm });
    expect(result).toEqual({ ok: true, id: "human-ann", displayName: "Ann" });
    expect(store.items.map((p) => p.id)).toEqual(["sauron"]);
    expect(stopped).toEqual(["human-ann"]);
    expect(hub.getState().participants.map((p) => p.id)).toEqual(["sauron"]);
  });

  // Red-team, 2026-08-25: /rotate now leaves a store row under a roster id, so a rotated roster
  // BOT would otherwise fall through the human-only ownership guard and be removable by anyone —
  // deleting an owner's rotated credential and re-bricking the account on next boot.
  it("refuses to remove a host-configured roster bot even when a rotation left a store row under its id", async () => {
    const store = new MemStore();
    store.items = [{ ...bot, credentials: { apiKey: "rotated", apiSecret: "rotated" } }];
    const { service } = makeService({ store, roster: [bot] });

    const result = await service.removeAccount({
      id: "sauron",
      confirmName: "Sauron",
      requesterId: "human-ann",
      authConfigured: true,
    });

    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.error).toContain("configured on the host");
    expect(store.items).toHaveLength(1);
  });

  it("refuses to remove a roster HUMAN by id-provenance, not just the human-ownership guard", async () => {
    const rosterHuman: StoredParticipant = {
      id: "human-eric",
      displayName: "Eric",
      kind: "human",
      credentials: { apiKey: "rotated", apiSecret: "rotated" },
    };
    const store = new MemStore();
    store.items = [rosterHuman];
    const { service } = makeService({ store, roster: [rosterHuman] });

    const result = await service.removeAccount({
      id: "human-eric",
      confirmName: "Eric",
      requesterId: "human-eric", // even the "self" case: host accounts are the operator's
      authConfigured: true,
    });

    expect(result).toMatchObject({ ok: false });
    expect(store.items).toHaveLength(1);
  });

  // 2026-08-26: same gap as the updateProfile case above, sharper here — removal is destructive.
  // Before /claim (#546) could link a bot, "any signed-in member" was the only posture available;
  // it should have tightened the moment a bot could carry a resolved owner, and didn't.
  it("lets the bot's linked owner retire it with the typed-name confirmation", async () => {
    const { service, store, hub } = makeService();
    const result = await service.removeAccount({
      id: "sauron",
      confirmName: "sauron", // case-insensitive on purpose — the friction is typing it, not casing
      requesterId: "sauron", // resolved via /claim's OwnerLinkStore, same shape as a human's link
      authConfigured: true,
    });
    expect(result).toMatchObject({ ok: true });
    expect(store.items.map((p) => p.id)).toEqual(["human-ann"]);
    expect(hub.getState().participants.map((p) => p.id)).toEqual(["human-ann"]);
  });

  it("refuses to retire a bot from a member who isn't its linked owner", async () => {
    const { service, store } = makeService();
    const result = await service.removeAccount({
      id: "sauron",
      confirmName: "sauron",
      requesterId: "human-ann",
      authConfigured: true,
    });
    expect(result).toMatchObject({ ok: false });
    expect(store.items.map((p) => p.id)).toEqual(["human-ann", "sauron"]);
  });
});
