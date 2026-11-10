import { mkdtemp, rm } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { parseSubscriptionsSnapshot } from "../../src/autonomous/subscriptions-wire.js";
import { DELEGATION_LOCKED_NOTE } from "../../src/domain/playbook-delegation.js";
import {
  BELOW_BAR_FLOOR_PCT,
  openCeilingFor,
  ownerFloorsOf,
} from "../../src/playbooks/fit-floor.js";
import { findPair } from "../../src/playbooks/pair-table.js";
import { subscriptionsOnTheWire } from "../../src/scripts/dashboard-insights-bridge.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { subscriptionSummary } from "../../src/server/subscription-changes.js";
import { SubscriptionStore } from "../../src/server/subscription-store.js";
import { serveSubscriptionsApi } from "../../src/server/subscriptions-api-routes.js";

/**
 * #6954 slice 5c-ii — the Playbook Store writes an owner's smaller below-bar floor, and the app
 * sends it to the bots under `subscriptions.v5`. Against a real store on a temp file, so what
 * reaches disk, and then the wire, is what is asserted.
 *  - WHEN an owner sets a smaller floor on a below-bar subscription, the bots SHALL size that pair's
 *    opens no larger than it (the same `openCeilingFor` the guards and the label read).
 *  - The Store SHALL refuse in words a floor above `BELOW_BAR_FLOOR_PCT`, one at or below 0, and one
 *    on a pair that is not below its bar.
 *  - Lowering a floor SHALL never meet the delegation fog; raising or clearing one SHALL.
 *
 * S1-NVDA is below its bar (p 0.0032 against about 0.001); G1-GOOG is not.
 */

const session = { email: "eric@example.com", name: "Eric Clark" } as never;
const TODAY = () => new Date("2026-11-07T15:00:00.000Z");

function request(method: string, body: unknown, url?: string): IncomingMessage {
  const req = Readable.from([
    typeof body === "string" ? body : JSON.stringify(body),
  ]) as unknown as IncomingMessage;
  req.method = method;
  req.headers = method === "POST" ? { "content-type": "application/json" } : {};
  if (url) req.url = url;
  return req;
}

/** A viewer whose ladder has not earned the delegation rung: the fog is down. */
const FOGGED = {
  resolveOwnerId: () => "sauron",
  progression: {
    view: () => Promise.resolve({ wheels: true, earnedByCode: new Map() }),
  },
};

async function call(
  store: SubscriptionStore,
  path: string,
  req: IncomingMessage,
  over: Record<string, unknown> = {},
): Promise<{ status?: number; body: Record<string, unknown> }> {
  const out: { status?: number; body?: string } = {};
  const res = {
    writeHead(status: number) {
      out.status = status;
      return res;
    },
    end(body?: string) {
      out.body = body ?? "";
    },
  } as unknown as ServerResponse;
  const config = {
    auth: { providerIds: ["google"] },
    resolveOwnerIds: () => ["sauron"],
    now: TODAY,
    subscriptions: store,
    ...over,
  } as unknown as DashboardServerConfig;
  await serveSubscriptionsApi(req, res, path, config, session);
  return {
    ...(out.status === undefined ? {} : { status: out.status }),
    body: JSON.parse(out.body ?? "{}"),
  };
}

const EDIT = { id: "sauron", mode: "standard", capitalAllocated: 50_000 } as const;

