import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  retainSearchParams,
} from "@tanstack/react-router";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { horizonSearch } from "../../src/live/horizon-params";
import * as actualResearch from "../../src/live/research" with { rstest: "importActual" };
import type { ResearchCalendarData } from "../../src/live/research";
import { EventsSection } from "../../src/shell/events-section";
import { TradeClock } from "../../src/shell/trade-clock";

/**
 * The market calendar's head on Trade (#3807 slice 3b-2): R&D's head row, with its line scoped to
 * the ticket's symbol — ◆ "on <SYM>" and ○ "market-wide" — and its range the ROOT `?on=&span=`,
 * so a week stepped to on the Profile page's Events (#5074) is the week Trade opens on. Two routes
 * over one real memory-history router whose root retains the range exactly as `__root.tsx` does;
 * the research corpus is a fixture (META prints Oct 28, the Fed decides Oct 28, the jobs report
 * lands Oct 2, a Treasury sale and an AAPL launch sit in the week of Oct 19 and are neither).
 */

const event = (id: string, title: string, date: string, symbols: string[] = [], kind?: string) => ({
  id,
  title,
  date,
  symbols,
  researched: false,
  ...(kind ? { kind } : {}),
});
const RESEARCH: ResearchCalendarData = {
  events: [
    event("jobs-2026-10-02", "Employment Situation (September)", "2026-10-02"),
    event("treasury-20y-bond-2026-10-21", "20-year bond reopening", "2026-10-21"),
    event("aapl-iphone-duo-launch-2026-10-23", "iPhone Duo goes on sale", "2026-10-23", ["AAPL"]),
    event("fomc-2026-10-28", "FOMC rate decision", "2026-10-28"),
    event("meta-2026-10-28-print", "META earnings print", "2026-10-28", ["META"], "earnings"),
  ],
  closures: [],
  calls: [],
};

rstest.mock("../../src/live/options", () => ({
  fetchPlays: () => Promise.resolve({ linked: true, wheels: false, plays: [] }),
}));
rstest.mock("../../src/live/research", () => ({
  ...actualResearch,
  // The calendar reads its slice (#3977 slice 5); the whole shelf is R&D's board's alone.
  fetchResearch: () => Promise.reject(new Error("the calendar never reads the whole shelf")),
  fetchResearchCalendar: () => Promise.resolve(RESEARCH),
}));

function mount(initialPath: string) {
  const rootRoute = createRootRoute({
    component: () => <Outlet />,
    validateSearch: horizonSearch,
    search: { middlewares: [retainSearchParams(["on", "span"])] },
  });
  const accounts = createRoute({
    getParentRoute: () => rootRoute,
    path: "/accounts",
    // The Profile page's one range control is its Events section's head (#5074).
    component: () => (
      <EventsSection
        desks={[]}
        desksLoading={false}
        desksError={false}
        day={undefined}
        onPickDay={() => undefined}
      />
    ),
  });
  const trade = createRoute({
    getParentRoute: () => rootRoute,
    path: "/trade",
    validateSearch: (s: Record<string, unknown>) =>
      typeof s.symbol === "string" ? { symbol: s.symbol } : {},
    component: function Trade() {
      const { symbol } = trade.useSearch();
      return <TradeClock symbol={symbol ?? ""} />;
    },
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([accounts, trade]),
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

/** The head's events line, once the corpus has loaded. */
async function line(): Promise<string> {
  const head = await screen.findByRole("region", { name: "Market calendar" });
  await waitFor(() =>
    expect(head.querySelector(".held-events")?.textContent).not.toMatch(/Reading the calendar/),
  );
  return head.querySelector(".held-events")?.textContent ?? "";
}

describe("TradeClock — the line, scoped to the ticket's symbol", () => {
  it("names the symbol's own dated event, then the market-wide print, each a glyph and a word", async () => {
    mount("/trade?symbol=META&on=2026-10-26");
    const text = await line();
    expect(text).toBe("◆ on META: Earnings Wed Oct 28 · ○ market-wide: Fed meeting Wed Oct 28");
    const head = screen.getByRole("region", { name: "Market calendar" });
    expect(within(head).getByText("Oct 26 – Nov 1")).toBeInTheDocument();
  });

  it("says the range honestly when nothing is dated on the symbol, and keeps the market tier", async () => {
    mount("/trade?symbol=EEM&on=2026-10-26");
    expect(await line()).toBe(
      "Nothing dated on EEM Oct 26 – Nov 1 · ○ market-wide: Fed meeting Wed Oct 28",
    );
  });

  it("reads market-wide only before a symbol is picked", async () => {
    mount("/trade?on=2026-10-26");
    expect(await line()).toBe("○ market-wide: Fed meeting Wed Oct 28");
  });

  it("says the range when no symbol is picked and nothing market-wide is dated", async () => {
    mount("/trade?on=2026-10-19");
    // The AAPL launch names another symbol and the Treasury sale is not a headline print.
    expect(await line()).toBe("Nothing market-wide dated Oct 19 – Oct 25");
  });
});

describe("TradeClock — one range with the Profile page, never an expiration", () => {
  it("opens Trade on the week stepped to on the Profile page", async () => {
    const user = userEvent.setup();
    const router = mount("/accounts?on=2026-10-19");
    await user.click(await screen.findByRole("button", { name: "Next week" }));
    await waitFor(() => expect(router.state.location.search).toMatchObject({ on: "2026-10-26" }));
    await router.navigate({ to: "/trade", search: { symbol: "META" } as never });
    expect(await line()).toMatch(/^◆ on META: Earnings Wed Oct 28/);
    expect(router.state.location.search).toMatchObject({ on: "2026-10-26", symbol: "META" });
  });

  it("moves the calendar's range and writes no expiration", async () => {
    const user = userEvent.setup();
    const router = mount("/trade?symbol=META&on=2026-10-19");
    await line();
    await user.click(screen.getByRole("button", { name: "Next week" }));
    await waitFor(() => expect(router.state.location.search).toMatchObject({ on: "2026-10-26" }));
    expect(router.state.location.search).not.toHaveProperty("exp");
    expect(screen.queryByLabelText(/Expiration/)).toBeNull();
  });
});
