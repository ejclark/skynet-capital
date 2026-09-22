import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { DraftOrder, DraftResponse } from "../../src/live/draft-order";
import { DraftOrderBuilder } from "../../src/shell/draft-order-builder";

/**
 * The builder while drafting (#3407 P3 slice 4): a leg's row reprices through the server's own
 * action with the leg's id, and the running net line reads the server's number before review.
 */

const drafting: DraftOrder = {
  phase: "drafting",
  legs: [
    {
      id: "leg-1",
      underlying: "NVDA",
      optionType: "call",
      strike: 180,
      expiration: "2026-09-18",
      action: "sell",
      contracts: 2,
      limitPrice: 4.2,
    },
    {
      id: "leg-2",
      underlying: "NVDA",
      optionType: "call",
      strike: 200,
      expiration: "2026-09-18",
      action: "buy",
      contracts: 2,
      limitPrice: 1.1,
    },
  ],
  refusals: [],
  nextLegId: 3,
};
const preview = {
  legCount: 2,
  pricedFully: true,
  netPremium: 620,
  maxGain: 620,
  maxLoss: 3380,
  unlimitedLoss: false,
  undefinedRiskLegIds: [],
};

const reprices: Array<{ id: string; limitPrice: number | undefined }> = [];
rstest.mock("../../src/live/draft-order", () => ({
  emptyDraft: () => drafting,
  addDraftLeg: () => Promise.reject(new Error("not used")),
  removeDraftLeg: () => Promise.reject(new Error("not used")),
  validateDraft: () => Promise.reject(new Error("not used")),
  reviewDraft: () => Promise.reject(new Error("not used")),
  submitDraftOrder: () => Promise.reject(new Error("not used")),
  repriceDraftLeg: (
    _desk: string,
    draft: DraftOrder,
    id: string,
    limitPrice: number | undefined,
  ): Promise<DraftResponse> => {
    reprices.push({ id, limitPrice });
    const legs = draft.legs.map((leg) =>
      leg.id === id ? { ...leg, limitPrice: limitPrice as number } : leg,
    );
    return Promise.resolve({
      draft: { ...draft, legs },
      preview: { ...preview, netPremium: 650 },
    });
  },
}));
rstest.mock("../../src/live/options", () => ({
  fetchChain: () =>
    new Promise(() => {
      // deliberately pending — the leg form is not under test here
    }),
}));

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <DraftOrderBuilder deskId="human-eric" />
    </QueryClientProvider>,
  );
}

describe("DraftOrderBuilder — pricing the legs", () => {
  it("reprices a leg by id from its row and updates the running net from the echo", async () => {
    mount();
    // No preview until a server answer carries one — the running net waits for the echo.
    expect(screen.queryByText(/Running net/)).not.toBeInTheDocument();
    const field = screen.getByLabelText(/Premium per share for Sell 2 NVDA/);
    fireEvent.change(field, { target: { value: "4.35" } });
    fireEvent.keyDown(field, { key: "Enter" });
    await waitFor(() =>
      expect(screen.getByText(/Running net credit \$650\.00/)).toBeInTheDocument(),
    );
    expect(reprices).toEqual([{ id: "leg-1", limitPrice: 4.35 }]);
    expect(
      (screen.getByLabelText(/Premium per share for Sell 2 NVDA/) as HTMLInputElement).value,
    ).toBe("4.35");
  });
});
