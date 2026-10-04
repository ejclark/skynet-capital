import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import type { QuoteAnswer } from "../../src/live/quote";
import type { WatchlistAnswer, WatchlistResult } from "../../src/live/watchlist";
import { WatchlistSection } from "../../src/shell/watchlist-section";

/**
 * The watchlist pane (#3407 P4 / #4332): the member's names with their prices, one tap from any
 * row onto the bench, a toggle that sends the state it wants, the server's own refusal shown
 * verbatim, and a live mark only where a frame actually carried the feed's own time.
 */

let list: WatchlistAnswer = { available: true, limit: 20, watching: [] };
let result: WatchlistResult = { ok: true, watching: [] };
const toggles: { symbol: string; watching: boolean }[] = [];
rstest.mock("../../src/live/watchlist", () => ({
  watchlistKey: ["watchlist"],
  watchlistQuery: { queryKey: ["watchlist"], queryFn: () => Promise.resolve(list) },
  setWatching: (symbol: string, watching: boolean) => {
    toggles.push({ symbol, watching });
    return Promise.resolve(result);
  },
}));

let quotes: Record<string, QuoteAnswer> = {};
rstest.mock("../../src/live/quote-query", () => ({
  quoteQuery: (symbol: string) => ({
    queryKey: ["quote", symbol],
    queryFn: () => Promise.resolve(quotes[symbol] ?? { quoteNote: "no quote" }),
    enabled: symbol !== "",
  }),
}));

// The socket is the route's business (`tests/server/quote-stream-route.spec.ts`); this pane only
// has to open ONE for the whole set, which the mock records.
const streamed: string[][] = [];
rstest.mock("../../src/live/quote-stream", () => ({
  useQuoteStreamSet: (symbols: readonly string[]) => {
    streamed.push([...symbols]);
  },
}));

