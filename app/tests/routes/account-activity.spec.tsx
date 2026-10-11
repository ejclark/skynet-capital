import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { configure, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DeskActivity, DeskActivityEvent, DeskActivityQuery } from "../../src/live/desk";
import { Route } from "../../src/routes/u.$id.activity";
import { FIND_PAGES } from "../../src/shell/use-activity-pages";

/**
 * An account's Activity, paged and narrowed (#4650, plan #4642): the owner watches the trades a bot
 * makes through each playbook it runs. The page renders through a real memory-history router, so
 * `Route.useSearch()` and its navigate calls are the real ones; the reads are mocked, and every
 * call is recorded so a spec can say exactly what the page asked the server for.
 */

// The walk is several reads in a row, each a render, and the symbol box waits out its debounce:
// room for a busy machine (the full gate runs every suite in parallel).
configure({ asyncUtilTimeout: 5000 });

let answer: (query: DeskActivityQuery) => DeskActivity = () => ({ available: true, activity: [] });
const calls: DeskActivityQuery[] = [];

rstest.mock("../../src/live/desk", () => ({
  fetchDeskActivity: (_id: string, query: DeskActivityQuery = {}) => {
    calls.push(query);
    return Promise.resolve(answer(query));
  },
}));
rstest.mock("../../src/shell/account-head", () => ({
  useOwnsAccount: () => true,
}));

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
/** A full first page: 30 orders, and the cursor of its oldest. */
const firstPage = (extra: Partial<DeskActivity> = {}): DeskActivity => {
  const activity = Array.from({ length: 30 }, (_, i) => row(`ord-${i}`, i));
  return { available: true, activity, nextCursor: activity[29]?.at ?? "", ...extra };
};

