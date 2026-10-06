import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import * as actualDraft from "../../src/live/draft-order" with { rstest: "importActual" };
import type { DraftOrder, NewLeg } from "../../src/live/draft-order";
import { DraftOrderBuilder } from "../../src/shell/draft-order-builder";

/**
 * A TAP ON A MARKED ROW IS A REPRICE (#3407, the banked "reprice from a chain row"). A pick for a
 * contract, side and size the draft already holds used to post `add-leg` and collect the state
 * machine's duplicate refusal — which renders on the ticket pane, not on the Chain pane the
 * member tapped. These are the three branches the builder's one `addLeg` funnel now has.
 */

const held: NewLeg = {
  underlying: "NVDA",
  optionType: "call",
  strike: 180,
  expiration: "2026-10-16",
  action: "sell",
  contracts: 2,
  limitPrice: 4.2,
};

const posts: Array<{ kind: string; id?: string; limitPrice?: number; leg?: NewLeg }> = [];
/** Seeded with `held` already on the draft — the state the gesture under test starts from. */
const seeded: DraftOrder = {
  phase: "drafting",
  legs: [{ ...held, id: "leg-1" }],
  refusals: [],
  nextLegId: 2,
};
const preview = {
  legCount: 1,
  pricedFully: true,
  maxGain: 0,
  maxLoss: 0,
  unlimitedLoss: false,
  undefinedRiskLegIds: [],
};

rstest.mock("../../src/live/draft-order", () => ({
  legOnSameContract: actualDraft.legOnSameContract,
  emptyDraft: () => seeded,
  addDraftLeg: (_desk: string, draft: DraftOrder, leg: NewLeg) => {
    posts.push({ kind: "add-leg", leg });
    // What the real state machine answers for a duplicate: the draft untouched, carrying the why.
    return Promise.resolve({
      draft: {
        ...draft,
        refusals: [
          "That leg is already in this order — change its size instead of adding it twice.",
        ],
      },
      preview,
    });
  },
  repriceDraftLeg: (_desk: string, draft: DraftOrder, id: string, limitPrice?: number) => {
    posts.push({ kind: "reprice-leg", id, ...(limitPrice === undefined ? {} : { limitPrice }) });
    return Promise.resolve({
      draft: { ...draft, legs: draft.legs.map((l) => (l.id === id ? { ...l, limitPrice } : l)) },
      preview,
    });
  },
  removeDraftLeg: () => Promise.reject(new Error("not used")),
  validateDraft: () => Promise.reject(new Error("not used")),
  reviewDraft: () => Promise.reject(new Error("not used")),
  submitDraftOrder: () => Promise.reject(new Error("not used")),
}));
rstest.mock("../../src/live/options", () => ({
  fetchChain: () =>
    new Promise(() => {
      // deliberately pending — the leg form's own inline chain isn't what's under test
    }),
}));

function mount(leg: NewLeg, key: number) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DraftOrderBuilder deskId="human-eric" incomingLeg={{ leg, key }} />
    </QueryClientProvider>,
  );
}

describe("DraftOrderBuilder — a chain tap on a leg the draft already holds (#3407)", () => {
  beforeEach(() => {
    posts.length = 0;
  });

  it("reprices that leg to the tapped price instead of posting a duplicate add", async () => {
    mount({ ...held, limitPrice: 2.52 }, 1);
    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0]).toEqual({ kind: "reprice-leg", id: "leg-1", limitPrice: 2.52 });
    await waitFor(() =>
      expect(screen.getByLabelText(/Premium per share for Sell 2 NVDA/)).toHaveValue(2.52),
    );
  });

  it("says the leg is already at that price rather than spending a round trip", async () => {
    mount({ ...held, limitPrice: 4.2 }, 1);
    await waitFor(() =>
      expect(screen.getByText(/is already priced at \$4\.20\/sh\./)).toBeInTheDocument(),
    );
    expect(posts).toHaveLength(0);
  });

  it("still adds — and still surfaces the size refusal — when the pick is a different size", async () => {
    mount({ ...held, contracts: 3, limitPrice: 2.52 }, 1);
    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0]?.kind).toBe("add-leg");
    // Twice on screen on purpose: the gate's headline and its refusal row both carry it.
    await waitFor(() =>
      expect(screen.getAllByText(/change its size instead of adding it twice/)).not.toHaveLength(0),
    );
  });

  it("adds normally when the pick is the other side of the same contract", async () => {
    mount({ ...held, action: "buy", limitPrice: 4.4 }, 1);
    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0]?.kind).toBe("add-leg");
  });

  it("adds — never reprices to 'at market' — when the tapped cell carried no price", async () => {
    const { limitPrice: _none, ...unpriced } = held;
    mount(unpriced, 1);
    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0]?.kind).toBe("add-leg");
  });
});
