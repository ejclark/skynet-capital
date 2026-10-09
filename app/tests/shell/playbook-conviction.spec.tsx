import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type {
  DelegationGateView,
  PairRowView,
  PlaybookStoreCardView,
  StrategyCardView,
} from "../../src/live/playbook-store";
import { allocationLine } from "../../src/shell/playbook-allocation";
import { StrategyCard } from "../../src/shell/playbook-strategy-cards";
import { TickerPicker } from "../../src/shell/playbook-ticker-picker";

/**
 * The Store's conviction and allocation fields (#4469 slice 3c part 3b, criteria 2, 5, 11, 12).
 * WHERE a pair needs a conviction, Subscribe SHALL not save without a reason and a check day, and
 * SHALL send both. An owner SHALL see their conviction stated back and SHALL be able to set a new
 * date. A strategy card SHALL show its allocation and what is budgeted inside it, in words.
 */

const OPEN: DelegationGateView = {
  locked: false,
  unlocksAfter: "102",
  unlocksAfterName: "Sell stock",
  note: "",
};

const cardOf = (id: string, symbol: string): PlaybookStoreCardView => ({
  id,
  symbol,
  symbols: [symbol],
  evidence: "e",
  traits: [],
  description: "d",
  enter: "enter",
  exitTakeProfit: "tp",
  exitCutLosses: "cl",
  hold: "hold",
  metrics: [],
});

const pair = (id: string, symbol: string, over: Partial<PairRowView> = {}): PairRowView => ({
  id,
  symbols: [symbol],
  status: "researched",
  statusLabel: "✓ researched",
  stale: false,
  call: `The call on ${symbol}.`,
  ...over,
});

const wheel = (
  pairs: readonly PairRowView[],
  over: Partial<StrategyCardView> = {},
): StrategyCardView => ({
  strategy: "wheel",
  name: "the wheel",
  instrument: "options",
  summary: "Sells a put.",
  pairs,
  ...over,
});

const posts: { url: string; body: Record<string, unknown> }[] = [];
const realFetch = globalThis.fetch;
let answer: { ok: boolean; error?: string } = { ok: true };
beforeEach(() => {
  posts.length = 0;
  answer = { ok: true };
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    if (init?.body) posts.push({ url: String(url), body: JSON.parse(String(init.body)) });
    return Promise.resolve(new Response(JSON.stringify(answer), { status: 200 }));
  }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

const ASIDE = pair("TSLA-WHEEL", "TSLA", {
  status: "stand-aside",
  statusLabel: "✗ stand aside",
  needsConviction: true,
});

function pickAside() {
  const strategy = wheel([ASIDE]);
  render(
    <TickerPicker
      accountId="sauron"
      strategy={strategy}
      cardsById={new Map([["TSLA-WHEEL", cardOf("TSLA-WHEEL", "TSLA")]])}
      delegation={OPEN}
      onChanged={rstest.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: /Pick a ticker/ }));
  fireEvent.click(screen.getByRole("button", { name: /TSLA/ }));
}

describe("subscribing to a pair the study does not back", () => {
  it("offers the ✗ row, and will not save without a reason and a check day", () => {
    pickAside();
    const save = screen.getByRole("button", { name: "Subscribe" });
    fireEvent.change(screen.getByLabelText("Capital to delegate ($)"), {
      target: { value: "20000" },
    });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Why you are taking it"), {
      target: { value: "Premium looks rich into the print." },
    });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Check it on"), { target: { value: "2027-01-15" } });
    expect(save).toBeEnabled();
  });

  it("sends the conviction with the subscription, trimmed", async () => {
    pickAside();
    fireEvent.change(screen.getByLabelText("Capital to delegate ($)"), {
      target: { value: "20000" },
    });
    fireEvent.change(screen.getByLabelText("Why you are taking it"), {
      target: { value: "  Premium looks rich.  " },
    });
    fireEvent.change(screen.getByLabelText("Check it on"), { target: { value: "2027-01-15" } });
    fireEvent.click(screen.getByRole("button", { name: "Subscribe" }));
    await waitFor(() => expect(posts).toHaveLength(1));
    const sent = posts.find((p) => p.url === "/api/playbook-store/subscribe");
    expect(sent?.body).toMatchObject({
      playbookId: "TSLA-WHEEL",
      capitalAllocated: 20_000,
      conviction: { reason: "Premium looks rich.", checkOn: "2027-01-15" },
    });
  });

  it("says what the check does, and that exits never stop", () => {
    pickAside();
    expect(screen.getByText(/stops opening new positions/)).toBeInTheDocument();
    expect(screen.getByText(/Open positions keep being managed to exit/)).toBeInTheDocument();
  });

  it("asks nothing extra of a pair the study backs", () => {
    const strategy = wheel([pair("CRWV-WHEEL", "CRWV", { status: "conviction" })]);
    render(
      <TickerPicker
        accountId="sauron"
        strategy={strategy}
        cardsById={new Map([["CRWV-WHEEL", cardOf("CRWV-WHEEL", "CRWV")]])}
        delegation={OPEN}
        onChanged={rstest.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Pick a ticker/ }));
    fireEvent.click(screen.getByRole("button", { name: /CRWV/ }));
    expect(screen.queryByLabelText("Why you are taking it")).not.toBeInTheDocument();
  });
});

