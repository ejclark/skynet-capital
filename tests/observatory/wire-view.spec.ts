import type { WirePnlRow, WireTradeRow } from "../../src/observatory/wire-data.js";
import { renderWireBody } from "../../src/observatory/wire-view.js";
import type { FeedbackLogEntry } from "../../src/server/feedback-log.js";
import type { FeedbackStatus } from "../../src/server/feedback-status.js";

const NAV = { active: "wire" as const, canAdd: false, authed: true };

const trade = (overrides: Partial<WireTradeRow> = {}): WireTradeRow => ({
  participantId: "sauron",
  participantName: "Sauron",
  kind: "bot",
  symbol: "NVDA",
  side: "buy",
  quantity: 10,
  price: 120,
  at: "2026-08-19T14:30:00.000Z",
  reconstructed: false,
  ...overrides,
});

const pnl = (overrides: Partial<WirePnlRow> = {}): WirePnlRow => ({
  participantId: "sauron",
  participantName: "Sauron",
  kind: "bot",
  realizedPl: 250,
  ...overrides,
});

const feedback = (overrides: Partial<FeedbackLogEntry> = {}): FeedbackLogEntry => ({
  uuid: "u1",
  opaqueMemberId: "m1",
  issueNumber: 42,
  url: "https://github.com/ejclark/skynet-capital/issues/42",
  kind: "feature",
  title: "Add a wire dashboard",
  filedAt: "2026-08-24T00:00:00.000Z",
  ...overrides,
});

describe("renderWireBody", () => {
  it("rides inside the shared app shell — the drawer nav stays visible", () => {
    const html = renderWireBody({
      nav: NAV,
      trades: [],
      pnl: [],
      feedback: [],
      feedbackEnabled: true,
    });
    expect(html).toContain('id="drawer"');
    expect(html).toContain("The Wire");
  });

  it("renders a trade row with side, symbol, and the trading participant's name", () => {
    const html = renderWireBody({
      nav: NAV,
      trades: [trade()],
      pnl: [],
      feedback: [],
      feedbackEnabled: true,
    });
    expect(html).toContain("BUY");
    expect(html).toContain("NVDA");
    expect(html).toContain("Sauron");
  });

  it("badges a reconstructed row, never a live-captured one", () => {
    const live = renderWireBody({
      nav: NAV,
      trades: [trade({ reconstructed: false })],
      pnl: [],
      feedback: [],
      feedbackEnabled: true,
    });
    expect(live).not.toContain("reconstructed");

    const recovered = renderWireBody({
      nav: NAV,
      trades: [trade({ reconstructed: true })],
      pnl: [],
      feedback: [],
      feedbackEnabled: true,
    });
    expect(recovered).toContain("reconstructed");
  });

  it("shows an honest empty state with no trades, rather than a blank column", () => {
    const html = renderWireBody({
      nav: NAV,
      trades: [],
      pnl: [],
      feedback: [],
      feedbackEnabled: true,
    });
    expect(html).toContain("No trades on the wire yet");
  });

  it("renders booked P&L with a signed figure", () => {
    const html = renderWireBody({
      nav: NAV,
      trades: [],
      pnl: [pnl({ realizedPl: 250 })],
      feedback: [],
      feedbackEnabled: true,
    });
    expect(html).toContain("+$250");
  });

  it("renders a filed feedback item and its live status when known", () => {
    const statuses = new Map<number, FeedbackStatus>([[42, "needs-eric"]]);
    const html = renderWireBody({
      nav: NAV,
      trades: [],
      pnl: [],
      feedback: [feedback()],
      feedbackStatuses: statuses,
      feedbackEnabled: true,
    });
    expect(html).toContain("Add a wire dashboard");
    expect(html).toContain("Needs Eric's call");
  });

  it("says feedback is off rather than rendering an empty pulse when it isn't wired", () => {
    const html = renderWireBody({
      nav: NAV,
      trades: [],
      pnl: [],
      feedback: [],
      feedbackEnabled: false,
    });
    expect(html).toContain("isn't switched on yet");
  });

  it("never resolves a filer's identity beyond the issue link — attribution stays as pseudonymous as /feedback's own list", () => {
    const html = renderWireBody({
      nav: NAV,
      trades: [],
      pnl: [],
      feedback: [feedback()],
      feedbackEnabled: true,
    });
    expect(html).not.toContain("opaqueMemberId");
    expect(html).not.toContain("m1<");
  });

  it("escapes an untrusted symbol/title rather than injecting raw HTML", () => {
    const html = renderWireBody({
      nav: NAV,
      trades: [trade({ symbol: "<img src=x>" })],
      pnl: [],
      feedback: [feedback({ title: "<script>alert(1)</script>" })],
      feedbackEnabled: true,
    });
    expect(html).not.toContain("<img src=x>");
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  it("guides a member toward the GitHub onramp, teaching the @claude mention as the one thing to know", () => {
    const html = renderWireBody({
      nav: NAV,
      trades: [],
      pnl: [],
      feedback: [],
      feedbackEnabled: true,
    });
    expect(html).toContain("github.com/join");
    expect(html).toContain("@claude");
  });
});
