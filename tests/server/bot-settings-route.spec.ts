import { mkdtemp, rm, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { MAX_BETA_PICKS } from "../../src/autonomous/bot-controls.js";
import { BotControlsStore } from "../../src/server/bot-controls-store.js";
import { parseBotSettingsBody } from "../../src/server/bot-settings-route.js";
import { applyControlsAction } from "../../src/server/controls-form.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveSettingsApi } from "../../src/server/settings-api-routes.js";
import {
  MAX_CHANGES_PER_ACCOUNT,
  SettingsChangeLog,
} from "../../src/server/settings-change-log.js";

/**
 * #4535 slice 3b — a bot's owner changes its hardcore build and forced-pick count from the app,
 * and every change to its settings is recorded with who proposed it, who approved it, before and
 * after (the plan's EARS criteria 2 and 4). Real stores on a temp dir: the files are the contract
 * the bots app reads over the `/controls` poll.
 */

const AT = new Date("2026-10-18T20:30:00.000Z");
const OWNER = "owner@example.com";

interface Answer {
  status?: number;
  body?: string;
}

function fakeRes(): { res: ServerResponse; out: Answer } {
  const out: Answer = {};
  const res = {
    writeHead(status: number) {
      out.status = status;
      return res;
    },
    end(body?: string) {
      out.body = body ?? "";
    },
  } as unknown as ServerResponse;
  return { res, out };
}

function request(method: "GET" | "POST", body: unknown = ""): IncomingMessage {
  const req = Readable.from([
    typeof body === "string" ? body : JSON.stringify(body),
  ]) as unknown as IncomingMessage;
  req.method = method;
  req.headers = method === "POST" ? { "content-type": "application/json" } : {};
  return req;
}

describe("a bot's own settings, changed by its owner (#4535 slice 3b)", () => {
  let dir: string;
  let store: BotControlsStore;
  let log: SettingsChangeLog;
  let owned: string[];
  let roster: { accounts: string[]; roster: [] } | undefined;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-bot-settings-"));
    store = new BotControlsStore(join(dir, "bot-controls.json"));
    log = new SettingsChangeLog(join(dir, "settings-changes.json"));
    owned = ["sauron"];
    roster = { accounts: ["sauron", "banker"], roster: [] };
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const config = (): DashboardServerConfig =>
    ({
      hub: {
        getState: () => ({
          participants: [
            { id: "sauron", displayName: "Sauron", kind: "bot" },
            { id: "banker", displayName: "Banker", kind: "bot" },
          ],
        }),
      },
      auth: { providerIds: ["google"] },
      resolveOwnerIds: () => owned,
      now: () => AT,
      readHouseRoster: () => roster,
      controls: { store, changes: log, isOwner: () => false, bots: () => [] },
    }) as unknown as DashboardServerConfig;

  const session = { email: OWNER, name: "Owner" } as never;

  async function change(body: unknown): Promise<Record<string, unknown>> {
    const { res, out } = fakeRes();
    await serveSettingsApi(
      request("POST", body),
      res,
      "/api/settings/bot-settings",
      config(),
      session,
    );
    return { status: out.status, ...JSON.parse(out.body ?? "{}") };
  }

  async function index(email = OWNER): Promise<Record<string, unknown>> {
    const { res, out } = fakeRes();
    await serveSettingsApi(request("GET"), res, "/api/settings", config(), {
      email,
      name: "x",
    } as never);
    return JSON.parse(out.body ?? "{}");
  }

  describe("WHEN the owner changes the bot's hardcore build or forced-pick count", () => {
    it("stores both where the bots app reads them on its next poll", async () => {
      expect(await change({ id: "sauron", hardcore: true, betaPicks: 3 })).toMatchObject({
        ok: true,
      });
      expect(store.load().bots.sauron).toEqual({ hardcore: true, betaPicks: 3 });
    });

    it("hands a setting back to the operations setting on null, keeping the others", async () => {
      store.setBot("sauron", { suspended: true, hardcore: true, betaPicks: 2 }, OWNER, AT);
      await change({ id: "sauron", betaPicks: null });
      expect(store.load().bots.sauron).toEqual({ suspended: true, hardcore: true });
    });

    it("records each moved setting with proposer, approver, before and after", async () => {
      store.setBot("sauron", { betaPicks: 2 }, OWNER, AT);
      await change({ id: "sauron", hardcore: true, betaPicks: 0 });
      expect(log.list("sauron")).toEqual(
        expect.arrayContaining([
          {
            at: AT.toISOString(),
            setting: "hardcore",
            before: null,
            after: true,
            proposedBy: OWNER,
            approvedBy: OWNER,
          },
          {
            at: AT.toISOString(),
            setting: "betaPicks",
            before: 2,
            after: 0,
            proposedBy: OWNER,
            approvedBy: OWNER,
          },
        ]),
      );
    });

    it("puts the change back when it cannot be recorded — never applied unrecorded", async () => {
      store.setBot("sauron", { betaPicks: 2 }, OWNER, AT);
      log = {
        record: () => {
          throw new Error("disk full");
        },
      } as unknown as SettingsChangeLog;
      await expect(change({ id: "sauron", betaPicks: 5 })).rejects.toThrow("disk full");
      expect(store.load().bots.sauron).toEqual({ betaPicks: 2 });
    });

    it("records nothing when the value did not move", async () => {
      await change({ id: "sauron", hardcore: true });
      await change({ id: "sauron", hardcore: true });
      expect(log.list("sauron")).toHaveLength(1);
    });
  });

  describe("IF a user changes a bot they do not own (criterion 2)", () => {
    it("refuses it and writes nothing", async () => {
      owned = ["banker"];
      const answer = await change({ id: "sauron", hardcore: true });
      expect(answer).toMatchObject({ ok: false });
      expect(String(answer.error)).toContain("your own bot");
      expect(store.load().bots.sauron).toBeUndefined();
      expect(log.list("sauron")).toEqual([]);
    });
  });

  describe("a stored value never says something false", () => {
    it("refuses hardcore on a bot with no hardcore build", async () => {
      owned = ["banker"];
      const answer = await change({ id: "banker", hardcore: true });
      expect(String(answer.error)).toContain("no hardcore build");
      expect(store.load().bots.banker).toBeUndefined();
    });

    it("refuses a forced-pick count on any bot but the one the pick runs on", async () => {
      owned = ["banker"];
      const answer = await change({ id: "banker", betaPicks: 2 });
      expect(String(answer.error)).toContain("this isn't it");
    });

    it("refuses a forced-pick count while the bots app has not said where the pick runs", async () => {
      roster = undefined;
      const answer = await change({ id: "sauron", betaPicks: 2 });
      expect(String(answer.error)).toContain("hasn't said which bot");
    });

    it.each([
      { id: "sauron" },
      { id: "sauron", hardcore: "yes" },
      { id: "sauron", betaPicks: -1 },
      { id: "sauron", betaPicks: 1.5 },
      { id: "sauron", betaPicks: MAX_BETA_PICKS + 1 },
      { hardcore: true },
    ])("answers 400 to a malformed body %j", async (body) => {
      expect(parseBotSettingsBody(JSON.stringify(body))).toBeUndefined();
      expect((await change(body)).status).toBe(400);
    });
  });

  describe("the settings index", () => {
    it("draws each control only where it does something, with the change log", async () => {
      owned = ["sauron", "banker"];
      await change({ id: "sauron", hardcore: false });
      const accounts = (await index()).accounts as Array<{ id: string; settings: unknown }>;
      const byId = Object.fromEntries(accounts.map((a) => [a.id, a.settings]));
      expect(byId.sauron).toMatchObject({
        hardcore: false,
        betaPicks: null,
        maxBetaPicks: MAX_BETA_PICKS,
        changes: [{ setting: "hardcore", before: null, after: false, proposedBy: "you" }],
      });
      expect(byId.banker).not.toHaveProperty("hardcore");
      expect(byId.banker).not.toHaveProperty("betaPicks");
    });

    it("never sends an email: another owner's change reads as another owner", async () => {
      await change({ id: "sauron", hardcore: true });
      const body = await index("co-owner@example.com");
      expect(JSON.stringify(body)).not.toContain(OWNER);
      const [account] = body.accounts as Array<{ settings: { changes: unknown[] } }>;
      expect(account?.settings.changes[0]).toMatchObject({
        proposedBy: "another owner",
        approvedBy: "another owner",
      });
    });
  });

  describe("suspend is a settings change too", () => {
    it("records the own-bot switch", async () => {
      const { res } = fakeRes();
      await serveSettingsApi(
        request("POST", { id: "sauron", action: "suspend" }),
        res,
        "/api/settings/bot-control",
        config(),
        session,
      );
      expect(log.list("sauron")[0]).toMatchObject({
        setting: "suspended",
        before: false,
        after: true,
      });
    });

    it("records nothing when a bot never suspended here is resumed", async () => {
      const { res } = fakeRes();
      await serveSettingsApi(
        request("POST", { id: "sauron", action: "resume" }),
        res,
        "/api/settings/bot-control",
        config(),
        session,
      );
      expect(log.list("sauron")).toEqual([]);
    });

    it("records Mission Control's per-bot switch", () => {
      applyControlsAction("suspend", "sauron", OWNER, {
        store,
        changes: log,
        isOwner: () => true,
        bots: () => [{ id: "sauron", displayName: "Sauron" }],
        now: () => AT,
      });
      expect(log.list("sauron")[0]).toMatchObject({ setting: "suspended", after: true });
    });
  });
});

describe("SettingsChangeLog", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-settings-log-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const line = (n: number) => ({
    at: new Date(Date.UTC(2026, 9, 18, 0, 0, n)).toISOString(),
    setting: "betaPicks",
    before: n,
    after: n + 1,
    proposedBy: OWNER,
    approvedBy: OWNER,
  });

  it("lists newest first and keeps only the latest lines per account", () => {
    const log = new SettingsChangeLog(join(dir, "log.json"));
    log.record(
      "sauron",
      Array.from({ length: MAX_CHANGES_PER_ACCOUNT + 5 }, (_, n) => line(n)),
    );
    const listed = log.list("sauron");
    expect(listed).toHaveLength(MAX_CHANGES_PER_ACCOUNT);
    expect(listed[0]?.before).toBe(MAX_CHANGES_PER_ACCOUNT + 4);
    expect(log.list("sauron", 2)).toHaveLength(2);
  });

  it("reads a torn file as empty, never a throw, and drops a malformed line", async () => {
    const path = join(dir, "log.json");
    await writeFile(path, "{not json");
    expect(new SettingsChangeLog(path).list("sauron")).toEqual([]);
    await writeFile(
      path,
      JSON.stringify({ accounts: { sauron: [line(1), { ...line(2), before: "x".repeat(201) }] } }),
    );
    expect(new SettingsChangeLog(path).list("sauron")).toEqual([line(1)]);
  });
});
