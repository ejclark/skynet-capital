import {
  LIFECYCLE_STATUS,
  lifecycleClosingFill,
  parseLifecycleActivity,
  type RawLifecycleActivity,
} from "../../src/trading/option-lifecycle.js";
import { matchRoundTrips } from "../../src/trading/round-trips.js";

const expired: RawLifecycleActivity = {
  id: "act-1",
  activity_type: "OPEXP",
  symbol: "MSFT260918P00420000",
  qty: "2",
  date: "2026-09-19T00:00:00Z",
};

describe("parseLifecycleActivity — never assume a field the wire format doesn't guarantee", () => {
  it("parses a well-formed OPEXP row", () => {
    const parsed = parseLifecycleActivity(expired);
    expect(parsed).toEqual({
      id: "act-1",
      type: "OPEXP",
      symbol: "MSFT260918P00420000",
      quantity: 2,
      // A date-only stamp is the END of the expiration day, not its first instant — see
      // `endOfDayIfTimeless`. Midnight sorted a contract's expiry ahead of the fill that opened it.
      at: "2026-09-19T23:59:59.999Z",
    });
  });

  it("keeps a real execution stamp exactly as reported, and prefers it over the date", () => {
    const parsed = parseLifecycleActivity({
      ...expired,
      transaction_time: "2026-09-19T14:30:00Z",
    });
    expect(parsed?.at).toBe("2026-09-19T14:30:00.000Z");
  });

  it("scores a contract WRITTEN and expired the same day — the 0DTE case", () => {
    const wrote = {
      symbol: "MSFT260918P00420000",
      side: "sell" as const,
      quantity: 2,
      price: 420,
      at: "2026-09-19T14:00:00.000Z",
    };
    const close = lifecycleClosingFill(
      parseLifecycleActivity(expired) as NonNullable<ReturnType<typeof parseLifecycleActivity>>,
    ) as NonNullable<ReturnType<typeof lifecycleClosingFill>>;
    const ledger = matchRoundTrips([wrote, close]);
    expect(ledger.trips).toHaveLength(1);
    expect(ledger.trips[0]?.realized).toBe(840);
    expect(ledger.open).toHaveLength(0);
  });

  it("carries price and side only when both are present and valid (OPTRD)", () => {
    const parsed = parseLifecycleActivity({
      id: "act-2",
      activity_type: "OPTRD",
      symbol: "MSFT",
      qty: "200",
      price: "420",
      side: "buy",
      transaction_time: "2026-09-19T14:30:00Z",
    });
    expect(parsed).toMatchObject({ type: "OPTRD", price: 420, side: "buy" });
  });

  it("rejects an activity type outside the four lifecycle codes", () => {
    expect(parseLifecycleActivity({ ...expired, activity_type: "FILL" })).toBeNull();
  });

  it("rejects a row missing id, symbol, a positive quantity, or a parseable date", () => {
    expect(parseLifecycleActivity({ ...expired, id: undefined })).toBeNull();
    expect(parseLifecycleActivity({ ...expired, symbol: "" })).toBeNull();
    expect(parseLifecycleActivity({ ...expired, qty: "0" })).toBeNull();
    expect(parseLifecycleActivity({ ...expired, qty: "not a number" })).toBeNull();
    expect(parseLifecycleActivity({ ...expired, date: "not a date" })).toBeNull();
  });

  it("never throws on a garbage payload", () => {
    expect(parseLifecycleActivity({})).toBeNull();
    expect(
      parseLifecycleActivity({ id: 123, activity_type: null } as unknown as RawLifecycleActivity),
    ).toBeNull();
  });
});

describe("LIFECYCLE_STATUS — the plain-language explanation IS the ledger's status column", () => {
  it("names all four lifecycle types in plain words", () => {
    expect(LIFECYCLE_STATUS.OPEXP).toBe("expired worthless");
    expect(LIFECYCLE_STATUS.OPASN).toBe("assigned");
    expect(LIFECYCLE_STATUS.OPEXC).toBe("exercised");
    expect(LIFECYCLE_STATUS.OPTRD).toBe("option settlement");
  });
});

describe("lifecycleClosingFill — closes a leg without a fill, honestly", () => {
  it("only OPEXP and OPASN produce a closing fill; OPEXC and OPTRD never do", () => {
    const parsed = parseLifecycleActivity(expired) as NonNullable<
      ReturnType<typeof parseLifecycleActivity>
    >;
    expect(lifecycleClosingFill(parsed)).toEqual({
      symbol: "MSFT260918P00420000",
      side: "sell",
      quantity: 2,
      price: 0,
      at: "2026-09-19T23:59:59.999Z",
      synthetic: true,
    });
    expect(lifecycleClosingFill({ ...parsed, type: "OPASN" })?.synthetic).toBe(true);
    expect(lifecycleClosingFill({ ...parsed, type: "OPEXC" })).toBeUndefined();
    expect(lifecycleClosingFill({ ...parsed, type: "OPTRD" })).toBeUndefined();
  });

  it("closes a genuinely open long lot at an honest $0 — a real total loss, correctly scored", () => {
    const opened = {
      symbol: "AAPL261218C00150000",
      side: "buy" as const,
      quantity: 1,
      price: 3.5,
      at: "2026-08-01T14:00:00.000Z",
    };
    const parsed = parseLifecycleActivity({
      id: "act-3",
      activity_type: "OPEXP",
      symbol: "AAPL261218C00150000",
      qty: "1",
      date: "2026-12-19T00:00:00Z",
    }) as NonNullable<ReturnType<typeof parseLifecycleActivity>>;
    const close = lifecycleClosingFill(parsed);
    const ledger = matchRoundTrips([opened, close as NonNullable<typeof close>]);
    expect(ledger.trips).toHaveLength(1);
    expect(ledger.trips[0]?.realized).toBe(-3.5);
    expect(ledger.open).toHaveLength(0);
    expect(ledger.truncated).toBe(false);
  });

  it("a written option's own expiration closes the short lot for the full premium (#838)", () => {
    // The opening SELL writes the contract, so the matcher opens a SHORT lot for it; this
    // lifecycle close is what finally scores it. End-to-end through the real parser, because the
    // arithmetic downstream of `lifecycleClosingFill` is the whole point of that function.
    const wrote = {
      symbol: "AAPL261218C00150000",
      side: "sell" as const,
      quantity: 1,
      price: 3.5,
      at: "2026-08-01T14:00:00.000Z",
    };
    const parsed = parseLifecycleActivity({
      id: "act-4",
      activity_type: "OPEXP",
      symbol: "AAPL261218C00150000",
      qty: "1",
      date: "2026-12-19T00:00:00Z",
    }) as NonNullable<ReturnType<typeof parseLifecycleActivity>>;
    const close = lifecycleClosingFill(parsed) as NonNullable<
      ReturnType<typeof lifecycleClosingFill>
    >;
    // Written but not yet expired: an open short lot, and never a truncated window.
    const stillOpen = matchRoundTrips([wrote]);
    expect(stillOpen.trips).toHaveLength(0);
    expect(stillOpen.unmatchedSellQuantity).toBe(0);
    expect(stillOpen.open).toHaveLength(1);

    const withLifecycle = matchRoundTrips([wrote, close]);
    expect(withLifecycle.unmatchedSellQuantity).toBe(0);
    expect(withLifecycle.trips).toHaveLength(1);
    expect(withLifecycle.trips[0]?.realized).toBe(3.5);
    expect(withLifecycle.trips[0]?.short).toBe(true);
    expect(withLifecycle.open).toHaveLength(0);
  });
});
