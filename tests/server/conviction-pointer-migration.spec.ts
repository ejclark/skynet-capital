import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { controlsPollReport } from "../../src/autonomous/controls-poll-wire.js";
import { parseSubscriptionsSnapshot } from "../../src/autonomous/subscriptions-wire.js";
import { statedCheck } from "../../src/playbooks/conviction-store.js";
import { subscriptionsOnTheWire } from "../../src/scripts/dashboard-insights-bridge.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { MemberConvictionStore } from "../../src/server/member-conviction-store.js";
import { pollSeedsFromEnv } from "../../src/server/subscription-seed-store.js";
import { SubscriptionStore } from "../../src/server/subscription-store.js";
import { serveSubscriptionsApi } from "../../src/server/subscriptions-api-routes.js";
import { pairViewId } from "../../src/subscriptions/pair-conviction.js";
import { subscriptionRoster } from "../../src/subscriptions/subscription-roster.js";

/**
 * #5482 slice 2, the MIGRATE step, against a real store on a temp file: the app writes a pointer
 * when a conviction matches a record, the poll migrates the two live CRWV subscriptions once, the
 * bots receive it on the wire (`subscriptions.v4` since contract piece 4). Since the contract
 * step's piece 2 a pointed subscription carries no inline copy beside its pointer, so the bots
 * check it on the record's day alone. Since the last piece a subscription carries no inline
 * conviction at all: an owner's own day is their view on the pair, in the views file beside it.
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
  members: MemberConvictionStore,
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
    memberConvictions: members,
  } as unknown as DashboardServerConfig;
  await serveSubscriptionsApi(post(body), res, `/api/playbook-store/${action}`, config, session);
  return JSON.parse(out.body ?? "{}");
}

describe("the app points a subscription at its conviction record (#5482 slice 2, migrate)", () => {
  let dir: string;
  let path: string;
  let store: SubscriptionStore;
  let members: MemberConvictionStore;
  const held = (id: string) => store.load().sauron?.find((s) => s.playbookId === id);
  const OWN = pairViewId("sauron", "CRWV-WHEEL");
  const subscribe = (playbookId: string, conviction?: { reason: string; checkOn: string }) =>
    write(store, members, "subscribe", {
      id: "sauron",
      playbookId,
      mode: "standard",
      capitalAllocated: 10_000,
      ...(conviction ? { conviction } : {}),
    });

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-5482-"));
    path = join(dir, "playbook-subscriptions.json");
    // Wired as production wires it (`dashboard-access.ts`): the views file beside the store.
    members = new MemberConvictionStore(join(dir, "member-convictions.json"));
    store = new SubscriptionStore(path, undefined, () => members.pointers());
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  describe("on a subscribe or an edit", () => {
    it("writes the pointer when the conviction states the record's day on a pair it steers", async () => {
      expect((await subscribe("CRWV-WHEEL", { reason: "my call", checkOn: DAY })).ok).toBe(true);
      expect(held("CRWV-WHEEL")?.convictionId).toBe(VIEW);
      // The pointer is the whole check: no conviction is kept on the subscription.
      expect(held("CRWV-WHEEL")).not.toHaveProperty("conviction");
      expect(statedCheck(held("CRWV-WHEEL") ?? ({} as never)).checkOn).toBe(DAY);
    });

    it("points a conviction on another day at the owner's own view, never the record", async () => {
      expect((await subscribe("CRWV-WHEEL", { reason: "later", checkOn: "2027-04-30" })).ok).toBe(
        true,
      );
      expect(held("CRWV-WHEEL")?.convictionId).toBe(OWN);
      expect(held("CRWV-WHEEL")).not.toHaveProperty("conviction");
      expect(members.handedOver().map((w) => w.conviction.checkOn)).toEqual(["2027-04-30"]);
    });

    it("a re-subscribe that states a new day moves the pointer to the owner's view, so the record's day never overrides it", async () => {
      await subscribe("CRWV-WHEEL", { reason: "my call", checkOn: DAY });
      await subscribe("CRWV-WHEEL", { reason: "pushed out", checkOn: "2027-04-30" });
      const wheel = held("CRWV-WHEEL");
      expect(wheel?.convictionId).toBe(OWN);
      expect(
        wheel &&
          statedCheck(wheel, (id) =>
            members
              .pointers()
              .heldBy("sauron")
              .find((v) => v.id === id),
          ).checkOn,
      ).toBe("2027-04-30");
    });

    it("a re-subscribe that states none keeps the pointer it had", async () => {
      await subscribe("CRWV-WHEEL", { reason: "my call", checkOn: DAY });
      await subscribe("CRWV-WHEEL");
      expect(held("CRWV-WHEEL")).toMatchObject({ convictionId: VIEW });
      expect(held("CRWV-WHEEL")).not.toHaveProperty("conviction");
    });

    it("setting a new day moves the pointer to the owner's view, and setting the record's day again restores it", async () => {
      await subscribe("CRWV-WHEEL", { reason: "my call", checkOn: DAY });
      const set = (checkOn: string) =>
        write(store, members, "conviction", {
          id: "sauron",
          playbookId: "CRWV-WHEEL",
          conviction: { reason: "still my call", checkOn },
        });
      expect((await set("2027-04-30")).ok).toBe(true);
      expect(held("CRWV-WHEEL")?.convictionId).toBe(OWN);
      expect((await set(DAY)).ok).toBe(true);
      expect(held("CRWV-WHEEL")?.convictionId).toBe(VIEW);
    });

    it("editing the budget adds a missing pointer on a pair one record steers, and keeps one it has", async () => {
      store.subscribe("sauron", {
        playbookId: "CRWV-WHEEL",
        mode: "standard",
        capitalAllocated: 10_000,
        enabled: true,
      });
      expect(held("CRWV-WHEEL")?.convictionId).toBe(VIEW);
      // Written under a build with no pointers at all.
      const { convictionId: _gone, ...bare } = held("CRWV-WHEEL") ?? ({} as never);
      store.replace({ sauron: [bare] });
      const edited = await write(store, members, "configure", {
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
    /** As both live pairs sat on disk before pointers, a retired inline conviction beside them. */
    const written = (playbookId: string) => ({
      accountId: "sauron",
      playbookId,
      mode: "aggressive" as const,
      capitalAllocated: 75_000,
      enabled: true,
      createdAt: "2026-10-16T00:00:00.000Z",
      updatedAt: "2026-10-16T00:00:00.000Z",
      conviction: { reason: "written before pointers", checkOn: DAY },
    });
    const livePair = (playbookId: string) =>
      store.subscribe("sauron", {
        playbookId,
        mode: "aggressive",
        capitalAllocated: 75_000,
        enabled: true,
      });

    it("points CRWV-WHEEL and CRWV-LONG-CALL at the AI-dip record, once, and the retired copies go", async () => {
      await writeFile(
        path,
        JSON.stringify({ sauron: [written("CRWV-WHEEL"), written("CRWV-LONG-CALL")] }),
      );
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
      // Nothing else moves, and the retired field is off the file.
      expect(after.map(({ convictionId: _p, updatedAt: _u, ...rest }) => rest)).toEqual(
        before.map(({ updatedAt: _u, ...rest }) => rest),
      );
      const raw = JSON.parse(await readFile(path, "utf8"));
      expect(raw.sauron.some((r: object) => "conviction" in r)).toBe(false);
      // The day the owner stated is the record's: pointing moves no check.
      expect(after.map((s) => statedCheck(s).checkOn)).toEqual([DAY, DAY]);
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

    it("the app sends subscriptions.v4, and the bots read the pointer off it", () => {
      const sent = JSON.parse(JSON.stringify(subscriptionsOnTheWire(store, AT.getTime())));
      expect(sent.kind).toBe("subscriptions.v4");
      const read = parseSubscriptionsSnapshot(sent);
      expect(read?.accounts.sauron?.[0]).toMatchObject({ convictionId: VIEW });
    });

    it("sends a pointed pair with no inline copy, and the bots check it on the record's day", () => {
      const sent = JSON.parse(JSON.stringify(subscriptionsOnTheWire(store, AT.getTime())));
      const seen = parseSubscriptionsSnapshot(sent)?.accounts.sauron?.[0];
      expect(seen).not.toHaveProperty("conviction");
      expect(seen && statedCheck(seen)).toMatchObject({
        checkOn: DAY,
        convictionId: expect.any(String),
      });
    });

    describe("a retired inline copy still on disk (the contract step's last piece)", () => {
      const unmoved = (reason: string, checkOn: string) =>
        writeFile(
          path,
          JSON.stringify({
            sauron: [
              {
                accountId: "sauron",
                playbookId: "CRWV-WHEEL",
                mode: "standard",
                enabled: true,
                createdAt: AT.toISOString(),
                updatedAt: AT.toISOString(),
                conviction: { reason, checkOn },
              },
            ],
          }),
        );
      const sent = () => JSON.parse(JSON.stringify(subscriptionsOnTheWire(store, AT.getTime())));

      it("never reaches the bots, and its ◆ pair runs exits-only until it is pointed", async () => {
        await unmoved("my call", "2027-04-30");
        const read = parseSubscriptionsSnapshot(sent());
        expect(read?.kind).toBe("subscriptions.v4");
        expect(read?.accounts.sauron?.[0]).not.toHaveProperty("conviction");
        const roster = subscriptionRoster(read?.accounts.sauron ?? []);
        expect(roster.enabled.map((e) => [e.playbook.id, e.exitsOnly])).toEqual([
          ["CRWV-WHEEL", true],
        ]);
      });

      it("never moves the version, for being there or for its words or day", async () => {
        await unmoved("my call", "2027-04-30");
        const first = sent().version;
        await unmoved("other words", "2027-06-30");
        expect(sent().version).toBe(first);
        store.replace(store.load());
        expect(sent().version).toBe(first);
        store.replace({});
        expect(sent().version).not.toBe(first);
      });
    });
  });
});
