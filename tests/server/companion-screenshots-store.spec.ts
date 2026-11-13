import { chmod, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  createCompanionScreenshotStore,
  evictionsFor,
  FileCompanionScreenshotStore,
  type ScreenshotEntry,
  sniffScreenshotType,
} from "../../src/server/companion-screenshots-store.js";

/**
 * The chat screenshot store (#6007 slice 1): criteria 11 (the bytes' own header), 17 and 18 (the
 * two caps, oldest removed first) and 19 (a failed write keeps nothing and says so by throwing).
 */

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 9, 9]);

const entry = (id: string, member: string, bytes: number, at: string): ScreenshotEntry => ({
  id: id.padEnd(32, "0"),
  opaqueMemberId: member,
  type: "image/png",
  bytes,
  at,
});

describe("sniffScreenshotType — the file's own header decides", () => {
  it("knows a PNG and a JPEG by their signatures", () => {
    expect(sniffScreenshotType(PNG)).toBe("image/png");
    expect(sniffScreenshotType(JPEG)).toBe("image/jpeg");
  });

  it("refuses anything else, whatever it claims to be", () => {
    expect(sniffScreenshotType(Buffer.from("GIF89a"))).toBeUndefined();
    expect(sniffScreenshotType(Buffer.from("<svg onload=alert(1)>"))).toBeUndefined();
    expect(sniffScreenshotType(Buffer.alloc(0))).toBeUndefined();
  });
});

describe("evictionsFor — the caps do the clean-up", () => {
  const caps = { perMember: 10, total: 25 };

  it("removes nothing while both caps have room", () => {
    const entries = [entry("a", "m1", 4, "2026-11-01"), entry("b", "m2", 4, "2026-11-02")];
    expect(evictionsFor(entries, "m1", 5, caps)).toEqual([]);
  });

  it("removes the member's own oldest first when they would pass their cap (criterion 17)", () => {
    const entries = [
      entry("a", "m1", 4, "2026-11-01"),
      entry("b", "m2", 4, "2026-11-02"),
      entry("c", "m1", 4, "2026-11-03"),
    ];
    const gone = evictionsFor(entries, "m1", 4, caps).map((e) => e.id[0]);
    expect(gone).toEqual(["a"]); // m2's older one is not theirs to lose
  });

  it("removes the oldest across everyone when the store would pass its cap (criterion 18)", () => {
    const entries = [
      entry("a", "m2", 8, "2026-11-01"),
      entry("b", "m3", 8, "2026-11-02"),
      entry("c", "m4", 8, "2026-11-03"),
    ];
    const gone = evictionsFor(entries, "m1", 5, caps).map((e) => e.id[0]);
    expect(gone).toEqual(["a"]);
  });

  it("counts a member's own removals toward the store's room before taking anyone else's", () => {
    const entries = [
      entry("a", "m2", 8, "2026-11-01"),
      entry("b", "m1", 8, "2026-11-02"),
      entry("c", "m3", 8, "2026-11-03"),
    ];
    // m1 sends 5: their own 8 goes for their cap, which also brings the store to 16 + 5 ≤ 25.
    expect(evictionsFor(entries, "m1", 5, caps).map((e) => e.id[0])).toEqual(["b"]);
  });
});

describe("FileCompanionScreenshotStore", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-companion-screenshots-"));
  });
  afterEach(async () => {
    await chmod(dir, 0o700).catch(() => undefined);
    await rm(dir, { recursive: true, force: true });
  });

  it("keeps a screenshot and gives it back by id to whoever asks", async () => {
    const store = new FileCompanionScreenshotStore(dir);
    const { id } = await store.save("member-a", "image/png", PNG);
    expect(id).toMatch(/^[0-9a-f]{32}$/);
    const loaded = await store.load(id);
    expect(loaded?.type).toBe("image/png");
    expect(loaded?.data.equals(PNG)).toBe(true);
  });

  it("survives a restart: a new store over the same directory reads the index", async () => {
    const { id } = await new FileCompanionScreenshotStore(dir).save("m", "image/jpeg", JPEG);
    const reopened = await new FileCompanionScreenshotStore(dir).load(id);
    expect(reopened?.type).toBe("image/jpeg");
  });

  it("answers undefined for an unknown id, and for anything not shaped like one", async () => {
    const store = new FileCompanionScreenshotStore(dir);
    expect(await store.load("0".repeat(32))).toBeUndefined();
    expect(await store.load("../index.json")).toBeUndefined();
    expect(await store.load("index")).toBeUndefined();
  });

  it("removes the oldest file from disk when a cap is passed, and forgets its id", async () => {
    const store = new FileCompanionScreenshotStore(dir, { perMember: 25, total: 1_000 });
    const first = await store.save("m", "image/png", PNG); // 11 bytes
    const second = await store.save("m", "image/png", PNG);
    const third = await store.save("m", "image/png", PNG); // 33 > 25: the first goes
    expect(await store.load(first.id)).toBeUndefined();
    expect(await store.load(second.id)).toBeDefined();
    expect(await store.load(third.id)).toBeDefined();
    const files = (await readdir(dir)).filter((f) => f.endsWith(".png"));
    expect(files.sort()).toEqual([`${second.id}.png`, `${third.id}.png`].sort());
  });

  it("throws on a failed write and keeps the earlier screenshots (criterion 19)", async () => {
    if (process.getuid?.() === 0) return; // root ignores the read-only bit this test relies on
    const store = new FileCompanionScreenshotStore(dir, { perMember: 15, total: 1_000 });
    const kept = await store.save("m", "image/png", PNG);
    await chmod(dir, 0o500);
    await expect(store.save("m", "image/png", PNG)).rejects.toThrow();
    await chmod(dir, 0o700);
    expect(await store.load(kept.id)).toBeDefined(); // the eviction never happened
  });

  it("lives under the derived-store root, and its own var overrides it", async () => {
    const store = createCompanionScreenshotStore({ SKYNET_COMPANION_SCREENSHOTS_DIR: dir });
    const { id } = await store.save("m", "image/png", PNG);
    expect(await readdir(dir)).toContain(`${id}.png`);
  });
});
