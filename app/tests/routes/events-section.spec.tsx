import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as actualDesk from "../../src/live/desk" with { rstest: "importActual" };
import type { DeskPosition, PositionEvent } from "../../src/live/desk";
import { horizonSearch } from "../../src/live/horizon-params";
import * as actualResearch from "../../src/live/research" with { rstest: "importActual" };
import type { ResearchShelfData } from "../../src/live/research";
import { Route } from "../../src/routes/accounts";

/**
 * The Profile page's Events section (#3807 slice 2c): `?section=events` renders the market
 * calendar's grid fed only the book's events, beside an agenda in two tiers — ◆ on what you hold,
 * ○ market-wide — over the three offline fixtures (`held-events.spec.ts` dates them): human-eric
 * holds EEM (no print — the held tier is honestly empty), sauron holds META (prints Oct 28), the
 * day-trader holds AAPL (prints Oct 29; the iPhone Duo goes on sale Oct 23). The page renders
 * through a real memory-history router; the data layer is mocked, and the Overview is a stub
 * that prints the blotter's count so the section switch's `q` drop is provable without charts.
 */

const jobs: PositionEvent = {
  label: "Jobs report Oct 2",
  at: "2026-10-02",
  beforeExpiry: false,
  scope: "market",
};
const print = (label: string, at: string): PositionEvent => ({
  label,
  at,
  beforeExpiry: false,
  scope: "stock",
});
const position = (symbol: string, quantity: string, nextEvent?: PositionEvent) =>
  ({
    symbol,
    display: symbol,
    isOption: false,
    quantity,
    ...(nextEvent ? { nextEvent } : {}),
  }) as unknown as DeskPosition;

const DESKS: Record<string, readonly DeskPosition[]> = {
  "human-eric": [position("EEM", "12000", jobs)],
  sauron: [
    position("NVDA", "40", jobs),
    position("META", "50", print("Earnings Oct 28", "2026-10-28")),
  ],
  "day-trader": [
    position("NVDA", "100", jobs),
    position("AAPL", "200", print("Earnings Oct 29", "2026-10-29")),
  ],
};

const event = (id: string, title: string, date: string, symbols: string[] = []) => ({
  id,
  title,
  date,
  symbols,
  researched: false,
});
const RESEARCH: ResearchShelfData = {
  events: [
    event("jobs-2026-10-02", "Employment Situation (September)", "2026-10-02"),
    event("mrvl-investor-day-2026-10-06", "MRVL Investor Day (NYC)", "2026-10-06", ["MRVL"]),
    event("cpi-2026-10-14", "CPI (September)", "2026-10-14"),
    event("treasury-20y-bond-2026-10-21", "20-year bond reopening", "2026-10-21"),
    event("aapl-iphone-duo-launch-2026-10-23", "iPhone Duo goes on sale", "2026-10-23", ["AAPL"]),
    event("fomc-2026-10-28", "FOMC rate decision", "2026-10-28"),
    event("meta-2026-10-28-print", "META earnings print", "2026-10-28", ["META"]),
    event("aapl-2026-10-29-print", "AAPL earnings print", "2026-10-29", ["AAPL"]),
  ],
  closures: [],
  calls: [
    {
      eventId: "meta-2026-10-28-print",
      call: "Stand aside into the print",
      horizon: "Today",
      href: "/research/events/meta-2026-10-28-print",
      horizons: {
        month: { call: "Stand aside into the print", horizon: "This month", confidence: "low" },
      },
    },
  ],
  symbols: [],
  studies: [],
  ledgers: [],
};

let plays: unknown = { linked: true, wheels: false, plays: [] };

