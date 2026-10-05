import type { DevelopmentFeedItem } from "../../src/observatory/development-event-feed.js";
import type { FeedbackFeedItem } from "../../src/observatory/feedback-event-feed.js";
import type { MemberMilestone } from "../../src/observatory/milestone-event-feed.js";
import { wireJsonView } from "../../src/observatory/wire-json-view.js";

/** The Wire's JSON twin: formatted figures, provenance kept, pseudonymous pulse, honest gates. */

const trade = (over: Record<string, unknown> = {}) => ({
  participantId: "sauron",
  participantName: "Sauron",
  kind: "bot" as const,
  symbol: "NVDA",
  side: "buy" as const,
  quantity: 25,
  price: 176.42,
  at: "2026-08-28T14:00:00Z",
  reconstructed: false,
  orderId: "ord-1",
  ...over,
});

const filing = (over: Partial<FeedbackFeedItem> = {}): FeedbackFeedItem => ({
  issueNumber: 700,
  filerId: "m-1",
  url: "https://github.com/ejclark/skynet-capital/issues/700",
  kind: "idea",
  title: "A better wire",
  filedAt: "2026-08-27T10:00:00Z",
  ...over,
});

const merged = (over: Partial<DevelopmentFeedItem> = {}): DevelopmentFeedItem => ({
  pullRequest: 4272,
  title: "feat(activity): development events for merged PRs",
  author: "claude",
  url: "https://github.com/ejclark/skynet-capital/pull/4272",
  mergedAt: "2026-10-02T12:00:00Z",
  ...over,
});

const earned = (over: Partial<MemberMilestone> = {}): MemberMilestone => ({
  participantId: "eric",
  participantName: "Eric",
  milestoneId: "first-buy",
  orderId: "ord-1",
  title: "Buy your first stock",
  points: 25,
  at: "2026-10-01T14:00:00Z",
  ...over,
});

