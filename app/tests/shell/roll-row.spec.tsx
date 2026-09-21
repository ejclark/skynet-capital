import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import type { DeskPosition } from "../../src/live/desk";
import type { DraftOrder, DraftResponse, NewLeg } from "../../src/live/draft-order";
import type { ChainData } from "../../src/live/options";
import { defaultRollExpiration, nearestListedStrike, RollRow } from "../../src/shell/roll-row";

/**
 * Roll as one ticket (#3407 P3 slice 3): the held contract closed and the target opened as the
 * two legs of one draft, driven through the draft route in order (add · add · validate ·
 * review · submit); a short is bought back at the ask and re-sold at the bid; the reviewed
 * Confirm names the net as the server computed it; a refusal anywhere stops in words.
 */

const chainFor = (expiration: string): ChainData => ({
  symbol: "MSFT",
  optionType: "put",
  expirations: ["2026-09-18", "2026-10-16", "2026-11-20"],
  expiration,
  spot: 430,
  rows: [
    { strike: 410, occSymbol: `MSFT${expiration}P410`, premium: 8, bid: 7.8, ask: 8.2 },
    { strike: 420, occSymbol: `MSFT${expiration}P420`, premium: 12, bid: 11.8, ask: 12.2 },
  ],
});
rstest.mock("../../src/live/options", () => ({
  fetchChain: (_symbol: string, _type: string, expiration?: string) =>
    Promise.resolve(chainFor(expiration ?? "2026-09-18")),
}));

const calls: Array<{ kind: string; leg?: NewLeg; tif?: string }> = [];
let refuseAt: string | undefined;
let executed = true;
const preview = {
  legCount: 2,
  pricedFully: true,
  netPremium: -80,
  maxGain: "uncapped" as const,
  maxLoss: 80,
  unlimitedLoss: false,
  undefinedRiskLegIds: [],
};
function answer(phase: DraftOrder["phase"], legs: DraftOrder["legs"]): DraftResponse {
  return { draft: { phase, legs, refusals: [], nextLegId: legs.length + 1 }, preview };
}
rstest.mock("../../src/live/draft-order", () => ({
  emptyDraft: () => ({ phase: "empty", legs: [], refusals: [], nextLegId: 1 }),
  addDraftLeg: (_desk: string, draft: DraftOrder, leg: NewLeg) => {
    calls.push({ kind: "add-leg", leg });
    const legs = [...draft.legs, { ...leg, id: `leg-${draft.legs.length + 1}` }];
    if (refuseAt === "add-leg")
      return Promise.resolve({ draft: { ...draft, refusals: ["no"] }, preview });
    return Promise.resolve(answer("drafting", legs));
  },
  validateDraft: (_desk: string, draft: DraftOrder) => {
    calls.push({ kind: "validate" });
    if (refuseAt === "validate")
      return Promise.resolve({
        draft: { ...draft, refusals: ["Training wheels are on"] },
        preview,
      });
    return Promise.resolve(answer("validated", draft.legs));
  },
  reviewDraft: (_desk: string, draft: DraftOrder) => {
    calls.push({ kind: "review" });
    return Promise.resolve(answer("reviewed", draft.legs));
  },
  submitDraftOrder: (_desk: string, draft: DraftOrder, tif?: string) => {
    calls.push({ kind: "submit", tif });
    return Promise.resolve(
      executed
        ? {
            ...answer("submitted", draft.legs),
            executed: true,
            orderId: "mleg-9",
            status: "accepted",
          }
        : {
            draft: { ...draft, refusals: ["The broker rejected the order: nope"] },
            preview,
            executed: false,
          },
    );
  },
}));

const heldShort: DeskPosition = {
  symbol: "MSFT260918P00420000",
  display: "MSFT $420 put · Sep 18",
  detail: "2 contracts",
  isOption: true,
  quantity: "-2",
  costPerShare: "$10.70",
  price: "$12.00",
  costBasis: "$2,140",
  value: "-$2,400",
  dayPl: "-$60",
  dayPct: "-2.5%",
  dayTone: "neg",
  totalPl: "-$260",
  totalPlRaw: -260,
  returnPct: "-12.1%",
  totalTone: "neg",
  weightPct: 3,
};

