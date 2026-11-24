import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, configure, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as actualResearch from "../../src/live/research" with { rstest: "importActual" };
import { Route } from "../../src/routes/trade";

/**
 * #8337: a failed settings read is not an empty one. WHEN `/api/settings` fails, the trade page
 * SHALL say the accounts could not be read, in words, with a way to try again, and SHALL NOT say
 * "No accounts are linked to your session yet" (which sends a linked member to re-link an account
 * they already have). WHEN the read succeeds and lists none, it SHALL still say none are linked.
 * The class is `tests/arch/failed-read-not-empty.spec.ts`; the harness is `trade-section.spec.tsx`'s.
 */

const NO_ACCOUNTS = /No accounts are linked to your session yet/;
const ACCOUNT = { id: "human-eric", name: "Eric", kind: "human", suspended: false };

let settingsAnswer: () => Promise<unknown> = () => Promise.resolve({ accounts: [ACCOUNT] });
rstest.mock("../../src/live/settings", () => ({
  fetchSettings: () => settingsAnswer(),
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
}

// Same budget as trade-section.spec.tsx (#5498): mounting the route tree is genuine work.
rstest.setConfig({ testTimeout: 15_000 });
configure({ asyncUtilTimeout: 12_000 });

afterEach(() => {
  cleanup();
  settingsAnswer = () => Promise.resolve({ accounts: [ACCOUNT] });
});

describe("/trade when the accounts read fails (#8337)", () => {
  it("says the read failed, never that no accounts are linked", async () => {
    settingsAnswer = () => Promise.reject(new Error("/api/settings 503"));
    mountTrade("/trade");
    const note = await screen.findByRole("alert");
    expect(note).toHaveTextContent("Your accounts couldn't be read just now");
    expect(screen.queryByText(NO_ACCOUNTS)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "connect one in Onboarding" })).toBeNull();
  });

  it("tries the read again on tap, and opens the page once it answers", async () => {
    settingsAnswer = () => Promise.reject(new Error("/api/settings 503"));
    mountTrade("/trade");
    const retry = await screen.findByRole("button", { name: "Try again" });
    settingsAnswer = () => Promise.resolve({ accounts: [ACCOUNT] });
    await userEvent.click(retry);
    expect(await screen.findByRole("link", { name: "← Back to Eric" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("still says no accounts are linked when the read succeeds and lists none", async () => {
    settingsAnswer = () => Promise.resolve({ accounts: [] });
    mountTrade("/trade");
    expect(await screen.findByText(NO_ACCOUNTS)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
