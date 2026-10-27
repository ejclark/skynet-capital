import type { PlaybookSubscription, Portfolio } from "../../src/domain/types.js";
import {
  CONVICTION_NOT_STATED,
  checkRecord,
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

  it("is unread, not flat, while a held contract or a held share has no mark", () => {
    const unmarkedPut = aPortfolio({
      positions: [aPosition({ symbol: PUT, quantity: -1, avgPrice: 2.3 })],
    });
    const unquotedShares = aPortfolio({
      positions: [aPosition({ symbol: "CRWV", quantity: 100, avgPrice: 80 })],
    });
    expect(netPl(WHEEL, ledger({ realizedPl: 10 }), unmarkedPut, quotes(80))).toBeUndefined();
    expect(netPl(WHEEL, ledger({ realizedPl: 10 }), unquotedShares, {})).toBeUndefined();
    expect(netPl(WHEEL, ledger({ realizedPl: 10 }), unquotedShares, quotes(0))).toBeUndefined();
  });

  it("ignores positions in other tickers", () => {
    const other = aPortfolio({
      positions: [aPosition({ symbol: "NVDA", quantity: 50, avgPrice: 100 })],
    });
    expect(netPl(WHEEL, ledger({ realizedPl: 5 }), other, quotes(80))).toBe(5);
  });
});

/** A one-pair view's check: the reading an owner's own reason and day get since #5482 contract
 *  piece 3, when the bots stopped reading inline convictions (piece 4). */
describe("checkRecord on one pair — net P/L and the wheel's retire test", () => {
  const one = (pair: typeof WHEEL, checkOn: string, history: PairLedger, net: number) =>
    checkRecord(checkOn, [{ pair, ledger: history, net }]);

  it("passes at exactly $0 and above", () => {
    expect(one(WHEEL, "2027-01-29", ledger(), 0)).toEqual({
      pass: true,
      netPl: 0,
      stopped: [],
      reason: "",
    });
  });

  it("fails below $0, in words an owner can read", () => {
    const verdict = one(WHEEL, "2027-01-29", ledger(), -120);
    expect(verdict).toMatchObject({ pass: false, netPl: -120, stopped: ["CRWV-WHEEL"] });
    expect(verdict.reason).toBe("the wheel on CRWV: net P/L is -$120.00 at the 2027-01-29 check");
  });

  it("stops the pair on the retire test when more than 1 in 3 sold puts finished in the money, even in profit", () => {
    const verdict = one(
      WHEEL,
      "2027-01-29",
      ledger({ realizedPl: 900, putsClosed: 5, putsAssigned: 2 }),
      900,
    );
    expect(verdict.stopped).toEqual(["CRWV-WHEEL"]);
    expect(verdict.reason).toContain("2 of 5 sold puts finished in the money");
  });

  it("holds at exactly 1 in 3, and with no puts finished yet", () => {
    expect(one(WHEEL, "d", ledger({ putsClosed: 3, putsAssigned: 1 }), 5).stopped).toEqual([]);
    expect(one(WHEEL, "d", ledger(), 5).stopped).toEqual([]);
  });

  it("applies the put test to the wheel only", () => {
    const runUp = findPair("S1-NVDA");
    if (!runUp) throw new Error("S1-NVDA is not in the pair table");
    expect(putStrategyTag(runUp)).toBeUndefined();
    expect(putStrategyTag(WHEEL)).toBe("crwv-wheel-put");
    expect(one(runUp, "d", ledger({ putsClosed: 1, putsAssigned: 1 }), 5).stopped).toEqual([]);
  });
});

