import { readFileSync } from "node:fs";

/**
 * Trade's copy never calls a paper account "live" (#5213). Every account here is an Alpaca paper
 * account, and "live" reads as real money — it also clashes with the SIM/LIVE label. The submit
 * re-check is named by what it reads instead. Read from source, the way
 * `ladder-chapter-footnote.spec.ts` pins copy it has no DOM for; whitespace is folded so the JSX
 * line wrap doesn't matter. Live *quotes* (real-time market data) are a different, honest sense
 * of the word and are not covered here.
 */

const source = (path: string): string => readFileSync(path, "utf8").replace(/\s+/g, " ");

const trade = source("app/src/routes/trade.tsx");
const gateFrame = source("app/src/shell/gate-frame.tsx");
const optionPositions = source("app/src/shell/option-positions.tsx");

describe("Trade copy on a paper account", () => {
  it("says the subtitle's submit re-check reads the paper account", () => {
    expect(trade).toContain("re-checks your paper account's buying power and positions at submit.");
  });

  it("says the review note's submit re-check reads the paper account", () => {
    expect(gateFrame).toContain(
      "which re-checks your paper account's buying power and positions at submit",
    );
  });

  it("says Close works out the direction from the contracts held now, not a live holding", () => {
    expect(optionPositions).toContain("works out the direction from the contracts you hold now.");
  });

  it("never calls the account live", () => {
    for (const text of [trade, gateFrame]) {
      expect(text).not.toMatch(/live account/i);
    }
  });
});
