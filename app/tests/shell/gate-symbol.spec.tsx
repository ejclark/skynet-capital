import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { PlayInfo } from "../../src/live/options";
import { OptionGate } from "../../src/shell/option-gate";
import { TradeGate } from "../../src/shell/trade-gate";

/**
 * `initialSymbol` / `onSymbolCommit` (#738 cockpit plan, red-team finding) — the symbol lives in
 * `?symbol=` route state so it survives the remount every Instrument/Side switch causes. These
 * specs pin the gates' half of the contract: a fresh mount starts filled from `initialSymbol` (and,
 * for the options ticket, the chain fetch fires immediately for it), and committing a symbol calls
 * back out so the route can keep the URL in sync. The route's own half (writing `?symbol=`,
 * dropping an invalid value) is covered in tests/routes/trade-search.spec.ts and
 * tests/live/symbol.spec.ts.
 */

const chainCalls: string[] = [];
const degradedChain = { chainNote: "test fixture — no live chain", reason: "failed" };
let nextChain: unknown = degradedChain;
rstest.mock("../../src/live/options", () => ({
  fetchChain: (symbol: string) => {
    chainCalls.push(symbol);
    return Promise.resolve(nextChain);
  },
  reviewOption: () => Promise.reject(new Error("not used in this spec")),
  submitOption: () => Promise.reject(new Error("not used in this spec")),
}));
// Both gates now mount `QuoteHeader`, which would otherwise fire a real fetch in jsdom.
const quoteCalls: string[] = [];
rstest.mock("../../src/live/quote", () => ({
  fetchQuote: (symbol: string) => {
    quoteCalls.push(symbol);
    return Promise.resolve({ quoteNote: "test fixture — no live quote" });
  },
}));
// Both gates now mount `RecentOrdersStrip` (#2017 Phase 1 slice 13), same reason — TradeGate's
// `quoteSym` is seeded from `initialSymbol` immediately, so it fires without waiting for a commit
// — and the options gate's held-badge desk query (Eric, 2026-09-22) fires unconditionally too.
rstest.mock("../../src/live/desk", () => ({
  fetchDeskActivity: () => Promise.resolve({ available: true, activity: [] }),
  fetchDesk: () =>
    Promise.resolve({
      generatedAt: "2026-09-21T00:00:00Z",
      desk: { id: "desk-1", name: "Desk", kind: "human", positions: [], considerations: [] },
    }),
}));

const unlockedOptionPlay: PlayInfo = {
  code: "201",
  id: "201",
  name: "Buy Call",
  tldr: "",
  kind: "option",
  side: "buy",
  optionType: "call",
  gloss: "",
  locked: false,
  earned: true,
};

beforeEach(() => {
  chainCalls.length = 0;
  quoteCalls.length = 0;
  nextChain = degradedChain;
});

describe("TradeGate — initial symbol and commit", () => {
  it("starts the symbol field filled from initialSymbol", () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <TradeGate deskId="desk-1" initialSymbol="NVDA" />
      </QueryClientProvider>,
    );

    expect(screen.getByLabelText("Symbol")).toHaveValue("NVDA");
  });

  it("calls onSymbolCommit when the symbol field commits", () => {
    let committed: string | undefined;
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <TradeGate
          deskId="desk-1"
          onSymbolCommit={(s) => {
            committed = s;
          }}
        />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByLabelText("Symbol"), { target: { value: "aapl" } });
    fireEvent.blur(screen.getByLabelText("Symbol"));

    expect(committed).toBe("AAPL");
  });
});

describe("OptionGate — initial symbol and commit", () => {
  it("fetches no quote of its own — the header reads it off the chain answer (#3299 slice 1)", async () => {
    nextChain = {
      symbol: "NVDA",
      optionType: "call",
      expirations: ["2026-10-16"],
      expiration: "2026-10-16",
      spot: 181.32,
      quote: { symbol: "NVDA", last: 181.32, change: 2.14, changePct: 1.19, tone: "pos" },
      quotes: { source: "indicative", quoted: 1, total: 1, asOf: "2026-09-21T14:00:00Z" },
      rows: [{ strike: 180, occSymbol: "NVDA261016C00180000", bid: 4.1, ask: 4.3, premium: 4.2 }],
    };
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <OptionGate deskId="desk-1" play={unlockedOptionPlay} initialSymbol="NVDA" plays={[]} />
      </QueryClientProvider>,
    );
    await waitFor(() =>
      expect(document.querySelector(".quote-header .quote-last")).toHaveTextContent("$181.32"),
    );
    // the chain fetch re-keys once the server names the expiration; what matters is the quote
    expect(chainCalls[0]).toBe("NVDA");
    expect(quoteCalls).toEqual([]);
  });

  it("falls back to its own quote fetch when the chain degrades, so a symbol with no options still quotes", async () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <OptionGate deskId="desk-1" play={unlockedOptionPlay} initialSymbol="NVDA" plays={[]} />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(chainCalls).toEqual(["NVDA"]));
    await waitFor(() => expect(quoteCalls).toEqual(["NVDA"]));
  });

  it("starts the symbol field filled from initialSymbol and fetches the chain for it", async () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <OptionGate deskId="desk-1" play={unlockedOptionPlay} initialSymbol="NVDA" />
      </QueryClientProvider>,
    );

    expect(screen.getByLabelText("Symbol")).toHaveValue("NVDA");
    await waitFor(() => expect(chainCalls).toContain("NVDA"));
  });

  it("does not fetch a chain on a fresh mount with no initialSymbol", () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <OptionGate deskId="desk-1" play={unlockedOptionPlay} />
      </QueryClientProvider>,
    );

    expect(screen.getByLabelText("Symbol")).toHaveValue("");
    expect(chainCalls).toEqual([]);
  });

  it("calls onSymbolCommit when the symbol field commits", () => {
    let committed: string | undefined;
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <OptionGate
          deskId="desk-1"
          play={unlockedOptionPlay}
          onSymbolCommit={(s) => {
            committed = s;
          }}
        />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByLabelText("Symbol"), { target: { value: "tsla" } });
    fireEvent.blur(screen.getByLabelText("Symbol"));

    expect(committed).toBe("TSLA");
  });
});
