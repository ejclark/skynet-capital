import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ChainData, OptionDraft, OptionPreview, PlayInfo } from "../../src/live/options";
import { ExitPlanReview } from "../../src/shell/exit-plan-review";
import { OptionGate } from "../../src/shell/option-gate";

/**
 * THE EXIT PLAN IN THE REVIEW STEP (#5709 slice 3). Buying a call, the review shows the house's
 * long-call plan the server priced, with Carry and Skip and neither picked; only a Carry tap sends
 * `exitPlan: "carry"` with the order, and the receipt says the plan was carried. A new review
 * unpicks the choice — it was made against the old review's numbers.
 */

const submitted: OptionDraft[] = [];
let reviews = 0;

const plan = {
  paid: 5,
  multiple: 2,
  takeProfit: 10,
  gain: 500,
  exitDte: 45,
  timeStop: "2026-12-01",
  holdDays: 30,
};

const preview: OptionPreview = {
  code: "302",
  underlying: "NVDA",
  occSymbol: "NVDA270115C00180000",
  optionType: "call",
  side: "buy",
  positionIntent: "buy_to_open",
  contracts: 1,
  strike: 180,
  expiration: "2027-01-15",
  orderType: "limit",
  limitPrice: 5,
  timeInForce: "day",
  ok: true,
  estPremium: 5,
  estNotional: 500,
  maxLoss: 500,
  refusals: [],
  warnings: [],
  exitPlan: plan,
};

const chain: ChainData = {
  symbol: "NVDA",
  optionType: "call",
  expirations: ["2027-01-15"],
  expiration: "2027-01-15",
  spot: 180,
  rows: [{ strike: 180, occSymbol: "NVDA270115C00180000", premium: 5, bid: 4.8, ask: 5.2 }],
};

rstest.mock("../../src/live/options", () => ({
  fetchChain: () => Promise.resolve(chain),
  reviewOption: () => {
    reviews += 1;
    return Promise.resolve({ preview });
  },
  submitOption: (draft: OptionDraft) => {
    submitted.push(draft);
    return Promise.resolve({
      ok: true,
      orderId: "o-1",
      status: "accepted",
      symbol: "NVDA270115C00180000",
      ...(draft.kind === "open" && draft.exitPlan === "carry" ? { exitPlan: "carried" } : {}),
    });
  },
}));
rstest.mock("../../src/live/quote", () => ({
  fetchQuote: () => Promise.resolve({ quoteNote: "test fixture — no live quote" }),
}));
rstest.mock("../../src/live/desk", () => ({
  fetchDeskActivity: () => Promise.resolve({ available: true, activity: [] }),
  fetchDesk: () =>
    Promise.resolve({
      generatedAt: "2026-11-01T00:00:00Z",
      desk: { id: "desk-1", name: "Desk", kind: "human", positions: [], considerations: [] },
    }),
}));
rstest.mock("../../src/live/desk-events", () => ({ useOrderFill: () => undefined }));

const buyCall: PlayInfo = {
  code: "302",
  id: "302",
  name: "Buy Call",
  tldr: "",
  kind: "option",
  side: "buy",
  optionType: "call",
  gloss: "",
  locked: false,
  earned: true,
};

function renderGate() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <OptionGate deskId="desk-1" play={buyCall} initialSymbol="NVDA" initialStrike="180" />
    </QueryClientProvider>,
  );
}

async function reviewed(): Promise<void> {
  await waitFor(() => expect(screen.getByRole("button", { name: "Review order" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Review order" }));
  await screen.findByRole("region", { name: "Exit plan" });
}

beforeEach(() => {
  submitted.length = 0;
  reviews = 0;
});

describe("the options ticket's exit plan (#5709 slice 3)", () => {
  it("WHEN a member reviews a call purchase, the review SHALL show the take-profit and time stop with their numbers, neither choice picked", async () => {
    renderGate();
    await reviewed();
    const plan = screen.getByRole("region", { name: "Exit plan" });
    expect(plan).toHaveTextContent("$5.00");
    expect(plan).toHaveTextContent("$10.00");
    expect(plan).toHaveTextContent("take profit");
    expect(plan).toHaveTextContent("Dec 1, 2026");
    expect(plan).toHaveTextContent("30 days");
    expect(plan).toHaveTextContent("+$500.00");
    expect(screen.getByRole("button", { name: "Carry this plan" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "Skip it" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("an order submitted without a tap carries no plan — the plan is offered, never applied", async () => {
    renderGate();
    await reviewed();
    fireEvent.click(screen.getByRole("button", { name: /Submit order/ }));
    await waitFor(() => expect(submitted).toHaveLength(1));
    expect(submitted[0]).not.toHaveProperty("exitPlan");
    expect(screen.queryByText(/Exit plan carried/)).not.toBeInTheDocument();
  });

  it("WHEN the member taps Carry, the order SHALL carry the plan and the receipt SHALL say so", async () => {
    renderGate();
    await reviewed();
    fireEvent.click(screen.getByRole("button", { name: "Carry this plan" }));
    expect(screen.getByRole("button", { name: "✓ Carry this plan" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: /Submit order/ }));
    await waitFor(() => expect(submitted).toHaveLength(1));
    expect(submitted[0]).toMatchObject({ kind: "open", exitPlan: "carry" });
    expect(await screen.findByText(/Exit plan carried/)).toBeInTheDocument();
  });

  it("Skip sends no plan", async () => {
    renderGate();
    await reviewed();
    fireEvent.click(screen.getByRole("button", { name: "Skip it" }));
    fireEvent.click(screen.getByRole("button", { name: /Submit order/ }));
    await waitFor(() => expect(submitted).toHaveLength(1));
    expect(submitted[0]).not.toHaveProperty("exitPlan");
  });

  it("an edit after Carry returns to draft, and the next review starts unpicked", async () => {
    renderGate();
    await reviewed();
    fireEvent.click(screen.getByRole("button", { name: "Carry this plan" }));
    fireEvent.change(screen.getByLabelText("Contracts (100 shares)"), { target: { value: "2" } });
    expect(screen.queryByRole("region", { name: "Exit plan" })).not.toBeInTheDocument();
    await reviewed();
    expect(reviews).toBe(2);
    expect(screen.getByRole("button", { name: "Carry this plan" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});

describe("ExitPlanReview — a call already inside the time stop", () => {
  it("says there is no plan to carry, and offers no choice", () => {
    render(
      <ExitPlanReview
        plan={{ ...plan, holdDays: -10 }}
        expiration="2026-12-05"
        carry={undefined}
        onCarry={() => undefined}
        disabled={false}
      />,
    );
    expect(screen.getByText(/none to carry/)).toBeInTheDocument();
    expect(screen.getByText(/already inside the house's 45-day time stop/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
