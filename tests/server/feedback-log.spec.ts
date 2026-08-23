import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  type FeedbackLogEntry,
  feedbackLogEntry,
  InMemoryFeedbackLogStore,
  JsonlFeedbackLogStore,
} from "../../src/server/feedback-log.js";

const entry = (overrides: Partial<FeedbackLogEntry> = {}): FeedbackLogEntry => ({
  uuid: "u-1",
  opaqueMemberId: "abc1234567",
  issueNumber: 7,
  url: "https://github.com/x/y/issues/7",
  kind: "bug",
  title: "Chart wobbles",
  filedAt: "2026-08-22T12:00:00.000Z",
  ...overrides,
});

describe("feedbackLogEntry", () => {
  it("builds an entry from a filed input and result, minting its own uuid", () => {
    const result = feedbackLogEntry(
      { kind: "idea", title: "  A side quest  " },
      "abc1234567",
      { url: "https://github.com/x/y/issues/9", number: 9 },
      "2026-08-22T12:00:00.000Z",
    );

    expect(result).toMatchObject({
      opaqueMemberId: "abc1234567",
      issueNumber: 9,
      url: "https://github.com/x/y/issues/9",
      kind: "idea",
      title: "A side quest",
      filedAt: "2026-08-22T12:00:00.000Z",
    });
    expect(result.uuid).toBeTruthy();
  });
});

describe("InMemoryFeedbackLogStore", () => {
  it("records entries and filters by member", async () => {
    const store = new InMemoryFeedbackLogStore();
    await store.record(entry({ opaqueMemberId: "member-a" }));
    await store.record(entry({ opaqueMemberId: "member-b", uuid: "u-2" }));

    expect(await store.list()).toHaveLength(2);
    expect(await store.list("member-a")).toHaveLength(1);
  });
});

describe("JsonlFeedbackLogStore", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-feedback-log-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("appends per member and reads back", async () => {
    const store = new JsonlFeedbackLogStore(dir);
    await store.record(entry());
    await store.record(entry({ uuid: "u-2", issueNumber: 8 }));
    await store.record(entry({ opaqueMemberId: "someone-else", uuid: "u-3" }));

    const mine = await store.list("abc1234567");
    expect(mine).toHaveLength(2);
    expect(mine.map((e) => e.issueNumber).sort()).toEqual([7, 8]);
    expect(await store.list()).toHaveLength(3);
  });
});
