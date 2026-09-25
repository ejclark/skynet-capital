import { positionGuidance } from "../../src/options/position-guidance.js";
import { guidanceToMarkdown } from "../../src/options/position-guidance-markdown.js";
import type {
  GuidanceInputs,
  GuidanceStake,
  OpenCall,
  PulseItem,
} from "../../src/options/position-guidance-types.js";
import { inputs, NOW, quoteAt } from "./position-guidance-fixture.js";

/**
 * CALLS YOU'VE SOLD (#3729, the deferred "Manage" lever): one call per open covered call, first
 * matching rule wins. The fixture is the frozen CRWV world — spot $80, 80% IV, an estimated
 * earnings window of Nov 9–16 — so every quote below is our own Black-Scholes price and the
 * arithmetic is checkable by hand.
 */

const STAKE: GuidanceStake = { shares: 400, costBasis: 70, cash: 0, goal: "income" };

/** An open call priced off the fixture's own chain; `premium` is what was taken in, per share. */
function open(expiration: string, strike: number, premium: number, over: Partial<OpenCall> = {}) {
  const q = quoteAt(expiration, strike, "call");
  return {
    occ: `CRWV${expiration.slice(2).replaceAll("-", "")}C${String(strike * 1000).padStart(8, "0")}`,
    strike,
    expiration,
    contracts: 1,
    premium,
    ...(q.bid !== undefined ? { bid: q.bid } : {}),
    ...(q.ask !== undefined ? { ask: q.ask } : {}),
    ...over,
  };
}

function manageOf(openCalls: OpenCall[], over: Partial<GuidanceInputs> = {}, stake = STAKE) {
  return positionGuidance(inputs({ stake: { ...stake, openCalls }, ...over })).manage;
}

describe("calls you've sold — no honest answer", () => {
  it("says so when there's no live price to buy it back at", () => {
    const [m] = manageOf([open("2026-10-16", 100, 2, { ask: undefined })]);
    expect(m?.call).toBe("NO ANSWER");
    expect(m?.reasons[0]?.text).toContain("No live price to buy it back at");
  });

  it("says so when the stock price couldn't be verified", () => {
    const pulse: PulseItem[] = [
      { id: "spot", source: "IEX", asOf: NOW, status: "stale", note: "20 min old" },
    ];
    const [m] = manageOf([open("2026-10-16", 100, 2)], { pulse });
    expect(m?.call).toBe("NO ANSWER");
    expect(m?.reasons[0]?.text).toContain("couldn't be verified");
  });
});

describe("calls you've sold — open through the earnings report", () => {
  it("rolls into an expiry that ends before the report, never below the current strike", () => {
    const [m] = manageOf([open("2026-11-13", 95, 4)]);
    expect(m?.call).toBe("ROLL");
    expect(m?.reasons[0]?.text).toContain("still open through the earnings report");
    expect((m?.rollTo?.expiration ?? "9999-12-31") < "2026-11-09").toBe(true);
    expect(m?.rollTo?.strike).toBeGreaterThanOrEqual(95);
  });

  it("prices the roll as the new call's bid less the old call's ask", () => {
    const c = open("2026-11-13", 95, 4);
    const [m] = manageOf([c]);
    const target = quoteAt(m?.rollTo?.expiration ?? "", m?.rollTo?.strike ?? 0, "call");
    expect(m?.rollTo?.net).toBeCloseTo((target.bid ?? 0) - (c.ask ?? 0), 6);
  });

  it("doesn't fight an exit — exercise is the exit, and it says to buy back before selling", () => {
    const [m] = manageOf([open("2026-11-13", 95, 4)], {}, { ...STAKE, goal: "exit" });
    expect(m?.call).toBe("KEEP");
    expect(m?.reasons[0]?.text).toContain("the exit you asked for");
    expect(m?.reasons[1]?.text).toContain("buy this call back first");
    expect(m?.until?.why).not.toContain("half the premium");
  });

  it("treats an expiry after the hold-or-sell date like one across the report", () => {
    // Nov 6 is past the decision date (Nov 2) the expiry strip marks unusable for new calls.
    const [m] = manageOf([open("2026-11-06", 95, 4)]);
    expect(["ROLL", "BUY BACK"]).toContain(m?.call);
    expect(m?.reasons[0]?.text).toContain("your hold-or-sell date");
  });
});

