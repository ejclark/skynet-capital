import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route } from "../../src/routes/trade";

/**
 * `/trade`'s section switch (#2017 Phase 1 chart build-out, the mount slice; the mechanism is
 * #1740's): "ticket" is the default and the untyped state, `?section=chart` swaps the ticket for
 * `ChartSection`, and switching back OMITS the param instead of writing `section=ticket`. The
 * page is rendered through a real memory-history router so `Route.useSearch()` and the navigate
 * calls are the real ones, not stubs; the data layer is mocked so the tree stays small (the
 * feedback gate keeps `DeskTicket` to its gate card, and the chart section gets a `barsNote`, so
 * no chart ever mounts — `docs/ENGINEERING.md`'s happy-dom gotcha).
 */

rstest.mock("../../src/live/settings", () => ({
  fetchSettings: () =>
    Promise.resolve({
      accounts: [{ id: "human-eric", name: "Eric", kind: "human", suspended: false }],
    }),
  ownsAccount: () => true,
}));
rstest.mock("../../src/live/options", () => ({
  fetchPlays: () =>
    Promise.resolve({
      linked: true,
      wheels: false,
      gate: { reason: "feedback", note: "Fixture gate — no ticket renders under it." },
      plays: [],
    }),
  fetchChain: () => Promise.reject(new Error("not used in this spec")),
  reviewOption: () => Promise.reject(new Error("not used in this spec")),
  submitOption: () => Promise.reject(new Error("not used in this spec")),
}));
rstest.mock("../../src/live/desk", () => ({
  fetchDesk: () => Promise.resolve({ desk: { id: "human-eric", positions: [] } }),
  fetchDeskActivity: () => Promise.resolve({ available: true, activity: [] }),
}));
rstest.mock("../../src/live/bars", () => ({
  fetchBars: () => Promise.resolve({ barsNote: "Fixture bars note — the chart section is here." }),
}));

function mountTrade(initialPath: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const tradeRoute = Route.update({
    id: "/trade",
    path: "/trade",
    getParentRoute: () => rootRoute,
  } as never);
  const router = createRouter({
    routeTree: rootRoute.addChildren([tradeRoute]),
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

describe("/trade validateSearch — section", () => {
  const validateSearch = Route.options.validateSearch as (search: Record<string, unknown>) => {
    section?: string;
  };

  it("keeps a known section id", () => {
    expect(validateSearch({ section: "chart" })).toMatchObject({ section: "chart" });
    expect(validateSearch({ section: "ticket" })).toMatchObject({ section: "ticket" });
  });

  it("drops an unknown or non-string section, and omits it when absent", () => {
    expect(validateSearch({ section: "bogus" })).not.toHaveProperty("section");
    expect(validateSearch({ section: 7 })).not.toHaveProperty("section");
    expect(validateSearch({})).not.toHaveProperty("section");
  });
});

describe("/trade section switch", () => {
  it("defaults to the ticket, with the switch in the rail", async () => {
    mountTrade("/trade");
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /The ladder is waiting on you/ }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "Ticket" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Chart" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText("Pick a symbol to see its chart.")).not.toBeInTheDocument();
  });

  it("renders ChartSection for ?section=chart, reading the committed ?symbol=", async () => {
    mountTrade("/trade?section=chart&symbol=NVDA");
    await waitFor(() =>
      expect(
        screen.getByText("Fixture bars note — the chart section is here."),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "Chart" })).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.queryByRole("heading", { name: /The ladder is waiting on you/ }),
    ).not.toBeInTheDocument();
  });

  it("shows the chart section's own empty state when no symbol is committed", async () => {
    mountTrade("/trade?section=chart");
    await waitFor(() =>
      expect(screen.getByText("Pick a symbol to see its chart.")).toBeInTheDocument(),
    );
  });

  it("omits the param from the URL when switching back to the ticket", async () => {
    const router = mountTrade("/trade?section=chart&symbol=NVDA");
    await waitFor(() =>
      expect(
        screen.getByText("Fixture bars note — the chart section is here."),
      ).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByRole("button", { name: "Ticket" }));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /The ladder is waiting on you/ }),
      ).toBeInTheDocument(),
    );
    expect(router.state.location.search).not.toHaveProperty("section");
    expect(router.state.location.search).toMatchObject({ symbol: "NVDA" });
    expect(router.state.location.href).not.toContain("section");
  });

  it("writes ?section=chart when switching to the chart", async () => {
    const router = mountTrade("/trade?symbol=NVDA");
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /The ladder is waiting on you/ }),
      ).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByRole("button", { name: "Chart" }));
    await waitFor(() =>
      expect(
        screen.getByText("Fixture bars note — the chart section is here."),
      ).toBeInTheDocument(),
    );
    expect(router.state.location.search).toMatchObject({ section: "chart", symbol: "NVDA" });
  });
});
