import type { DeskActivityEvent } from "../../src/live/desk";
import { ledgerEntry } from "../../src/live/ledger-entry";

/** #5317 — the words a Ledger entry is drawn from: sizes that say their unit, a round trip's total
 *  (how long, from when to when), and where a single order stands. */

const NOW = new Date("2026-10-14T16:00:00Z");

const line = (over: Partial<DeskActivityEvent> = {}): DeskActivityEvent => ({
  orderId: "o",
  symbol: "META",
  display: "META",
  side: "buy",
  quantity: 15,
  filled: 15,
  price: "$742.00",
  status: "filled",
  at: "2026-09-22T14:00:00Z",
  backfilled: false,
  origin: "unknown",
  ...over,
});

const sale = (opened: DeskActivityEvent["opened"], at = "2026-10-01T19:30:00Z") =>
  line({ orderId: "s", side: "sell", price: "$761.00", at, realizedPl: "-$40", opened });

describe("ledgerEntry — the words an entry is drawn from", () => {
  it("labels a size by its unit, and part of a fill as part", () => {
    expect(ledgerEntry(line({ quantity: 1, filled: 1 }), NOW).legs[0]?.words.size).toBe("1 share");
    expect(ledgerEntry(line({ quantity: 10, filled: 3 }), NOW).legs[0]?.words.size).toBe(
      "3 of 10 shares",
    );
    const put = line({ symbol: "CRWV261106P00080000", quantity: 2, filled: 2, price: "$2.55" });
    expect(ledgerEntry(put, NOW).legs[0]?.words).toMatchObject({
      size: "2 contracts",
      name: "CRWV",
      contract: "$80 PUT · Nov 6",
      price: "$2.55",
    });
  });

  it("totals a round trip held within one day as the same day, a loss with a true minus", () => {
    const entry = ledgerEntry(sale([{ ...line(), at: "2026-10-01T14:00:00Z", matched: 15 }]), NOW);
    expect(entry.total).toEqual({ name: "META", held: "same day", range: "Oct 1 → Oct 1" });
    expect(entry.outcome?.text).toBe("−$40");
  });

  it("says one day in the singular", () => {
    const entry = ledgerEntry(sale([{ ...line(), at: "2026-09-30T14:00:00Z", matched: 15 }]), NOW);
    expect(entry.total?.held).toBe("1 day");
  });

  it("names an option's strike and kind on the total, its expiry left to the legs", () => {
    const put = { symbol: "CRWV261106P00080000", display: "CRWV $80 PUT · 6 NOV 26" };
    const opened = [{ ...line({ ...put, side: "sell", quantity: 1, filled: 1 }), matched: 1 }];
    const entry = ledgerEntry({ ...sale(opened), ...put, side: "buy" }, NOW);
    expect(entry.total?.name).toBe("CRWV $80 PUT");
    expect(entry.legs.map((leg) => leg.words.side)).toEqual(["BOUGHT", "SOLD"]);
  });

  it("claims no standing for a stock sale with no buy to pair — its buy is older than the ledger", () => {
    expect(ledgerEntry(line({ side: "sell" }), NOW).outcome).toBeUndefined();
  });

  it("gives a closing spread its result, a spread with every leg closed its close date", () => {
    const spread = { symbol: "", display: "NVDA $185/$200 CALL SPREAD · 13 NOV 26" };
    expect(ledgerEntry(line({ ...spread, realizedPl: "+$290" }), NOW).outcome?.text).toBe("+$290");
    expect(
      ledgerEntry(line({ ...spread, closedOn: "2026-11-02T15:00:00Z" }), NOW).outcome?.text,
    ).toBe("closed Nov 2");
  });
});
