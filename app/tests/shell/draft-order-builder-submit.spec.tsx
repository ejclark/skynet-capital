import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { DraftOrder, DraftResponse } from "../../src/live/draft-order";
import { DraftOrderBuilder } from "../../src/shell/draft-order-builder";

/**
 * The builder's confirm step (#3407 P3 slice 1): Day / GTC sits beside Confirm and rides the
 * submit; an executed submit reads "Confirmed" with the broker's echo and re-reads the working
 * orders list; a refused one stays on the review screen with the refusal in words.
 */

const reviewedDraft: DraftOrder = {
  phase: "reviewed",
  legs: [
    {
      id: "leg-1",
      underlying: "NVDA",
      optionType: "call",
      strike: 180,
      expiration: "2026-09-18",
      action: "sell",
      contracts: 1,
      limitPrice: 4.2,
    },
    {
      id: "leg-2",
      underlying: "NVDA",
      optionType: "call",
      strike: 200,
      expiration: "2026-09-18",
      action: "buy",
      contracts: 1,
      limitPrice: 1.1,
    },
  ],
  verdict: { ok: true, refusals: [], warnings: [] },
  refusals: [],
  nextLegId: 3,
};
const preview = {
  legCount: 2,
  pricedFully: true,
  netPremium: 310,
  maxGain: 310,
  maxLoss: 1690,
  unlimitedLoss: false,
  breakevens: [183.1],
  undefinedRiskLegIds: [],
};

const submits: unknown[] = [];
let nextSubmit: DraftResponse = { draft: reviewedDraft, preview };
rstest.mock("../../src/live/draft-order", () => ({
  emptyDraft: () => reviewedDraft,
  addDraftLeg: () => Promise.reject(new Error("not used")),
  removeDraftLeg: () => Promise.reject(new Error("not used")),
  validateDraft: () => Promise.reject(new Error("not used")),
  reviewDraft: () => Promise.reject(new Error("not used")),
  submitDraftOrder: (_desk: string, _draft: DraftOrder, tif?: string) => {
    submits.push(tif);
    return Promise.resolve(nextSubmit);
  },
}));
rstest.mock("../../src/live/options", () => ({
  // Never resolves — the leg form is not under test here, and it never mounts on a reviewed draft.
  fetchChain: () =>
    new Promise(() => {
      // deliberately pending
    }),
}));

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidated: unknown[] = [];
  client.invalidateQueries = ((filters: unknown) => {
    invalidated.push(filters);
    return Promise.resolve();
  }) as typeof client.invalidateQueries;
  render(
    <QueryClientProvider client={client}>
      <DraftOrderBuilder deskId="human-eric" />
    </QueryClientProvider>,
  );
  return { invalidated };
}

describe("DraftOrderBuilder — confirm", () => {
  beforeEach(() => {
    submits.length = 0;
  });

  it("sends the picked time in force with the confirm and re-reads working orders on execute", async () => {
    nextSubmit = {
      draft: { ...reviewedDraft, phase: "submitted" },
      preview,
      executed: true,
      orderId: "mleg-1",
      status: "accepted",
      note: "Order mleg-1 accepted — one net limit.",
    };
    const { invalidated } = mount();
    fireEvent.click(screen.getByRole("button", { name: "GTC" }));
    fireEvent.click(screen.getByRole("button", { name: /Confirm order · GTC/ }));
    await waitFor(() => expect(screen.getByText("Confirmed")).toBeInTheDocument());
    expect(submits).toEqual(["gtc"]);
    expect(screen.getByText(/Order mleg-1 accepted/)).toBeInTheDocument();
    expect(invalidated).toEqual([{ queryKey: ["desk-orders", "human-eric"] }]);
  });

  it("stays on the review screen, refusal in words, when the seam refused", async () => {
    nextSubmit = {
      draft: { ...reviewedDraft, refusals: ["The broker rejected the order: no level 3"] },
      preview,
      executed: false,
    };
    const { invalidated } = mount();
    fireEvent.click(screen.getByRole("button", { name: /Confirm order · Day/ }));
    await waitFor(() =>
      expect(screen.getByText(/The broker rejected the order: no level 3/)).toBeInTheDocument(),
    );
    expect(submits).toEqual([undefined]);
    expect(screen.queryByText("Confirmed")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Confirm order/ })).toBeInTheDocument();
    expect(invalidated).toEqual([]);
  });
});
