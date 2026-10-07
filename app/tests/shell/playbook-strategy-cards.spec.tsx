import { fireEvent, render, screen, within } from "@testing-library/react";
import type {
  PairRowView,
  PlaybookStoreCardView,
  StrategyCardView,
} from "../../src/live/playbook-store";
import { StrategyCard } from "../../src/shell/playbook-strategy-cards";

/**
 * The Store by strategy (#4469 slice 3b), phone order. WHEN a strategy card renders, it SHALL lead
 * with the owner's own pairs, then say the strategy in one line, then list its tickers by evidence.
 * A row SHALL wear its status as a glyph AND a word, with its confidence, the exit it was measured
 * at and its own study link. A pair the server would refuse SHALL say why in visible words. ✗ and ?
 * rows SHALL fold into one counted line. An owner SHALL never be shown a playbook id.
 */

const OPEN = { locked: false, unlocksAfter: "102", unlocksAfterName: "Sell stock", note: "" };

const cardOf = (id: string, symbols: readonly string[]): PlaybookStoreCardView => ({
  id,
  symbol: symbols[0] ?? "",
  symbols,
  evidence: "fixture evidence",
  traits: [],
  description: "What the strategy does on this ticker.",
  enter: "enter",
  exitTakeProfit: "take profit",
  exitCutLosses: "cut losses",
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
  summary: "Sells one cash-secured put about a month out.",
  pairs,
});

function mount(strategy: StrategyCardView, canManage = true) {
  const cards = strategy.pairs.map((p) => cardOf(p.id, p.symbols));
  render(
    <StrategyCard
      accountId="sauron"
      strategy={strategy}
      cardsById={new Map(cards.map((c) => [c.id, c]))}
      canManage={canManage}
      delegation={OPEN}
      onChanged={rstest.fn()}
      accountName="Sauron"
      metricsFor={() => undefined}
      houseFor={() => undefined}
    />,
  );
}

