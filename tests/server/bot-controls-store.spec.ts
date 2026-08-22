import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BotControlsStore } from "../../src/server/bot-controls-store.js";

const AT = new Date("2026-08-21T12:00:00.000Z");

describe("BotControlsStore", () => {
  let dir: string;
  let path: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-controls-"));
    path = join(dir, "bot-controls.json");
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("loads the empty state when no file exists", () => {
    expect(new BotControlsStore(path).load()).toEqual({ bots: {} });
  });

  it("merges per-bot patches and stamps the audit line", () => {
    const store = new BotControlsStore(path);
    store.setBot("sauron", { suspended: true }, "owner@example.com", AT);
    store.setBot("sauron", { mode: "observe" }, "owner@example.com", AT);

    const state = store.load();
    expect(state.bots.sauron).toEqual({ suspended: true, mode: "observe" });
    expect(state.updatedAt).toBe(AT.toISOString());
    expect(state.updatedBy).toBe("owner@example.com");
  });

  it("flips the global switch without touching per-bot settings", () => {
    const store = new BotControlsStore(path);
    store.setBot("sauron", { suspended: true }, "owner@example.com", AT);
    store.setAllSuspended(true, "owner@example.com", AT);

    const state = store.load();
    expect(state.allSuspended).toBe(true);
    expect(state.bots.sauron).toEqual({ suspended: true });
  });

  it("treats a torn/malformed file as empty and reports, never throws", async () => {
    await writeFile(path, "{ definitely not js", "utf8");
    const reports: string[] = [];
    const store = new BotControlsStore(path, (m) => reports.push(m));
    expect(store.load()).toEqual({ bots: {} });
    expect(reports).toHaveLength(1);
  });

  it("writes durable JSON a fresh store can read back", async () => {
    new BotControlsStore(path).setBot("sauron", { hardcore: true }, "owner@example.com", AT);
    const raw = JSON.parse(await readFile(path, "utf8"));
    expect(raw.bots.sauron.hardcore).toBe(true);
    expect(new BotControlsStore(path).load().bots.sauron?.hardcore).toBe(true);
  });
});