describe("an owner's below-bar floor, written by the Store (#6954 slice 5c-ii)", () => {
  let dir: string;
  let store: SubscriptionStore;
  const configure = (body: Record<string, unknown>, over?: Record<string, unknown>) =>
    call(store, "/api/playbook-store/configure", request("POST", body), over);
  const floorOn = (playbookId: string) =>
    store.load().sauron?.find((s) => s.playbookId === playbookId)?.belowBarFloorPct;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-5c2-"));
    store = new SubscriptionStore(join(dir, "playbook-subscriptions.json"));
    store.subscribe("sauron", {
      playbookId: "S1-NVDA",
      mode: "standard",
      capitalAllocated: 50_000,
      enabled: true,
    });
    store.subscribe("sauron", {
      playbookId: "G1-GOOG",
      mode: "standard",
      capitalAllocated: 50_000,
      enabled: true,
    });
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("reaches the bots: a set floor sizes the pair's opens to it, within one poll", async () => {
    const saved = await configure({ ...EDIT, playbookId: "S1-NVDA", belowBarFloorPct: 0.005 });
    expect(saved.body).toEqual({ ok: true });
    expect(floorOn("S1-NVDA")).toBe(0.005);
    const sent = JSON.parse(JSON.stringify(subscriptionsOnTheWire(store, TODAY().getTime())));
    const read = parseSubscriptionsSnapshot(sent);
    expect(read?.kind).toBe("subscriptions.v5");
    const ceiling = openCeilingFor(findPair, ownerFloorsOf(read?.accounts.sauron ?? []));
    expect(ceiling("S1-NVDA")).toBe(0.005);
    expect(ceiling("G1-GOOG")).toBeUndefined();
  });

  it("an edit that leaves the field out keeps the floor; null clears it to the house floor", async () => {
    await configure({ ...EDIT, playbookId: "S1-NVDA", belowBarFloorPct: 0.005 });
    await configure({ ...EDIT, playbookId: "S1-NVDA", capitalAllocated: 40_000 });
    expect(floorOn("S1-NVDA")).toBe(0.005);
    await configure({ ...EDIT, playbookId: "S1-NVDA", belowBarFloorPct: null });
    expect(floorOn("S1-NVDA")).toBeUndefined();
  });

  it("a re-subscribe can state one, and one that states none keeps it", async () => {
    const subscribe = (extra: Record<string, unknown>) =>
      call(
        store,
        "/api/playbook-store/subscribe",
        request("POST", { ...EDIT, playbookId: "S1-NVDA", ...extra }),
      );
    expect((await subscribe({ belowBarFloorPct: 0.0025 })).body).toEqual({ ok: true });
    expect(floorOn("S1-NVDA")).toBe(0.0025);
    await subscribe({});
    expect(floorOn("S1-NVDA")).toBe(0.0025);
  });

  describe("is refused in words, and nothing is saved", () => {
    it.each([
      ["above the house limit", "S1-NVDA", 0.02, /only be set below the house limit of 1%/],
      [
        "at the house limit: it would change nothing",
        "S1-NVDA",
        BELOW_BAR_FLOOR_PCT,
        /below the house limit of 1%/,
      ],
      ["on a pair at its bar", "G1-GOOG", 0.005, /meets its study's bar/],
      ["at zero", "S1-NVDA", 0, /above 0%/],
      ["below zero", "S1-NVDA", -0.001, /above 0%/],
    ])("%s", async (_label, playbookId, belowBarFloorPct, words) => {
      const answer = await configure({ ...EDIT, playbookId, belowBarFloorPct });
      expect(answer.body.ok).toBe(false);
      expect(String(answer.body.error)).toMatch(words);
      expect(floorOn(playbookId)).toBeUndefined();
    });

    it("on subscribe too", async () => {
      const answer = await call(
        store,
        "/api/playbook-store/subscribe",
        request("POST", { ...EDIT, playbookId: "S1-NVDA", belowBarFloorPct: 0.03 }),
      );
      expect(answer.body).toMatchObject({ ok: false });
      expect(floorOn("S1-NVDA")).toBeUndefined();
    });
  });

  it("a floor echoed back unchanged is never re-judged, so it cannot block an unrelated edit", async () => {
    // A floor saved while G1-GOOG sat below its bar (written to disk directly: the Store would now
    // refuse it), then an edit from a page that still sends it.
    store.configure("sauron", "G1-GOOG", { ...EDIT, belowBarFloorPct: 0.005 });
    const answer = await configure({
      ...EDIT,
      playbookId: "G1-GOOG",
      capitalAllocated: 40_000,
      belowBarFloorPct: 0.005,
    });
    expect(answer.body).toEqual({ ok: true });
    expect(floorOn("G1-GOOG")).toBe(0.005);
    // ...and it can be cleared there.
    await configure({ ...EDIT, playbookId: "G1-GOOG", belowBarFloorPct: null });
    expect(floorOn("G1-GOOG")).toBeUndefined();
  });

  it.each([
    ["a string", "0.005"],
    ["an object", { pct: 1 }],
    ["true", true],
  ])(
    "a floor that is not a number (%s) is a 400, never dropped",
    async (_label, belowBarFloorPct) => {
      const answer = await configure({ ...EDIT, playbookId: "S1-NVDA", belowBarFloorPct });
      expect(answer.status).toBe(400);
      const subscribed = await call(
        store,
        "/api/playbook-store/subscribe",
        request("POST", { ...EDIT, playbookId: "S1-NVDA", belowBarFloorPct }),
      );
      expect(subscribed.status).toBe(400);
    },
  );

  describe("behind the delegation fog", () => {
    beforeEach(async () => {
      await configure({ ...EDIT, playbookId: "S1-NVDA", belowBarFloorPct: 0.005 });
    });

    it("lowering it goes through: reducing risk is never gated", async () => {
      const answer = await configure(
        { ...EDIT, playbookId: "S1-NVDA", belowBarFloorPct: 0.002 },
        FOGGED,
      );
      expect(answer.body).toEqual({ ok: true });
      expect(floorOn("S1-NVDA")).toBe(0.002);
    });

    it.each([
      ["raising it", 0.008],
      ["clearing it", null],
    ])("%s is held, as more delegation", async (_label, belowBarFloorPct) => {
      const answer = await configure({ ...EDIT, playbookId: "S1-NVDA", belowBarFloorPct }, FOGGED);
      expect(answer.body).toEqual({ ok: false, error: DELEGATION_LOCKED_NOTE });
      expect(floorOn("S1-NVDA")).toBe(0.005);
    });
  });

  it("the Store tells the form which pairs take a floor, and hands the owner theirs back", async () => {
    await configure({ ...EDIT, playbookId: "S1-NVDA", belowBarFloorPct: 0.005 });
    const index = await call(
      store,
      "/api/playbook-store",
      request("GET", "", "/api/playbook-store?id=sauron"),
    );
    const cards = index.body.cards as {
      id: string;
      houseFloorPct?: number;
      subscription?: { belowBarFloorPct?: number };
    }[];
    const card = (id: string) => cards.find((c) => c.id === id);
    expect(card("S1-NVDA")).toMatchObject({
      houseFloorPct: BELOW_BAR_FLOOR_PCT,
      subscription: { belowBarFloorPct: 0.005 },
    });
    expect(card("G1-GOOG")).not.toHaveProperty("houseFloorPct");
    expect(card("G1-GOOG")?.subscription).not.toHaveProperty("belowBarFloorPct");
  });

  it("the settings change log names it, as the percent the owner typed", () => {
    const [s1] = store.load().sauron ?? [];
    expect(s1 && subscriptionSummary({ ...s1, belowBarFloorPct: 0.005 })).toContain(
      "each new order at most 0.5%",
    );
    expect(s1 && subscriptionSummary(s1)).not.toContain("each new order");
  });
});