function withClient(node: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

const row = (symbol: string) => ({ symbol, at: "2026-10-01T00:00:00.000Z" });

describe("WatchlistSection", () => {
  beforeEach(() => {
    toggles.length = 0;
    streamed.length = 0;
    quotes = {};
    list = { available: true, limit: 20, watching: [] };
    result = { ok: true, watching: [] };
  });

  it("says what an empty list is for rather than showing nothing", async () => {
    render(withClient(<WatchlistSection symbol="" onPick={() => undefined} />));
    await waitFor(() => expect(screen.getByText(/Nothing here yet/)).toBeInTheDocument());
  });

  it("says in the server's own words when nothing is stored on this deployment", async () => {
    list = { available: false, limit: 20, watching: [], reason: "Watchlists aren't stored here." };
    render(withClient(<WatchlistSection symbol="" onPick={() => undefined} />));
    await waitFor(() =>
      expect(screen.getByText("Watchlists aren't stored here.")).toBeInTheDocument(),
    );
  });

  it("draws a row's price with a live mark only when a frame carried the feed's own time", async () => {
    list = { available: true, limit: 20, watching: [row("NVDA"), row("AAPL")] };
    quotes = {
      NVDA: {
        symbol: "NVDA",
        last: 178.42,
        change: 2.31,
        changePct: 1.31,
        tone: "pos",
        asOf: "2026-10-04T18:00:00Z",
      },
      AAPL: { symbol: "AAPL", last: 225.1, change: -0.88, changePct: -0.39, tone: "neg" },
    };
    render(withClient(<WatchlistSection symbol="" onPick={() => undefined} />));
    await waitFor(() => expect(screen.getByText("$178.42")).toBeInTheDocument());
    // Direction never rides on hue: a glyph and a signed number carry it (quote-change.tsx).
    expect(screen.getByText(/▲/)).toBeInTheDocument();
    expect(screen.getByText(/▼/)).toBeInTheDocument();
    // One streamed row, one not — the unstreamed row makes no claim about its age.
    expect(screen.getAllByText("live")).toHaveLength(1);
    expect(screen.getByText(/shows the last price read, not a moving one/)).toBeInTheDocument();
  });

  it("opens one stream for the whole set, not one per row", async () => {
    list = { available: true, limit: 20, watching: [row("NVDA"), row("AAPL"), row("TSLA")] };
    render(withClient(<WatchlistSection symbol="" onPick={() => undefined} />));
    await waitFor(() => expect(screen.getByText("NVDA")).toBeInTheDocument());
    expect(streamed.at(-1)).toEqual(["NVDA", "AAPL", "TSLA"]);
  });

  it("hands the row's symbol back when a row is tapped", async () => {
    list = { available: true, limit: 20, watching: [row("NVDA")] };
    const picked: string[] = [];
    render(withClient(<WatchlistSection symbol="" onPick={(s) => picked.push(s)} />));
    await waitFor(() => expect(screen.getByText("NVDA")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /NVDA.*open it on the bench/ }));
    expect(picked).toEqual(["NVDA"]);
  });

  it("offers the bench's committed symbol as one tap, and stops offering once it is watched", async () => {
    render(withClient(<WatchlistSection symbol="nvda" onPick={() => undefined} />));
    await waitFor(() => expect(screen.getByRole("button", { name: "Watch NVDA" })).toBeEnabled());
    result = { ok: true, watching: [row("NVDA")] };
    fireEvent.click(screen.getByRole("button", { name: "Watch NVDA" }));
    await waitFor(() => expect(screen.getByText("NVDA")).toBeInTheDocument());
    expect(toggles).toEqual([{ symbol: "NVDA", watching: true }]);
    expect(screen.queryByRole("button", { name: "Watch NVDA" })).toBeNull();
  });

  it("asks for a removal as the state it wants, and shows the list the server answered with", async () => {
    list = { available: true, limit: 20, watching: [row("NVDA"), row("AAPL")] };
    result = { ok: true, watching: [row("AAPL")] };
    render(withClient(<WatchlistSection symbol="" onPick={() => undefined} />));
    await waitFor(() => expect(screen.getByText("NVDA")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Stop watching NVDA" }));
    await waitFor(() => expect(screen.queryByText("NVDA")).toBeNull());
    expect(toggles).toEqual([{ symbol: "NVDA", watching: false }]);
  });

  it("announces the price and its direction as part of the row's own name", async () => {
    // An `aria-label` would REPLACE the contents as the accessible name and silence the
    // `.visually-hidden` sentence `quote-change.tsx` exists to speak — a screen reader would hear
    // the ticker and the action, and nothing about the money.
    list = { available: true, limit: 20, watching: [row("NVDA")] };
    quotes = {
      NVDA: { symbol: "NVDA", last: 178.42, change: 2.31, changePct: 1.31, tone: "pos" },
    };
    render(withClient(<WatchlistSection symbol="" onPick={() => undefined} />));
    await waitFor(() => expect(screen.getByText("$178.42")).toBeInTheDocument());
    expect(
      screen.getByRole("button", { name: /NVDA.*up 2\.31 dollars, 1\.31 percent/ }),
    ).toBeInTheDocument();
  });

  it("does not add a half-typed name just because the field lost focus", async () => {
    // Tapping a row blurs the input first; `SymbolField` commits on blur everywhere it writes a
    // reversible `?symbol=`, and a durable append is not that.
    list = { available: true, limit: 20, watching: [row("NVDA")] };
    render(withClient(<WatchlistSection symbol="" onPick={() => undefined} />));
    await waitFor(() => expect(screen.getByText("NVDA")).toBeInTheDocument());
    const field = screen.getByLabelText("Watch a name");
    fireEvent.change(field, { target: { value: "TS" } });
    fireEvent.blur(field);
    expect(toggles).toEqual([]);
    // Enter still commits, so nothing a member MEANT to do was taken away.
    fireEvent.change(field, { target: { value: "TSLA" } });
    fireEvent.keyDown(field, { key: "Enter" });
    await waitFor(() => expect(toggles).toEqual([{ symbol: "TSLA", watching: true }]));
  });

  it("keeps the list on screen when the server refuses a name it never read the list for", async () => {
    // The bad-symbol refusal is decided before the route has the list; adopting its `watching`
    // verbatim would blank the member's whole list — and close the shared stream with it.
    list = { available: true, limit: 20, watching: [row("NVDA"), row("AAPL")] };
    result = { ok: false, refusals: ["That doesn't read as a ticker"], watching: [] };
    render(withClient(<WatchlistSection symbol="" onPick={() => undefined} />));
    await waitFor(() => expect(screen.getByText("NVDA")).toBeInTheDocument());
    const field = screen.getByLabelText("Watch a name");
    fireEvent.change(field, { target: { value: "NVIDIA" } });
    fireEvent.keyDown(field, { key: "Enter" });
    await waitFor(() => expect(screen.getByText(/doesn't read as a ticker/)).toBeInTheDocument());
    expect(screen.getByText("NVDA")).toBeInTheDocument();
    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(streamed.at(-1)).toEqual(["NVDA", "AAPL"]);
  });

  it("shows the server's refusal verbatim and leaves the list alone", async () => {
    list = { available: true, limit: 2, watching: [row("NVDA"), row("AAPL")] };
    result = {
      ok: false,
      refusals: ["Your watchlist holds 2 names, the most that stay live on one connection."],
      watching: [row("NVDA"), row("AAPL")],
    };
    render(withClient(<WatchlistSection symbol="TSLA" onPick={() => undefined} />));
    await waitFor(() => expect(screen.getByRole("button", { name: "Watch TSLA" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Watch TSLA" }));
    await waitFor(() => expect(screen.getByText(/the most that stay live/)).toBeInTheDocument());
    expect(screen.getByText(/2 of 2 names/)).toBeInTheDocument();
  });
});
