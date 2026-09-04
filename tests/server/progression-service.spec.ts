import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkFor } from "../../src/domain/comprehension-checks.js";
import type { TradeActivityRecord } from "../../src/observatory/activity-store.js";
import type { CompanionMessageLogEntry } from "../../src/server/companion-message-log.js";
import type { FeedbackLogEntry } from "../../src/server/feedback-log.js";
import type { OrderAuditRecord } from "../../src/server/order-audit-log.js";
import {
  createProgressionService,
  type ParticipantProgression,
} from "../../src/server/progression-service.js";
import { ProgressionStore } from "../../src/server/progression-store.js";

const journalLine = (over: Partial<TradeActivityRecord>): TradeActivityRecord => ({
  orderId: "o1",
  participantId: "ann",
  symbol: "AAPL",
  side: "buy",
  quantity: 10,
  filledQuantity: 10,
  status: "filled",
  at: "2026-08-25T14:00:00.000Z",
  source: "stream",
  ...over,
});

const tagLine = (over: Partial<OrderAuditRecord>): OrderAuditRecord => ({
  participantId: "ann",
  orderId: "o1",
  at: "2026-08-25T13:59:59.000Z",
  ...over,
});

function service(journal: TradeActivityRecord[], tags: OrderAuditRecord[] = []) {
  return createProgressionService({
    readFills: () => Promise.resolve(journal),
    readTags: () => Promise.resolve(tags),
  });
}

describe("progression service — the ledgers ARE the progress", () => {
  it("derives earned milestones, points, rank and the ladder from the two ledgers", async () => {
    const view: ParticipantProgression = await service(
      [
        journalLine({ orderId: "b1" }),
        journalLine({ orderId: "s1", side: "sell", at: "2026-08-25T15:00:00.000Z" }),
      ],
      [tagLine({ orderId: "b1", code: "101", intent: "open", side: "buy" })],
    ).view("ann");
    expect(view.earned.map((m) => m.milestoneId)).toEqual(["first-buy", "first-sell"]);
    expect(view.points).toBe(50);
    expect(view.rank.title).toBe("Trader");
    expect(view.unlocked.has("201")).toBe(true);
    expect(view.unlocked.has("202")).toBe(false);
    expect(view.nextUp).toBe("201");
    expect(view.unlockedLevels.has(200)).toBe(true);
    expect(view.earnedByCode.get("101")?.orderId).toBe("b1");
  });

  it("collapses the journal per order — a partial fill line never double-earns or fake-earns", async () => {
    // The same order journaled new → filled: only the collapsed (filled) state counts, once.
    const view = await service([
      journalLine({ orderId: "b1", filledQuantity: 0, status: "new" }),
      journalLine({
        orderId: "b1",
        filledQuantity: 10,
        status: "filled",
        at: "2026-08-25T14:05:00.000Z",
      }),
    ]).view("ann");
    expect(view.earned).toHaveLength(1);
    expect(view.earned[0]?.milestoneId).toBe("first-buy");
  });

  it("answers a clean zero for a participant with no history", async () => {
    const view = await service([]).view("ann");
    expect(view.earned).toEqual([]);
    expect(view.points).toBe(0);
    expect(view.rank.title).toBe("Observer");
    expect([...view.unlocked]).toEqual(["101"]);
    expect(view.nextUp).toBe("101");
  });

  it("celebrates nothing and reports wheels off when no store is wired (offline builds)", async () => {
    const view = await service([journalLine({})]).view("ann");
    expect(view.wheels).toBe(false);
    expect(view.celebrating).toEqual([]);
  });
});