function mount(node: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

describe("defaultRollExpiration", () => {
  it("picks the next listed expiration, or the held one when it is the last", () => {
    expect(defaultRollExpiration(["2026-09-18", "2026-10-16"], "2026-09-18")).toBe("2026-10-16");
    expect(defaultRollExpiration(["2026-09-18"], "2026-09-18")).toBe("2026-09-18");
  });
});

describe("nearestListedStrike", () => {
  it("keeps a listed strike and otherwise picks the closest one the chain carries", () => {
    const rows = [
      { strike: 410, occSymbol: "a" },
      { strike: 425, occSymbol: "b" },
    ];
    expect(nearestListedStrike(rows, 410)).toBe(410);
    expect(nearestListedStrike(rows, 420)).toBe(425);
    expect(nearestListedStrike([], 420)).toBe(420);
  });
});

describe("RollRow", () => {
  beforeEach(() => {
    calls.length = 0;
    refuseAt = undefined;
    executed = true;
  });

  it("rolls a short out: buy back at the ask, re-sell at the bid, one draft, then submits with the TIF", async () => {
    let filled = 0;
    mount(<RollRow deskId="human-eric" position={heldShort} onFilled={() => filled++} />);
    // Both chains (held expiration, target expiration) must be in before a roll can be reviewed.
    await waitFor(() => expect(screen.getByLabelText("Strike")).not.toBeDisabled());
    expect((screen.getByLabelText("Roll to") as HTMLSelectElement).value).toBe("2026-10-16");
    fireEvent.change(screen.getByLabelText("Strike"), { target: { value: "410" } });
    fireEvent.click(screen.getByRole("button", { name: "GTC" }));
    fireEvent.click(screen.getByRole("button", { name: "Review roll…" }));
    const confirmButton = await screen.findByRole("button", { name: /Confirm roll/ });
    expect(calls.map((c) => c.kind)).toEqual(["add-leg", "add-leg", "validate", "review"]);
    expect(calls[0]?.leg).toEqual({
      underlying: "MSFT",
      optionType: "put",
      strike: 420,
      expiration: "2026-09-18",
      action: "buy",
      contracts: 2,
      limitPrice: 12.2,
    });
    expect(calls[1]?.leg).toEqual({
      underlying: "MSFT",
      optionType: "put",
      strike: 410,
      expiration: "2026-10-16",
      action: "sell",
      contracts: 2,
      limitPrice: 7.8,
    });
    expect(confirmButton.textContent).toContain("net debit $80.00");
    expect(confirmButton.textContent).toContain("GTC");
    fireEvent.click(confirmButton);
    await waitFor(() => expect(screen.getByText(/order mleg-9 accepted/)).toBeInTheDocument());
    expect(calls.at(-1)).toEqual({ kind: "submit", tif: "gtc" });
    expect(filled).toBe(1);
  });

  it("stops at the first refusal, in the server's words, and sends nothing", async () => {
    refuseAt = "validate";
    mount(<RollRow deskId="human-eric" position={heldShort} onFilled={() => undefined} />);
    await waitFor(() => expect(screen.getByLabelText("Strike")).not.toBeDisabled());
    fireEvent.click(screen.getByRole("button", { name: "Review roll…" }));
    await waitFor(() => expect(screen.getByText(/Training wheels are on/)).toBeInTheDocument());
    expect(calls.map((c) => c.kind)).toEqual(["add-leg", "add-leg", "validate"]);
    expect(screen.queryByRole("button", { name: /Confirm roll/ })).not.toBeInTheDocument();
  });

  it("reads a refused submit as not sent, never as done", async () => {
    executed = false;
    let filled = 0;
    mount(<RollRow deskId="human-eric" position={heldShort} onFilled={() => filled++} />);
    await waitFor(() => expect(screen.getByLabelText("Strike")).not.toBeDisabled());
    fireEvent.click(screen.getByRole("button", { name: "Review roll…" }));
    fireEvent.click(await screen.findByRole("button", { name: /Confirm roll/ }));
    await waitFor(() =>
      expect(screen.getByText(/The broker rejected the order: nope/)).toBeInTheDocument(),
    );
    expect(filled).toBe(0);
  });

  it("renders nothing for a symbol that isn't an option contract", () => {
    const { container } = mount(
      <RollRow
        deskId="human-eric"
        position={{ ...heldShort, symbol: "MSFT", isOption: false }}
        onFilled={() => undefined}
      />,
    );
    expect(container.querySelector(".tkt-roll-row")).toBeNull();
  });
});
