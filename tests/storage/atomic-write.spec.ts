import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFileAtomicSync } from "../../src/storage/atomic-write.js";

describe("writeFileAtomicSync (#4612 slice 9)", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "skynet-atomic-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("creates the directory and replaces the file, leaving no temp file behind", () => {
    const path = join(dir, "nested", "state.json");
    writeFileAtomicSync(path, "first");
    writeFileAtomicSync(path, "second");

    expect(readFileSync(path, "utf8")).toBe("second");
    expect(existsSync(`${path}.tmp`)).toBe(false);
  });

  it("leaves the previous file whole when the write fails before the rename", () => {
    const path = join(dir, "state.json");
    writeFileSync(path, "previous");
    // A directory where the temp file goes makes the write throw, as a full volume would.
    mkdirSync(`${path}.tmp`);

    expect(() => writeFileAtomicSync(path, "next")).toThrow();
    expect(readFileSync(path, "utf8")).toBe("previous");
  });
});
