import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import {
  buildSubscriptionsSnapshot,
  parseSubscriptionsSnapshot,
  SUBSCRIPTIONS_SNAPSHOT_KIND_V2,
} from "../../src/autonomous/subscriptions-wire.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { carryConvictions } from "../../src/server/subscription-seed-store.js";
import { SubscriptionStore } from "../../src/server/subscription-store.js";
import { serveSubscriptionsApi } from "../../src/server/subscriptions-api-routes.js";

/**
 * #4469 slice 3c part 3 — the app writes an owner's conviction and a strategy allocation, checks
 * each ticker's budget against it, and carries the ◆ row's conviction onto the CRWV wheel's
 * subscriptions. Against a real store on a temp file, so what reaches disk is what is asserted.
 */

const session = { email: "eric@example.com", name: "Eric Clark" } as never;
const TODAY = () => new Date("2026-10-09T15:00:00.000Z");

function post(body: unknown): IncomingMessage {
  const req = Readable.from([JSON.stringify(body)]) as unknown as IncomingMessage;
  req.method = "POST";
  req.headers = { "content-type": "application/json" };
  return req;
}

function get(url: string): IncomingMessage {
  const req = Readable.from([""]) as unknown as IncomingMessage;
  req.method = "GET";
  req.url = url;
  req.headers = {};
  return req;
}

async function call(
  store: SubscriptionStore,
  path: string,
  req: IncomingMessage,
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
  } as unknown as DashboardServerConfig;
  await serveSubscriptionsApi(req, res, path, config, session);
  return {
    ...(out.status === undefined ? {} : { status: out.status }),
    body: JSON.parse(out.body ?? "{}"),
  };
}

const write = (store: SubscriptionStore, path: string, body: unknown) =>
  call(store, `/api/playbook-store/${path}`, post(body));

