import { mkdtemp, rm } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import type { PlaybookSubscription } from "../../src/domain/types.js";
import { BotControlsStore } from "../../src/server/bot-controls-store.js";
import { botSettingsView } from "../../src/server/bot-settings-route.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { SettingsChangeLog } from "../../src/server/settings-change-log.js";
import {
  recordSubscriptionWrite,
  subscriptionSummary,
} from "../../src/server/subscription-changes.js";
import { SubscriptionStore } from "../../src/server/subscription-store.js";
import { serveSubscriptionsApi } from "../../src/server/subscriptions-api-routes.js";

/**
 * #4535 slice 3c — the Playbook Store's writes land in the same settings change log as a bot's
 * suspend, build and forced picks, so its Settings card lists them with who, before and after
 * (the plan's EARS criterion 4). Real stores on a temp dir.
 */

const AT = new Date("2026-10-07T15:00:00.000Z");
const OWNER = "eric@example.com";
const session = { email: OWNER, name: "Eric Clark" } as never;
const BOT = "acct-mine";

function fakeRes(): { res: ServerResponse; out: { body?: string } } {
  const out: { body?: string } = {};
  const res = {
    writeHead: () => res,
    end(body?: string) {
      out.body = body ?? "";
    },
  } as unknown as ServerResponse;
  return { res, out };
}

function post(body: unknown): IncomingMessage {
  const req = Readable.from([JSON.stringify(body)]) as unknown as IncomingMessage;
  req.method = "POST";
  req.headers = { "content-type": "application/json" };
  return req;
}

describe("the Store's writes in the settings change log (#4535 slice 3c)", () => {
  let dir: string;
  let subs: SubscriptionStore;
  let log: SettingsChangeLog;
  let config: DashboardServerConfig;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-sub-changes-"));
    subs = new SubscriptionStore(join(dir, "playbook-subscriptions.json"));
    log = new SettingsChangeLog(join(dir, "settings-changes.json"));
    config = {
      auth: { providerIds: ["google"] },
      resolveOwnerIds: () => [BOT],
      now: () => AT,
      subscriptions: subs,
      controls: {
        store: new BotControlsStore(join(dir, "bot-controls.json")),
        isOwner: () => true,
        bots: () => [],
        changes: log,
      },
    } as unknown as DashboardServerConfig;
    subs.subscribe(BOT, {
      playbookId: "S1-NVDA",
      mode: "standard",
      capitalAllocated: 50_000,
      enabled: true,
    });
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const write = async (path: string, body: unknown): Promise<unknown> => {
    const { res, out } = fakeRes();
    await serveSubscriptionsApi(post(body), res, `/api/playbook-store/${path}`, config, session);
    return JSON.parse(out.body ?? "{}");
  };
  const ref = { id: BOT, playbookId: "S1-NVDA" };

  it("WHEN an owner edits, pauses or unsubscribes, the bot's Settings card lists each change with who, before and after", async () => {
    expect(
      await write("configure", { ...ref, mode: "standard", capitalAllocated: 40_000 }),
    ).toEqual({ ok: true });
    expect(await write("set-enabled", { ...ref, enabled: false })).toEqual({ ok: true });
    expect(await write("unsubscribe", ref)).toEqual({ ok: true });

    const card = botSettingsView(config, BOT, OWNER)?.changes ?? [];
    expect(
      card.map(({ setting, before, after, proposedBy, approvedBy }) => ({
        setting,
        before,
        after,
        proposedBy,
        approvedBy,
      })),
    ).toEqual([
      {
        setting: "subscription:S1-NVDA",
        before: "paused · standard · $40,000",
        after: null,
        proposedBy: "you",
        approvedBy: "you",
      },
      {
        setting: "subscription:S1-NVDA",
        before: "on · standard · $40,000",
        after: "paused · standard · $40,000",
        proposedBy: "you",
        approvedBy: "you",
      },
      {
        setting: "subscription:S1-NVDA",
        before: "on · standard · $50,000",
        after: "on · standard · $40,000",
        proposedBy: "you",
        approvedBy: "you",
      },
    ]);
  });

  it("logs an allocation as dollars before and after, null when none is set", async () => {
    expect(
      await write("allocation", {
        id: BOT,
        strategy: "pre-print-run-up",
        capitalAllocated: 90_000,
      }),
    ).toEqual({ ok: true });
    expect(log.list(BOT)[0]).toMatchObject({
      setting: "allocation:pre-print-run-up",
      before: null,
      after: 90_000,
      proposedBy: OWNER,
    });
  });

  it("a repeated click that changes nothing records nothing", async () => {
    await write("set-enabled", { ...ref, enabled: true });
    expect(log.list(BOT)).toEqual([]);
  });

  it("IF the log cannot be written, THEN the subscription is put back and the write throws", () => {
    const broken = {
      record: () => {
        throw new Error("disk full");
      },
    };
    const brokenConfig = {
      ...config,
      controls: { ...config.controls, changes: broken },
    } as unknown as DashboardServerConfig;
    expect(() =>
      recordSubscriptionWrite(brokenConfig, subs, ref, OWNER, () =>
        subs.unsubscribe(BOT, "S1-NVDA"),
      ),
    ).toThrow("disk full");
    expect(subs.load()[BOT]?.map((s) => s.capitalAllocated)).toEqual([50_000]);
  });

  it("a summary stays within what the log keeps, however many symbols it names", () => {
    const sub = {
      playbookId: "S1-NVDA",
      mode: "aggressive",
      enabled: true,
      symbols: Array.from({ length: 40 }, (_, i) => `SYM${i}`),
      compoundAllocation: true,
      conviction: { reason: "x", checkOn: "2026-11-20" },
    } as unknown as PlaybookSubscription;
    const text = subscriptionSummary(sub) ?? "";
    expect(text).toBe(
      "on · aggressive · no budget · SYM0, SYM1, SYM2, SYM3, SYM4, SYM5 +34 more · compounding · conviction checked 2026-11-20",
    );
    expect(text.length).toBeLessThanOrEqual(200);
    expect(subscriptionSummary(undefined)).toBeNull();
  });
});
