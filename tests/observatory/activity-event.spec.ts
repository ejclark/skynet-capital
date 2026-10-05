import {
  activityEventFromAuditRecord,
  activityEventFromBotOrder,
  activityEventFromFeedbackEntry,
  activityEventFromMergedPullRequest,
  activityEventFromTradeRecord,
} from "../../src/observatory/activity-event.js";
import type { TradeActivityRecord } from "../../src/observatory/activity-record.js";
import type { OrderAuditRecord } from "../../src/server/order-audit-log.js";

const tradeRecord = (overrides: Partial<TradeActivityRecord> = {}): TradeActivityRecord => ({
  orderId: "ord-1",
  participantId: "sauron",
  symbol: "NVDA",
  side: "buy",
  quantity: 10,
  filledQuantity: 10,
  price: 120,
  status: "filled",
  at: "2026-08-19T14:30:00.000Z",
  source: "stream",
  ...overrides,
});

const auditRecord = (overrides: Partial<OrderAuditRecord> = {}): OrderAuditRecord => ({
  participantId: "sauron",
  orderId: "ord-1",
  at: "2026-08-19T14:29:00.000Z",
  ...overrides,
});

describe("activityEventFromTradeRecord", () => {
  it("maps a filled line to order.filled, public visibility, success outcome", () => {
    const event = activityEventFromTradeRecord(tradeRecord());
    expect(event).toMatchObject({
      eventType: "order.filled",
      actor: { participantId: "sauron" },
      target: { kind: "order", id: "ord-1" },
      correlationId: "ord-1",
      source: "stream",
      outcome: "success",
      visibility: "public",
      payload: { symbol: "NVDA", side: "buy", quantity: 10, filledQuantity: 10, price: 120 },
    });
  });

  it("maps every other status to the coarse order.updated (slice 1: no new taxonomy yet)", () => {
    expect(
      activityEventFromTradeRecord(tradeRecord({ status: "partially_filled" })).eventType,
    ).toBe("order.updated");
    expect(activityEventFromTradeRecord(tradeRecord({ status: "canceled" })).eventType).toBe(
      "order.updated",
    );
  });

  it("never invents a price the record doesn't carry", () => {
    const { price, ...withoutPrice } = tradeRecord();
    void price;
    expect(
      activityEventFromTradeRecord(withoutPrice as TradeActivityRecord).payload,
    ).not.toHaveProperty("price");
  });

  it("gives two lines of the same order distinct, stable ids", () => {
    const filled = activityEventFromTradeRecord(tradeRecord());
    const partial = activityEventFromTradeRecord(
      tradeRecord({
        status: "partially_filled",
        filledQuantity: 4,
        at: "2026-08-19T14:00:00.000Z",
      }),
    );
    expect(filled.id).not.toBe(partial.id);
    expect(activityEventFromTradeRecord(tradeRecord()).id).toBe(filled.id);
  });
});

describe("activityEventFromAuditRecord", () => {
  it("maps a submission line to order.submitted, owner-only visibility", () => {
    const event = activityEventFromAuditRecord(
      auditRecord({ ownerEmail: "eric@example.com", symbol: "NVDA", side: "buy", code: "101" }),
    );
    expect(event).toMatchObject({
      eventType: "order.submitted",
      actor: { participantId: "sauron", email: "eric@example.com" },
      target: { kind: "order", id: "ord-1" },
      correlationId: "ord-1",
      source: "app",
      outcome: "success",
      visibility: "owner-only",
      payload: { symbol: "NVDA", side: "buy", code: "101" },
    });
  });

  it("omits actor.email for a bot's own autonomous submission (no ownerEmail)", () => {
    expect(activityEventFromAuditRecord(auditRecord()).actor).not.toHaveProperty("email");
  });

  it("shares its correlationId with the matching trade-record event, chaining the two", () => {
    const submitted = activityEventFromAuditRecord(auditRecord());
    const filled = activityEventFromTradeRecord(tradeRecord());
    expect(submitted.correlationId).toBe(filled.correlationId);
  });
});

describe("activityEventFromBotOrder", () => {
  it("maps a bot's accepted order to order.submitted, owner-only, actor.kind bot (#1211 slice 2)", () => {
    const event = activityEventFromBotOrder({
      participantId: "sauron",
      orderId: "ord-9",
      symbol: "NVDA",
      side: "buy",
      quantity: 5,
      at: "2026-09-04T14:30:00.000Z",
    });
    expect(event).toMatchObject({
      eventType: "order.submitted",
      actor: { participantId: "sauron", kind: "bot" },
      target: { kind: "order", id: "ord-9" },
      correlationId: "ord-9",
      source: "bot",
      outcome: "success",
      visibility: "owner-only",
      payload: { symbol: "NVDA", side: "buy", quantity: 5 },
    });
    expect(event.actor).not.toHaveProperty("email");
  });

  it("shares its correlationId with the matching trade-record event, chaining the two", () => {
    const submitted = activityEventFromBotOrder({
      participantId: "sauron",
      orderId: "ord-1",
      symbol: "NVDA",
      side: "buy",
      quantity: 10,
      at: "2026-08-19T14:29:00.000Z",
    });
    const filled = activityEventFromTradeRecord(tradeRecord());
    expect(submitted.correlationId).toBe(filled.correlationId);
  });
});

describe("activityEventFromMergedPullRequest", () => {
  const merge = {
    number: 4272,
    title: "feat(activity): development events for merged PRs",
    author: "claude",
    url: "https://github.com/ejclark/skynet-capital/pull/4272",
    mergedAt: "2026-10-02T12:00:00.000Z",
  };

  it("maps a merged PR to development.pr-merged, public, attributed to the system (#784 slice 4)", () => {
    expect(activityEventFromMergedPullRequest(merge)).toMatchObject({
      eventType: "development.pr-merged",
      actor: { participantId: "system", kind: "system" },
      target: { kind: "development", id: "4272" },
      at: "2026-10-02T12:00:00.000Z",
      correlationId: "development:4272",
      source: "github",
      outcome: "success",
      visibility: "public",
      payload: { pullRequest: 4272, title: merge.title, author: "claude", url: merge.url },
    });
  });

  it("times the event at the merge GitHub reported, not at the poll — a merge HAS a timestamp", () => {
    expect(activityEventFromMergedPullRequest(merge).at).toBe(merge.mergedAt);
  });

  it("keys identity on the PR number alone, so re-reading the same merge cannot publish it twice", () => {
    const again = activityEventFromMergedPullRequest({
      ...merge,
      // The same merge as GitHub might render it on a later read — a different string, one merge.
      mergedAt: "2026-10-02T12:00:00Z",
      title: merge.title,
    });

    expect(again.id).toBe(activityEventFromMergedPullRequest(merge).id);
  });

  it("omits the author rather than naming someone GitHub did not", () => {
    const event = activityEventFromMergedPullRequest({ ...merge, author: undefined });

    expect(event.payload).not.toHaveProperty("author");
  });

  it("never collides with a filing on the same number — an issue and a PR are different things", () => {
    const filing = activityEventFromFeedbackEntry({
      uuid: "u1",
      issueNumber: 4272,
      opaqueMemberId: "m1",
      kind: "idea",
      title: "a filing that happens to share the number",
      url: "https://github.com/ejclark/skynet-capital/issues/4272",
      filedAt: "2026-10-01T00:00:00.000Z",
    });

    expect(activityEventFromMergedPullRequest(merge).id).not.toBe(filing.id);
    expect(activityEventFromMergedPullRequest(merge).target.kind).not.toBe(filing.target.kind);
  });
});
