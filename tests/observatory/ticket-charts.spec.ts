import { payoffSvg, premiumByStrikeSvg, windowChain } from "../../src/observatory/ticket-charts.js";
import { previewOptionOrder } from "../../src/trading/option-ticket.js";

const chain = Array.from({ length: 20 }, (_, i) => ({
  occSymbol: `MSFT260918P00${400 + i * 5}000`,
  strike: 400 + i * 5,
  closePrice: 5 + i,
}));

describe("windowChain", () => {
  it("windows around the selected strike so the chart stays readable", () => {
    const rows = windowChain(chain, 450, undefined, 9);
    expect(rows).toHaveLength(9);
    expect(rows.map((r) => r.strike)).toContain(450);
  });

  it("anchors on the spot when no strike is chosen, and passes short chains through", () => {
    expect(windowChain(chain.slice(0, 3), undefined, undefined, 9)).toHaveLength(3);
    const rows = windowChain(chain, undefined, 402, 9);
    expect(rows[0]?.strike).toBe(400);
  });
});

describe("premiumByStrikeSvg", () => {
  it("renders each strike as a LINK so picking works with JavaScript off", () => {
    const svg = premiumByStrikeSvg(chain.slice(0, 5), {
      selectedStrike: 410,
      spot: 412,
      hrefFor: (strike) => `/trade?strike=${strike}`,
    });
    expect(svg).toContain('href="/trade?strike=405"');
    expect(svg).toContain("NOW $412.00");
    expect(svg).toContain('fill="var(--accent)"'); // the selected bar
  });

  it("says honestly when no premiums are known instead of drawing an empty chart", () => {
    const svg = premiumByStrikeSvg([{ occSymbol: "X", strike: 400 }], {
      hrefFor: () => "/trade",
    });
    expect(svg).toContain("No premium data");
  });
});

describe("payoffSvg", () => {
  const preview = previewOptionOrder(
    {
      code: "201",
      underlying: "MSFT",
      contracts: 2,
      strike: 420,
      expiration: "2026-09-18",
      orderType: "limit",
      limitPrice: 10.7,
    },
    { cash: 100_000, positions: [], tradingEnabled: true, isSelf: true },
  );

  it("draws the payoff with the breakeven marked in dollars", () => {
    const svg = payoffSvg(preview);
    expect(svg).toContain("$409.30"); // strike − premium
    expect(svg).toContain("stock price at expiration");
    expect(svg).toContain('stroke="var(--neg)"'); // losses are visible, not implied
  });

  it("renders nothing rather than a wrong chart when the inputs can't price it", () => {
    expect(payoffSvg({ ...preview, estPremium: undefined } as never)).toBe("");
  });
});