function mountCard(strategy: StrategyCardView, botsOnlyLocked = false) {
  const cards = strategy.pairs.map((p) => cardOf(p.id, p.symbols[0] ?? ""));
  const onChanged = rstest.fn();
  render(
    <StrategyCard
      accountId="sauron"
      strategy={strategy}
      cardsById={new Map(cards.map((c) => [c.id, c]))}
      canManage
      delegation={OPEN}
      {...(botsOnlyLocked ? { botsOnly: { locked: true, note: "Bots only." } } : {})}
      onChanged={onChanged}
      accountName="Sauron"
      metricsFor={() => undefined}
      houseFor={() => undefined}
    />,
  );
  return { onChanged };
}

const HELD = pair("CRWV-WHEEL", "CRWV", {
  status: "conviction",
  statusLabel: "◆ conviction",
  subscription: {
    mode: "aggressive",
    capitalAllocated: 75_000,
    enabled: true,
    conviction: { reason: "Run it against the study.", checkOn: "2027-01-29" },
  },
});

describe("the owner's conviction on their row", () => {
  it("states the reason and the check day back, with a glyph and a word", () => {
    mountCard(wheel([HELD]));
    expect(screen.getByText(/Conviction/)).toBeInTheDocument();
    expect(screen.getByText(/Run it against the study\./)).toBeInTheDocument();
    expect(screen.getByText("2027-01-29")).toBeInTheDocument();
  });

  it("sets a new date, sending the whole conviction", async () => {
    const { onChanged } = mountCard(wheel([HELD]));
    fireEvent.click(screen.getByRole("button", { name: "Set a new date" }));
    expect(screen.getByLabelText("Why you are taking it")).toHaveValue("Run it against the study.");
    const save = screen.getByRole("button", { name: "Save conviction" });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Check it on"), { target: { value: "2027-04-30" } });
    fireEvent.click(save);
    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts.find((p) => p.url === "/api/playbook-store/conviction")?.body).toEqual({
      id: "sauron",
      playbookId: "CRWV-WHEEL",
      conviction: { reason: "Run it against the study.", checkOn: "2027-04-30" },
    });
    expect(onChanged).toHaveBeenCalled();
  });

  it("shows the server's own sentence when it refuses the day", async () => {
    answer = { ok: false, error: "A conviction is checked on a day still to come." };
    mountCard(wheel([HELD]));
    fireEvent.click(screen.getByRole("button", { name: "Set a new date" }));
    fireEvent.change(screen.getByLabelText("Check it on"), { target: { value: "2026-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Save conviction" }));
    expect(await screen.findByText(/still to come/)).toBeInTheDocument();
  });

  it("says plainly when none is stated, and that the pair keeps trading", () => {
    const bare = pair("CRWV-WHEEL", "CRWV", {
      status: "conviction",
      subscription: { mode: "standard", capitalAllocated: 5_000, enabled: true },
    });
    mountCard(wheel([bare]));
    expect(screen.getByText(/No conviction stated/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "State a conviction" })).toBeInTheDocument();
  });

  it("leaves a researched pair without one alone", () => {
    const backed = pair("S1-NVDA", "NVDA", {
      subscription: { mode: "standard", capitalAllocated: 50_000, enabled: true },
    });
    mountCard(wheel([backed], { strategy: "pre-print-run-up" }));
    expect(screen.queryByText(/onviction/)).not.toBeInTheDocument();
  });
});

describe("a strategy's allocation", () => {
  it("reads in words: budgeted, of the allocation, and what is left", () => {
    expect(allocationLine({ capitalAllocated: 100_000, budgeted: 75_000 })).toBe(
      "$75,000 of $100,000 budgeted · $25,000 left",
    );
    expect(allocationLine({ capitalAllocated: 50_000, budgeted: 60_000 })).toBe(
      "$60,000 of $50,000 budgeted · $10,000 over",
    );
  });

  it("is drawn on a card the account holds a pair on, and sets one", async () => {
    const { onChanged } = mountCard(
      wheel([HELD], { allocation: { capitalAllocated: 100_000, budgeted: 75_000 } }),
    );
    expect(screen.getByText(/\$75,000 of \$100,000 budgeted · \$25,000 left/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Change allocation" }));
    fireEvent.change(screen.getByLabelText(/Allocation for the wheel/), {
      target: { value: "120000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save allocation" }));
    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts.find((p) => p.url === "/api/playbook-store/allocation")?.body).toEqual({
      id: "sauron",
      strategy: "wheel",
      capitalAllocated: 120_000,
    });
    expect(onChanged).toHaveBeenCalled();
  });

  it("clears with its own button, sending null", async () => {
    mountCard(wheel([HELD], { allocation: { capitalAllocated: 100_000, budgeted: 75_000 } }));
    fireEvent.click(screen.getByRole("button", { name: "Change allocation" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear it" }));
    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts.find((p) => p.url === "/api/playbook-store/allocation")?.body).toMatchObject({
      capitalAllocated: null,
    });
  });

  it("offers none on a strategy the account holds nothing on, nor to a human account", () => {
    mountCard(wheel([pair("CRWV-WHEEL", "CRWV", { status: "conviction" })]));
    expect(screen.queryByRole("button", { name: "Set an allocation" })).not.toBeInTheDocument();
  });

  it("is not offered on a human account", () => {
    mountCard(wheel([HELD], { allocation: { capitalAllocated: 1, budgeted: 0 } }), true);
    expect(screen.queryByRole("button", { name: "Change allocation" })).not.toBeInTheDocument();
  });
});
