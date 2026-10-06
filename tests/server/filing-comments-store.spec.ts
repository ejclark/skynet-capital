import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  FilingCommentsStore,
  filingCommentsFilePathFrom,
  parseFilingCommentsState,
} from "../../src/server/filing-comments-store.js";

const comment = (id: string, authorId = "a1") => ({
  id,
  authorId,
  text: `comment ${id}`,
  at: "2026-09-30T10:00:00.000Z",
});

describe("parseFilingCommentsState — total, defensive", () => {
  it("keeps well-formed comments and drops junk ones, junk keys and hollow filings", () => {
    const state = parseFilingCommentsState({
      issues: {
        "42": [comment("c1"), { id: "c2" }, { ...comment("c3"), text: "x".repeat(501) }],
        "0": [comment("c4")],
        abc: [comment("c5")],
        "7": [{ nope: true }],
      },
    });
    expect(state).toEqual({ issues: { "42": [comment("c1")] } });
  });

  it("refuses a non-object", () => {
    expect(parseFilingCommentsState("torn")).toBeNull();
  });
});

describe("FilingCommentsStore", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "filing-comments-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("appends to a filing and survives a reload", () => {
    const path = join(dir, "filing-comments.json");
    new FilingCommentsStore(path).add(42, comment("c1"));
    new FilingCommentsStore(path).add(42, comment("c2", "b2"));
    expect(new FilingCommentsStore(path).load().issues["42"]?.map((c) => c.id)).toEqual([
      "c1",
      "c2",
    ]);
  });

  it("removes a comment only for its author, and drops the emptied filing", () => {
    const store = new FilingCommentsStore(join(dir, "fc.json"));
    store.add(42, comment("c1", "a1"));
    store.remove(42, "c1", "someone-else");
    expect(store.load().issues["42"]).toHaveLength(1);
    store.remove(42, "c1", "a1");
    expect(store.load()).toEqual({ issues: {} });
  });
});

it("lives beside the controls file", () => {
  expect(filingCommentsFilePathFrom("/data/bot-controls.json")).toBe("/data/filing-comments.json");
  expect(filingCommentsFilePathFrom("bot-controls.json")).toBe("filing-comments.json");
});
