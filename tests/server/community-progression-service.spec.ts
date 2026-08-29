import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCommunityProgressionService } from "../../src/server/community-progression-service.js";
import { CommunityProgressionStore } from "../../src/server/community-progression-store.js";
import type { FeedbackLogEntry } from "../../src/server/feedback-log.js";

const filing = (over: Partial<FeedbackLogEntry>): FeedbackLogEntry => ({
  uuid: "u1",
  opaqueMemberId: "member1",
  issueNumber: 42,
  url: "https://github.com/ejclark/skynet-capital/issues/42",
  kind: "bug",
  title: "a bug",
  filedAt: "2026-08-29T14:00:00.000Z",
  ...over,
});

describe("community progression service — the feedback log IS the progress", () => {
  it("reports zero earns and the feedback count with no store wired (offline builds)", async () => {
    const svc = createCommunityProgressionService({ readFeedback: () => Promise.resolve([]) });
    const view = await svc.view("member1");
    expect(view.feedbackCount).toBe(0);
    expect(view.earned).toEqual([]);
    expect(view.celebrating).toEqual([]); // nothing celebrates without a store
  });

  it("derives the feedback count and earned milestone from filings alone", async () => {
    const svc = createCommunityProgressionService({
      readFeedback: () => Promise.resolve([filing({ issueNumber: 1 }), filing({ issueNumber: 2 })]),
    });
    const view = await svc.view("member1");
    expect(view.feedbackCount).toBe(2);
    expect(view.earned.map((m) => m.milestoneId)).toEqual(["first-feedback"]);
  });

  describe("with a store — seeding and one-time celebrations", () => {
    let dir: string;

    beforeEach(() => {
      dir = mkdtempSync(join(tmpdir(), "community-progression-svc-"));
    });
    afterEach(() => {
      rmSync(dir, { recursive: true, force: true });
    });

    it("seeds a member WITH history pre-acknowledged — day-one history is never fanfare", async () => {
      const store = new CommunityProgressionStore(join(dir, "community-progression.json"));
      const svc = createCommunityProgressionService({
        readFeedback: () => Promise.resolve([filing({ filedAt: "2026-08-01T10:00:00.000Z" })]),
        store,
        now: () => new Date("2026-08-29T16:00:00.000Z"),
      });
      const view = await svc.view("member1");
      expect(view.celebrating).toEqual([]);
      expect(store.get("member1")?.acknowledged).toEqual(["first-feedback"]);
    });

    it("celebrates a fresh earn once, until claimed", async () => {
      const storePath = join(dir, "community-progression.json");
      // Seed a brand-new member with no filings yet.
      const seedSvc = createCommunityProgressionService({
        readFeedback: () => Promise.resolve([]),
        store: new CommunityProgressionStore(storePath),
        now: () => new Date("2026-08-29T14:00:00.000Z"),
      });
      await seedSvc.view("member1");

      // A filing lands after the seed's `since` — a fresh, unclaimed earn.
      const laterSvc = createCommunityProgressionService({
        readFeedback: () => Promise.resolve([filing({ filedAt: "2026-08-29T15:00:00.000Z" })]),
        store: new CommunityProgressionStore(storePath),
        now: () => new Date("2026-08-29T15:01:00.000Z"),
      });
      const view = await laterSvc.view("member1");
      expect(view.celebrating.map((m) => m.milestoneId)).toEqual(["first-feedback"]);

      await laterSvc.acknowledge("member1", ["first-feedback"]);
      const claimed = await laterSvc.view("member1");
      expect(claimed.celebrating).toEqual([]);
      expect(claimed.earned.map((m) => m.milestoneId)).toEqual(["first-feedback"]); // still earned
    });

    it("acknowledge filters out ids that aren't real community milestones", async () => {
      const store = new CommunityProgressionStore(join(dir, "community-progression.json"));
      const svc = createCommunityProgressionService({
        readFeedback: () => Promise.resolve([]),
        store,
      });
      await svc.acknowledge("member1", ["first-feedback", "not-a-real-id"]);
      expect(store.get("member1")?.acknowledged).toEqual(["first-feedback"]);
    });
  });
});
