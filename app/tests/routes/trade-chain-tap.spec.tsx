import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as actualResearch from "../../src/live/research" with { rstest: "importActual" };
import { normalizeLimit, normalizeQty, Route, suggestionNote } from "../../src/routes/trade";

/**
 * A tap on the standalone Chain section opens the ticket the cell names (#5166): the chain's own
 * line says "tap a bid to sell it or an ask to buy it", and for weeks a bid opened a BUY at the
 * mid. Driven through the real page and a memory-history router, so the route's hand-off (the
 * tapped price riding state beside the URL across the ticket's remount) is the real one.
 */

const play = (code: string, name: string, side: "buy" | "sell", optionType: "call" | "put") => ({
  code,
  id: code,
  name,
  tldr: "",
  kind: "option",
  side,
  optionType,
  gloss: "",
  locked: false,
  earned: true,
});
let plays = [
  play("201", "Sell a cash-secured put", "sell", "put"),
  play("202", "Sell a covered call", "sell", "call"),
  play("301", "Buy a long put", "buy", "put"),
  play("302", "Buy a long call", "buy", "call"),
];

rstest.mock("../../src/live/settings", () => ({
  fetchSettings: () =>
    Promise.resolve({
      accounts: [{ id: "human-eric", name: "Eric", kind: "human", suspended: false }],
    }),
  ownsAccount: () => true,
}));
rstest.mock("../../src/live/options", () => ({
  fetchPlays: () => Promise.resolve({ linked: true, wheels: false, plays }),
  fetchChain: (symbol: string, optionType: "call" | "put") =>
    Promise.resolve({
      symbol,
      optionType,
      expirations: ["2026-10-09"],
      expiration: "2026-10-09",
      spot: 226,
      rows: [
        {
          strike: 225,
          occSymbol: `NVDA261009${optionType === "call" ? "C" : "P"}00225000`,
          premium: 7.3,
          bid: 7.15,
          ask: 7.45,
        },
      ],
    }),
  fetchOptionPositions: () =>
    Promise.resolve({ available: false, reason: "unlinked", rows: [], book: undefined }),
  reviewOption: () => Promise.reject(new Error("not used in this spec")),
  submitOption: () => Promise.reject(new Error("not used in this spec")),
}));
rstest.mock("../../src/live/quote", () => ({
  fetchQuote: () => Promise.resolve({ quoteNote: "Fixture quote note." }),
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
rstest.mock("../../src/live/research", () => ({
  ...actualResearch,
  fetchResearch: () => Promise.reject(new Error("the calendar never reads the whole shelf")),
  fetchResearchCalendar: () => Promise.resolve({ events: [], closures: [], calls: [] }),
}));
rstest.mock("../../src/live/bars", () => ({
  fetchBars: () => Promise.resolve({ barsNote: "Fixture bars note." }),
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

describe("/trade — a chain tap opens the ticket the cell names (#5166)", () => {
  beforeEach(() => {
    plays = plays.map((p) => ({ ...p, locked: false }));
  });

  it("a call bid on 'Buy a long call' opens 'Sell a covered call' at the bid", async () => {
    const router = mountTrade("/trade?section=chain&symbol=NVDA&play=302");
    fireEvent.click(await screen.findByRole("button", { name: "Pick the 225 call bid" }));
    expect(await screen.findByRole("heading", { name: "Sell a covered call" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Limit /share")).toHaveValue(7.15));
    expect(router.state.location.search).toMatchObject({ play: "202", strike: "225" });
  });

  it("a call ask on 'Sell a covered call' opens 'Buy a long call' at the ask", async () => {
    mountTrade("/trade?section=chain&symbol=NVDA&play=202");
    fireEvent.click(await screen.findByRole("button", { name: "Pick the 225 call ask" }));
    expect(await screen.findByRole("heading", { name: "Buy a long call" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Limit /share")).toHaveValue(7.45));
  });

  it("a locked sell rung keeps the ticket, fills the strike at the mid, and says why", async () => {
    plays = plays.map((p) => (p.code === "202" ? { ...p, locked: true } : p));
    mountTrade("/trade?section=chain&symbol=NVDA&play=302");
    fireEvent.click(await screen.findByRole("button", { name: "Pick the 225 call bid" }));
    expect(await screen.findByRole("heading", { name: "Buy a long call" })).toBeInTheDocument();
    expect(
      await screen.findByText(
        "Strike filled — “Sell a covered call” isn't unlocked yet, so the side didn't change.",
      ),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Limit /share")).toHaveValue(7.3));
  });
});

describe("/trade — a suggestion link of Moneypenny's fills the whole ticket (#7547)", () => {
  it("opens the rung on the named contract with her count, her limit and the line saying whose they are", async () => {
    const router = mountTrade(
      "/trade?symbol=NVDA&play=201&strike=225&exp=2026-10-09&qty=2&limit=6.90&tier=standard",
    );
    expect(
      await screen.findByRole("heading", { name: "Sell a cash-secured put" }),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Limit /share")).toHaveValue(6.9));
    expect(screen.getByLabelText("Contracts (100 shares)")).toHaveValue(2);
    expect(
      screen.getByText(
        "Standard option from Moneypenny (SIM): 2 contracts at $6.90, the mid when Moneypenny suggested it. Check the live quote before you review.",
      ),
    ).toBeInTheDocument();
    // spent once staged: the count and price leave the URL so they can never re-price another strike
    await waitFor(() => expect(router.state.location.search).not.toHaveProperty("qty"));
    expect(router.state.location.search).not.toHaveProperty("limit");
    expect(router.state.location.search).toMatchObject({ play: "201", strike: "225" });
  });

  it("drops a count or price that is not a clean number", () => {
    expect(normalizeQty("2")).toBe(2);
    expect(normalizeQty("0")).toBeUndefined();
    expect(normalizeQty("2.5")).toBeUndefined();
    expect(normalizeQty("1000")).toBeUndefined();
    expect(normalizeLimit("3.15")).toBe(3.15);
    expect(normalizeLimit(6.9)).toBe(6.9);
    expect(normalizeLimit("3.155")).toBeUndefined();
    expect(normalizeLimit("-1")).toBeUndefined();
    expect(normalizeLimit("abc")).toBeUndefined();
  });

  it("words the line for a link that names no tier, and for one contract", () => {
    expect(suggestionNote(undefined, 1, 2)).toBe(
      "Suggested trade from Moneypenny (SIM): 1 contract at $2.00, the mid when Moneypenny suggested it. Check the live quote before you review.",
    );
    expect(suggestionNote("high-risk", 3, undefined)).toBe(
      "High risk option from Moneypenny (SIM): 3 contracts.",
    );
  });
});
