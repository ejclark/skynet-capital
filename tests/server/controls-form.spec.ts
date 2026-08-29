import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BotControlsStore } from "../../src/server/bot-controls-store.js";
import {
  applyControlsAction,
  type ControlsDeps,
  fleetControls,
} from "../../src/server/controls-form.js";

/**
 * The fleet's action authority (shared by the shell's `/api/controls`, `controls-api-routes.ts`,
 * and formerly the classic desk-settings HTML tab): one switch flips per call, unknown
 * bots/actions refuse loudly, and every flip stamps who changed it and when.
 */
const BOTS = [
  { id: "sauron", displayName: "Sauron" },
  { id: "banker", displayName: "The Banker" },
];

describe("applyControlsAction", () => {
  let dir: string;
  let store: BotControlsStore;
  const deps = (): ControlsDeps => ({
    store,
    isOwner: () => true,
    bots: () => BOTS,
    now: () => new Date("2026-08-21T12:00:00.000Z"),
  });

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-controls-form-"));
    store = new BotControlsStore(join(dir, "bot-controls.json"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("suspends and resumes one bot, stamping who changed it and when", () => {
    const suspended = applyControlsAction("suspend", "sauron", "owner@example.com", deps());
    expect(suspended).toEqual({
      ok: true,
      notice: { kind: "ok", message: expect.stringContaining("within ~30 seconds") },
    });
    expect(store.load().bots.sauron?.suspended).toBe(true);
    expect(store.load().updatedBy).toBe("owner@example.com");
    expect(store.load().updatedAt).toBe("2026-08-21T12:00:00.000Z");

    applyControlsAction("resume", "sauron", "owner@example.com", deps());
    expect(store.load().bots.sauron?.suspended).toBe(false);
  });

  it("the global switch stands the whole fleet down and lifts again", () => {
    applyControlsAction("suspend-all", undefined, "owner@example.com", deps());
    expect(store.load().allSuspended).toBe(true);
    applyControlsAction("resume-all", undefined, "owner@example.com", deps());
    expect(store.load().allSuspended).toBe(false);
  });

  it("refuses an unknown bot without touching the store", () => {
    const result = applyControlsAction("suspend", "nobody", "owner@example.com", deps());
    expect(result).toEqual({ ok: false, notice: { kind: "error", message: "Unknown bot." } });
    expect(store.load()).toEqual({ bots: {} });
  });

  it("refuses any action it doesn't itself define — never guesses", () => {
    const result = applyControlsAction("explode", "sauron", "owner@example.com", deps());
    expect(result).toEqual({ ok: false, notice: { kind: "error", message: "Unknown action." } });
    expect(store.load()).toEqual({ bots: {} });
  });
});

describe("fleetControls", () => {
  it("flattens the store's state and the live roster into one read", async () => {
    const dir = await mkdtemp(join(tmpdir(), "skynet-controls-form-"));
    try {
      const store = new BotControlsStore(join(dir, "bot-controls.json"));
      store.setBot(
        "sauron",
        { suspended: true },
        "owner@example.com",
        new Date("2026-08-21T12:00:00.000Z"),
      );
      const controls = fleetControls({ store, isOwner: () => true, bots: () => BOTS });
      expect(controls.allSuspended).toBe(false);
      expect(controls.bots).toEqual([
        { id: "sauron", displayName: "Sauron", suspended: true },
        { id: "banker", displayName: "The Banker", suspended: false },
      ]);
      expect(controls.updatedBy).toBe("owner@example.com");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