describe("progression service + store — seeding, the toggle, and one-time celebrations", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "progression-svc-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  const stored = (journal: TradeActivityRecord[], at = "2026-08-25T16:00:00.000Z") => {
    const store = new ProgressionStore(join(dir, "progression.json"));
    const svc = createProgressionService({
      readFills: () => Promise.resolve(journal),
      readTags: () => Promise.resolve([]),
      store,
      now: () => new Date(at),
    });
    return { svc, store };
  };

  it("seeds a member WITH history as wheels OFF, past earns pre-acknowledged — never locked out", async () => {
    const { svc, store } = stored([journalLine({ at: "2026-08-01T10:00:00.000Z" })]);
    const view = await svc.view("ann");
    expect(view.wheels).toBe(false);
    expect(view.celebrating).toEqual([]); // day-one history is never fanfare
    expect(store.get("ann")).toMatchObject({
      trainingWheels: false,
      acknowledged: ["first-buy"],
    });
  });

  it("seeds a brand-new member as wheels ON", async () => {
    const { svc, store } = stored([]);
    const view = await svc.view("ann");
    expect(view.wheels).toBe(true);
    expect(store.get("ann")?.trainingWheels).toBe(true);
  });

  /** A fresh, unacknowledged `first-buy` earn — the state the gate is supposed to intercept. */
  const freshEarn = () => {
    const svc2 = createProgressionService({
      readFills: () => Promise.resolve([journalLine({ at: "2026-08-26T14:00:00.000Z" })]),
      readTags: () => Promise.resolve([]),
      store: new ProgressionStore(join(dir, "progression.json")),
      now: () => new Date("2026-08-26T14:01:00.000Z"),
    });
    return svc2;
  };

  const perfectAnswers = () => {
    const check = checkFor("first-buy");
    if (!check) throw new Error("first-buy is gated in the bank this spec relies on");
    return new Map(check.questions.map((q) => [q.id, String(q.answerIndex)]));
  };

  it("holds a gated earn at the check instead of celebrating it", async () => {
    const { svc } = stored([], "2026-08-25T16:00:00.000Z");
    await svc.view("ann"); // seed first (wheels on, nothing earned)

    const view = await freshEarn().view("ann");
    expect(view.pendingChecks.map((m) => m.milestoneId)).toEqual(["first-buy"]);
    expect(view.celebrating).toEqual([]);
    // The fill still earned it — the gate is ADDITIONAL, never a replacement.
    expect(view.earned.map((m) => m.milestoneId)).toEqual(["first-buy"]);
    expect(view.points).toBe(25);
  });

  it("celebrates a gated earn once the check passes, exactly as it did before", async () => {
    const { svc } = stored([], "2026-08-25T16:00:00.000Z");
    await svc.view("ann");
    const svc2 = freshEarn();

    const result = await svc2.submitCheck("ann", "first-buy", perfectAnswers());
    expect(result?.passed).toBe(true);

    const view = await svc2.view("ann");
    expect(view.pendingChecks).toEqual([]);
    expect(view.celebrating.map((m) => m.milestoneId)).toEqual(["first-buy"]);

    await svc2.acknowledge("ann", ["first-buy"]);
    expect((await svc2.view("ann")).celebrating).toEqual([]);
  });

  it("banks nothing on a miss — the earn stays pending and the retry stays open", async () => {
    const { svc, store } = stored([], "2026-08-25T16:00:00.000Z");
    await svc.view("ann");
    const svc2 = freshEarn();

    const result = await svc2.submitCheck("ann", "first-buy", new Map());
    expect(result?.passed).toBe(false);
    expect(store.get("ann")?.comprehension).toEqual([]);
    expect((await svc2.view("ann")).pendingChecks.map((m) => m.milestoneId)).toEqual(["first-buy"]);

    // Same member, second attempt, no cooldown and no penalty.
    await svc2.submitCheck("ann", "first-buy", perfectAnswers());
    expect(store.get("ann")?.comprehension).toEqual(["first-buy"]);
  });

  it("grades nothing for a milestone the bank does not gate", async () => {
    const { svc, store } = stored([]);
    await svc.view("ann");
    expect(await svc.submitCheck("ann", "not-a-milestone", new Map())).toBeUndefined();
    expect(store.get("ann")?.comprehension).toEqual([]);
  });

  it("banks only real curriculum ids — forged ack values never reach the store", async () => {
    const { svc, store } = stored([]);
    await svc.view("ann");
    await svc.acknowledge("ann", ["not-a-milestone", "<script>", "first-buy"]);
    expect(store.get("ann")?.acknowledged).toEqual(["first-buy"]);
  });

  describe("graduation ceremonies (#469 slice 4)", () => {
    it("reports a course level graduated exactly once, on the acknowledge that completes it", async () => {
      const { svc } = stored([]);
      // first-buy graduates nothing (it isn't course 100's LAST milestone); first-sell does.
      expect(await svc.acknowledge("ann", ["first-buy"])).toEqual([]);
      expect(await svc.acknowledge("ann", ["first-sell"])).toEqual([100]);

      // Re-acknowledging the same id (a retry, a double-submit) never re-graduates it.
      expect(await svc.acknowledge("ann", ["first-sell"])).toEqual([]);
    });

    it("persists which levels have already graduated, across service instances", async () => {
      const { svc, store } = stored([]);
      await svc.acknowledge("ann", ["first-buy", "first-sell"]);
      expect(store.get("ann")?.graduated).toEqual([100]);

      const again = createProgressionService({
        readFills: () => Promise.resolve([]),
        readTags: () => Promise.resolve([]),
        store: new ProgressionStore(join(dir, "progression.json")),
      });
      expect(await again.acknowledge("ann", ["first-sell"])).toEqual([]); // already banked
    });

    it("names both graduated courses when a single acknowledge spans two at once", async () => {
      const { svc, store } = stored([]);
      const graduated = await svc.acknowledge("ann", [
        "first-sell", // graduates 100
        "first-covered-call", // graduates 200
      ]);
      expect([...graduated].sort()).toEqual([100, 200]);
      expect([...(store.get("ann")?.graduated ?? [])].sort()).toEqual([100, 200]);
    });
  });

  it("persists the wheels toggle across service instances", async () => {
    const { svc } = stored([]);
    await svc.view("ann"); // seeds wheels on
    await svc.setWheels("ann", false);
    const again = createProgressionService({
      readFills: () => Promise.resolve([]),
      readTags: () => Promise.resolve([]),
      store: new ProgressionStore(join(dir, "progression.json")),
    });
    expect((await again.view("ann")).wheels).toBe(false);
  });
});

