import {
  addToWatchlist,
  foldWatchlistLines,
  normalizeWatchSymbol,
  removeFromWatchlist,
  WATCHLIST_LIMIT,
  type WatchedSymbol,
} from "../../src/trading/watchlist.js";

/**
 * The watchlist's rules (#3407 P4 / #4332): what counts as a ticker, what the cap refuses and in
 * whose words, why a second tap is never an error, and how an append-only ledger folds back into
 * the list standing now.
 */

const AT = "2026-10-04T14:00:00.000Z";
const list = (...symbols: string[]): readonly WatchedSymbol[] =>
  symbols.map((symbol) => ({ symbol, at: AT }));

describe("normalizeWatchSymbol", () => {
  it("uppercases and trims what a member typed", () => {
    expect(normalizeWatchSymbol("  nvda ")).toBe("NVDA");
  });

  it("accepts a dotted class share", () => {
    expect(normalizeWatchSymbol("brk.b")).toBe("BRK.B");
  });

  it("rejects anything that isn't a ticker", () => {
    for (const bad of ["", "   ", "NVDA CALL", "TOOLONGTICKER", "123", "NVDA241018C00180000"]) {
      expect(normalizeWatchSymbol(bad)).toBeUndefined();
    }
  });
});

describe("addToWatchlist", () => {
  it("appends the name to the end, so the order is the one the member built", () => {
    const added = addToWatchlist(list("NVDA", "AAPL"), "tsla", AT);
    expect(added).toMatchObject({ ok: true, changed: true });
    if (!added.ok) throw new Error("expected ok");
    expect(added.list.map((row) => row.symbol)).toEqual(["NVDA", "AAPL", "TSLA"]);
  });

  it("treats a name already watched as the state the member asked for, not an error", () => {
    const again = addToWatchlist(list("NVDA"), "NVDA", AT);
    expect(again).toMatchObject({ ok: true, changed: false });
  });

  it("refuses a non-ticker in words", () => {
    const bad = addToWatchlist(list(), "not a ticker", AT);
    expect(bad.ok).toBe(false);
    if (bad.ok) throw new Error("expected a refusal");
    expect(bad.reason).toMatch(/doesn't read as a ticker/);
  });

  it("refuses past the cap, and says the number", () => {
    const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const full = list(...Array.from({ length: WATCHLIST_LIMIT }, (_, i) => `${alpha[i]}X`));
    const over = addToWatchlist(full, "NVDA", AT);
    expect(over.ok).toBe(false);
    if (over.ok) throw new Error("expected a refusal");
    expect(over.reason).toContain(String(WATCHLIST_LIMIT));
  });

  it("leaves room on the 30-symbol socket the rows stream over", () => {
    // The cap exists so rows never quietly stop moving — the bench's own committed symbol rents
    // from the same connection (`quote-stream-hub.ts`'s SYMBOLS_PER_STREAM is 30).
    expect(WATCHLIST_LIMIT).toBeLessThan(30);
  });
});

describe("removeFromWatchlist", () => {
  it("drops the name and leaves the rest in order", () => {
    const dropped = removeFromWatchlist(list("NVDA", "AAPL", "TSLA"), "aapl");
    expect(dropped).toMatchObject({ ok: true, changed: true });
    if (!dropped.ok) throw new Error("expected ok");
    expect(dropped.list.map((row) => row.symbol)).toEqual(["NVDA", "TSLA"]);
  });

  it("treats removing an unwatched name as a no-op, not an error", () => {
    expect(removeFromWatchlist(list("NVDA"), "AAPL")).toMatchObject({ ok: true, changed: false });
  });
});

describe("foldWatchlistLines", () => {
  it("folds adds and removes into the list standing now", () => {
    const folded = foldWatchlistLines([
      { symbol: "NVDA", at: AT },
      { symbol: "AAPL", at: AT },
      { symbol: "NVDA", at: AT, removed: true },
    ]);
    expect(folded.map((row) => row.symbol)).toEqual(["AAPL"]);
  });

  it("sends a re-added name to the end — it is a new decision", () => {
    const folded = foldWatchlistLines([
      { symbol: "NVDA", at: "2026-10-01T00:00:00.000Z" },
      { symbol: "AAPL", at: "2026-10-02T00:00:00.000Z" },
      { symbol: "NVDA", at: "2026-10-03T00:00:00.000Z", removed: true },
      { symbol: "NVDA", at: "2026-10-04T00:00:00.000Z" },
    ]);
    expect(folded).toEqual([
      { symbol: "AAPL", at: "2026-10-02T00:00:00.000Z" },
      { symbol: "NVDA", at: "2026-10-04T00:00:00.000Z" },
    ]);
  });

  it("reads an empty ledger as an empty list", () => {
    expect(foldWatchlistLines([])).toEqual([]);
  });
});
