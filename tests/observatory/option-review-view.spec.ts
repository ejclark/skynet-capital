import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import { renderOptionReviewBody } from "../../src/observatory/trade-review-view.js";
import { previewOptionClose, previewOptionOrder } from "../../src/trading/option-ticket.js";

const ann: ParticipantSnapshot = {
  id: "ann",
  displayName: "Ann",
  kind: "human",
  cash: 100_000,
  equity: 100_000,
  positions: [],
  activity: [],
};

const okPreview = () =>
  previewOptionOrder(
    {
      code: "201",
      underlying: "MSFT",
      contracts: 2,
      strike: 420,
      expiration: "2026-09-18",
      orderType: "limit",
      limitPrice: 10.7,
    },
    { cash: 100_000, positions: [], tradingEnabled: true, isSelf: true, underlyingPrice: 428.6 },
  );

describe("the options review screen", () => {
  it("restates the order in broker grammar with the honest dollar consequences", () => {
    const html = renderOptionReviewBody(ann, okPreview(), { isSelf: true });
    expect(html).toContain("SELL 2 × MSFT $420 PUT · 18 SEP 26");
    expect(html).toContain("limit $10.70/sh · day");
    expect(html).toContain("Cash set aside (the “secured”)");
    expect(html).toContain("$84,000");
    expect(html).toContain("Max loss");
    expect(html).toContain("Breakeven at expiration");
    expect(html).toContain("At expiration · P/L vs stock price"); // the payoff drawing
  });

  it("sends nothing itself — the confirm form carries confirm=1 and the full order", () => {
    const html = renderOptionReviewBody(ann, okPreview(), { isSelf: true });
    expect(html).toContain('name="confirm" value="1"');
    expect(html).toContain('name="play" value="201"');
    expect(html).toContain('name="strike" value="420"');
    expect(html).toContain('name="limit" value="10.7"');
    expect(html).toContain("Nothing has been sent yet");
  });

  it("a refused order renders its reasons and offers only the way back", () => {
    const refused = previewOptionOrder(
      {
        code: "201",
        underlying: "MSFT",
        contracts: 2,
        strike: 420,
        expiration: "2026-09-18",
        orderType: "limit",
        limitPrice: 10.7,
      },
      { cash: 1_000, positions: [], tradingEnabled: true, isSelf: true },
    );
    const html = renderOptionReviewBody(ann, refused, { isSelf: true });
    expect(html).toContain("This order can't be sent");
    expect(html).toContain("Cash-secured means the cash is there");
    expect(html).not.toContain('name="confirm"');
  });

  it("a close review posts the close fields, not an open", () => {
    const close = previewOptionClose("MSFT260918P00420000", {
      cash: 0,
      positions: [
        { symbol: "MSFT260918P00420000", quantity: -2, avgPrice: 1_070, marketValue: -2_140 },
      ],
      tradingEnabled: true,
      isSelf: true,
    });
    const html = renderOptionReviewBody(ann, close, { isSelf: true });
    expect(html).toContain("BUY 2 × MSFT $420 PUT");
    expect(html).toContain('name="close" value="MSFT260918P00420000"');
  });
});
