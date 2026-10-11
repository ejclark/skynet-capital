import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  CouncilRepliesStore,
  councilRepliesFilePathFrom,
  parseCouncilRepliesState,
} from "../../src/server/council-replies-store.js";

/** Replies under a weekly Council line (#5097, #2224 option A) — the store: total parse, append,
 *  author-only delete, and a file beside the Council's own. */

const reply = (id: string, authorId = "a1") => ({
  id,
  authorId,
  text: `reply ${id}`,
  at: "2026-10-06T10:00:00.000Z",
  lineAt: "2026-10-05T09:00:00.000Z",
});

describe("parseCouncilRepliesState — total, defensive", () => {
  it("keeps well-formed replies and drops junk replies, junk weeks and hollow lines", () => {
    const state = parseCouncilRepliesState({
      weeks: {
        "2026-W41": {
          line1: [reply("r1"), { id: "r2" }, { ...reply("r3"), text: "x".repeat(501) }],
          line2: [{ ...reply("r4"), lineAt: 7 }],
          line3: "not a list",
        },
        "not-a-week": { line1: [reply("r5")] },
        "2026-W42": "torn",
      },
    });
    expect(state).toEqual({ weeks: { "2026-W41": { line1: [reply("r1")] } } });
  });

  it("refuses a non-object", () => {
    expect(parseCouncilRepliesState("torn")).toBeNull();
    expect(parseCouncilRepliesState(null)).toBeNull();
  });
});

describe("CouncilRepliesStore", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "council-replies-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("appends under one line of one week and survives a reload", () => {
    const path = join(dir, "council-replies.json");
    new CouncilRepliesStore(path).add("2026-W41", "line1", reply("r1"));
    new CouncilRepliesStore(path).add("2026-W41", "line1", reply("r2", "b2"));
    new CouncilRepliesStore(path).add("2026-W41", "line2", reply("r3"));
    const weeks = new CouncilRepliesStore(path).load().weeks;
    expect(weeks["2026-W41"]?.line1?.map((r) => r.id)).toEqual(["r1", "r2"]);
    expect(weeks["2026-W41"]?.line2?.map((r) => r.id)).toEqual(["r3"]);
  });

  it("removes a reply only for its author, and drops the emptied line and week", () => {
    const store = new CouncilRepliesStore(join(dir, "cr.json"));
    store.add("2026-W41", "line1", reply("r1", "a1"));
    store.remove("2026-W41", "line1", "r1", "someone-else");
    expect(store.load().weeks["2026-W41"]?.line1).toHaveLength(1);
    store.remove("2026-W41", "line1", "r1", "a1");
    expect(store.load()).toEqual({ weeks: {} });
  });

  it("treats a missing reply, line or week as a no-op", () => {
    const store = new CouncilRepliesStore(join(dir, "cr.json"));
    store.add("2026-W41", "line1", reply("r1"));
    store.remove("2026-W41", "line1", "nope", "a1");
    store.remove("2026-W41", "nobody", "r1", "a1");
    store.remove("2026-W40", "line1", "r1", "a1");
    store.remove("2026-W41", "__proto__", "r1", "a1");
    expect(store.load().weeks["2026-W41"]?.line1).toHaveLength(1);
  });
});

it("lives beside the controls file, next to the Council's own", () => {
  expect(councilRepliesFilePathFrom("/data/bot-controls.json")).toBe("/data/council-replies.json");
  expect(councilRepliesFilePathFrom("bot-controls.json")).toBe("council-replies.json");
});
