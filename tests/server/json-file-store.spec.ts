import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { JsonFileStore } from "../../src/server/json-file-store.js";

/**
 * The durability discipline both volume-backed JSON stores stand on: a write that a crash cannot
 * tear, and a read that cannot throw — but also cannot fail SILENTLY, because a torn file quietly
 * read as "empty" is data loss nobody notices.
 */
interface Counter {
  readonly count: number;
}

const EMPTY: Counter = { count: 0 };
const parse = (raw: unknown): Counter | undefined =>
  typeof raw === "object" && raw !== null && typeof (raw as Counter).count === "number"
    ? { count: (raw as Counter).count }
    : undefined;

describe("JsonFileStore", () => {
  let dir: string;
  let path: string;
  const build = (onReadError?: (m: string) => void) =>
    new JsonFileStore<Counter>({
      path,
      empty: EMPTY,
      parse,
      label: "counter",
      ...(onReadError ? { onReadError } : {}),
    });

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-json-store-"));
    path = join(dir, "nested", "counter.json");
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("reads the empty state when the file has never been written", () => {
    expect(build().load()).toEqual(EMPTY);
  });

  it("creates missing directories and round-trips what it wrote", async () => {
    build().write({ count: 7 });

    expect(build().load()).toEqual({ count: 7 });
    expect(JSON.parse(await readFile(path, "utf8"))).toEqual({ count: 7 });
  });

  it("leaves no temp file behind for the next reader to trip over", async () => {
    build().write({ count: 1 });
    await expect(readFile(`${path}.tmp`, "utf8")).rejects.toThrow();
  });

  it("reports and falls back to empty when the file is not JSON at all", async () => {
    build().write({ count: 3 });
    await writeFile(path, "{ definitely not js", "utf8");
    const reports: string[] = [];

    expect(build((m) => reports.push(m)).load()).toEqual(EMPTY);
    expect(reports).toHaveLength(1);
    expect(reports[0]).toContain("[counter]");
  });

  it("reports and falls back to empty when the JSON is valid but the wrong shape", async () => {
    build().write({ count: 3 });
    await writeFile(path, JSON.stringify({ nope: true }), "utf8");
    const reports: string[] = [];

    expect(build((m) => reports.push(m)).load()).toEqual(EMPTY);
    expect(reports).toHaveLength(1);
  });

  it("stays silent about a healthy read", () => {
    build().write({ count: 2 });
    const reports: string[] = [];

    expect(build((m) => reports.push(m)).load()).toEqual({ count: 2 });
    expect(reports).toEqual([]);
  });
});
