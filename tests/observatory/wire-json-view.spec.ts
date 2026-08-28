import { wireJsonView } from "../../src/observatory/wire-json-view.js";
import type { FeedbackLogEntry } from "../../src/server/feedback-log.js";

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
  ...over,
});

const filing = (over: Partial<FeedbackLogEntry> = {}): FeedbackLogEntry =>
  ({
    uuid: "u-1",
    opaqueMemberId: "m-1",
    issueNumber: 700,
    url: "https://github.com/ejclark/skynet-capital/issues/700",
    kind: "idea",
    title: "A better wire",
    filedAt: "2026-08-27T10:00:00Z",
    ...over,
  }) as FeedbackLogEntry;

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
      [filing(), filing({ uuid: "u-2", issueNumber: 701, filedAt: "2026-08-28T10:00:00Z" })],
      true,
      new Map([[701, "shipped"]]),
    );
    expect(view.feedback[0]).toMatchObject({ status: "Shipped", statusKey: "shipped" });
    expect(view.feedback[1]?.status).toBeUndefined();
    expect(view.feedback[0]?.meta.startsWith("#701")).toBe(true);
  });

  it("says when the feedback lane is unwired — the gate rides the payload", () => {
    expect(wireJsonView([], [], [], false).feedbackEnabled).toBe(false);
  });
});
