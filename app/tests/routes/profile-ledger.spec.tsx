import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { configure, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DeskActivity, DeskActivityEvent, DeskActivityQuery } from "../../src/live/desk";
import { horizonSearch } from "../../src/live/horizon-params";
import { Route } from "../../src/routes/accounts";

/**
 * Profile → Ledger reaches past the newest 30 (#5165): with one account picked it is the same
 * paged, narrowed list `/u/<id>/ledger` shows (that page's own spec covers the walk and the
 * filters in depth); with "All accounts" it says it holds each account's newest page and opens one
 * account's full list. Rendered through a real memory-history router; the reads are mocked and
 * every activity read is recorded with the account it asked for.
 */

configure({ asyncUtilTimeout: 5000 });

const SAURON = { id: "bot-sauron", name: "Sauron", kind: "bot", suspended: false };
const ERIC = { id: "human-eric", name: "Eric", kind: "human", suspended: false };
let accounts: unknown[] = [];
let answer: (id: string, query: DeskActivityQuery) => DeskActivity = () => ({
  available: true,
  activity: [],
});
const calls: { id: string; query: DeskActivityQuery }[] = [];

rstest.mock("../../src/live/settings", () => ({
  fetchSettings: () => Promise.resolve({ accounts }),
  ownsAccount: () => true,
}));
rstest.mock("../../src/live/networth", () => ({
  fetchNetWorth: () => Promise.reject(new Error("not used in this spec")),
}));
rstest.mock("../../src/live/desk", () => ({
  fetchDesk: (id: string) => Promise.resolve({ desk: { id, positions: [] } }),
  fetchDeskActivity: (id: string, query: DeskActivityQuery = {}) => {
    calls.push({ id, query });
    return Promise.resolve(answer(id, query));
  },
}));
rstest.mock("../../src/shell/heartbeat", () => ({ PlaybooksHeadLine: () => null }));
rstest.mock("../../src/shell/sauron-card", () => ({ SauronCard: () => null }));
rstest.mock("../../src/shell/council-line-card", () => ({ CouncilLineCard: () => null }));

const row = (orderId: string, minute: number): DeskActivityEvent => ({
  orderId,
  symbol: "NVDA",
  display: "NVDA",
  side: "buy",
  quantity: 1,
  filled: 1,
  price: "$181.40",
  status: "filled",
  at: new Date(Date.parse("2026-10-01T14:00:00Z") - minute * 60_000).toISOString(),
  backfilled: false,
  origin: "unknown",
});
/** A full first page — 30 orders and the cursor of its oldest — named for its account. */
const firstPage = (prefix: string): DeskActivity => {
  const activity = Array.from({ length: 30 }, (_, i) => row(`${prefix}-${i}`, i));
  return { available: true, activity, nextCursor: activity[29]?.at ?? "" };
};

function mount(path: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet />, validateSearch: horizonSearch });
  const accountsRoute = Route.update({
    id: "/accounts",
    path: "/accounts",
    getParentRoute: () => rootRoute,
  } as never);
  const router = createRouter({
    routeTree: rootRoute.addChildren([accountsRoute]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

const loadOlder = () => screen.findByRole("button", { name: "Load older orders" });

beforeEach(() => {
  calls.length = 0;
  accounts = [SAURON];
  window.location.hash = "";
});

// Each test mounts a route tree and waits for its data to render: genuine work (0.1-1 s on a quiet
// machine), so these specs get 15 s rather than the default 5 s (#5498). None waits on the clock.
rstest.setConfig({ testTimeout: 15_000 });
configure({ asyncUtilTimeout: 12_000 });

describe("one account's Ledger", () => {
  it("offers older orders past the newest 30, the next page following the last row, then says it reached the oldest", async () => {
    const first = firstPage("ord");
    answer = (_id, q) =>
      q.before === first.nextCursor
        ? { available: true, activity: [row("old-1", 40), row("old-2", 41)] }
        : first;
    mount("/accounts?section=ledger");
    expect(screen.queryByText(/oldest order/)).toBeNull();
    await userEvent.click(await loadOlder());
    await waitFor(() => expect(document.getElementById("act-old-2")).not.toBeNull());
    expect(calls.at(-1)).toEqual({
      id: SAURON.id,
      query: { before: first.nextCursor, symbol: undefined, playbook: undefined },
    });
    // The older page lands after the first page's last row, not merged into it.
    const ids = [...document.querySelectorAll('[id^="act-"]')].map((el) => el.id);
    expect(ids.indexOf("act-old-1")).toBeGreaterThan(ids.indexOf("act-ord-29"));
    expect(screen.queryByRole("button", { name: "Load older orders" })).toBeNull();
    expect(
      screen.getByText("That's the oldest order in this account's ledger."),
    ).toBeInTheDocument();
  });

  it("carries the read-only page's symbol box, and an older page keeps the filter", async () => {
    answer = (_id, q) =>
      q.before ? { available: true, activity: [row("old-1", 40)] } : firstPage("ord");
    mount("/accounts?section=ledger&symbol=nvda");
    await userEvent.click(await loadOlder());
    await waitFor(() => expect(document.getElementById("act-old-1")).not.toBeNull());
    expect(calls.every((c) => c.query.symbol === "NVDA")).toBe(true);
    expect(screen.getByRole("textbox", { name: "Filter by symbol" })).toHaveValue("NVDA");
    expect(
      screen.getByText("That's the oldest order on NVDA in this account's ledger."),
    ).toBeInTheDocument();
  });

  it("says a short ledger is the whole ledger, with no button to press", async () => {
    answer = () => ({ available: true, activity: [row("ord-0", 0)] });
    mount("/accounts?section=ledger");
    expect(
      await screen.findByText("That's the oldest order in this account's ledger."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load older orders" })).toBeNull();
  });
});

describe("All accounts", () => {
  beforeEach(() => {
    accounts = [SAURON, ERIC];
  });

  it("says it holds each account's newest 30 and links to the full list of each account with more", async () => {
    answer = (id) =>
      id === SAURON.id ? firstPage("s") : { available: true, activity: [row("e-0", 5)] };
    mount("/accounts?section=ledger&account=all");
    const note = await screen.findByText(/These are the newest 30 orders from each account/);
    const link = await screen.findByRole("link", { name: "Sauron ›" });
    expect(note).toContainElement(link);
    expect(link.getAttribute("href")).toMatch(/account=bot-sauron/);
    expect(link.getAttribute("href")).toMatch(/section=ledger/);
    // Eric's ledger was all on its first page: nothing more to open there.
    expect(screen.queryByRole("link", { name: "Eric ›" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Load older orders" })).toBeNull();
  });

  it("says when every account's ledger is already all here", async () => {
    answer = (id) => ({ available: true, activity: [row(`${id}-0`, 0)] });
    mount("/accounts?section=ledger&account=all");
    expect(
      await screen.findByText("That's the oldest order in every account's ledger."),
    ).toBeInTheDocument();
  });
});
