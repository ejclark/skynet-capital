import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import type { PlaybookMetricsView } from "../../src/live/playbook-performance";
import { PlaybooksSection, usePlaybooksSection } from "../../src/shell/playbooks-section";

/**
 * R&D → Playbooks' two metric blocks (#3665 slice 4). WHEN a playbook has attributed trips from
 * any participant, ITS card SHALL show a "House — every account" block separate from the account
 * block, shown even in catalog-only mode; a playbook with none SHALL say so in words. Falsifier:
 * any single figure on a card that sums the account block and the house block.
 */

const row = (playbookId: string, trades: number, netRealized: number): PlaybookMetricsView => ({
  playbookId,
  trades,
  wins: trades,
  losses: 0,
  winRate: 100,
  netRealized,
  returnPct: 5,
  capitalCommitted: 10_000,
  avgHoldMs: null,
  longestHold: null,
  shortestHold: null,
  byDirection: { long: trades, short: 0 },
  byInstrument: { stock: trades, call: 0, put: 0 },
});

const card = (id: string, subscribers?: number) => ({
  id,
  symbol: "NVDA",
  symbols: ["NVDA"],
  evidence: "fixture",
  traits: [],
  description: `Playbook ${id}`,
  enter: "enter",
  exitTakeProfit: "tp",
  exitCutLosses: "cut",
  hold: "hold",
  metrics: [],
  ...(subscribers === undefined ? {} : { subscribers }),
});

const requested: (string | undefined)[] = [];

rstest.mock("../../src/live/playbook-store", () => ({
  fetchPlaybookStore: (accountId: string) =>
    Promise.resolve({
      cards: [card("S1-NVDA", 3), card("HC-SAURON", 0), card("E1-AMD", 1), card("G1-NONE")],
      capitalUnderManagement: 0,
      canManage: accountId !== "",
      delegation: { locked: true, unlocksAfter: "102", unlocksAfterName: "Sell stock", note: "" },
    }),
}));

rstest.mock("../../src/live/settings", () => ({
  fetchSettings: () => Promise.resolve({ accounts: [] }),
}));

rstest.mock("../../src/live/playbook-performance", () => ({
  fetchPlaybookPerformance: (account?: string) => {
    requested.push(account);
    return Promise.resolve({
      // Mine: 2 trades, +$100. House: 7 trades, +$900. A summed figure would read 9 / +$1,000.00.
      mine: [row("S1-NVDA", 2, 100)],
      house: [row("S1-NVDA", 7, 900)],
      accounts: ["human-joe"],
    });
  },
}));

function Harness({ accountId }: { readonly accountId?: string }) {
  const { store } = usePlaybooksSection(true, accountId);
  return <PlaybooksSection store={store} accountId={accountId} accountName="Uncle Joe" />;
}

function mount(accountId?: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <Harness accountId={accountId} />
    </QueryClientProvider>,
  );
}

const cardOf = (id: string) => {
  const section = screen.getByText(id).closest(".pb-card");
  if (!(section instanceof HTMLElement)) throw new Error(`no card ${id}`);
  return within(section);
};

describe("PlaybooksSection metric blocks", () => {
  beforeEach(() => {
    requested.length = 0;
  });

  it("draws the account and the house as two blocks and never sums them", async () => {
    mount("human-joe");
    const house = await screen.findAllByRole("region", { name: /House — every account/ });
    const nvda = cardOf("S1-NVDA");
    const mine = nvda.getByRole("region", { name: /Uncle Joe on this playbook/ });
    const houseBlock = nvda.getByRole("region", { name: /House — every account/ });
    expect(within(mine).getByText("+$100.00")).toBeInTheDocument();
    expect(within(houseBlock).getByText("+$900.00")).toBeInTheDocument();
    expect(nvda.queryByText("+$1,000.00")).not.toBeInTheDocument();
    expect(nvda.queryByText("9")).not.toBeInTheDocument();
    expect(house).toHaveLength(4);
    expect(requested).toEqual(["human-joe"]);
  });

  it("shows only the house in catalog-only mode, asking without an account", async () => {
    mount(undefined);
    await screen.findAllByRole("region", { name: /House — every account/ });
    expect(screen.queryByRole("region", { name: /on this playbook$/ })).not.toBeInTheDocument();
    expect(cardOf("S1-NVDA").getByText("+$900.00")).toBeInTheDocument();
    expect(screen.queryByText("+$100.00")).not.toBeInTheDocument();
    expect(requested).toEqual([undefined]);
  });

  it("says in words when no account has traded a playbook", async () => {
    mount(undefined);
    await screen.findAllByRole("region", { name: /House — every account/ });
    expect(
      cardOf("HC-SAURON").getByText(/No account has closed a trade on this playbook yet/),
    ).toBeInTheDocument();
  });
});

/**
 * The subscriber count (#3970). The card SHALL show the number of enabled subscriptions across all
 * accounts — words, never which accounts — and SHALL show it where no account is selected.
 */
describe("PlaybooksSection subscriber count", () => {
  it("shows the bare count in plain words, even in catalog-only mode", async () => {
    mount(undefined);
    expect(await screen.findByText("3 active subscribers")).toBeInTheDocument();
    expect(cardOf("S1-NVDA").getByText("3 active subscribers")).toBeInTheDocument();
    expect(cardOf("E1-AMD").getByText("1 active subscriber")).toBeInTheDocument();
    expect(cardOf("HC-SAURON").getByText("No active subscribers yet")).toBeInTheDocument();
  });

  it("shows the same count when an account is selected", async () => {
    mount("human-joe");
    await screen.findByText("3 active subscribers");
    expect(cardOf("S1-NVDA").getByText("3 active subscribers")).toBeInTheDocument();
  });

  it("draws no count at all when the server sent none — never a false zero", async () => {
    mount(undefined);
    await screen.findByText("3 active subscribers");
    expect(cardOf("G1-NONE").queryByText(/subscriber/)).not.toBeInTheDocument();
  });

  /**
   * The label names the measure. The server counts ENABLED subscriptions only, so a card claiming a
   * plain "N subscribers" would be wider than its own number — an account that paused is a
   * subscriber and is not in it. Falsifier: any card wording the count without "active".
   */
  it("says 'active' on every count, because a paused subscriber is not in the number", async () => {
    mount(undefined);
    await screen.findByText("3 active subscribers");
    for (const line of screen.getAllByText(/subscriber/)) {
      expect(line.textContent).toMatch(/active subscriber/);
    }
  });
});
