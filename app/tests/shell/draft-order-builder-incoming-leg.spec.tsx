import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { DraftOrder, NewLeg } from "../../src/live/draft-order";
import { DraftOrderBuilder } from "../../src/shell/draft-order-builder";

/**
 * A leg picked from the bench's standalone Chain section pane while the Spread ticket is on
 * screen (#3407 — "the chain pane adds legs on the Spread rung," banked once Workbench slice 2
 * shipped this pane browse-only): `incomingLeg` applies exactly once per distinct `key`, against
 * whichever draft is current when it arrives, and hands the pick back to the parent via
 * `onIncomingLegHandled` so a stale pick sitting in the parent can never replay on a remount.
 */

const legA: NewLeg = {
  underlying: "NVDA",
  optionType: "put",
  strike: 180,
  expiration: "2026-10-16",
  action: "sell",
  contracts: 1,
  limitPrice: 4.1,
};
const legB: NewLeg = {
  underlying: "NVDA",
  optionType: "put",
  strike: 170,
  expiration: "2026-10-16",
  action: "buy",
  contracts: 1,
  limitPrice: 1.5,
};

const addLegCalls: Array<{ draft: DraftOrder; leg: NewLeg }> = [];
rstest.mock("../../src/live/draft-order", () => ({
  emptyDraft: () => ({ phase: "empty" as const, legs: [], refusals: [], nextLegId: 1 }),
  addDraftLeg: (_desk: string, draft: DraftOrder, leg: NewLeg) => {
    addLegCalls.push({ draft, leg });
    const added = { ...leg, id: `leg-${draft.nextLegId}` };
    const legs = [...draft.legs, added];
    return Promise.resolve({
      draft: { phase: "drafting" as const, legs, refusals: [], nextLegId: draft.nextLegId + 1 },
      preview: {
        legCount: legs.length,
        pricedFully: true,
        maxGain: 0,
        maxLoss: 0,
        unlimitedLoss: false,
        undefinedRiskLegIds: [],
      },
    });
  },
  removeDraftLeg: () => Promise.reject(new Error("not used")),
  repriceDraftLeg: () => Promise.reject(new Error("not used")),
  validateDraft: () => Promise.reject(new Error("not used")),
  reviewDraft: () => Promise.reject(new Error("not used")),
  submitDraftOrder: () => Promise.reject(new Error("not used")),
}));
rstest.mock("../../src/live/options", () => ({
  fetchChain: () =>
    new Promise(() => {
      // deliberately pending — the leg form's own inline chain isn't under test here
    }),
}));

describe("DraftOrderBuilder — a leg picked from the standalone Chain pane (#3407)", () => {
  beforeEach(() => {
    addLegCalls.length = 0;
  });

  it("adds the leg once per distinct key, against whichever draft is current, and hands it back", async () => {
    const handled: number[] = [];
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { rerender } = render(
      <QueryClientProvider client={client}>
        <DraftOrderBuilder
          deskId="human-eric"
          incomingLeg={{ leg: legA, key: 1 }}
          onIncomingLegHandled={() => handled.push(1)}
        />
      </QueryClientProvider>,
    );
    // `.draft-leg-label` disambiguates from the reprice field's visually-hidden label, which
    // repeats the same leg label text as part of its own accessible name.
    await waitFor(() =>
      expect(
        screen.getByText(/Sell 1 NVDA \$180P/, { selector: ".draft-leg-label" }),
      ).toBeInTheDocument(),
    );
    expect(addLegCalls).toHaveLength(1);
    expect(addLegCalls[0]?.leg).toEqual(legA);
    expect(handled).toEqual([1]);

    // The parent re-rendering with the SAME key (its own pending pick not yet cleared, e.g. a
    // sibling state update) never re-applies the leg a second time.
    rerender(
      <QueryClientProvider client={client}>
        <DraftOrderBuilder
          deskId="human-eric"
          incomingLeg={{ leg: legA, key: 1 }}
          onIncomingLegHandled={() => handled.push(1)}
        />
      </QueryClientProvider>,
    );
    expect(addLegCalls).toHaveLength(1);

    // A fresh, distinct key applies against the draft as it now stands — legA already on it.
    rerender(
      <QueryClientProvider client={client}>
        <DraftOrderBuilder
          deskId="human-eric"
          incomingLeg={{ leg: legB, key: 2 }}
          onIncomingLegHandled={() => handled.push(2)}
        />
      </QueryClientProvider>,
    );
    await waitFor(() =>
      expect(
        screen.getByText(/Buy 1 NVDA \$170P/, { selector: ".draft-leg-label" }),
      ).toBeInTheDocument(),
    );
    expect(addLegCalls).toHaveLength(2);
    expect(addLegCalls[1]?.draft.legs.map((l) => l.strike)).toEqual([180]);
    expect(addLegCalls[1]?.leg).toEqual(legB);
    expect(handled).toEqual([1, 2]);
  });

  it("never applies when no incomingLeg is passed (the common, unaffected case)", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <DraftOrderBuilder deskId="human-eric" />
      </QueryClientProvider>,
    );
    await waitFor(() =>
      expect(
        screen.getByText("No legs yet — add at least two to build a spread."),
      ).toBeInTheDocument(),
    );
    expect(addLegCalls).toHaveLength(0);
  });
});
