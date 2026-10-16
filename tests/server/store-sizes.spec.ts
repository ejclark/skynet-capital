import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { formatStoreSizes, measureStores, pathBytes } from "../../src/server/store-sizes.js";

// Store sizes at boot and hourly (#4618): the audit had to estimate production's history and
// volume sizes because nothing logged them.
let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "skynet-store-sizes-"));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("store sizes", () => {
  it("sums a directory's files recursively and reads a file's own size", () => {
    mkdirSync(join(dir, "history", "nested"), { recursive: true });
    writeFileSync(join(dir, "history", "a.jsonl"), "x".repeat(100));
    writeFileSync(join(dir, "history", "nested", "b.jsonl"), "x".repeat(50));
    writeFileSync(join(dir, "allowlist.json"), "x".repeat(7));
    expect(pathBytes(join(dir, "history"))).toBe(150);
    expect(pathBytes(join(dir, "allowlist.json"))).toBe(7);
  });

  it("counts a store that has never written as 0, not a failure", () => {
    expect(pathBytes(join(dir, "missing"))).toBe(0);
  });

  it("measures every declared store at the path this process uses, plus the volume's room", () => {
    writeFileSync(join(dir, "h.jsonl"), "x".repeat(2 * 1_048_576));
    const sizes = measureStores({ SKYNET_HISTORY_DIR: join(dir, "h.jsonl") }, dir);
    expect(sizes.stores.find((s) => s.name === "history")?.bytes).toBe(2 * 1_048_576);
    expect(sizes.stores.map((s) => s.name)).toContain("activity");
    expect(sizes.volume?.totalBytes).toBeGreaterThan(0);
  });

  it("logs the largest stores first and leaves out empty ones", () => {
    const line = formatStoreSizes({
      stores: [
        { name: "activity", bytes: 1_048_576 },
        { name: "watchlist", bytes: 0 },
        { name: "history", bytes: 3 * 1_048_576 },
      ],
      volume: { freeBytes: 512 * 1_048_576, totalBytes: 1024 * 1_048_576 },
    });
    expect(line).toBe(
      "[stores] total 4.0 MB · history 3.0 MB · activity 1.0 MB · volume 512.0 of 1024.0 MB free",
    );
  });
});
