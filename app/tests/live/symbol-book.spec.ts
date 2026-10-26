import { narrowDesks, type SymbolDesk, symbolBook, symbolView } from "../../src/live/symbol-book";

/**
 * One symbol's book (#6082) over the round-4 study's CRWV: 55 shares and one $80 put sold for
 * Nov 6 on the wheel, beside NVDA the book also holds. The figures are the events-calendar shoot's.
 */

const PUT = "CRWV261106P00080000";
const position = (
  symbol: string,
  quantity: string,
  value: string,
  costBasis: string,
  totalPlRaw: number,
  playbookId?: string,
) => ({
  symbol,
  quantity,
  isOption: symbol.length > 6,
  value,
  costBasis,
  totalPlRaw,
  ...(playbookId ? { playbookId } : {}),
});

const sauron: SymbolDesk = {
  desk: {
    id: "bot-sauron",
    positions: [
      position("NVDA", "130", "$30,173", "$29,117", 1056),
      position("CRWV", "55", "$4,543", "$4,955", -412),
      position(PUT, "-1", "-$550", "-$255", -295, "wheel-put"),
    ],
    decisions: [
      {
        id: "crwv-put-expiry",
        symbol: PUT,
        display: "CRWV Nov 6 $80 Put",
        title: "Expires Nov 6: keep, roll or buy back",
        due: { at: "2026-11-06", reason: "expiry", label: "Expires Nov 6" },
      },
    ],
  },
};

describe("symbolBook — one symbol's picture on Events (#6082)", () => {
  it("sums the money in the symbol the way the cockpit head does: market value, a sold put netting against it", () => {
    const book = symbolBook([sauron], "CRWV");
    expect(book?.invested).toBe(4543 - 550);
    expect(book?.pl).toBe(-412 - 295);
  });

  it("leads with the soonest date to act and says what is due", () => {
    expect(symbolBook([sauron], "CRWV")?.soonest).toEqual({
      date: "2026-11-06",
      what: "the $80 put expires first",
    });
  });

  it("gives each position an honest target: a sold option keeps its premium, wheel shares have no price target", () => {
    const rows = symbolBook([sauron], "CRWV")?.rows ?? [];
    expect(rows.map((r) => [r.name, r.state, r.target, r.pl, r.toClose])).toEqual([
      ["Sold $80 put", "expires Nov 6", "target: keep the $255 premium", -295, "$550 to close"],
      ["55 shares", "hold", "no price target · the wheel holds", -412, undefined],
    ]);
  });

  it("says no target is recorded where nothing names one", () => {
    const rows = symbolBook([sauron], "NVDA")?.rows ?? [];
    expect(rows.map((r) => r.target)).toEqual(["no target recorded"]);
  });

  it("has no date to act on for shares alone", () => {
    expect(symbolBook([sauron], "NVDA")?.soonest).toBeUndefined();
  });

  it("is undefined for a symbol the book does not hold", () => {
    expect(symbolBook([sauron], "AAPL")).toBeUndefined();
  });
});

describe("narrowDesks / symbolView — the section narrowed by ?symbol=", () => {
  it("keeps only that symbol's positions and decisions, an option counting as its underlying", () => {
    const [desk] = narrowDesks([sauron], "CRWV");
    expect(desk?.desk.positions.map((p) => p.symbol)).toEqual(["CRWV", PUT]);
    expect(desk?.desk.decisions?.map((d) => d.id)).toEqual(["crwv-put-expiry"]);
  });

  it("drops a desk that holds none of it", () => {
    expect(narrowDesks([sauron], "AAPL")).toEqual([]);
  });

  it("with no symbol, shows every desk under the section's own name", () => {
    const view = symbolView([sauron], undefined);
    expect(view.desks).toEqual([sauron]);
    expect(view.book).toBeUndefined();
    expect(view.named).toBe("Events");
  });

  it("with a symbol, names the section after it", () => {
    expect(symbolView([sauron], "CRWV").named).toBe("Events on CRWV");
  });
});