describe("the Store writes conviction and allocations (#4469 slice 3c part 3)", () => {
  let dir: string;
  let path: string;
  let store: SubscriptionStore;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-3c3-"));
    path = join(dir, "playbook-subscriptions.json");
    store = new SubscriptionStore(path);
    store.subscribe("sauron", {
      playbookId: "CRWV-WHEEL",
      mode: "aggressive",
      capitalAllocated: 75_000,
      enabled: true,
    });
    store.subscribe("sauron", {
      playbookId: "S1-NVDA",
      mode: "standard",
      capitalAllocated: 50_000,
      enabled: true,
      compoundAllocation: true,
    });
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  describe("the ◆ row's conviction moves onto the CRWV wheel's subscription", () => {
    it("is carried once, touches nothing else, and the next poll writes nothing", async () => {
      const before = store.load().sauron ?? [];
      expect(carryConvictions(store)).toEqual(["sauron/CRWV-WHEEL"]);
      const after = store.load().sauron ?? [];
      const wheel = after.find((s) => s.playbookId === "CRWV-WHEEL");
      expect(wheel?.conviction?.checkOn).toBe("2027-01-29");
      // Call 1 of the plan: id, mode, capital, compounding and pause state never move.
      expect(after.map(({ conviction: _c, updatedAt: _u, ...rest }) => rest)).toEqual(
        before.map(({ updatedAt: _u, ...rest }) => rest),
      );
      const onDisk = await readFile(path, "utf8");
      expect(carryConvictions(store)).toEqual([]);
      expect(await readFile(path, "utf8")).toBe(onDisk);
    });

    it("leaves a file it cannot read whole alone", async () => {
      await writeFile(path, JSON.stringify({ sauron: [{ playbookId: "CRWV-WHEEL" }] }));
      expect(carryConvictions(store)).toEqual([]);
      expect(JSON.parse(await readFile(path, "utf8"))).toEqual({
        sauron: [{ playbookId: "CRWV-WHEEL" }],
      });
    });

    it("rides the v2 wire the app now sends, so the bots act on it", () => {
      carryConvictions(store);
      const snapshot = buildSubscriptionsSnapshot(
        store.load(),
        TODAY().getTime(),
        store.loadAllocations(),
        SUBSCRIPTIONS_SNAPSHOT_KIND_V2,
      );
      const read = parseSubscriptionsSnapshot(JSON.parse(JSON.stringify(snapshot)));
      expect(read?.kind).toBe(SUBSCRIPTIONS_SNAPSHOT_KIND_V2);
      expect(read?.accounts.sauron?.find((s) => s.playbookId === "CRWV-WHEEL")?.conviction).toEqual(
        store.load().sauron?.find((s) => s.playbookId === "CRWV-WHEEL")?.conviction,
      );
    });
  });

  describe("conviction", () => {
    it("sets the owner's reason and a new check date, keeping the budget and a pause", async () => {
      store.setEnabled("sauron", "CRWV-WHEEL", false);
      const answer = await write(store, "conviction", {
        id: "sauron",
        playbookId: "CRWV-WHEEL",
        conviction: { reason: "  The premium still pays for the tail.  ", checkOn: "2027-04-30" },
      });
      expect(answer.body).toEqual({ ok: true });
      const wheel = store.load().sauron?.find((s) => s.playbookId === "CRWV-WHEEL");
      expect(wheel?.conviction).toEqual({
        reason: "The premium still pays for the tail.",
        checkOn: "2027-04-30",
      });
      expect(wheel).toMatchObject({ enabled: false, capitalAllocated: 75_000, mode: "aggressive" });
    });

    it("refuses a check day that has come, or is more than a year out", async () => {
      for (const checkOn of ["2026-10-09", "2028-01-01"]) {
        const answer = await write(store, "conviction", {
          id: "sauron",
          playbookId: "CRWV-WHEEL",
          conviction: { reason: "x", checkOn },
        });
        expect(answer.body.ok).toBe(false);
      }
      expect(
        store.load().sauron?.find((s) => s.playbookId === "CRWV-WHEEL")?.conviction,
      ).toBeUndefined();
    });

    it("never creates a subscription", async () => {
      const answer = await write(store, "conviction", {
        id: "sauron",
        playbookId: "G1-GOOG",
        conviction: { reason: "x", checkOn: "2027-01-01" },
      });
      expect(answer.body).toEqual({
        ok: false,
        error: "Not subscribed to G1-GOOG — subscribe first.",
      });
      expect(store.load().sauron?.map((s) => s.playbookId)).toEqual(["CRWV-WHEEL", "S1-NVDA"]);
    });

    it("answers a blank reason or a non-day with 400", async () => {
      for (const conviction of [
        { reason: "   ", checkOn: "2027-01-01" },
        { reason: "x", checkOn: "2027-02-30" },
        { reason: "x" },
      ]) {
        const answer = await write(store, "conviction", {
          id: "sauron",
          playbookId: "CRWV-WHEEL",
          conviction,
        });
        expect(answer.status).toBe(400);
      }
    });

    it("refuses an account the session does not own", async () => {
      const answer = await write(store, "conviction", {
        id: "banker",
        playbookId: "CRWV-WHEEL",
        conviction: { reason: "x", checkOn: "2027-01-01" },
      });
      expect(answer.body.ok).toBe(false);
      expect(store.load().banker).toBeUndefined();
    });
  });

  describe("allocation", () => {
    it("stores one per account × strategy without touching a subscription", async () => {
      const before = store.load();
      const answer = await write(store, "allocation", {
        id: "sauron",
        strategy: "wheel",
        capitalAllocated: 100_000,
      });
      expect(answer.body).toEqual({ ok: true });
      expect(store.loadAllocations().sauron?.wheel?.capitalAllocated).toBe(100_000);
      expect(store.load()).toEqual(before);
    });

    it("refuses one the budgets already set would not fit under", async () => {
      const answer = await write(store, "allocation", {
        id: "sauron",
        strategy: "wheel",
        capitalAllocated: 50_000,
      });
      expect(answer.body).toEqual({
        ok: false,
        error:
          "Its tickers' budgets already add up to $75,000; allocate at least that to the wheel, or lower a budget first.",
      });
      expect(store.loadAllocations()).toEqual({});
    });

    it("clears with null, and a later subscription write keeps any allocation still set", async () => {
      await write(store, "allocation", {
        id: "sauron",
        strategy: "wheel",
        capitalAllocated: 100_000,
      });
      await write(store, "allocation", {
        id: "sauron",
        strategy: "pre-print-run-up",
        capitalAllocated: 60_000,
      });
      await write(store, "allocation", { id: "sauron", strategy: "wheel", capitalAllocated: null });
      store.setEnabled("sauron", "S1-NVDA", false);
      expect(store.loadAllocations().sauron).toEqual({
        "pre-print-run-up": expect.objectContaining({ capitalAllocated: 60_000 }),
      });
    });

    it("answers an unknown strategy, a zero amount or a missing one with 400", async () => {
      for (const body of [
        { id: "sauron", strategy: "iron-condor", capitalAllocated: 1_000 },
        { id: "sauron", strategy: "wheel", capitalAllocated: 0 },
        { id: "sauron", strategy: "wheel" },
      ]) {
        expect((await write(store, "allocation", body)).status).toBe(400);
      }
    });

    it("then holds an Edit that raises a budget past it, and never one that lowers it", async () => {
      await write(store, "allocation", {
        id: "sauron",
        strategy: "wheel",
        capitalAllocated: 80_000,
      });
      const edit = (capitalAllocated: number) =>
        write(store, "configure", {
          id: "sauron",
          playbookId: "CRWV-WHEEL",
          mode: "aggressive",
          capitalAllocated,
        });
      expect((await edit(90_000)).body).toEqual({
        ok: false,
        error:
          "That would put $90,000 on the wheel, over the $80,000 you gave it; $80,000 is left for CRWV.",
      });
      expect((await edit(60_000)).body).toEqual({ ok: true });
      expect(
        store.load().sauron?.find((s) => s.playbookId === "CRWV-WHEEL")?.capitalAllocated,
      ).toBe(60_000);
    });

    it("holds a subscribe that would not fit, and takes one that does with its owner's conviction", async () => {
      store.unsubscribe("sauron", "CRWV-WHEEL");
      await write(store, "allocation", {
        id: "sauron",
        strategy: "wheel",
        capitalAllocated: 50_000,
      });
      const subscribe = (capitalAllocated: number, extra: Record<string, unknown> = {}) =>
        write(store, "subscribe", {
          id: "sauron",
          playbookId: "CRWV-WHEEL",
          mode: "standard",
          capitalAllocated,
          ...extra,
        });
      expect((await subscribe(75_000)).body.ok).toBe(false);
      const conviction = { reason: "Premium over the tail, my call.", checkOn: "2027-01-29" };
      expect((await subscribe(40_000, { conviction })).body).toEqual({ ok: true });
      expect(store.load().sauron?.find((s) => s.playbookId === "CRWV-WHEEL")?.conviction).toEqual(
        conviction,
      );
    });

    it("refuses a subscribe whose conviction is checked on a day that has come", async () => {
      store.unsubscribe("sauron", "CRWV-WHEEL");
      const answer = await write(store, "subscribe", {
        id: "sauron",
        playbookId: "CRWV-WHEEL",
        mode: "standard",
        capitalAllocated: 10_000,
        conviction: { reason: "x", checkOn: "2026-10-01" },
      });
      expect(answer.body).toEqual({
        ok: false,
        error: "A conviction is checked on a day still to come; 2026-10-01 isn't.",
      });
    });

    it("shows the owner the allocation and what is budgeted inside it, never a non-owner", async () => {
      await write(store, "allocation", {
        id: "sauron",
        strategy: "wheel",
        capitalAllocated: 100_000,
      });
      carryConvictions(store);
      const mine = await call(store, "/api/playbook-store", get("/api/playbook-store?id=sauron"));
      const strategies = mine.body.strategies as {
        strategy: string;
        allocation?: unknown;
        pairs: { id: string; subscription?: { conviction?: { checkOn: string } } }[];
      }[];
      const wheel = strategies.find((card) => card.strategy === "wheel");
      expect(wheel?.allocation).toEqual({ capitalAllocated: 100_000, budgeted: 75_000 });
      expect(
        wheel?.pairs.find((p) => p.id === "CRWV-WHEEL")?.subscription?.conviction?.checkOn,
      ).toBe("2027-01-29");
      const theirs = await call(store, "/api/playbook-store", get("/api/playbook-store?id=banker"));
      for (const card of theirs.body.strategies as { allocation?: unknown }[]) {
        expect(card.allocation).toBeUndefined();
      }
    });
  });
});
