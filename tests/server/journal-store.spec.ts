import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { InMemoryJournalStore } from "../../src/server/journal-memory-store.js";
import {
  createJournalStore,
  JsonlJournalStore,
  journalNote,
} from "../../src/server/journal-store.js";

/**
 * #8190: a member's private notes, one append-only file per member on the data volume — the
 * derived-store root, so the store costs no `fly.toml` line (#4604).
 */

describe("journalNote", () => {
  it("keeps the member's words with who and when, minting its own id", () => {
    const note = journalNote({ kind: "experience", text: "Late fill" }, "abc1234567", "2026-11-24");
    expect(note).toMatchObject({
      kind: "experience",
      text: "Late fill",
      opaqueMemberId: "abc1234567",
      savedAt: "2026-11-24",
    });
    expect(note.uuid).toBeTruthy();
  });
});

describe("InMemoryJournalStore", () => {
  it("lists only the asking member's notes", async () => {
    const store = new InMemoryJournalStore();
    await store.append(journalNote({ kind: "experience", text: "a" }, "member-a", "t1"));
    await store.append(journalNote({ kind: "trade", learned: "b" }, "member-b", "t2"));

    expect((await store.list("member-a")).map((n) => n.opaqueMemberId)).toEqual(["member-a"]);
  });
});

describe("JsonlJournalStore", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-journal-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("appends per member and reads back in saved order", async () => {
    const store = new JsonlJournalStore(dir);
    await store.append(journalNote({ kind: "experience", text: "first" }, "abc1234567", "t1"));
    await store.append(journalNote({ kind: "trade", whyIn: "second" }, "abc1234567", "t2"));
    await store.append(journalNote({ kind: "experience", text: "theirs" }, "other", "t3"));

    const mine = await store.list("abc1234567");
    expect(mine.map((n) => n.savedAt)).toEqual(["t1", "t2"]);
  });

  it("resolves under the derived-store root, `journal` on the volume", () => {
    // A Fly Machine's root is the mount; the store is written as `<root>/journal`.
    const store = createJournalStore({ SKYNET_DATA_ROOT: dir });
    return store
      .append(journalNote({ kind: "experience", text: "x" }, "m1", "t1"))
      .then(() => new JsonlJournalStore(join(dir, "journal")).list("m1"))
      .then((notes) => expect(notes).toHaveLength(1));
  });
});
