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
  fetchOptionPositions: () =>
    Promise.resolve({ available: false, reason: "unlinked", rows: [], book: undefined }),
  reviewOption: () => Promise.reject(new Error("not used in this spec")),
  submitOption: () => Promise.reject(new Error("not used in this spec")),
}));
rstest.mock("../../src/live/desk", () => ({
  fetchDesk: () => Promise.resolve({ desk: { id: "human-eric", positions: [] } }),
  fetchDeskActivity: () => Promise.resolve({ available: true, activity: [] }),
}));
rstest.mock("../../src/live/orders", () => ({
  fetchOrders: () =>
    Promise.resolve({ available: false, reason: "unlinked", working: [], recent: [] }),
  cancelOrder: () => Promise.reject(new Error("not used in this spec")),
  replaceOrder: () => Promise.reject(new Error("not used in this spec")),
}));
rstest.mock("../../src/live/alerts", () => ({
  fetchDeskAlerts: () =>
    Promise.resolve({ available: false, reason: "unlinked", alerts: [], dismissable: false }),
  dismissDeskAlert: () => Promise.reject(new Error("not used in this spec")),
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
    expect(validateSearch({ section: "chain" })).toMatchObject({ section: "chain" });
    expect(validateSearch({ section: "orders" })).toMatchObject({ section: "orders" });
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

  it("renders ChainSection for ?section=chain — the bench's second tool (#3407 slice 2)", async () => {
    mountTrade("/trade?section=chain&symbol=NVDA");
    await waitFor(() =>
      expect(screen.getByText("The chain for NVDA is unreachable.")).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "Chain" })).toHaveAttribute("aria-pressed", "true");
    mountTrade("/trade?section=chain");
    await waitFor(() =>
      expect(screen.getByText(/Pick a symbol on the Ticket/)).toBeInTheDocument(),
    );
  });

  it("renders the Orders section — working orders, alerts, positions as one pane (#3407 slice 3)", async () => {
    mountTrade("/trade?section=orders");
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Working orders" })).toBeInTheDocument(),
    );
    expect(screen.getByRole("heading", { name: "Alerts" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Orders" })).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.queryByRole("heading", { name: /The ladder is waiting on you/ }),
    ).not.toBeInTheDocument();
  });

  it("keeps the ticket section free of the book — the panels live on Orders now", async () => {
    mountTrade("/trade");
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /The ladder is waiting on you/ }),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByRole("heading", { name: "Working orders" })).not.toBeInTheDocument();
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

describe("/trade the docked bench (#3407, Workbench slice 4b)", () => {
  /** `useBenchWidth` reads `matchMedia("(min-width: 1280px)")`; happy-dom has none, which is the
   *  folded default every case above relies on. Dock by installing one that matches. */
  function dock(matches: boolean) {
    const listeners = new Set<() => void>();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: () => ({
        matches,
        addEventListener: (_: string, fn: () => void) => listeners.add(fn),
        removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
      }),
    });
    return () => {
      Reflect.deleteProperty(window, "matchMedia");
    };
  }

  it("docks every pane at the bench width and drops the switch from the rail", async () => {
    const undock = dock(true);
    try {
      mountTrade("/trade?symbol=NVDA");
      await waitFor(() =>
        expect(
          screen.getByRole("heading", { name: /The ladder is waiting on you/ }),
        ).toBeInTheDocument(),
      );
      // the four panes, each labelled like the switch button it stands in for
      for (const name of ["Ticket", "Chain", "Chart", "Orders"]) {
        expect(screen.getByRole("region", { name })).toBeInTheDocument();
      }
      expect(
        await screen.findByText("Fixture bars note — the chart section is here."),
      ).toBeInTheDocument();
      expect(await screen.findByText("The chain for NVDA is unreachable.")).toBeInTheDocument();
      expect(await screen.findByRole("heading", { name: "Working orders" })).toBeInTheDocument();
      // no switch: docked, there is nothing exclusive left to choose
      expect(screen.queryByRole("button", { name: "Chart" })).not.toBeInTheDocument();
      expect(screen.queryByText("On this page")).not.toBeInTheDocument();
    } finally {
      undock();
    }
  });

  it("marks the pane ?section= names instead of choosing it", async () => {
    const undock = dock(true);
    try {
      mountTrade("/trade?section=orders");
      await waitFor(() =>
        expect(screen.getByRole("heading", { name: "Working orders" })).toBeInTheDocument(),
      );
      expect(screen.getByRole("region", { name: "Orders" })).toHaveAttribute(
        "data-current",
        "true",
      );
      expect(screen.getByRole("region", { name: "Ticket" })).not.toHaveAttribute("data-current");
      // the ticket is still on the page — docked, `?section=` scrolls, it never hides
      expect(
        screen.getByRole("heading", { name: /The ladder is waiting on you/ }),
      ).toBeInTheDocument();
    } finally {
      undock();
    }
  });

  it("folds below the bench width — the switch is back and the panes are exclusive", async () => {
    const undock = dock(false);
    try {
      mountTrade("/trade");
      await waitFor(() =>
        expect(
          screen.getByRole("heading", { name: /The ladder is waiting on you/ }),
        ).toBeInTheDocument(),
      );
      expect(screen.getByRole("button", { name: "Chart" })).toBeInTheDocument();
      expect(screen.queryByRole("region", { name: "Chain" })).not.toBeInTheDocument();
    } finally {
      undock();
    }
  });
});
