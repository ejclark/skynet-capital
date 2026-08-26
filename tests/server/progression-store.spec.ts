import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createProgressionStore, ProgressionStore } from "../../src/server/progression-store.js";

describe("progression store — durable wheels preference + claimed celebrations", () => {
  let dir: string;
  let path: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "progression-"));
    path = join(dir, "progression.json");
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("answers empty for a missing file, and round-trips a record", () => {
    const store = new ProgressionStore(path);
    expect(store.get("ann")).toBeUndefined();

    store.set(
      "ann",
      { trainingWheels: false, acknowledged: ["first-buy"] },
      new Date("2026-08-25T14:00:00Z"),
    );
    const reread = new ProgressionStore(path).get("ann");
    expect(reread).toMatchObject({
      trainingWheels: false,
      acknowledged: ["first-buy"],
      since: "2026-08-25T14:00:00.000Z",
      updatedAt: "2026-08-25T14:00:00.000Z",
    });
  });

  it("merges a patch without touching other fields, stamping updatedAt", () => {
    const store = new ProgressionStore(path);
    store.set(
      "ann",
      { trainingWheels: true, acknowledged: ["first-buy"] },
      new Date("2026-08-25T14:00:00Z"),
    );
    store.set("ann", { trainingWheels: false }, new Date("2026-08-26T09:00:00Z"));
    expect(store.get("ann")).toMatchObject({
      trainingWheels: false,
      acknowledged: ["first-buy"], // untouched
      since: "2026-08-25T14:00:00.000Z", // first write, never restamped
      updatedAt: "2026-08-26T09:00:00.000Z",
    });
  });

  it("degrades a malformed file to empty, loudly, and never throws", () => {
    writeFileSync(path, "{not json", "utf8");
    const errors: string[] = [];
    const store = new ProgressionStore(path, (m) => errors.push(m));
    expect(store.load()).toEqual({ participants: {} });
    expect(errors).toHaveLength(1);

    writeFileSync(
      path,
      JSON.stringify({ participants: { ann: { trainingWheels: "yes" } } }),
      "utf8",
    );
    expect(store.get("ann")).toBeUndefined(); // wrong shape = empty, not a half-parsed record
  });

  it("writes atomically — the file on disk is always whole JSON", () => {
    const store = new ProgressionStore(path);
    store.set("ann", { trainingWheels: true });
    expect(() => JSON.parse(readFileSync(path, "utf8"))).not.toThrow();
  });

  it("builds from the environment with the documented default path", () => {
    const store = createProgressionStore({ SKYNET_PROGRESSION_FILE: path });
    store.set("bob", { trainingWheels: true });
    expect(new ProgressionStore(path).get("bob")?.trainingWheels).toBe(true);
  });
});