function mount(path: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const activityRoute = Route.update({
    id: "/u/$id/activity",
    path: "/u/$id/activity",
    getParentRoute: () => rootRoute,
  } as never);
  const router = createRouter({
    routeTree: rootRoute.addChildren([activityRoute]),
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
const chips = () =>
  within(screen.getByRole("group", { name: "Playbook" }))
    .getAllByRole("button")
    .map((b) => [b.textContent, b.getAttribute("aria-pressed")]);

beforeEach(() => {
  calls.length = 0;
  window.location.hash = "";
});

describe("older orders", () => {
  it("loads the page older than the first with the server's cursor, and stops when none is left", async () => {
    const first = firstPage();
    answer = (q) =>
      q.before === first.nextCursor
        ? { available: true, activity: [row("old-1", 40), row("old-2", 41)] }
        : first;
    mount("/u/sauron/activity");
    await userEvent.click(await loadOlder());
    await waitFor(() => expect(document.getElementById("act-old-2")).not.toBeNull());
    expect(calls.at(-1)).toEqual({
      before: first.nextCursor,
      symbol: undefined,
      playbook: undefined,
    });
    expect(document.getElementById("act-ord-0")).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Load older orders" })).toBeNull();
  });

  /** Every older page holds one order, `old-<n>`, and points further back still. */
  const endlessLedger = () => {
    let served = 0;
    return (q: DeskActivityQuery): DeskActivity => {
      if (q.before === undefined) return firstPage();
      served += 1;
      return {
        available: true,
        activity: [row(`old-${served}`, 40 + served)],
        nextCursor: `c${served}`,
      };
    };
  };
  const olderReads = () => calls.filter((q) => q.before !== undefined);

  it("walks back on its own to an order a link points at, and stops once it is there", async () => {
    window.location.hash = "#act-old-3";
    answer = endlessLedger();
    mount("/u/sauron/activity");
    await waitFor(() => expect(document.getElementById("act-old-3")).not.toBeNull());
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(olderReads()).toHaveLength(3);
  });

  it(`walks at most ${FIND_PAGES} pages under the filter that is on, then says the order is further back`, async () => {
    window.location.hash = "#act-never";
    answer = endlessLedger();
    mount("/u/sauron/activity?symbol=AMD");
    expect(await screen.findByText(/older than the 35 loaded here/)).toBeInTheDocument();
    expect(olderReads()).toHaveLength(FIND_PAGES);
    expect(olderReads().every((q) => q.symbol === "AMD")).toBe(true);
    // The button carries on from where the walk stopped.
    expect(await loadOlder()).toBeEnabled();
  });
});

describe("narrowing by symbol", () => {
  it("sends what the box says, a beat behind, into the URL and the read — and pages under it", async () => {
    const first = firstPage();
    answer = (q) => (q.before ? { available: true, activity: [row("old-1", 40)] } : first);
    const router = mount("/u/sauron/activity");
    await userEvent.type(await screen.findByLabelText("Filter by symbol"), "nvda");
    await waitFor(() => expect(router.state.location.search).toMatchObject({ symbol: "NVDA" }));
    await waitFor(() => expect(calls.at(-1)).toMatchObject({ symbol: "NVDA" }));
    await userEvent.click(await loadOlder());
    await waitFor(() =>
      expect(calls.at(-1)).toMatchObject({ before: first.nextCursor, symbol: "NVDA" }),
    );
  });

  it("names the filter on an empty result and offers to clear it", async () => {
    answer = (q) => (q.symbol ? { available: true, activity: [] } : firstPage());
    const router = mount("/u/sauron/activity?symbol=ZZZ");
    expect(await screen.findByText(/No orders on ZZZ in this account's ledger\./)).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Clear the filter" }));
    await waitFor(() => expect(router.state.location.search).toEqual({}));
    await waitFor(() => expect(document.getElementById("act-ord-0")).not.toBeNull());
    expect(screen.getByLabelText("Filter by symbol")).toHaveValue("");
  });
});

describe("narrowing by playbook", () => {
  it("gives the owner one chip per playbook, All first, and narrows by the one pressed", async () => {
    answer = (q) =>
      firstPage({
        playbooks: ["CRWV-WHEEL", "NVDA-CALL-SPREAD"],
        ...(q.playbook ? { activity: [row("mleg-1", 0)], nextCursor: undefined } : {}),
      });
    const router = mount("/u/sauron/activity");
    await screen.findByRole("group", { name: "Playbook" });
    // Pressed reads as a ✓ as well as the accent — never the hue alone.
    expect(chips()).toEqual([
      ["✓All", "true"],
      ["CRWV-WHEEL", "false"],
      ["NVDA-CALL-SPREAD", "false"],
    ]);
    await userEvent.click(screen.getByRole("button", { name: "NVDA-CALL-SPREAD" }));
    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({ playbook: "NVDA-CALL-SPREAD" }),
    );
    await waitFor(() => expect(document.getElementById("act-ord-0")).toBeNull());
    expect(calls.at(-1)).toMatchObject({ playbook: "NVDA-CALL-SPREAD" });
    expect(chips()).toEqual([
      ["All", "false"],
      ["CRWV-WHEEL", "false"],
      ["✓NVDA-CALL-SPREAD", "true"],
    ]);
  });

  it("draws no chips when the server sends no list — anyone but the bot's owner", async () => {
    answer = () => firstPage();
    mount("/u/sauron/activity");
    await waitFor(() => expect(document.getElementById("act-ord-0")).not.toBeNull());
    expect(screen.queryByRole("group", { name: "Playbook" })).toBeNull();
    expect(screen.getByLabelText("Filter by symbol")).toBeInTheDocument();
  });
});

/** #5101 (R2-deep): an order's full detail lives in the URL — `?order=<id>#act-<id>` — so it is
 *  linkable, and its one way back returns to the same row. */
describe("an order's full detail", () => {
  /** happy-dom has no `matchMedia` — the desktop default. A phone installs one that matches. */
  function phone(): () => void {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: () => ({
        matches: true,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }),
    });
    return () => Reflect.deleteProperty(window, "matchMedia");
  }

  it("opens from a link as a panel beside the live list on a desktop, and Close drops it", async () => {
    answer = () => firstPage();
    const router = mount("/u/sauron/activity?order=ord-3");
    const panel = await screen.findByRole("complementary");
    expect(within(panel).getByRole("heading", { level: 3 })).toHaveTextContent(
      "NVDA rises from $181.40",
    );
    expect(document.getElementById("act-ord-0")).not.toBeNull();
    expect(screen.getByLabelText("Filter by symbol")).toBeInTheDocument();
    await userEvent.click(within(panel).getByRole("button", { name: /Close/ }));
    await waitFor(() => expect(router.state.location.search).toEqual({}));
    expect(screen.queryByRole("complementary")).toBeNull();
  });

  it("on a phone, opens as a page from the card and steps back to the same row, opened", async () => {
    const restore = phone();
    try {
      answer = () => firstPage();
      const router = mount("/u/sauron/activity");
      const card = () => document.getElementById("act-ord-3") as HTMLElement;
      await waitFor(() => expect(card()).not.toBeNull());
      await userEvent.click(within(card()).getAllByRole("button")[0] as HTMLElement);
      await userEvent.click(within(card()).getByRole("button", { name: /Full detail/ }));
      await waitFor(() => expect(router.state.location.search).toEqual({ order: "ord-3" }));
      expect(router.state.location.hash).toBe("act-ord-3");
      // A page in the list's place: the list, its heading and its filter step aside.
      expect(screen.queryByLabelText("Filter by symbol")).toBeNull();
      expect(document.getElementById("act-ord-0")).toBeNull();
      await userEvent.click(screen.getByRole("button", { name: "‹ Activity" }));
      await waitFor(() => expect(router.state.location.search).toEqual({}));
      expect(router.state.location.hash).toBe("act-ord-3");
      await waitFor(() => expect(card()).toHaveAttribute("data-open"));
    } finally {
      restore();
    }
  });
});
