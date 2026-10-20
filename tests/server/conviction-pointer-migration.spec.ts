import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { controlsPollReport } from "../../src/autonomous/controls-poll-wire.js";
import {
  buildSubscriptionsSnapshot,
  parseSubscriptionsSnapshot,
  SUBSCRIPTIONS_SNAPSHOT_KIND_V2,
} from "../../src/autonomous/subscriptions-wire.js";
import { statedCheck } from "../../src/playbooks/conviction-store.js";
import { subscriptionsOnTheWire } from "../../src/scripts/dashboard-insights-bridge.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { carryConvictions, pollSeedsFromEnv } from "../../src/server/subscription-seed-store.js";
import { SubscriptionStore } from "../../src/server/subscription-store.js";
import { serveSubscriptionsApi } from "../../src/server/subscriptions-api-routes.js";

/**
 * #5482 slice 2, the MIGRATE step, against a real store on a temp file: the app writes a pointer
 * when a conviction matches a record, the poll migrates the two live CRWV subscriptions once, the
 * bots receive it on `subscriptions.v3`, and a v2 reader keeps working off the inline convictions.
 */

const session = { email: "eric@example.com", name: "Eric Clark" } as never;
const TODAY = () => new Date("2026-10-17T15:00:00.000Z");
const AT = TODAY();
const VIEW = "ai-dip-2026-10";
const DAY = "2027-01-29";

function post(body: unknown): IncomingMessage {
  const req = Readable.from([JSON.stringify(body)]) as unknown as IncomingMessage;
  req.method = "POST";
  req.headers = { "content-type": "application/json" };
  return req;
}

async function write(
  store: SubscriptionStore,
  action: string,
  body: unknown,
): Promise<Record<string, unknown>> {
  const out: { body?: string } = {};
  const res = {
    writeHead: () => res,
    end(text?: string) {
      out.body = text ?? "";
    },
  } as unknown as ServerResponse;
  const config = {
    auth: { providerIds: ["google"] },
    resolveOwnerIds: () => ["sauron"],
    now: TODAY,
    subscriptions: store,
  } as unknown as DashboardServerConfig;
  await serveSubscriptionsApi(post(body), res, `/api/playbook-store/${action}`, config, session);
  return JSON.parse(out.body ?? "{}");
}

