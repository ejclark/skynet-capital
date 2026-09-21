import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import type { DraftLeg, NewLeg } from "../../src/live/draft-order";
import type { ChainData } from "../../src/live/options";
import { DraftLegForm } from "../../src/shell/draft-leg-form";

/**
 * The chain as the leg picker (#3407 P3 slice 2): once a symbol resolves a chain, a tap on a
 * Bid is a sell leg and a tap on an Ask is a buy leg, at that price, sized by the Contracts
 * field; a "—" cell falls back to the row's mid; strikes already in the draft are outlined. With
 * no chain the typed fields still add a leg.
 */

const chainRows = [
  { strike: 180, occSymbol: "NVDA180", premium: 5, bid: 4.8, ask: 5.2 },
  { strike: 200, occSymbol: "NVDA200", premium: 1.2 },
];
const chain: ChainData = {
  symbol: "NVDA",
  optionType: "call",
  expirations: ["2026-09-18", "2026-10-16"],
  expiration: "2026-09-18",
  spot: 181,
  rows: chainRows,
};
let chainAnswer: ChainData | { chainNote: string } = chain;
rstest.mock("../../src/live/options", () => ({
  fetchChain: () => Promise.resolve(chainAnswer),
}));

function mount(node: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

async function commitSymbol() {
  const input = screen.getByLabelText("Underlying");
  fireEvent.change(input, { target: { value: "nvda" } });
  fireEvent.keyDown(input, { key: "Enter" });
  await screen.findByRole("button", { name: "Pick the 180 call bid" });
}

describe("DraftLegForm — the chain as the leg picker", () => {
  beforeEach(() => {
    chainAnswer = chain;
  });

  it("adds a sell leg at the bid and a buy leg at the ask, sized by Contracts", async () => {
    const added: NewLeg[] = [];
    mount(<DraftLegForm busy={false} onAdd={(leg) => added.push(leg)} />);
    await commitSymbol();
    fireEvent.change(screen.getByLabelText("Contracts"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Pick the 180 call bid" }));
    fireEvent.click(screen.getByRole("button", { name: "Pick the 180 put ask" }));
    expect(added).toEqual([
      {
        underlying: "NVDA",
        optionType: "call",
        strike: 180,
        expiration: "2026-09-18",
        action: "sell",
        contracts: 2,
        limitPrice: 4.8,
      },
      {
        underlying: "NVDA",
        optionType: "put",
        strike: 180,
        expiration: "2026-09-18",
        action: "buy",
        contracts: 2,
        limitPrice: 5.2,
      },
    ]);
  });

  it("falls back to the row's mid when the tapped cell had no quote", async () => {
    const added: NewLeg[] = [];
    mount(<DraftLegForm busy={false} onAdd={(leg) => added.push(leg)} />);
    await commitSymbol();
    fireEvent.click(screen.getByRole("button", { name: "Pick the 200 call ask" }));
    expect(added[0]).toMatchObject({ strike: 200, action: "buy", limitPrice: 1.2 });
  });

  it("outlines the strikes the draft already holds on this expiration", async () => {
    const held: DraftLeg = {
      id: "leg-1",
      underlying: "NVDA",
      optionType: "call",
      strike: 180,
      expiration: "2026-09-18",
      action: "sell",
      contracts: 1,
      limitPrice: 4.8,
    };
    const { container } = mount(
      <DraftLegForm busy={false} legs={[held]} onAdd={() => undefined} />,
    );
    await commitSymbol();
    expect(container.querySelectorAll(".straddle-marked")).toHaveLength(1);
  });

  it("adds nothing while busy or with a bad size", async () => {
    const added: NewLeg[] = [];
    mount(<DraftLegForm busy={false} onAdd={(leg) => added.push(leg)} />);
    await commitSymbol();
    fireEvent.change(screen.getByLabelText("Contracts"), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "Pick the 180 call bid" }));
    expect(added).toHaveLength(0);
  });

  it("keeps the typed fields for a symbol with no chain", async () => {
    chainAnswer = { chainNote: "no chain" };
    const added: NewLeg[] = [];
    mount(<DraftLegForm busy={false} onAdd={(leg) => added.push(leg)} />);
    const input = screen.getByLabelText("Underlying");
    fireEvent.change(input, { target: { value: "XYZ" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.change(screen.getByLabelText("Expiration"), { target: { value: "2026-12-18" } });
    fireEvent.change(screen.getByLabelText("Strike"), { target: { value: "40" } });
    fireEvent.change(screen.getByLabelText("Limit /share"), { target: { value: "1.5" } });
    fireEvent.click(await screen.findByRole("button", { name: "Add leg" }));
    expect(added).toEqual([
      {
        underlying: "XYZ",
        expiration: "2026-12-18",
        contracts: 1,
        optionType: "call",
        action: "sell",
        strike: 40,
        limitPrice: 1.5,
      },
    ]);
  });
});
