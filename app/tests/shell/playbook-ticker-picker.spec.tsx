import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type {
  BotsOnlyGateView,
  DelegationGateView,
  PairRowView,
  PlaybookStoreCardView,
  PreflightAnswer,
  StrategyCardView,
} from "../../src/live/playbook-store";
import { preflightLine } from "../../src/shell/playbook-subscribe-form";
import { TickerPicker } from "../../src/shell/playbook-ticker-picker";

/**
 * The ticker picker (#4469 slice 3b part 2). WHEN an owner opens it, it SHALL list EVERY ticker the
 * strategy runs on, a ticker that cannot be taken disabled with its reason in visible words. WHEN a
 * ticker is chosen, the subscribe form SHALL open with "Check first", which asks the server what
 * Subscribe would say and states one contract's cash and the idle share in words. "Ask for research"
 * SHALL file one request through the feedback door and never start research itself.
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

const wheel = (pairs: readonly PairRowView[]): StrategyCardView => ({
  strategy: "wheel",
  name: "the wheel",
  instrument: "options",
  summary: "Sells a put.",
  pairs,
});

const ROWS = [
  pair("CRWV-WHEEL", "CRWV", { status: "conviction", statusLabel: "◆ conviction" }),
  pair("TSLA-WHEEL", "TSLA", {
    status: "stand-aside",
    statusLabel: "✗ stand aside",
    subscribeRefusal: "Its research ran past its shelf date.",
  }),
  pair("AMZN-WHEEL", "AMZN", {
    subscription: { mode: "standard", capitalAllocated: 50_000, enabled: true },
  }),
];

const seen: { url: string; body?: Record<string, unknown> }[] = [];
let preflight: PreflightAnswer = { ok: true };
let filing: { ok: boolean; error?: string } = { ok: true };
const realFetch = globalThis.fetch;
beforeEach(() => {
  seen.length = 0;
  preflight = { ok: true };
  filing = { ok: true };
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    const path = String(url);
    seen.push({
      url: path,
      ...(init?.body ? { body: JSON.parse(String(init.body)) as Record<string, unknown> } : {}),
    });
    const json = (body: unknown) =>
      Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
    return json(path.startsWith("/api/playbook-store/preflight") ? preflight : filing);
  }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

function mount(
  strategy: StrategyCardView = wheel(ROWS),
  gates: { delegation?: DelegationGateView; botsOnly?: BotsOnlyGateView } = {},
) {
  const cards = strategy.pairs.map((p) => cardOf(p.id, p.symbols[0] ?? ""));
  const onChanged = rstest.fn();
  render(
    <TickerPicker
      accountId="sauron"
      strategy={strategy}
      cardsById={new Map(cards.map((c) => [c.id, c]))}
      delegation={gates.delegation ?? OPEN}
      {...(gates.botsOnly ? { botsOnly: gates.botsOnly } : {})}
      onChanged={onChanged}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: /Pick a ticker/ }));
  return { onChanged };
}

describe("the ticker picker", () => {
  it("lists every ticker with its evidence as a glyph and a word", () => {
    mount();
    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    expect(within(list).getByText("◆ conviction")).toBeInTheDocument();
    expect(within(list).getByText("✗ stand aside")).toBeInTheDocument();
  });

  it("disables a ticker that cannot be taken and says why in visible words", () => {
    mount();
    expect(screen.getByRole("button", { name: /TSLA/ })).toBeDisabled();
    expect(screen.getByText("Its research ran past its shelf date.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /AMZN/ })).toBeDisabled();
    expect(screen.getByText(/Yours already/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /CRWV/ })).toBeEnabled();
  });

  it("names the rung that opens a ticker behind the delegation fog, once", () => {
    mount(wheel([pair("CRWV-WHEEL", "CRWV")]), {
      delegation: { ...OPEN, locked: true, note: "Delegation opens at rung 102." },
    });
    expect(screen.getByText("Delegation opens at rung 102.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /CRWV/ })).toBeDisabled();
    expect(
      screen.getByText(/Opens after your first filled 102 \(Sell stock\)/),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/Not on the list/)).not.toBeInTheDocument();
  });

  it("opens the subscribe form for a chosen ticker, and returns to the list", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: /CRWV/ }));
    expect(screen.getByLabelText("Capital to delegate ($)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /All tickers/ }));
    expect(screen.getByRole("list")).toBeInTheDocument();
  });

  it("checks first: asks what Subscribe would say and states one contract's cash and the idle share", async () => {
    preflight = { ok: true, options: true, oneContractCash: 8_000, idleShare: 0.893 };
    mount();
    fireEvent.click(screen.getByRole("button", { name: /CRWV/ }));
    fireEvent.change(screen.getByLabelText("Capital to delegate ($)"), {
      target: { value: "75000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check first" }));
    expect(
      await screen.findByText(
        /One contract ties up about \$8,000, which leaves 89% of this budget idle/,
      ),
    ).toBeInTheDocument();
    const ask = seen.find((s) => s.url.startsWith("/api/playbook-store/preflight"));
    expect(ask?.url).toContain("id=sauron");
    expect(ask?.url).toContain("playbookId=CRWV-WHEEL");
    expect(ask?.url).toContain("capital=75000");
  });

  it("drops the answer the moment the budget changes, since it answered another question", async () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: /CRWV/ }));
    const capital = screen.getByLabelText("Capital to delegate ($)");
    fireEvent.change(capital, { target: { value: "75000" } });
    fireEvent.click(screen.getByRole("button", { name: "Check first" }));
    await screen.findByText(/Clear/);
    fireEvent.change(capital, { target: { value: "5000" } });
    expect(screen.queryByText(/Clear/)).not.toBeInTheDocument();
  });

  it("says the server's own sentence when the preflight refuses", async () => {
    preflight = { ok: false, error: "The market-data feed gave no price for CRWV just now." };
    mount();
    fireEvent.click(screen.getByRole("button", { name: /CRWV/ }));
    fireEvent.change(screen.getByLabelText("Capital to delegate ($)"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Check first" }));
    expect(await screen.findByText(/gave no price for CRWV/)).toBeInTheDocument();
  });
});

describe("add a ticker", () => {
  const ask = (text: string) => {
    fireEvent.change(screen.getByLabelText(/Not on the list/), { target: { value: text } });
  };

  it("files one feature request naming the strategy and the ticker, and trades nothing", async () => {
    mount();
    ask("msft ");
    fireEvent.click(screen.getByRole("button", { name: "Ask for research" }));
    expect(
      await screen.findByText(/Asked\. MSFT appears on this list once its research is done/),
    ).toBeInTheDocument();
    const filed = seen.filter((s) => s.url === "/api/feedback");
    expect(filed).toHaveLength(1);
    expect(filed[0]?.body).toMatchObject({
      kind: "feature",
      title: "Study MSFT for the wheel in the Playbook Store",
    });
    expect(seen.some((s) => s.url.includes("/api/playbook-store/subscribe"))).toBe(false);
  });

  it("refuses a ticker already on the list, and one that is not a ticker, before sending", () => {
    mount();
    ask("CRWV");
    expect(screen.getByText("CRWV is already on this list.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ask for research" })).toBeDisabled();
    ask("12345");
    expect(screen.getByText("A ticker is one to five letters, like AMZN.")).toBeInTheDocument();
    expect(seen).toEqual([]);
  });

  it("says the server's sentence when the filing is refused", async () => {
    filing = { ok: false, error: "You've sent a bunch just now — give it a few minutes." };
    mount();
    ask("MSFT");
    fireEvent.click(screen.getByRole("button", { name: "Ask for research" }));
    await waitFor(() => expect(screen.getByText(/give it a few minutes/)).toBeInTheDocument());
  });
});

describe("the preflight in words", () => {
  it("states what a contract ties up and how much of the budget stays idle", () => {
    expect(
      preflightLine({ ok: true, options: true, oneContractCash: 8_000, idleShare: 0.893 }),
    ).toEqual({
      glyph: "✓",
      text: "Clear. One contract ties up about $8,000, which leaves 89% of this budget idle.",
    });
    expect(
      preflightLine({ ok: true, options: true, oneContractCash: 8_000, idleShare: 0 }).text,
    ).toMatch(/none of this budget idle/);
  });

  it("says an options pair's contract is judged at the open when no chain was read", () => {
    expect(preflightLine({ ok: true, options: true }).text).toMatch(/while the market is open/);
  });

  it("says a share pair is clear on the feed and the account, and a refusal in its own words", () => {
    expect(preflightLine({ ok: true }).text).toBe(
      "Clear: the feed has a price and the account can take it.",
    );
    expect(preflightLine({ ok: false, error: "Needs level 3." })).toEqual({
      glyph: "–",
      text: "Needs level 3.",
    });
  });
});