describe("progression service — the engagement track (#567)", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "progression-svc-engagement-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  const messageEntry = (at: string): CompanionMessageLogEntry => ({ opaqueMemberId: "ann", at });

  it("earns nothing when readMessages isn't wired — offline builds stay untouched", async () => {
    const view = await service([]).view("ann");
    expect(view.engagementEarned).toEqual([]);
    expect(view.engagementCelebrating).toEqual([]);
  });

  it("earns nothing from a fill history alone — messaging her is the only way in", async () => {
    const view = await service([journalLine({})]).view("ann");
    expect(view.engagementEarned).toEqual([]);
  });

  it("reads messages by the opaque member id, not the account id (#1171)", async () => {
    // The message log is keyed by `opaqueMemberId(session.email)` — a different id space than
    // the account/participant id. A `view` call that only passes the account id must not see a
    // message recorded under the member's opaque id, and vice versa.
    const svc = createProgressionService({
      readFills: () => Promise.resolve([]),
      readTags: () => Promise.resolve([]),
      readMessages: (id) =>
        Promise.resolve(id === "opaque-abc" ? [messageEntry("2026-09-01T00:00:00.000Z")] : []),
    });
    const byAccountIdOnly = await svc.view("acct-1");
    expect(byAccountIdOnly.engagementEarned).toEqual([]);

    const byOpaqueId = await svc.view("acct-1", "opaque-abc");
    expect(byOpaqueId.engagementEarned.map((m) => m.milestoneId)).toEqual(["first-message"]);
  });

  it("pre-acknowledges a pre-existing message on first view — never a surprise fanfare", async () => {
    const store = new ProgressionStore(join(dir, "progression.json"));
    const svc = createProgressionService({
      readFills: () => Promise.resolve([]),
      readTags: () => Promise.resolve([]),
      readMessages: () => Promise.resolve([messageEntry("2026-08-01T00:00:00.000Z")]),
      store,
      now: () => new Date("2026-08-26T00:00:00.000Z"),
    });
    const view = await svc.view("ann");
    expect(view.engagementEarned.map((m) => m.milestoneId)).toEqual(["first-message"]);
    expect(view.engagementCelebrating).toEqual([]);
    expect(store.get("ann")?.acknowledged).toEqual(["first-message"]);
  });

  it("celebrates a message made AFTER the participant record already exists", async () => {
    const store = new ProgressionStore(join(dir, "progression.json"));
    const before = createProgressionService({
      readFills: () => Promise.resolve([]),
      readTags: () => Promise.resolve([]),
      readMessages: () => Promise.resolve([]),
      store,
      now: () => new Date("2026-08-25T16:00:00.000Z"),
    });
    await before.view("ann"); // seeds the record with nothing earned yet

    const after = createProgressionService({
      readFills: () => Promise.resolve([]),
      readTags: () => Promise.resolve([]),
      readMessages: () => Promise.resolve([messageEntry("2026-08-26T09:00:00.000Z")]),
      store,
      now: () => new Date("2026-08-26T09:00:01.000Z"),
    });
    const view = await after.view("ann");
    expect(view.engagementCelebrating.map((m) => m.milestoneId)).toEqual(["first-message"]);

    await after.acknowledge("ann", ["first-message"]);
    expect((await after.view("ann")).engagementCelebrating).toEqual([]);
  });

  it("acknowledging a trade milestone doesn't bank the engagement one, and vice versa", async () => {
    const store = new ProgressionStore(join(dir, "progression.json"));
    const svc = createProgressionService({
      readFills: () => Promise.resolve([]),
      readTags: () => Promise.resolve([]),
      readMessages: () => Promise.resolve([]),
      store,
      now: () => new Date("2026-08-25T16:00:00.000Z"),
    });
    await svc.view("ann"); // seeds, nothing earned yet on either track

    const withMessage = createProgressionService({
      readFills: () => Promise.resolve([journalLine({ at: "2026-08-25T16:30:00.000Z" })]),
      readTags: () => Promise.resolve([]),
      readMessages: () => Promise.resolve([messageEntry("2026-08-25T16:31:00.000Z")]),
      store,
      now: () => new Date("2026-08-25T16:32:00.000Z"),
    });
    // first-buy is comprehension-gated: pass its check so it reaches `celebrating`, same
    // mechanics the existing "celebrates a gated earn once the check passes" case relies on.
    const check = checkFor("first-buy");
    if (!check) throw new Error("first-buy is gated in the bank this spec relies on");
    await withMessage.submitCheck(
      "ann",
      "first-buy",
      new Map(check.questions.map((q) => [q.id, String(q.answerIndex)])),
    );
    const view = await withMessage.view("ann");
    expect(view.celebrating.map((m) => m.milestoneId)).toEqual(["first-buy"]);
    expect(view.engagementCelebrating.map((m) => m.milestoneId)).toEqual(["first-message"]);

    await withMessage.acknowledge("ann", ["first-buy"]);
    const afterTradeAck = await withMessage.view("ann");
    expect(afterTradeAck.celebrating).toEqual([]);
    expect(afterTradeAck.engagementCelebrating.map((m) => m.milestoneId)).toEqual([
      "first-message",
    ]);
  });

  describe("the message gate on the ladder (#1119, lowered 2026-09-03)", () => {
    let dir = "";
    beforeEach(() => {
      dir = mkdtempSync(join(tmpdir(), "prog-gate-"));
    });
    afterEach(() => {
      rmSync(dir, { recursive: true, force: true });
    });
    const filing = (at: string): FeedbackLogEntry =>
      ({
        uuid: "u",
        opaqueMemberId: "m",
        issueNumber: 1,
        url: "",
        kind: "idea",
        title: "",
        filedAt: at,
      }) as FeedbackLogEntry;
    const gatedService = (
      messages: CompanionMessageLogEntry[],
      journal: TradeActivityRecord[] = [],
      feedback: FeedbackLogEntry[] = [],
    ) =>
      createProgressionService({
        readFills: () => Promise.resolve(journal),
        readTags: () => Promise.resolve([]),
        readMessages: () => Promise.resolve(messages),
        readFeedback: () => Promise.resolve(feedback),
        store: new ProgressionStore(join(dir, "progression.json")),
        now: () => new Date("2026-09-02T00:00:00.000Z"),
      });

    it("shuts every rung for a brand-new member (wheels on, nothing said) and names why", async () => {
      const view = await gatedService([]).view("ann");
      expect(view.wheels).toBe(true);
      expect(view.ladderGate).toBe("first-message");
      expect([...view.unlocked]).toEqual([]);
      expect(view.nextUp).toBeUndefined();
    });

    it("opens the ladder the moment a message is on the log", async () => {
      const view = await gatedService([messageEntry("2026-09-01T00:00:00.000Z")]).view("ann");
      expect(view.ladderGate).toBeUndefined();
      expect([...view.unlocked]).toEqual(["101"]);
      expect(view.nextUp).toBe("101");
    });

    it("also opens for a member who filed real feedback before the message log existed", async () => {
      const view = await gatedService([], [], [filing("2026-08-01T00:00:00.000Z")]).view("ann");
      expect(view.ladderGate).toBeUndefined();
      // The grandfather clause never invents an engagement earn — it only satisfies the gate.
      expect(view.engagementEarned).toEqual([]);
    });

    it("never gates a member with fill history — seeded wheels off", async () => {
      const view = await gatedService([], [journalLine({})]).view("ann");
      expect(view.wheels).toBe(false);
      expect(view.ladderGate).toBeUndefined();
      expect(view.unlocked.has("102")).toBe(true);
    });

    it("never locks away a rung already earned, even while gated", async () => {
      const svc = gatedService([], [journalLine({})]);
      await svc.setWheels("ann", true);
      const view = await svc.view("ann");
      expect(view.ladderGate).toBe("first-message");
      expect([...view.unlocked]).toEqual(["101"]);
    });
  });
});