describe("wireJsonView", () => {
  it("formats the trade feed and keeps reconstructed provenance", () => {
    const view = wireJsonView(
      [trade(), trade({ price: undefined, reconstructed: true, side: "sell" })],
      [],
      [],
      true,
    );
    expect(view.trades[0]).toMatchObject({ side: "buy", price: "$176.42", who: "Sauron" });
    expect(view.trades[1]).toMatchObject({ price: "—", reconstructed: true });
  });

  it("tones booked P&L by its sign, formatted signed", () => {
    const view = wireJsonView(
      [],
      [
        { participantId: "a", participantName: "A", kind: "bot", realizedPl: 1998 },
        { participantId: "b", participantName: "B", kind: "human", realizedPl: -250 },
      ],
      [],
      true,
    );
    expect(view.pnl[0]).toMatchObject({ realized: "+$1,998", tone: "pos" });
    expect(view.pnl[1]).toMatchObject({ realized: "-$250", tone: "neg" });
  });

  it("sorts the pulse newest first and carries status labels only when known", () => {
    const view = wireJsonView(
      [],
      [],
      [filing(), filing({ issueNumber: 701, filedAt: "2026-08-28T10:00:00Z", status: "shipped" })],
      true,
    );
    expect(view.feedback[0]).toMatchObject({ status: "Shipped", statusKey: "shipped" });
    expect(view.feedback[1]?.status).toBeUndefined();
    expect(view.feedback[0]?.meta.startsWith("#701")).toBe(true);
  });

  it("badges a filing whose kind the app doesn't recognize rather than dropping it", () => {
    const { kind: _dropped, ...kindless } = filing();
    const view = wireJsonView([], [], [kindless], true);
    expect(view.feedback).toHaveLength(1);
    expect(view.feedback[0]?.icon).toBe("📄");
    expect(view.feedback[0]?.kindLabel).toBe("Filing");
  });

  it("rides the icon with its word, so a row's kind never depends on one glyph (#784 slice 3)", () => {
    const view = wireJsonView([], [], [filing({ kind: "bug" }), filing({ kind: "feature" })], true);
    expect(view.feedback.map((f) => f.kindLabel)).toEqual(["Bug", "Feature"]);
  });

  it("ships the raw instant beside the formatted one for both kinds, so one feed can interleave them", () => {
    const view = wireJsonView([trade()], [], [filing()], true);
    expect(view.trades[0]?.at).toBe("2026-08-28T14:00:00Z");
    expect(view.feedback[0]?.at).toBe("2026-08-27T10:00:00Z");
    // `when` stays the formatted phrase — the raw field is an addition, not a replacement.
    expect(view.trades[0]?.when).not.toBe(view.trades[0]?.at);
  });

  it("says when the feedback lane is unwired — the gate rides the payload", () => {
    expect(wireJsonView([], [], [], false).feedbackEnabled).toBe(false);
  });

  it("formats a merged pull request as the feed's third kind, newest merge first (#784 slice 4)", () => {
    const view = wireJsonView([], [], [], true, [
      merged(),
      merged({ pullRequest: 4273, mergedAt: "2026-10-03T12:00:00Z" }),
    ]);
    expect(view.development[0]).toMatchObject({
      pullRequest: 4273,
      kindLabel: "Merged",
      at: "2026-10-03T12:00:00Z",
    });
    expect(view.development[0]?.meta.startsWith("#4273")).toBe(true);
  });

  it("says 'Merged', not 'Shipped' — a filing row already wears that word as a status", () => {
    const view = wireJsonView([], [], [filing({ status: "shipped" })], true, [merged()]);
    expect(view.development[0]?.kindLabel).not.toBe(view.feedback[0]?.status);
  });

  it("omits the author rather than naming someone GitHub did not", () => {
    const view = wireJsonView([], [], [], true, [merged({ author: undefined })]);
    expect(view.development[0]).not.toHaveProperty("author");
  });

  it("tells an unwired development read apart from a league that has merged nothing", () => {
    expect(wireJsonView([], [], [], true).developmentEnabled).toBe(false);
    expect(wireJsonView([], [], [], true, []).developmentEnabled).toBe(true);
  });

  it("formats a member's earn as the feed's fourth kind, newest first, naming who (#784 slice 5)", () => {
    const view = wireJsonView(
      [],
      [],
      [],
      true,
      [],
      [
        earned(),
        earned({
          milestoneId: "first-sell",
          title: "Sell some shares",
          at: "2026-10-02T14:00:00Z",
        }),
      ],
    );
    expect(view.milestones[0]).toMatchObject({
      kindLabel: "Earned",
      who: "Eric",
      whoId: "eric",
      title: "Sell some shares",
      at: "2026-10-02T14:00:00Z",
    });
  });

  it("puts points in the meta only when the course score counts them", () => {
    const view = wireJsonView(
      [],
      [],
      [],
      true,
      [],
      [earned(), earned({ milestoneId: "first-realized-profit", points: undefined })],
    );
    const byId = new Map(view.milestones.map((m) => [m.key, m]));
    expect(byId.get("eric:first-buy")?.meta.startsWith("+25 pts")).toBe(true);
    expect(byId.get("eric:first-realized-profit")?.meta).not.toMatch(/pts/);
    expect(byId.get("eric:first-realized-profit")).not.toHaveProperty("points");
  });

  it("wears a leading word no other kind's row or pill wears", () => {
    const view = wireJsonView(
      [],
      [],
      [filing({ status: "shipped" })],
      true,
      [merged()],
      [earned()],
    );
    const word = view.milestones[0]?.kindLabel;
    expect([view.development[0]?.kindLabel, view.feedback[0]?.status]).not.toContain(word);
  });

  it("tells unwired milestone sources apart from a league where nobody has earned anything", () => {
    expect(wireJsonView([], [], [], true).milestonesEnabled).toBe(false);
    expect(wireJsonView([], [], [], true, undefined, []).milestonesEnabled).toBe(true);
  });
});