rstest.mock("../../src/live/settings", () => ({
  fetchSettings: () =>
    Promise.resolve({
      accounts: [
        { id: "human-eric", name: "Eric", kind: "human", suspended: false },
        { id: "sauron", name: "Sauron", kind: "bot", suspended: false },
        { id: "day-trader", name: "Day Trader", kind: "bot", suspended: false },
      ],
    }),
  ownsAccount: () => true,
}));
rstest.mock("../../src/live/desk", () => ({
  ...actualDesk,
  fetchDesk: (id: string) => Promise.resolve({ desk: { id, positions: DESKS[id] ?? [] } }),
  fetchDeskActivity: () => Promise.resolve({ available: true, activity: [] }),
}));
// Onboarding complete: the page's default is the Overview (#3807 slice 2b's `defaultSection`).
rstest.mock("../../src/live/onboarding", () => ({
  fetchOnboarding: () => Promise.resolve({ complete: true, steps: [], done: 3, total: 3 }),
}));
rstest.mock("../../src/live/networth", () => ({
  fetchNetWorth: () => Promise.reject(new Error("not used in this spec")),
}));
rstest.mock("../../src/live/options", () => ({
  fetchPlays: () => Promise.resolve(plays),
}));
rstest.mock("../../src/live/research", () => ({
  ...actualResearch,
  fetchResearch: () => Promise.resolve(RESEARCH),
}));
rstest.mock("../../src/shell/heartbeat", () => ({
  HeartbeatChip: () => null,
  HeartbeatSection: () => null,
}));
rstest.mock("../../src/shell/accounts-overview-section", () => ({
  OverviewSection: ({
    desks,
    query,
  }: {
    desks?: readonly { desk: { positions: readonly DeskPosition[] } }[];
    query: string;
  }) => {
    const rows = (desks ?? []).flatMap((d) => d.desk.positions);
    const shown = rows.filter((p) => query === "" || p.symbol.includes(query.toUpperCase()));
    return <p data-testid="blotter">Positions {shown.length}</p>;
  },
}));

