import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import type { ChainAnswer } from "../../src/live/options";
import { type ChainPick, ChainSection, chainPickTarget } from "../../src/shell/chain-section";

/**
 * The chain as its own section (#3407, Workbench slice 2): reads the committed symbol, shows the
 * straddle for the play's side, and a tap presets the ticket through the caller — strike and
 * side — under the ticket's own fail-safe rung rule (a locked target never presets a rung).
 */

const chainResult: ChainAnswer = {
  symbol: "NVDA",
  optionType: "put",
  expirations: ["2026-10-16", "2026-11-20"],
  expiration: "2026-10-16",
  spot: 181.3,
  rows: [
    { strike: 175, occSymbol: "NVDA261016P00175000", premium: 1.5, bid: 1.45, ask: 1.55 },
    { strike: 180, occSymbol: "NVDA261016P00180000", premium: 4.2, bid: 4.1, ask: 4.3 },
  ],
};
rstest.mock("../../src/live/options", () => ({
  fetchChain: () => Promise.resolve(chainResult),
  fetchQuote: () => Promise.resolve({ quoteNote: "Fixture quote note." }),
}));
rstest.mock("../../src/live/quote", () => ({
  fetchQuote: () => Promise.resolve({ quoteNote: "Fixture quote note." }),
}));

function withClient(node: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

const plays = [
  { code: "201", locked: false },
  { code: "202", locked: true },
  { code: "301", locked: false },
  { code: "302", locked: false },
] as never;

describe("ChainSection", () => {
  it("asks for a symbol, in words, when none is committed", () => {
    render(
      withClient(
        <ChainSection symbol="" play="201" strike="" plays={plays} onPick={() => undefined} />,
      ),
    );
    expect(screen.getByText(/Pick a symbol on the Ticket/)).toBeInTheDocument();
  });

  it("shows the straddle for the play's side and hands a bid tap back as a pick", async () => {
    const picks: ChainPick[] = [];
    render(
      withClient(
        <ChainSection
          symbol="NVDA"
          play="201"
          strike=""
          plays={plays}
          onPick={(p) => picks.push(p)}
        />,
      ),
    );
    await waitFor(() =>
      expect(screen.getByRole("region", { name: "NVDA options chain" })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Pick the 180 put bid" }));
    expect(picks).toEqual([{ strike: "180", side: "put" }]);
  });
});

describe("chainPickTarget — the ticket's own fail-safe rule", () => {
  it("keeps the side and flips the type; a stock play lands on the long side", () => {
    expect(chainPickTarget("201", "call", plays)).toEqual({ play: undefined, locked: true }); // 202 locked
    expect(chainPickTarget("301", "call", plays)).toEqual({ play: "302", locked: false });
    expect(chainPickTarget("101", "put", plays)).toEqual({ play: "301", locked: false });
  });

  it("presets nothing for the same rung, and reads an unknown target as locked", () => {
    expect(chainPickTarget("201", "put", plays)).toEqual({ play: undefined, locked: false });
    expect(chainPickTarget("301", "put", plays)).toEqual({ play: undefined, locked: false });
    expect(chainPickTarget("101", "call", undefined)).toEqual({ play: undefined, locked: true });
  });
});
