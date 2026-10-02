import type { FeedbackFeedItem } from "../../src/observatory/feedback-event-feed.js";
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
});
