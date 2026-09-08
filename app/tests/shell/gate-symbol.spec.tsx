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
rstest.mock("../../src/live/options", () => ({
  fetchChain: (symbol: string) => {
    chainCalls.push(symbol);
    return Promise.resolve({ chainNote: "test fixture — no live chain" });
  },
  reviewOption: () => Promise.reject(new Error("not used in this spec")),
  submitOption: () => Promise.reject(new Error("not used in this spec")),
}));
// Both gates now mount `QuoteHeader`, which would otherwise fire a real fetch in jsdom.
rstest.mock("../../src/live/quote", () => ({
  fetchQuote: () => Promise.resolve({ quoteNote: "test fixture — no live quote" }),
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
