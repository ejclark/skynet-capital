import type { PlaybookSubscription, Portfolio } from "../../src/domain/types.js";
import {
  CONVICTION_NOT_STATED,
  checkConviction,
  isConvictionNotStated,
  netPl,
  type PairLedger,
  putStrategyTag,
} from "../../src/playbooks/conviction-check.js";
import { findPair } from "../../src/playbooks/pair-table.js";
import { buildOccSymbol } from "../../src/trading/option-symbols.js";
import { aContext, aPortfolio, aPosition, aSubscription } from "../support/builders.js";

/**
 * #4469 criteria 11 and 12 — the conviction check, pure over a ledger. The plan's own spec case
 * leads: an assigned put whose shares sit below the strike by more than the premiums collected
 * trips the check, because the decision ledger scores no share leg.
 */

const WHEEL = findPair("CRWV-WHEEL");
if (!WHEEL) throw new Error("CRWV-WHEEL is not in the pair table");
const PUT = buildOccSymbol({
  underlying: "CRWV",
  expiration: "2027-02-19",
  type: "put",
  strike: 80,
});
const ledger = (overrides: Partial<PairLedger> = {}): PairLedger => ({
  realizedPl: 0,
  putsClosed: 0,
  putsAssigned: 0,
  ...overrides,
});
const quotes = (last: number) => aContext({ CRWV: { last } }).quotes;
const flat = (): Portfolio => aPortfolio({ positions: [] });

describe("netPl — the ledger plus what the open positions are worth against cost", () => {
  it("is the realized P/L alone when flat", () => {
    expect(netPl(WHEEL, ledger({ realizedPl: 230 }), flat(), quotes(80))).toBe(230);
  });

  it("marks assigned shares at the last price against their cost — the leg the ledger never scores", () => {
    const held = aPortfolio({
      positions: [aPosition({ symbol: "CRWV", quantity: 100, avgPrice: 80 })],
    });
    expect(netPl(WHEEL, ledger({ realizedPl: 230 }), held, quotes(76.5))).toBe(-120);
    expect(netPl(WHEEL, ledger({ realizedPl: 230 }), held, quotes(84))).toBe(630);
  });

  it("marks an open sold put at the broker's mark: premium taken less the cost to close", () => {
    const open = aPortfolio({
      positions: [aPosition({ symbol: PUT, quantity: -1, avgPrice: 2.3, marketValue: -150 })],
    });
    expect(netPl(WHEEL, ledger(), open, quotes(82))).toBe(80);
  });

  it("reads an unmarked contract at cost, and a share with no quote at cost, so neither moves it", () => {
    const open = aPortfolio({
      positions: [
        aPosition({ symbol: PUT, quantity: -1, avgPrice: 2.3 }),
        aPosition({ symbol: "CRWV", quantity: 100, avgPrice: 80 }),
      ],
    });
    expect(netPl(WHEEL, ledger({ realizedPl: 10 }), open, {})).toBe(10);
  });

  it("ignores positions in other tickers", () => {
    const other = aPortfolio({
      positions: [aPosition({ symbol: "NVDA", quantity: 50, avgPrice: 100 })],
    });
    expect(netPl(WHEEL, ledger({ realizedPl: 5 }), other, quotes(80))).toBe(5);
  });
});

describe("checkConviction — net P/L and the wheel's retire test", () => {
  it("passes at exactly $0 and above", () => {
    expect(checkConviction(WHEEL, "2027-01-29", ledger(), 0)).toEqual({ pass: true, netPl: 0 });
  });

  it("fails below $0, in words an owner can read", () => {
    const verdict = checkConviction(WHEEL, "2027-01-29", ledger(), -120);
    expect(verdict).toMatchObject({ pass: false, netPl: -120 });
    expect(verdict.pass === false && verdict.reason).toBe(
      "the wheel on CRWV: net P/L is -$120.00 at its 2027-01-29 check",
    );
  });

  it("fails the retire test when more than 1 in 3 sold puts finished in the money, even in profit", () => {
    const verdict = checkConviction(
      WHEEL,
      "2027-01-29",
      ledger({ realizedPl: 900, putsClosed: 5, putsAssigned: 2 }),
      900,
    );
    expect(verdict.pass).toBe(false);
    expect(verdict.pass === false && verdict.reason).toContain(
      "2 of 5 sold puts finished in the money",
    );
  });

  it("holds at exactly 1 in 3, and with no puts finished yet", () => {
    expect(checkConviction(WHEEL, "d", ledger({ putsClosed: 3, putsAssigned: 1 }), 5).pass).toBe(
      true,
    );
    expect(checkConviction(WHEEL, "d", ledger(), 5).pass).toBe(true);
  });

  it("applies the put test to the wheel only", () => {
    const runUp = findPair("S1-NVDA");
    if (!runUp) throw new Error("S1-NVDA is not in the pair table");
    expect(putStrategyTag(runUp)).toBeUndefined();
    expect(putStrategyTag(WHEEL)).toBe("crwv-wheel-put");
    expect(checkConviction(runUp, "d", ledger({ putsClosed: 1, putsAssigned: 1 }), 5).pass).toBe(
      true,
    );
  });
});

describe("criterion 11 — a non-✓ pair with no conviction is labelled, never stopped", () => {
  const conviction = { reason: "my call", checkOn: "2027-01-29" };
  const sub = (id: string, overrides: Partial<PlaybookSubscription> = {}) =>
    aSubscription("sauron", id, overrides);

  it("names the wheel on CRWV (◆ conviction row) while its owner has stated none", () => {
    expect(isConvictionNotStated(sub("CRWV-WHEEL"))).toBe(true);
    expect(CONVICTION_NOT_STATED).toBe("conviction not stated");
  });

  it("is quiet once a conviction is stated", () => {
    expect(isConvictionNotStated(sub("CRWV-WHEEL", { conviction }))).toBe(false);
  });

  it("is quiet for a house ✓ pair, a paused subscription, and an id that is no pair", () => {
    expect(isConvictionNotStated(sub("S1-NVDA"))).toBe(false);
    expect(isConvictionNotStated(sub("CRWV-WHEEL", { enabled: false }))).toBe(false);
    expect(isConvictionNotStated(sub("U-my-own-play"))).toBe(false);
  });
});