describe("the app points a subscription at its conviction record (#5482 slice 2, migrate)", () => {
  let dir: string;
  let path: string;
  let store: SubscriptionStore;
  const held = (id: string) => store.load().sauron?.find((s) => s.playbookId === id);
  const subscribe = (playbookId: string, conviction?: { reason: string; checkOn: string }) =>
    write(store, "subscribe", {
      id: "sauron",
      playbookId,
      mode: "standard",
      capitalAllocated: 10_000,
      ...(conviction ? { conviction } : {}),
    });

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-5482-"));
    path = join(dir, "playbook-subscriptions.json");
    store = new SubscriptionStore(path);
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  describe("on a subscribe or an edit", () => {
    it("writes the pointer when the conviction states the record's day on a pair it steers", async () => {
      expect((await subscribe("CRWV-WHEEL", { reason: "my call", checkOn: DAY })).ok).toBe(true);
      expect(held("CRWV-WHEEL")?.convictionId).toBe(VIEW);
      expect(held("CRWV-WHEEL")?.conviction).toEqual({ reason: "my call", checkOn: DAY });
    });

    it("writes none for a conviction on another day, a pair the record does not steer, or no conviction", async () => {
      await subscribe("CRWV-WHEEL", { reason: "later", checkOn: "2027-04-30" });
      await subscribe("CRWV-LONG-CALL");
      expect(held("CRWV-WHEEL")?.convictionId).toBeUndefined();
      expect(held("CRWV-LONG-CALL")?.convictionId).toBeUndefined();
    });

    it("a re-subscribe that states a new day drops the old pointer, so the record's day never overrides it", async () => {
      await subscribe("CRWV-WHEEL", { reason: "my call", checkOn: DAY });
      await subscribe("CRWV-WHEEL", { reason: "pushed out", checkOn: "2027-04-30" });
      const wheel = held("CRWV-WHEEL");
      expect(wheel?.convictionId).toBeUndefined();
      expect(wheel && statedCheck(wheel).checkOn).toBe("2027-04-30");
    });

    it("a re-subscribe that states none keeps the conviction and the pointer it had", async () => {
      await subscribe("CRWV-WHEEL", { reason: "my call", checkOn: DAY });
      await subscribe("CRWV-WHEEL");
      expect(held("CRWV-WHEEL")).toMatchObject({
        conviction: { reason: "my call", checkOn: DAY },
        convictionId: VIEW,
      });
    });

    it("setting a new day drops the pointer, and setting the record's day again restores it", async () => {
      await subscribe("CRWV-WHEEL", { reason: "my call", checkOn: DAY });
      const set = (checkOn: string) =>
        write(store, "conviction", {
          id: "sauron",
          playbookId: "CRWV-WHEEL",
          conviction: { reason: "still my call", checkOn },
        });
      expect((await set("2027-04-30")).ok).toBe(true);
      expect(held("CRWV-WHEEL")?.convictionId).toBeUndefined();
      expect((await set(DAY)).ok).toBe(true);
      expect(held("CRWV-WHEEL")?.convictionId).toBe(VIEW);
    });

    it("editing the budget adds a missing pointer to a conviction written before pointers, and keeps one it has", async () => {
      store.subscribe("sauron", {
        playbookId: "CRWV-WHEEL",
        mode: "standard",
        capitalAllocated: 10_000,
        enabled: true,
        conviction: { reason: "written before pointers", checkOn: DAY },
      });
      expect(held("CRWV-WHEEL")?.convictionId).toBe(VIEW);
      // Written under a build with no pointers at all: only the inline conviction is on disk.
      const { convictionId: _gone, ...bare } = held("CRWV-WHEEL") ?? ({} as never);
      store.replace({ sauron: [bare] });
      const edited = await write(store, "configure", {
        id: "sauron",
        playbookId: "CRWV-WHEEL",
        mode: "aggressive",
        capitalAllocated: 20_000,
      });
      expect(edited.ok).toBe(true);
      expect(held("CRWV-WHEEL")).toMatchObject({
        convictionId: VIEW,
        capitalAllocated: 20_000,
        mode: "aggressive",
      });
    });
  });

  describe("on the poll, for the two live subscriptions", () => {
    const livePair = (playbookId: string) =>
      store.subscribe("sauron", {
        playbookId,
        mode: "aggressive",
        capitalAllocated: 75_000,
        enabled: true,
      });

    it("points CRWV-WHEEL (carried from its row) and CRWV-LONG-CALL at the AI-dip record, once", () => {
      livePair("CRWV-WHEEL");
      livePair("CRWV-LONG-CALL");
      carryConvictions(store, AT);
      const before = store.load().sauron ?? [];
      const seed = pollSeedsFromEnv({
        SKYNET_SUBSCRIPTIONS_FILE: path,
        SKYNET_CONTROLS_FILE: join(dir, "bot-controls.json"),
      });
      const lines = seed(controlsPollReport({}), AT);
      expect(lines.join("\n")).toMatch(
        /pointed each subscription .*: sauron\/CRWV-WHEEL, sauron\/CRWV-LONG-CALL/,
      );
      const after = store.load().sauron ?? [];
      expect(after.map((s) => s.convictionId)).toEqual([VIEW, VIEW]);
      // The inline convictions stay (contract is a later step) and nothing else moves.
      expect(after.map((s) => s.conviction)).toEqual(before.map((s) => s.conviction));
      expect(after.map(({ convictionId: _p, updatedAt: _u, ...rest }) => rest)).toEqual(
        before.map(({ updatedAt: _u, ...rest }) => rest),
      );
      // Same check day before and after: pointing moves no check.
      expect(after.map((s) => statedCheck(s).checkOn)).toEqual(
        before.map((s) => statedCheck(s).checkOn),
      );
    });

    it("is safe to run twice: the second poll writes nothing", async () => {
      livePair("CRWV-WHEEL");
      const seed = pollSeedsFromEnv({
        SKYNET_SUBSCRIPTIONS_FILE: path,
        SKYNET_CONTROLS_FILE: join(dir, "bot-controls.json"),
      });
      seed(controlsPollReport({}), AT);
      const onDisk = await readFile(path, "utf8");
      const lines = seed(controlsPollReport({}), new Date("2026-10-18T09:00:00.000Z"));
      expect(lines.join("\n")).not.toContain("pointed");
      expect(await readFile(path, "utf8")).toBe(onDisk);
    });

    it("keeps the inline conviction of a subscription no record states", () => {
      livePair("CRWV-WHEEL");
      store.setConviction("sauron", "CRWV-WHEEL", { reason: "later", checkOn: "2027-04-30" }, AT);
      const seed = pollSeedsFromEnv({
        SKYNET_SUBSCRIPTIONS_FILE: path,
        SKYNET_CONTROLS_FILE: join(dir, "bot-controls.json"),
      });
      seed(controlsPollReport({}), AT);
      expect(held("CRWV-WHEEL")).toMatchObject({ conviction: { checkOn: "2027-04-30" } });
      expect(held("CRWV-WHEEL")?.convictionId).toBeUndefined();
    });

    it("leaves a file it cannot read whole alone", async () => {
      await writeFile(path, JSON.stringify({ sauron: [{ playbookId: "CRWV-WHEEL" }] }));
      const seed = pollSeedsFromEnv({
        SKYNET_SUBSCRIPTIONS_FILE: path,
        SKYNET_CONTROLS_FILE: join(dir, "bot-controls.json"),
      });
      seed(controlsPollReport({}), AT);
      expect(JSON.parse(await readFile(path, "utf8"))).toEqual({
        sauron: [{ playbookId: "CRWV-WHEEL" }],
      });
    });
  });

  describe("on the wire", () => {
    beforeEach(() => {
      store.subscribe("sauron", {
        playbookId: "CRWV-WHEEL",
        mode: "aggressive",
        capitalAllocated: 75_000,
        enabled: true,
        conviction: { reason: "my call", checkOn: DAY },
      });
    });

    it("the app sends subscriptions.v3, and the bots read the pointer off it", () => {
      const sent = JSON.parse(JSON.stringify(subscriptionsOnTheWire(store, AT.getTime())));
      expect(sent.kind).toBe("subscriptions.v3");
      const read = parseSubscriptionsSnapshot(sent);
      expect(read?.accounts.sauron?.[0]).toMatchObject({ convictionId: VIEW });
    });

    it("a v2 reader still gets the inline conviction and checks on the same day, pointer or not", () => {
      const v2 = parseSubscriptionsSnapshot(
        JSON.parse(
          JSON.stringify(
            buildSubscriptionsSnapshot(
              store.load(),
              AT.getTime(),
              store.loadAllocations(),
              SUBSCRIPTIONS_SNAPSHOT_KIND_V2,
            ),
          ),
        ),
      );
      const seen = v2?.accounts.sauron?.[0];
      expect(seen?.convictionId).toBeUndefined();
      expect(seen?.conviction).toEqual({ reason: "my call", checkOn: DAY });
      const v3 = parseSubscriptionsSnapshot(
        JSON.parse(JSON.stringify(subscriptionsOnTheWire(store, AT.getTime()))),
      );
      expect(seen && statedCheck(seen).checkOn).toBe(
        v3?.accounts.sauron?.[0] && statedCheck(v3.accounts.sauron[0]).checkOn,
      );
    });
  });
});
