import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { act, configure, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DeskActivity, DeskActivityEvent, DeskActivityQuery } from "../../src/live/desk";
import { Route } from "../../src/routes/u.$id.activity";
import { SYMBOL_BEAT_MS } from "../../src/shell/account-activity";
import { FIND_PAGES } from "../../src/shell/use-activity-pages";

/**
 * An account's Activity, paged and narrowed (#4650, plan #4642): the owner watches the trades a bot
 * makes through each playbook it runs. The page renders through a real memory-history router, so
 * `Route.useSearch()` and its navigate calls are the real ones; the reads are mocked, and every
 * call is recorded so a spec can say exactly what the page asked the server for.
 */

// Each test mounts a 30-row ledger and walks it a read at a time: genuine render work (0.1-1 s on a
// quiet machine), so these specs get 15 s rather than the default 5 s (#5498). Nothing in them waits
// on the clock: the symbol box's debounce is held and released by `typeSymbolBox` below.
rstest.setConfig({ testTimeout: 15_000 });
configure({ asyncUtilTimeout: 12_000 });

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

/** Let the promise chains a render started run out — a macrotask yield, not a sleep on the clock. */
const flush = () =>
  act(async () => {
    for (let i = 0; i < 10; i++) await new Promise((resolve) => setImmediate(resolve));
  });

/** Types into the symbol box, and holds its debounce until the spec lets the beat pass (#5498).
 *  The box writes the URL `SYMBOL_BEAT_MS` after the last letter; waiting that out on the real clock
 *  made the spec's length depend on how busy the machine was. Only a timer of exactly that length is
 *  held — everything else (waitFor, the router, the query client) keeps the real clock — and
 *  `release` runs what is held. Nothing held means the page did not debounce at all, which fails the
 *  spec's `held` check rather than passing quietly. */
function typeSymbolBox(box: HTMLElement, text: string) {
  const realSet = globalThis.setTimeout;
  const realClear = globalThis.clearTimeout;
  const held = new Map<number, () => void>();
  let next = 0;
  globalThis.setTimeout = ((fn: () => void, ms?: number, ...args: unknown[]) => {
    if (ms !== SYMBOL_BEAT_MS) return realSet(fn, ms, ...args);
    held.set(--next, () => fn(...(args as [])));
    return next;
  }) as typeof setTimeout;
  globalThis.clearTimeout = ((id?: number) => {
    if (id !== undefined && held.delete(id)) return;
    realClear(id);
  }) as typeof clearTimeout;
  try {
    // A change per letter, as typing does: each one restarts the beat, so one timer is left.
    for (let n = 1; n <= text.length; n++) {
      fireEvent.change(box, { target: { value: text.slice(0, n) } });
    }
  } finally {
    globalThis.setTimeout = realSet;
    globalThis.clearTimeout = realClear;
  }
  return {
    held: held.size,
    release: () =>
      act(() => {
        for (const run of held.values()) run();
        held.clear();
      }),
  };
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
    await flush();
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
    const typed = typeSymbolBox(await screen.findByLabelText("Filter by symbol"), "nvda");
    // A beat behind: one timer is waiting, and neither the URL nor the read has moved yet.
    expect(typed.held).toBe(1);
    expect(router.state.location.search).toEqual({});
    expect(calls).toEqual([{}]);
    await typed.release();
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

  /** A bot's rows: each has a why, so each opens to a "Full detail ›" while a panel is up. */
  const reasoned = (): DeskActivity => {
    const page = firstPage();
    return {
      ...page,
      activity: page.activity.map((e) => ({
        ...e,
        reasoning: { reason: `bought ${e.orderId}`, personaId: "sauron" },
      })),
    };
  };
  const tableRow = (id: string) => document.getElementById(`act-${id}`) as HTMLElement;
  /** Opens a table row's why if it is shut, then presses its "Full detail ›". */
  const fullDetail = async (id: string) => {
    await waitFor(() => expect(tableRow(id)).not.toBeNull());
    if (tableRow(id).querySelector("[aria-expanded='false']")) {
      await userEvent.click(within(tableRow(id)).getByRole("button", { name: /Why/ }));
    }
    const why = tableRow(id).nextElementSibling as HTMLElement;
    await userEvent.click(within(why).getByRole("button", { name: /Full detail/ }));
  };
  const close = () =>
    userEvent.click(
      within(screen.getByRole("complementary")).getByRole("button", { name: /Close/ }),
    );

  it("swaps one panel for another from the live list, and one Close returns to the list", async () => {
    answer = () => reasoned();
    const router = mount("/u/sauron/activity");
    await fullDetail("ord-3");
    await waitFor(() => expect(router.state.location.search).toEqual({ order: "ord-3" }));
    // The list stays live beside the panel: a second order's full detail takes the panel's place.
    await fullDetail("ord-5");
    await waitFor(() => expect(router.state.location.search).toEqual({ order: "ord-5" }));
    expect(router.state.location.hash).toBe("act-ord-5");
    await close();
    // One Close: back to the list at the row it left — never the first order's panel again.
    await waitFor(() => expect(router.state.location.search).toEqual({}));
    expect(router.state.location.hash).toBe("act-ord-5");
    expect(screen.queryByRole("complementary")).toBeNull();
  });

  it("keeps a filter narrowed beside the open panel when Close returns to the list", async () => {
    answer = () => reasoned();
    const router = mount("/u/sauron/activity");
    await fullDetail("ord-3");
    await waitFor(() => expect(router.state.location.search).toEqual({ order: "ord-3" }));
    await typeSymbolBox(screen.getByLabelText("Filter by symbol"), "nvda").release();
    await waitFor(() =>
      expect(router.state.location.search).toEqual({ order: "ord-3", symbol: "NVDA" }),
    );
    await close();
    await waitFor(() => expect(router.state.location.search).toEqual({ symbol: "NVDA" }));
    expect(screen.queryByRole("complementary")).toBeNull();
    expect(screen.getByLabelText("Filter by symbol")).toHaveValue("nvda");
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