describe("criterion 11 — a non-✓ pair with no conviction is labelled, never stopped", () => {
  const sub = (id: string, overrides: Partial<PlaybookSubscription> = {}) =>
    aSubscription("sauron", id, overrides);

  it("names SAURON's basket (? not studied) while its owner has stated none", () => {
    expect(isConvictionNotStated(sub("SAURON"))).toBe(true);
    expect(CONVICTION_NOT_STATED).toBe("conviction not stated");
  });

  // The inline carry's replacement, bots first: a ◆ pair trades only on a conviction (#4469 c2), so
  // with no pointer it runs exits-only (`subscriptionRoster`), and "still
  // trading" would be false of it.
  it("never labels a ◆ pair with no pointer: it runs exits-only instead", () => {
    expect(isConvictionNotStated(sub("CRWV-WHEEL"))).toBe(false);
    expect(isConvictionNotStated(sub("CRWV-LONG-CALL"))).toBe(false);
  });

  it("counts a pointer at a record that steers the pair as stated (#5482 slice 2)", () => {
    expect(isConvictionNotStated(sub("CRWV-WHEEL", { convictionId: "ai-dip-2026-10" }))).toBe(
      false,
    );
  });

  it("never labels a pointed pair, even one this build's store cannot read (#5482 contract piece 2)", () => {
    // A member's view is held by the bots' own lookup, not this store; a pointer nothing resolves
    // runs its pair exits-only (`steeredBy`), so "still trading" would be false of it either way.
    expect(isConvictionNotStated(sub("CRWV-WHEEL", { convictionId: "no-such-view" }))).toBe(false);
  });

  it("is quiet for a house ✓ pair, a paused subscription, and an id that is no pair", () => {
    expect(isConvictionNotStated(sub("S1-NVDA"))).toBe(false);
    expect(isConvictionNotStated(sub("CRWV-WHEEL", { enabled: false }))).toBe(false);
    expect(isConvictionNotStated(sub("U-my-own-play"))).toBe(false);
  });
});

describe("checkRecord — a conviction record's check over every pair it steers (#5482 criterion 5)", () => {
  const LONG_CALL = findPair("CRWV-LONG-CALL");
  if (!LONG_CALL) throw new Error("CRWV-LONG-CALL is not in the pair table");
  const reading = (pair: typeof WHEEL, net: number, over: Partial<PairLedger> = {}) => ({
    pair,
    ledger: ledger({ realizedPl: net, ...over }),
    net,
  });

  it("passes when the pairs together are at $0 or more, whatever one of them did alone", () => {
    const verdict = checkRecord("2027-01-29", [reading(WHEEL, -80), reading(LONG_CALL, 80)]);
    expect(verdict).toEqual({ pass: true, netPl: 0, stopped: [], reason: "" });
  });

  it("fails below $0 together and stops every pair it steers, in words", () => {
    const verdict = checkRecord("2027-01-29", [reading(WHEEL, 100), reading(LONG_CALL, -300)]);
    expect(verdict.pass).toBe(false);
    expect(verdict.netPl).toBe(-200);
    expect(verdict.stopped).toEqual(["CRWV-WHEEL", "CRWV-LONG-CALL"]);
    expect(verdict.reason).toBe(
      "the wheel on CRWV + the long call on CRWV: net P/L is -$200.00 together at the 2027-01-29 check",
    );
  });

  it("sums to the cent", () => {
    expect(checkRecord("d", [reading(WHEEL, 0.1), reading(LONG_CALL, 0.2)]).netPl).toBe(0.3);
  });

  it("stops the wheel on its retire test alone while the view holds", () => {
    const verdict = checkRecord("2027-01-29", [
      reading(WHEEL, 900, { putsClosed: 5, putsAssigned: 2 }),
      reading(LONG_CALL, 10),
    ]);
    expect(verdict.pass).toBe(true);
    expect(verdict.stopped).toEqual(["CRWV-WHEEL"]);
    expect(verdict.reason).toContain("2 of 5 sold puts finished in the money");
  });

  it("judges an owner who accepts assignment on net P/L alone (Eric, 2026-10-18)", () => {
    const assigned = [
      reading(WHEEL, 900, { putsClosed: 5, putsAssigned: 2 }),
      reading(LONG_CALL, 10),
    ];
    expect(checkRecord("2027-01-29", assigned, { acceptsAssignment: true })).toEqual({
      pass: true,
      netPl: 910,
      stopped: [],
      reason: "",
    });
    // the money still stops it: a loss together fails the view whatever the owner accepts
    const losing = checkRecord(
      "2027-01-29",
      [reading(WHEEL, -400, { putsClosed: 5, putsAssigned: 2 })],
      {
        acceptsAssignment: true,
      },
    );
    expect(losing.pass).toBe(false);
    expect(losing.stopped).toEqual(["CRWV-WHEEL"]);
  });
});
