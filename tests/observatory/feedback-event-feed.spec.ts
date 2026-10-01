import type { ActivityEvent } from "../../src/observatory/activity-event.js";
import {
  activityEventFromFeedbackEntry,
  activityEventFromFeedbackStatus,
  activityEventFromTradeRecord,
} from "../../src/observatory/activity-event.js";
import type { TradeActivityRecord } from "../../src/observatory/activity-store.js";
import {
  collapseFeedbackEvents,
  feedbackFilingFromEvent,
  latestStatusByIssue,
  mergeFeedbackLogIntoEvents,
  mergeFeedbackStatusesIntoEvents,
} from "../../src/observatory/feedback-event-feed.js";
import type { FeedbackLogEntry } from "../../src/server/feedback-log.js";

/**
 * The read half of feedback-as-an-event (#784 slice 2): what a filing event says, status folded in
 * as a facet of the same schema, and the union that keeps pre-bus filings on the pulse.
 *
 * The honesty bar these specs hold: a filing is never invented from a half-read payload, a status
 * is never asserted for a filing nobody observed, and a real filing is never dropped off the
 * league's record for a cosmetic reason.
 */

const entry = (overrides: Partial<FeedbackLogEntry> = {}): FeedbackLogEntry => ({
  uuid: "u-1",
  opaqueMemberId: "m-1",
  issueNumber: 700,
  url: "https://github.com/ejclark/skynet-capital/issues/700",
  kind: "idea",
  title: "A better wire",
  filedAt: "2026-08-27T10:00:00.000Z",
  ...overrides,
});

const filed = (overrides: Partial<FeedbackLogEntry> = {}): ActivityEvent =>
  activityEventFromFeedbackEntry(entry(overrides));

/** An event with a deliberately broken payload — what a future emitter could publish by mistake. */
const malformed = (payload: Record<string, unknown>): ActivityEvent => ({
  ...filed(),
  payload,
});

const tradeRecord: TradeActivityRecord = {
  orderId: "ord-1",
  participantId: "sauron",
  symbol: "NVDA",
  side: "buy",
  quantity: 10,
  filledQuantity: 10,
  status: "filled",
  at: "2026-08-19T14:30:00.000Z",
  source: "stream",
};

describe("feedbackFilingFromEvent", () => {
  it("decodes a filing out of the envelope", () => {
    expect(feedbackFilingFromEvent(filed())).toEqual({
      issueNumber: 700,
      filerId: "m-1",
      kind: "idea",
      title: "A better wire",
      url: "https://github.com/ejclark/skynet-capital/issues/700",
      filedAt: "2026-08-27T10:00:00.000Z",
    });
  });

  it("is null for an event of another kind — the common answer on a mixed bus", () => {
    expect(feedbackFilingFromEvent(activityEventFromTradeRecord(tradeRecord))).toBeNull();
    expect(
      feedbackFilingFromEvent(activityEventFromFeedbackStatus(700, "shipped", "x")),
    ).toBeNull();
  });

  it("drops a filing with no title or no url — the row could not say what it is about", () => {
    expect(feedbackFilingFromEvent(malformed({ title: "", url: "u" }))).toBeNull();
    expect(feedbackFilingFromEvent(malformed({ title: "t" }))).toBeNull();
  });

  it("keeps a filing whose kind is unrecognized, with the kind simply absent", () => {
    const decoded = feedbackFilingFromEvent(malformed({ title: "t", url: "u", kind: "wishlist" }));
    expect(decoded).toMatchObject({ title: "t", issueNumber: 700 });
    expect(decoded?.kind).toBeUndefined();
  });

  it("drops an owner-only line — the pulse is the public tier only", () => {
    expect(feedbackFilingFromEvent({ ...filed(), visibility: "owner-only" })).toBeNull();
  });
});

describe("collapseFeedbackEvents", () => {
  it("renders one row per filing, newest filing first", () => {
    const rows = collapseFeedbackEvents([
      filed(),
      filed({ issueNumber: 701, filedAt: "2026-08-28T10:00:00.000Z" }),
    ]);
    expect(rows.map((r) => r.issueNumber)).toEqual([701, 700]);
  });

  it("folds the latest observed status onto its filing", () => {
    const rows = collapseFeedbackEvents([
      filed(),
      activityEventFromFeedbackStatus(700, "next-slice", "2026-08-28T10:00:00.000Z"),
      activityEventFromFeedbackStatus(700, "shipped", "2026-08-29T10:00:00.000Z"),
    ]);
    expect(rows[0]?.status).toBe("shipped");
  });

  it("leaves status absent when nothing observed one — never asserts a state on the filing's behalf", () => {
    expect(collapseFeedbackEvents([filed()])[0]?.status).toBeUndefined();
  });

  it("never renders a row from a status observation alone — it has no title and no url", () => {
    expect(collapseFeedbackEvents([activityEventFromFeedbackStatus(700, "shipped", "x")])).toEqual(
      [],
    );
  });

  it("ignores trade events, so a caller can hand it the whole bus", () => {
    const rows = collapseFeedbackEvents([activityEventFromTradeRecord(tradeRecord), filed()]);
    expect(rows).toHaveLength(1);
  });
});

describe("latestStatusByIssue", () => {
  it("keeps the latest observation per filing", () => {
    const latest = latestStatusByIssue([
      activityEventFromFeedbackStatus(700, "shipped", "2026-08-29T10:00:00.000Z"),
      activityEventFromFeedbackStatus(700, "next-slice", "2026-08-28T10:00:00.000Z"),
      activityEventFromFeedbackStatus(701, "not-built", "2026-08-28T10:00:00.000Z"),
    ]);
    expect([...latest]).toEqual([
      [700, "shipped"],
      [701, "not-built"],
    ]);
  });

  it("drops a status the app does not define rather than trusting the payload", () => {
    const bogus: ActivityEvent = {
      ...activityEventFromFeedbackStatus(700, "shipped", "x"),
      payload: { issueNumber: 700, status: "on-fire" },
    };
    expect(latestStatusByIssue([bogus]).size).toBe(0);
  });
});

describe("mergeFeedbackLogIntoEvents", () => {
  it("keeps a pre-bus filing on the pulse — the bus alone would have dropped it", () => {
    const rows = collapseFeedbackEvents(mergeFeedbackLogIntoEvents([], [entry()]));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.title).toBe("A better wire");
  });

  it("cannot double-count a filing the bus already holds — the event id is deterministic", () => {
    const merged = mergeFeedbackLogIntoEvents([filed()], [entry()]);
    expect(merged).toHaveLength(1);
    expect(collapseFeedbackEvents(merged)).toHaveLength(1);
  });
});

describe("mergeFeedbackStatusesIntoEvents", () => {
  it("lets a just-polled status reach this render rather than the next one", () => {
    const merged = mergeFeedbackStatusesIntoEvents(
      [filed(), activityEventFromFeedbackStatus(700, "open", "2026-08-27T11:00:00.000Z")],
      new Map([[700, "shipped" as const]]),
      "2026-08-30T10:00:00.000Z",
    );
    expect(collapseFeedbackEvents(merged)[0]?.status).toBe("shipped");
  });
});