function mountAccounts(initialPath: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet />, validateSearch: horizonSearch });
  const accountsRoute = Route.update({
    id: "/accounts",
    path: "/accounts",
    getParentRoute: () => rootRoute,
  } as never);
  const router = createRouter({
    routeTree: rootRoute.addChildren([accountsRoute]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

const OCTOBER = "on=2026-10-15&span=month";
const agenda = () => screen.getByRole("list", { name: /^Events / });
const rowTexts = () =>
  within(agenda())
    .getAllByRole("listitem")
    .map((li) => li.textContent);

beforeEach(() => {
  plays = { linked: true, wheels: false, plays: [] };
});

describe("/accounts?section=events — the book's calendar", () => {
  it("is listed in the section switch, and the grid's head is the page's one lens row", async () => {
    mountAccounts(`/accounts?section=events&${OCTOBER}`);
    await screen.findByRole("list", { name: /^Events / });
    expect(screen.getByRole("button", { name: "Events" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("group", { name: "Lens" })).toHaveLength(1);
    // The grid is open on this section, and each tier is a glyph + a word.
    expect(screen.getByText("Month · pick a day").closest("details")).toHaveAttribute("open");
    expect(screen.getAllByText("on what you hold").length).toBeGreaterThan(0);
  });

  it("says so when nothing held is dated (human-eric, EEM), and still lists the market-wide prints", async () => {
    mountAccounts(`/accounts?section=events&account=human-eric&${OCTOBER}`);
    await screen.findByText("Nothing dated on what you hold in October 2026.");
    expect(rowTexts()).toHaveLength(3);
    expect(rowTexts().every((t) => t?.includes("market-wide"))).toBe(true);
    expect(screen.getByText(/dated records on/).textContent).toMatch(/4 of 8 dated records/);
    // Two taps from a marked day: the jobs report is EEM's next event, so its row lands on EEM.
    const jobsRow = screen
      .getByText("Employment Situation (September)")
      .closest("li") as HTMLElement;
    expect(within(jobsRow).getByRole("link")).toHaveTextContent("EEM · 12,000 shares · no expiry");
  });

  it("puts META's print on Sauron's book with its call, linking to the position row", async () => {
    mountAccounts(`/accounts?section=events&account=sauron&${OCTOBER}`);
    await screen.findByText("META earnings print");
    const row = screen.getByText("META earnings print").closest("li") as HTMLElement;
    expect(row).toHaveTextContent("on what you hold");
    expect(row).toHaveTextContent("Stand aside into the print · low confidence");
    const links = within(row).getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveTextContent("META · 50 shares · no expiry");
    expect(links[0]?.getAttribute("href")).toMatch(/^\/accounts\?account=sauron.*#pos-META$/);
    expect(links[0]?.getAttribute("href")).not.toContain("section=");
  });

  it("gives the day-trader AAPL's two October days; a market print nobody's next links to R&D", async () => {
    mountAccounts(`/accounts?section=events&account=day-trader&${OCTOBER}`);
    await screen.findByText("AAPL earnings print");
    expect(screen.getByText("iPhone Duo goes on sale")).toBeInTheDocument();
    expect(screen.queryByText("MRVL Investor Day (NYC)")).not.toBeInTheDocument();
    expect(screen.queryByText("20-year bond reopening")).not.toBeInTheDocument();
    // The jobs report is NVDA's next event (nothing of its own sooner): its row lands on NVDA.
    const jobsRow = screen
      .getByText("Employment Situation (September)")
      .closest("li") as HTMLElement;
    expect(within(jobsRow).getByRole("link")).toHaveAttribute(
      "href",
      expect.stringMatching(/#pos-NVDA$/),
    );
    // CPI is nobody's next event here, so its one link is that day on R&D — a place, not a filter.
    const cpiRow = screen.getByText("CPI (September)").closest("li") as HTMLElement;
    expect(within(cpiRow).getByRole("link")).toHaveAttribute(
      "href",
      expect.stringContaining("/research?on=2026-10-14"),
    );
  });

  it("narrows the agenda to a picked day (?events=) and a second tap clears it", async () => {
    const router = mountAccounts(
      `/accounts?section=events&account=sauron&events=2026-10-28&${OCTOBER}`,
    );
    await screen.findByText("META earnings print");
    expect(rowTexts()).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: "Clear 2026-10-28 ×" }));
    await waitFor(() => expect(router.state.location.search).not.toHaveProperty("events"));
    await waitFor(() => expect(rowTexts()).toHaveLength(4));
  });

  it("holds the day lens behind its rung with the reason as visible text", async () => {
    plays = { linked: true, wheels: true, plays: [] };
    mountAccounts(`/accounts?section=events&account=sauron&${OCTOBER}`);
    await screen.findByText(/Day lens: Held until rung/);
    expect(screen.getByRole("button", { name: /^Day/ })).toBeDisabled();
  });
});

describe("the section switch drops Overview's filter crossing into and out of Events", () => {
  it("round-trips Events → Overview → Events with the blotter's count unchanged", async () => {
    const router = mountAccounts("/accounts?account=day-trader&q=AAPL");
    await waitFor(() => expect(screen.getByTestId("blotter")).toHaveTextContent("Positions 1"));
    await userEvent.click(screen.getByRole("button", { name: "Events" }));
    await screen.findByText(/on this book/);
    expect(router.state.location.search).not.toHaveProperty("q");
    await userEvent.click(screen.getByRole("button", { name: "Overview" }));
    await waitFor(() => expect(screen.getByTestId("blotter")).toHaveTextContent("Positions 2"));
    await userEvent.click(screen.getByRole("button", { name: "Events" }));
    await screen.findByText(/on this book/);
    await userEvent.click(screen.getByRole("button", { name: "Overview" }));
    await waitFor(() => expect(screen.getByTestId("blotter")).toHaveTextContent("Positions 2"));
    expect(router.state.location.search).not.toHaveProperty("q");
  });
});
