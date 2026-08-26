import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { NavContext } from "../../src/observatory/dashboard-shell.js";
import { botControlsBlock, handleBotControl } from "../../src/server/account-bot-controls.js";
import { suffix } from "../../src/server/account-form-context.js";
import { BotControlsStore } from "../../src/server/bot-controls-store.js";
import type { ControlsDeps } from "../../src/server/controls-form.js";

/**
 * The Mission Control fold-in (Eric, 2026-08-26: "fold mission control into account") — a claimed
 * bot's suspend/resume toggle, folded onto `/account` instead of a link to a separate page.
 * Authorization is `/account`'s own session-ownership check, never `requireOwner`; see
 * controls-form.spec.ts for Mission Control's own owner-gated fleet-wide switchboard.
 */
const nav: NavContext = { active: "add", canAdd: true, authed: true };

describe("suffix", () => {
  it("builds a ?key= suffix, or nothing when the key is blank", () => {
    expect(suffix("pw")).toBe("?key=pw");
    expect(suffix("")).toBe("");
  });
});

describe("botControlsBlock", () => {
  it("renders nothing when there's no bot state (human account, or controls not wired)", () => {
    expect(botControlsBlock({ ownedAccounts: [], key: "", nav })).toBe("");
    expect(botControlsBlock({ ownedAccounts: [], requesterId: "human-ann", key: "", nav })).toBe(
      "",
    );
  });

  it("offers to suspend an active bot, and to resume a suspended one", () => {
    const active = botControlsBlock({
      ownedAccounts: [],
      requesterId: "sauron",
      bot: { suspended: false },
      key: "",
      nav,
    });
    expect(active).toContain("currently <b>active</b>");
    expect(active).toContain('value="suspend"');
    expect(active).toContain("Suspend trading");

    const suspended = botControlsBlock({
      ownedAccounts: [],
      requesterId: "sauron",
      bot: { suspended: true },
      key: "",
      nav,
    });
    expect(suspended).toContain("currently <b>suspended</b>");
    expect(suspended).toContain('value="resume"');
    expect(suspended).toContain("Resume trading");
  });
});

async function withBotControl(
  controls: ControlsDeps | undefined,
  requesterId: string | undefined,
  run: (base: string) => Promise<void>,
): Promise<void> {
  const server = createServer((req, res) => {
    void handleBotControl(
      req,
      res,
      req.method ?? "GET",
      { ownedAccounts: [], requesterId, profile: { displayName: "Sauron" }, key: "", nav },
      controls,
      { email: "ann@example.com", provider: "google", name: "Ann", exp: 1 },
    );
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

describe("handleBotControl", () => {
  let dir: string;
  let store: BotControlsStore;
  let controls: ControlsDeps;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-account-bot-controls-"));
    store = new BotControlsStore(join(dir, "bot-controls.json"));
    controls = {
      store,
      isOwner: () => false,
      bots: () => [{ id: "sauron", displayName: "Sauron" }],
    };
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("refuses any method besides POST", async () => {
    await withBotControl(controls, "sauron", async (base) => {
      const res = await fetch(base, { method: "GET" });
      expect(res.status).toBe(405);
    });
  });

  it("flips the bot's own suspend state when the caller resolves to that same bot", async () => {
    await withBotControl(controls, "sauron", async (base) => {
      const res = await fetch(base, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "id=sauron&action=suspend",
      });
      expect(res.status).toBe(200);
      expect(await res.text()).toContain("Trading suspended");
      expect(store.load().bots.sauron?.suspended).toBe(true);
    });
  });

  it("refuses a caller whose session doesn't resolve to the submitted bot", async () => {
    await withBotControl(controls, "human-ann", async (base) => {
      const res = await fetch(base, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "id=sauron&action=suspend",
      });
      expect(res.status).toBe(400);
      expect(await res.text()).toContain("only control your own bot");
      expect(store.load().bots.sauron?.suspended).toBeUndefined();
    });
  });

  it("refuses when bot controls aren't wired at all", async () => {
    await withBotControl(undefined, "sauron", async (base) => {
      const res = await fetch(base, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "id=sauron&action=suspend",
      });
      expect(res.status).toBe(400);
    });
  });

  it("refuses an unrecognized action", async () => {
    await withBotControl(controls, "sauron", async (base) => {
      const res = await fetch(base, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "id=sauron&action=self-destruct",
      });
      expect(res.status).toBe(400);
      expect(await res.text()).toContain("Unknown action");
    });
  });
});
