import {
  BETA_SCOUT_ID,
  betaScoutExitIntents,
  betaScoutIntents,
  parseBetaForcing,
} from "../../src/playbooks/beta-scout.js";
import { aContext, aPortfolio, aPosition } from "../support/builders.js";

describe("betaScoutIntents", () => {
  it("does nothing when something organic already fired today", () => {
    const context = aContext({ AAPL: { last: 100, sentiment: 0.9 } });
    const intents = betaScoutIntents(
      context,
      aPortfolio({ cash: 100_000 }),
      ["AAPL"],
      new Set(),
      true, // firedOrganicallyToday
    );
    expect(intents).toEqual([]);
  });

  it("picks the top-ranked candidates by combined |sentiment| + |momentum|", () => {
    const context = aContext({
      AAPL: { last: 100, sentiment: 0.9, momentum: 0.01 },
      MSFT: { last: 100, sentiment: 0.2, momentum: 0.0 },
      GOOG: { last: 100, sentiment: 0.5, momentum: 0.02 },
    });
    const intents = betaScoutIntents(
      context,
      aPortfolio({ cash: 1_000_000 }),
      ["AAPL", "MSFT", "GOOG"],
      new Set(),
      false,
      { maxPicks: 2 },
    );
    expect(intents.map((i) => i.symbol)).toEqual(["AAPL", "GOOG"]); // strongest two, ranked
  });

  it("stamps BETA_SCOUT_ID and a reason that names it as a forced, non-conviction pick", () => {
    const context = aContext({ AAPL: { last: 100, sentiment: 0.9 } });
    const [intent] = betaScoutIntents(
      context,
      aPortfolio({ cash: 100_000 }),
      ["AAPL"],
      new Set(),
      false,
    );
    expect(intent?.playbookId).toBe(BETA_SCOUT_ID);
    expect(intent?.reason).toMatch(/BETA-PHASE FORCED PICK/);
    expect(intent?.reason).toMatch(/not a conviction call/);
  });

  it("sizes well below the softest playbook mode — a probe, not a position", () => {
    const context = aContext({ AAPL: { last: 100, sentiment: 0.9 } });
    const [intent] = betaScoutIntents(
      context,
      aPortfolio({ cash: 100_000 }),
      ["AAPL"],
      new Set(),
      false,
    );
    // 0.5% of $100k = $500, at the builder's ask of $100.05 (last + spread) = 4 shares — tiny, and
    // less than S1-NVDA's 1% conservative floor.
    expect(intent?.quantity).toBe(4);
  });

  it("skips a symbol with net-negative signal — long-only, no shorting instrument", () => {
    const context = aContext({ AAPL: { last: 100, sentiment: -0.9 } });
    const intents = betaScoutIntents(
      context,
      aPortfolio({ cash: 100_000 }),
      ["AAPL"],
      new Set(),
      false,
    );
    expect(intents).toEqual([]);
  });

  it("excludes symbols already managed by an evidence-gated playbook", () => {
    const context = aContext({ NVDA: { last: 100, sentiment: 0.9 } });
    const intents = betaScoutIntents(
      context,
      aPortfolio({ cash: 100_000 }),
      ["NVDA"],
      new Set(["NVDA"]), // managed by S1-NVDA
      false,
    );
    expect(intents).toEqual([]);
  });

  it("never pyramids a symbol it already holds", () => {
    const context = aContext({ AAPL: { last: 100, sentiment: 0.9 } });
    const portfolio = aPortfolio({
      cash: 100_000,
      positions: [aPosition({ symbol: "AAPL", quantity: 5 })],
    });
    const intents = betaScoutIntents(context, portfolio, ["AAPL"], new Set(), false);
    expect(intents).toEqual([]);
  });

  it("says nothing rather than placing a 0-share order when cash is too thin", () => {
    const context = aContext({ AAPL: { last: 100_000, sentiment: 0.9 } });
    const intents = betaScoutIntents(
      context,
      aPortfolio({ cash: 100 }),
      ["AAPL"],
      new Set(),
      false,
    );
    expect(intents).toEqual([]);
  });
});

describe("betaScoutExitIntents", () => {
  it("flattens every tracked scout-owned position", () => {
    const portfolio = aPortfolio({
      positions: [
        aPosition({ symbol: "AAPL", quantity: 5 }),
        aPosition({ symbol: "MSFT", quantity: 3 }),
      ],
    });
    const intents = betaScoutExitIntents(portfolio, new Set(["AAPL", "MSFT"]));
    expect(intents).toHaveLength(2);
    expect(intents.every((i) => i.side === "sell" && i.playbookId === BETA_SCOUT_ID)).toBe(true);
  });

  it("skips a tracked symbol that is already flat — nothing left to exit", () => {
    const intents = betaScoutExitIntents(aPortfolio({ positions: [] }), new Set(["AAPL"]));
    expect(intents).toEqual([]);
  });

  it("ignores positions not in the tracked set — never touches a real conviction position", () => {
    const portfolio = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 10 })] });
    const intents = betaScoutExitIntents(portfolio, new Set());
    expect(intents).toEqual([]);
  });
});

describe("parseBetaForcing", () => {
  it("reads the plain pick count as in-hours only", () => {
    expect(parseBetaForcing("2")).toEqual({ maxPicks: 2, stageAfterClose: false });
  });
  it("reads +stage as after-close staging, whitespace and case tolerant", () => {
    expect(parseBetaForcing("2+stage")).toEqual({ maxPicks: 2, stageAfterClose: true });
    expect(parseBetaForcing(" 3 + STAGE ")).toEqual({ maxPicks: 3, stageAfterClose: true });
  });
  it("is dark on unset, zero, or anything it does not recognise — never a guess", () => {
    for (const raw of [undefined, "", "0", "0+stage", "stage", "two", "2,stage", "2+later"]) {
      expect(parseBetaForcing(raw)).toEqual({ maxPicks: 0, stageAfterClose: false });
    }
  });
});