const precedes = (a: HTMLElement, b: HTMLElement) =>
  Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe("a strategy card", () => {
  it("heads the card with the strategy and each row with its ticker, never a playbook id", () => {
    mount(wheel([pair("CRWV-WHEEL", "CRWV"), pair("AMZN-WHEEL", "AMZN")]));
    expect(screen.getByRole("heading", { level: 2, name: /The wheel/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: /CRWV/ })).toBeInTheDocument();
    expect(screen.queryByText(/CRWV-WHEEL/)).not.toBeInTheDocument();
    expect(screen.queryByText(/AMZN-WHEEL/)).not.toBeInTheDocument();
  });

  it("says the strategy in one line ahead of its tickers", () => {
    mount(wheel([pair("CRWV-WHEEL", "CRWV")]));
    expect(
      precedes(
        screen.getByText("Sells one cash-secured put about a month out."),
        screen.getByRole("heading", { level: 3, name: /CRWV/ }),
      ),
    ).toBe(true);
  });

  it("leads with the owner's own pair, ahead of the strategy line", () => {
    mount(
      wheel([
        pair("AMZN-WHEEL", "AMZN"),
        pair("CRWV-WHEEL", "CRWV", {
          subscription: { mode: "aggressive", capitalAllocated: 75_000, enabled: true },
        }),
      ]),
    );
    const state = screen.getByText("On").closest("p");
    if (!(state instanceof HTMLElement)) throw new Error("no status line");
    expect(state).toHaveTextContent("● On · aggressive · $75,000");
    expect(precedes(state, screen.getByText("Sells one cash-secured put about a month out."))).toBe(
      true,
    );
    expect(screen.getByRole("button", { name: "Pause" })).toBeEnabled();
  });

  it("draws each row's evidence as words: status, confidence, measured exit and its own study", () => {
    mount(
      wheel([
        pair("CRWV-WHEEL", "CRWV", {
          status: "conviction",
          statusLabel: "◆ conviction",
          confidence: "medium",
          measuredExit: "D-5",
          checkOn: "2027-01-29",
          studyHref: "/app/research/crwv-premium-fit",
        }),
      ]),
    );
    expect(screen.getByText("◆ conviction")).toBeInTheDocument();
    const facts = screen.getByText(/medium confidence/);
    expect(facts).toHaveTextContent(
      "medium confidence · measured at the D-5 exit · conviction checked 2027-01-29 · its study →",
    );
    expect(within(facts).getByRole("link", { name: "its study →" })).toHaveAttribute(
      "href",
      "/app/research/crwv-premium-fit",
    );
  });

  it("says in words why a new subscription is refused, beside a disabled Subscribe", () => {
    const refusal = "The call spread already trades NVDA options on this bot.";
    mount(wheel([pair("NVDA-WHEEL", "NVDA", { subscribeRefusal: refusal })]));
    expect(screen.getByText(refusal)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Subscribe" })).toBeDisabled();
    expect(screen.queryByLabelText("Capital to delegate ($)")).not.toBeInTheDocument();
  });

  it("says what the bot does with a held pair: the hand-off and the not-trading line", () => {
    mount(
      wheel([
        pair("A", "NVDA", {
          subscription: { mode: "standard", enabled: true },
          handOff: "The call spread trades NVDA on this bot; the run-up yields it",
        }),
        pair("B", "AMZN", {
          subscription: { mode: "standard", enabled: true },
          notTrading: "not trading — the call spread owns AMZN",
        }),
      ]),
    );
    expect(
      screen.getByText("The call spread trades NVDA on this bot; the run-up yields it."),
    ).toBeInTheDocument();
    expect(screen.getByText("not trading — the call spread owns AMZN")).toBeInTheDocument();
  });

  it("opens the subscribe form from its own row, keyed on the row's pair id", () => {
    mount(wheel([pair("CRWV-WHEEL", "CRWV")]));
    fireEvent.click(screen.getByText("Subscribe", { selector: "summary" }));
    expect(screen.getByLabelText("Capital to delegate ($)")).toBeInTheDocument();
  });

  it("offers no controls to a viewer who does not manage the account", () => {
    mount(wheel([pair("CRWV-WHEEL", "CRWV")]), false);
    expect(screen.queryByRole("button", { name: "Subscribe" })).not.toBeInTheDocument();
    expect(screen.queryByText("Subscribe", { selector: "summary" })).not.toBeInTheDocument();
  });
});

describe("the fold", () => {
  const folded = wheel([
    pair("CRWV-WHEEL", "CRWV"),
    pair("TSLA-WHEEL", "TSLA", { status: "stand-aside", statusLabel: "✗ stand aside" }),
    pair("X-WHEEL", "XOM", { status: "not-studied", statusLabel: "? not studied" }),
    pair("Y-WHEEL", "YUM", { status: "not-studied", statusLabel: "? not studied" }),
    pair("TACO-DJT", "DJT", { status: "cant-run", statusLabel: "– can't run" }),
  ]);

  it("folds ✗ ? and – rows into one counted line, with the researched row open", () => {
    mount(folded);
    const summary = screen.getByText(/^4 more:/);
    expect(summary).toHaveTextContent("4 more: ✗ 1 stand aside · ? 2 not studied · – 1 can't run");
    const fold = summary.closest("details");
    if (!(fold instanceof HTMLElement)) throw new Error("no fold");
    expect(fold).not.toHaveAttribute("open");
    expect(within(fold).getByRole("heading", { level: 3, name: /TSLA/ })).toBeInTheDocument();
    expect(fold).not.toContainElement(screen.getByRole("heading", { level: 3, name: /CRWV/ }));
  });

  it("keeps a subscribed row open whatever its evidence", () => {
    mount(
      wheel([
        pair("X-WHEEL", "XOM", {
          status: "not-studied",
          statusLabel: "? not studied",
          subscription: { mode: "standard", enabled: true },
        }),
      ]),
    );
    expect(screen.queryByText(/more:/)).not.toBeInTheDocument();
  });

  it("counts a stale ✓ by its glyph and word, not its shelf-date suffix", () => {
    mount(
      wheel([
        pair("CRWV-WHEEL", "CRWV"),
        pair("A", "AAA", {
          status: "screened",
          statusLabel: "~ screened, thin · past its shelf date",
        }),
      ]),
    );
    expect(screen.getByText(/^1 more:/)).toHaveTextContent("1 more: ~ 1 screened");
  });
});
