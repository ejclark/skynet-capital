import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  CommunityProgressionStore,
  createCommunityProgressionStore,
} from "../../src/server/community-progression-store.js";

describe("community progression store — durable claimed celebrations only", () => {
  let dir: string;
  let path: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "community-progression-"));
    path = join(dir, "community-progression.json");
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("answers empty for a missing file, and round-trips a record", () => {
    const store = new CommunityProgressionStore(path);
    expect(store.get("member1")).toBeUndefined();

    store.set("member1", { acknowledged: ["first-feedback"] }, new Date("2026-08-29T14:00:00Z"));
    const reread = new CommunityProgressionStore(path).get("member1");
    expect(reread).toMatchObject({
      acknowledged: ["first-feedback"],
      since: "2026-08-29T14:00:00.000Z",
      updatedAt: "2026-08-29T14:00:00.000Z",
    });
  });

  it("merges a patch without touching other fields, stamping updatedAt", () => {
    const store = new CommunityProgressionStore(path);
    store.set("member1", { acknowledged: ["first-feedback"] }, new Date("2026-08-29T14:00:00Z"));
    store.set(
      "member1",
      { acknowledged: ["first-feedback", "other"] },
      new Date("2026-08-30T09:00:00Z"),
    );
    expect(store.get("member1")).toMatchObject({
      acknowledged: ["first-feedback", "other"],
      since: "2026-08-29T14:00:00.000Z", // first write, never restamped
      updatedAt: "2026-08-30T09:00:00.000Z",
    });
  });

  it("degrades a malformed file to empty, loudly, and never throws", () => {
    writeFileSync(path, "{not json", "utf8");
    const errors: string[] = [];
    const store = new CommunityProgressionStore(path, (m) => errors.push(m));
    expect(store.load()).toEqual({ participants: {} });
    expect(errors).toHaveLength(1);

    writeFileSync(
      path,
      JSON.stringify({ participants: { member1: { acknowledged: "not-an-array" } } }),
      "utf8",
    );
    expect(store.get("member1")).toBeUndefined();
  });

  it("writes atomically — the file on disk is always whole JSON", () => {
    const store = new CommunityProgressionStore(path);
    store.set("member1", { acknowledged: [] });
    expect(() => JSON.parse(readFileSync(path, "utf8"))).not.toThrow();
  });

  it("builds from the environment with the documented default path", () => {
    const store = createCommunityProgressionStore({ SKYNET_COMMUNITY_PROGRESSION_FILE: path });
    store.set("member1", { acknowledged: ["first-feedback"] });
    expect(new CommunityProgressionStore(path).get("member1")?.acknowledged).toEqual([
      "first-feedback",
    ]);
  });
});
