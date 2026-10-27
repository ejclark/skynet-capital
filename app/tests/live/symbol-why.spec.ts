import { type BookEvent, bookEventsIn } from "../../src/live/book-events";
import { ALL_RANGE } from "../../src/live/horizon-range";
import { type SymbolBook, type SymbolDesk, symbolBook } from "../../src/live/symbol-book";
import { expiryWhy, whyFor, whyOn } from "../../src/live/symbol-why";

/**
 * Why each date matters on one symbol (#6082 slice 2, criterion 7) — CRWV from the round-4 study:
 * 55 shares and one $80 put sold for $255, expiring Nov 6.
 */

const PUT = "CRWV261106P00080000";
const desk: SymbolDesk = {
  desk: {
    id: "bot-sauron",
    positions: [
      {
        symbol: "CRWV",
        quantity: "55",
        isOption: false,
        value: "$4,543",
        costBasis: "$4,955",
        totalPlRaw: -412,
      },
      {
        symbol: PUT,
        quantity: "-1",
        isOption: true,
        value: "-$550",
        costBasis: "-$255",
        totalPlRaw: -295,
      },
    ],
  },
};
const crwv = symbolBook([desk], "CRWV") as SymbolBook;
const event = (over: Partial<BookEvent> & Pick<BookEvent, "date" | "tier">): BookEvent => ({
  id: `${over.tier} ${over.date}`,
  title: "an event",
  touches: [],
  ...over,
});

describe("whyOn — each date says what it does to what you hold on the symbol", () => {
  it("says what each side of a sold put's strike does on its last day", () => {
    const expiry = event({ date: "2026-11-06", tier: "decide", mark: "Expires" });
    expect(whyOn(expiry, crwv)).toBe("above $80 keeps the $255; below buys 100 shares at $80");
  });

  it("says an earnings day after the put's expiry finds the put gone, the estimate left to the title", () => {
    const print = event({
      date: "2026-11-10",
      tier: "held",
      title: "CRWV earnings (estimated date)",
      mark: "Earnings",
      estimated: true,
    });
    expect(whyOn(print, crwv)).toBe("the $80 put is gone by then");
  });

  it("says an earnings day before the expiry can move the put", () => {
    const print = event({ date: "2026-11-02", tier: "held", mark: "Earnings" });
    expect(whyOn(print, crwv)).toBe("lands before the $80 put expires — it can move it");
  });

  it("gives a market print the house call, and names the expiry it shares a day with", () => {
    const fed = event({
      date: "2026-10-28",
      tier: "market",
      call: { call: "Stand aside", horizon: "Today", href: "/research/fomc" },
    });
    expect(whyOn(fed, crwv)).toBe("house call: stand aside");
    const jobs = event({ date: "2026-11-06", tier: "market" });
    expect(whyOn(jobs, crwv)).toBe("same day the $80 put expires; no house call on it");
    const cpi = event({ date: "2026-10-14", tier: "market" });
    expect(whyOn(cpi, crwv)).toBe("moves every position; no house call on it");
  });

  it("mirrors a sold call and keeps a bought option plain", () => {
    expect(
      expiryWhy({
        type: "call",
        strike: 120,
        expiry: "2026-11-20",
        short: true,
        contracts: 2,
        premium: 300,
      }),
    ).toBe("below $120 keeps the $300; above sells 200 shares at $120");
    expect(
      expiryWhy({ type: "call", strike: 120, expiry: "2026-11-20", short: false, contracts: 1 }),
    ).toBe("ends worth only what it is past $120");
  });

  it("says nothing on every symbol's view", () => {
    expect(whyFor(undefined)(event({ date: "2026-11-06", tier: "market" }))).toBeUndefined();
  });
});

/** Each expiry row through the real chain — the book's events, the symbol's book, the why. */
const expiryWhys = (desks: readonly SymbolDesk[], symbol: string): Record<string, string> => {
  const book = symbolBook(desks, symbol) as SymbolBook;
  const { held } = bookEventsIn({ desks, events: [], calls: [], range: ALL_RANGE, lens: "month" });
  return Object.fromEntries(
    held.filter((e) => e.mark === "Expires").map((e) => [e.title, whyOn(e, book) ?? ""]),
  );
};

const option = (symbol: string, quantity: string, costBasis: string) => ({
  symbol,
  quantity,
  isOption: true,
  value: "$0",
  costBasis,
  totalPlRaw: 0,
});

describe("whyOn — two options on the symbol expiring the same day each keep their own terms (#6284)", () => {
  it("gives each leg of a vertical spread its own line", () => {
    const spread: SymbolDesk = {
      desk: {
        id: "bot-a",
        positions: [
          option("NVDA261120C00180000", "1", "$900"),
          option("NVDA261120C00190000", "-1", "-$400"),
        ],
      },
    };
    expect(expiryWhys([spread], "NVDA")).toEqual({
      "NVDA $180 long call expires": "ends worth only what it is past $180",
      "NVDA $190 short call expires": "below $190 keeps the $400; above sells 100 shares at $190",
    });
  });

  it("gives each account's contract its own strike, premium and share count", () => {
    const me: SymbolDesk = {
      desk: { id: "me", positions: [option("CRWV261106P00080000", "-1", "-$255")] },
    };
    const bot: SymbolDesk = {
      desk: { id: "bot-x", positions: [option("CRWV261106P00070000", "-2", "-$400")] },
    };
    expect(expiryWhys([me, bot], "CRWV")).toEqual({
      "CRWV $80 short put expires": "above $80 keeps the $255; below buys 100 shares at $80",
      "CRWV $70 short put expires": "above $70 keeps the $400; below buys 200 shares at $70",
    });
  });

  it("says nothing when the event names a contract the symbol's book does not hold", () => {
    const expiry = event({
      date: "2026-11-06",
      tier: "held",
      mark: "Expires",
      on: { deskId: "someone-else", symbol: PUT },
    });
    expect(whyOn(expiry, crwv)).toBeUndefined();
  });
});
