import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type {
  BotsOnlyGateView,
  DelegationGateView,
  PlaybookStoreCardView,
  SubscriptionView,
} from "../../src/live/playbook-store";
import { StrategyCard } from "../../src/shell/playbook-strategy-cards";

/**
 * The owner's below-bar floor on the Playbook Store form (#6954 slice 5c-ii):
 *  - WHERE a pair sits below its bar (the card's `houseFloorPct`), the form SHALL offer a smaller
 *    floor as a percent and post it as a share; empty is the house floor.
 *  - On Edit, an emptied field SHALL post `null` (clear), and a pair at its bar SHALL post no floor
 *    at all, so its subscription keeps what it has.
 *  - The row SHALL name a floor the owner set, as the percent they typed.
 */

const OPEN: DelegationGateView = {
  locked: false,
  unlocksAfter: "102",
  unlocksAfterName: "Sell stock",
  note: "",
};
const BOT: BotsOnlyGateView = { locked: false, note: "" };

const card = (
  over: Partial<PlaybookStoreCardView> = {},
  subscription?: SubscriptionView,
): PlaybookStoreCardView => ({
  id: "S1-NVDA",
  symbol: "NVDA",
  symbols: ["NVDA"],
  evidence: "fixture evidence",
  traits: [],
  description: "What the playbook does.",
  enter: "enter rule",
  exitTakeProfit: "take-profit rule",
  exitCutLosses: "cut-loss rule",
  hold: "hold rule",
  metrics: [],
  houseFloorPct: 0.01,
  ...(subscription ? { subscription } : {}),
  ...over,
});

const posts: { url: string; body: Record<string, unknown> }[] = [];
const realFetch = globalThis.fetch;
beforeEach(() => {
  posts.length = 0;
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    if (init?.method === "POST") {
      posts.push({ url: String(url), body: JSON.parse(String(init.body ?? "{}")) });
    }
    return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
  }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

function mount(c: PlaybookStoreCardView) {
  const onChanged = rstest.fn();
  render(
    <StrategyCard
      accountId="sauron"
      strategy={{
        strategy: "pre-print-run-up",
        name: "the pre-print run-up",
        instrument: "shares",
        summary: "One line on the strategy.",
        pairs: [
          {
            id: c.id,
            symbols: c.symbols,
            status: "researched",
            statusLabel: "✓ researched, weakened",
            stale: false,
            call: "The call.",
            ...(c.subscription ? { subscription: c.subscription } : {}),
          },
        ],
      }}
      cardsById={new Map([[c.id, c]])}
      canManage
      delegation={OPEN}
      botsOnly={BOT}
      onChanged={onChanged}
      accountName="Sauron"
      metricsFor={() => undefined}
      houseFor={() => undefined}
    />,
  );
  return onChanged;
}

const FIELD = "Most each new order may risk (% of the account)";
const SUBSCRIBED: SubscriptionView = { mode: "standard", capitalAllocated: 5000, enabled: true };

describe("the owner's below-bar floor", () => {
  it("a new subscription posts the typed percent as a share", async () => {
    const onChanged = mount(card());
    expect(screen.getByLabelText(FIELD)).toHaveAttribute("placeholder", "1 (house limit)");
    expect(screen.getByText(/limits each new order to 1% of the account/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Capital to delegate ($)"), {
      target: { value: "5000" },
    });
    fireEvent.change(screen.getByLabelText(FIELD), { target: { value: "0.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Subscribe" }));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(posts[0]?.body).toMatchObject({ belowBarFloorPct: 0.005 });
  });

  it("an empty field on a new subscription posts no floor: the house floor", async () => {
    mount(card());
    fireEvent.change(screen.getByLabelText("Capital to delegate ($)"), {
      target: { value: "5000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Subscribe" }));
    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0]?.body).not.toHaveProperty("belowBarFloorPct");
  });

  it("Edit opens on the owner's floor, and emptying it posts null to clear it", async () => {
    const onChanged = mount(card({}, { ...SUBSCRIBED, belowBarFloorPct: 0.005 }));
    expect(screen.getByText(/each new order at most 0\.5% of the account/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText(FIELD)).toHaveValue(0.5);
    fireEvent.change(screen.getByLabelText(FIELD), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(posts[0]).toMatchObject({
      url: "/api/playbook-store/configure",
      body: { belowBarFloorPct: null },
    });
  });

  it("an edit that leaves the field alone posts no floor, so a rounded number never overwrites it", async () => {
    // 0.9996% shows as "1"; sending that back would raise the stored floor.
    const onChanged = mount(card({}, { ...SUBSCRIBED, belowBarFloorPct: 0.009996 }));
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText(FIELD)).toHaveValue(1);
    fireEvent.change(screen.getByLabelText("Capital to delegate ($)"), {
      target: { value: "4000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(posts[0]?.body).toMatchObject({ capitalAllocated: 4000 });
    expect(posts[0]?.body).not.toHaveProperty("belowBarFloorPct");
  });

  it("a pair now at its bar keeps the field only to clear a saved floor, and the row stops naming it", async () => {
    const { houseFloorPct: _none, ...atBar } = card({}, { ...SUBSCRIBED, belowBarFloorPct: 0.005 });
    const onChanged = mount(atBar);
    expect(screen.queryByText(/each new order at most/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(
      screen.getByText(/now meets its study's bar, so this limit changes nothing/),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(FIELD), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(posts[0]?.body).toMatchObject({ belowBarFloorPct: null });
  });

  it("a pair at its bar shows no field and posts no floor, so an edit keeps what it has", async () => {
    const { houseFloorPct: _none, ...atBar } = card({}, SUBSCRIBED);
    const onChanged = mount(atBar);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.queryByLabelText(FIELD)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(posts[0]?.body).not.toHaveProperty("belowBarFloorPct");
  });
});
