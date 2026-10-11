import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import type { ChainAnswer } from "../../src/live/options";
import {
  CHAIN_TAP_COPY,
  type ChainPick,
  ChainSection,
  chainPickLeg,
  chainPickTarget,
  lockedTapNote,
} from "../../src/shell/chain-section";

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
const chainCalls: unknown[][] = [];
rstest.mock("../../src/live/options", () => ({
  fetchChain: (...args: unknown[]) => {
    chainCalls.push(args);
    return Promise.resolve(chainResult);
  },
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
    // The expiration travels with the strike (slice 4a) — the contract is not named without it.
    // `cell` (#3407) is what a bid/ask pick is — a strike-only pick never carries one.
    expect(picks).toEqual([
      { strike: "180", side: "put", expiration: "2026-10-16", cell: { price: "bid", value: 4.1 } },
    ]);
  });

  // The words and the behaviour, pinned together (#5166): the line promised "tap a bid to sell it"
  // for weeks while a bid opened a buy at the mid. `chainPickTarget`'s bid/ask rows below are the
  // behaviour half; this is the words half.
  it("says a bid sells at the bid and an ask buys at the ask, off the Spread rung", async () => {
    render(
      withClient(
        <ChainSection symbol="NVDA" play="302" strike="" plays={plays} onPick={() => undefined} />,
      ),
    );
    expect(await screen.findByText(CHAIN_TAP_COPY)).toBeInTheDocument();
    expect(CHAIN_TAP_COPY).toMatch(/bid to sell that contract at the bid/);
    expect(CHAIN_TAP_COPY).toMatch(/ask to buy it at the ask/);
    expect(chainPickTarget("302", "call", plays, "bid").target).toBe("202"); // sell to open
    expect(chainPickTarget("202", "call", plays, "ask")).toMatchObject({ play: "302" }); // buy
  });

  it("reads spread-aware copy on the Spread rung (#3407)", async () => {
    render(
      withClient(
        <ChainSection symbol="NVDA" play="401" strike="" plays={plays} onPick={() => undefined} />,
      ),
    );
    await waitFor(() =>
      expect(screen.getByRole("region", { name: "NVDA options chain" })).toBeInTheDocument(),
    );
    expect(screen.getByText(/it's added as a leg to your spread/)).toBeInTheDocument();
    expect(screen.queryByText(/the ticket opens preset/)).not.toBeInTheDocument();
  });

  it("starts on the expiration the URL names and reports a browse to another one (slice 4a)", async () => {
    chainCalls.length = 0;
    const changes: string[] = [];
    render(
      withClient(
        <ChainSection
          symbol="NVDA"
          play="201"
          strike=""
          plays={plays}
          initialExpiration="2026-11-20"
          onExpirationChange={(e) => changes.push(e)}
          onPick={() => undefined}
        />,
      ),
    );
    const oct = await screen.findByRole("button", { name: /Oct 16/ });
    expect(chainCalls[0]).toEqual(["NVDA", "put", "2026-11-20"]);
    fireEvent.click(oct);
    expect(changes).toEqual(["2026-10-16"]);
  });
});

describe("chainPickTarget — the ticket's own fail-safe rule", () => {
  it("a bare strike tap keeps the side and flips the type; a stock play lands on the long side", () => {
    expect(chainPickTarget("201", "call", plays)).toEqual({
      play: undefined,
      locked: true,
      target: "202",
    }); // 202 locked
    expect(chainPickTarget("301", "call", plays)).toEqual({
      play: "302",
      locked: false,
      target: "302",
    });
    expect(chainPickTarget("101", "put", plays)).toEqual({
      play: "301",
      locked: false,
      target: "301",
    });
  });

  // #5166: the cell says the side — the 225 call bid on "Buy a long call" used to open a buy.
  it("a bid sells to open and an ask buys to open, whatever rung the ticket was on", () => {
    expect(chainPickTarget("301", "put", plays, "bid")).toMatchObject({ play: "201" });
    expect(chainPickTarget("101", "put", plays, "bid")).toMatchObject({ play: "201" });
    expect(chainPickTarget("201", "put", plays, "ask")).toMatchObject({ play: "301" });
    expect(chainPickTarget("201", "call", plays, "ask")).toMatchObject({ play: "302" });
    expect(chainPickTarget("201", "put", plays, "bid")).toMatchObject({ play: undefined }); // same rung
  });

  it("never widens a locked rung from a bid — the strike travels, the rung stays", () => {
    // 202 (the covered call) is locked in this fixture; there is no uncovered-call rung to fall to.
    expect(chainPickTarget("302", "call", plays, "bid")).toEqual({
      play: undefined,
      locked: true,
      target: "202",
    });
  });

  it("presets nothing for the same rung, and reads an unknown target as locked", () => {
    expect(chainPickTarget("201", "put", plays)).toEqual({
      play: undefined,
      locked: false,
      target: "201",
    });
    expect(chainPickTarget("301", "put", plays)).toEqual({
      play: undefined,
      locked: false,
      target: "301",
    });
    expect(chainPickTarget("101", "call", undefined)).toEqual({
      play: undefined,
      locked: true,
      target: "302",
    });
  });
});

describe("lockedTapNote — why the side stayed", () => {
  it("names the refused rung, and says the strike filled only where one did", () => {
    expect(lockedTapNote("Sell a covered call", true)).toBe(
      "Strike filled — “Sell a covered call” isn't unlocked yet, so the side didn't change.",
    );
    expect(lockedTapNote("Sell a covered call", false)).toBe(
      "“Sell a covered call” isn't unlocked yet, so the ticket didn't change.",
    );
    expect(lockedTapNote(undefined, false)).toBe(
      "That side isn't unlocked yet, so the ticket didn't change.",
    );
  });
});

describe("chainPickLeg — turning a chain pick into a Spread leg (#3407)", () => {
  const bidPick: ChainPick = {
    strike: "180",
    side: "put",
    expiration: "2026-10-16",
    cell: { price: "bid", value: 4.1 },
  };
  const askPick: ChainPick = {
    strike: "170",
    side: "put",
    expiration: "2026-10-16",
    cell: { price: "ask", value: 1.6 },
  };
  const barePick: ChainPick = { strike: "180", side: "put", expiration: "2026-10-16" };

  it("turns a bid into a sell leg and an ask into a buy leg, priced at the tapped cell", () => {
    expect(chainPickLeg("401", "NVDA", bidPick)).toEqual({
      underlying: "NVDA",
      optionType: "put",
      strike: 180,
      expiration: "2026-10-16",
      action: "sell",
      contracts: 1,
      limitPrice: 4.1,
    });
    expect(chainPickLeg("401", "NVDA", askPick)).toEqual({
      underlying: "NVDA",
      optionType: "put",
      strike: 170,
      expiration: "2026-10-16",
      action: "buy",
      contracts: 1,
      limitPrice: 1.6,
    });
  });

  it("is not a leg pick off the Spread rung, for a bare strike tap, or with no committed symbol", () => {
    expect(chainPickLeg("201", "NVDA", bidPick)).toBeUndefined();
    expect(chainPickLeg("401", "NVDA", barePick)).toBeUndefined();
    expect(chainPickLeg("401", "", bidPick)).toBeUndefined();
  });

  it("omits limitPrice for a quoted '—' cell instead of pricing the leg at 0", () => {
    const noQuote: ChainPick = {
      strike: "180",
      side: "put",
      expiration: "2026-10-16",
      cell: { price: "bid" },
    };
    expect(chainPickLeg("401", "NVDA", noQuote)).toEqual({
      underlying: "NVDA",
      optionType: "put",
      strike: 180,
      expiration: "2026-10-16",
      action: "sell",
      contracts: 1,
    });
  });
});