describe("calls you've sold — in the money with a week or less left", () => {
  it("lets it go when the member wants out", () => {
    const [m] = manageOf([open("2026-10-02", 75, 3)], {}, { ...STAKE, goal: "exit" });
    expect(m?.call).toBe("LET IT GO");
    expect(m?.reasons[1]?.text).toContain("100 shares sell at $75.00");
  });

  it("otherwise rolls up and out for a credit, or buys it back", () => {
    const [m] = manageOf([open("2026-10-02", 75, 3)]);
    expect(["ROLL", "BUY BACK"]).toContain(m?.call);
    if (m?.call === "ROLL") {
      expect((m.rollTo?.expiration ?? "") > "2026-10-02").toBe(true);
      expect(m.rollTo?.strike).toBeGreaterThanOrEqual(75);
      expect(m.rollTo?.net).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("calls you've sold — premium kept", () => {
  it("buys it back once half the premium is kept", () => {
    const ask = open("2026-10-16", 100, 1).ask ?? 0;
    const [m] = manageOf([open("2026-10-16", 100, ask * 2)]);
    expect(m?.call).toBe("BUY BACK");
    expect(m?.kept).toBeCloseTo(0.5, 6);
  });

  it("keeps it below half, until it expires", () => {
    const ask = open("2026-10-16", 100, 1).ask ?? 0;
    const [m] = manageOf([open("2026-10-16", 100, ask * 1.2)]);
    expect(m?.call).toBe("KEEP");
    expect(m?.until?.date).toBe("2026-10-16");
  });

  it("marks an action as a plan for the open when the market is closed", () => {
    const ask = open("2026-10-16", 100, 1).ask ?? 0;
    const [m] = manageOf([open("2026-10-16", 100, ask * 3)], { sessionOpen: false });
    expect(m?.atOpen).toBe(true);
  });
});

describe("calls you've sold — the rest of the guidance sees them", () => {
  it("takes their lots out of the new covered calls it offers", () => {
    const g = positionGuidance(
      inputs({ stake: { ...STAKE, openCalls: [open("2026-10-16", 100, 2, { contracts: 3 })] } }),
    );
    const rows = g.ladder.filter((r) => r.lever === "covered-calls");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.maxContracts === 1)).toBe(true);
  });

  it("gets its own markdown section only when there is one", () => {
    expect(guidanceToMarkdown(positionGuidance(inputs()))).not.toContain("already sold");
    const md = guidanceToMarkdown(
      positionGuidance(inputs({ stake: { ...STAKE, openCalls: [open("2026-10-16", 100, 2)] } })),
    );
    expect(md).toContain("### 3b · Calls you've already sold");
    expect(md).toContain("$100.00 call, Oct 16 (1)");
  });
});

// #3749 review: the most common state a sold call ends in — past the strike, weeks left.
describe("calls you've sold — in the money with more than a week left", () => {
  it("says the shares will likely sell at the strike, never that the stock is still below it", () => {
    const [m] = manageOf([open("2026-10-16", 75, 3)]);
    expect(m?.call).toBe("KEEP");
    const text = m?.reasons.map((r) => r.text).join(" ") ?? "";
    expect(text).toContain("above your $75.00 strike");
    expect(text).not.toContain("stays below");
    expect(m?.provesWrong).toContain("falls back below $75.00");
    expect(m?.until?.why).toContain("likely exercised");
  });

  it("offers a roll or a buy-back when the member wants to keep the shares", () => {
    const [m] = manageOf([open("2026-10-16", 75, 3)], {}, { ...STAKE, goal: "keep-shares" });
    expect(["ROLL", "BUY BACK"]).toContain(m?.call);
  });
});

describe("calls you've sold — honest about its own inputs", () => {
  it("never prices a roll off an option chain the read calls out of date", () => {
    const pulse: PulseItem[] = [
      { id: "chain", source: "Alpaca", asOf: NOW, status: "stale", note: "quotes 40 min old" },
    ];
    const [m] = manageOf([open("2026-11-13", 95, 4)], { pulse });
    expect(m?.call).toBe("NO ANSWER");
    expect(m?.rollTo).toBeUndefined();
  });

  it("says when the stock price is only partly verified", () => {
    const pulse: PulseItem[] = [
      { id: "spot", source: "IEX", asOf: NOW, status: "aging", note: "no parity pair" },
    ];
    const [m] = manageOf([open("2026-10-16", 100, 2)], { pulse });
    expect(m?.reasons[0]?.text).toContain("only partly verified");
  });

  it("drops a contract that has already expired", () => {
    const [m] = manageOf([open("2026-09-18", 100, 2, { ask: 0.05 })]);
    expect(m?.call).toBe("NO ANSWER");
    expect(m?.reasons[0]?.text).toContain("expired");
  });
});
