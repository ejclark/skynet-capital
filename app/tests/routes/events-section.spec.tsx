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
import type { Decision, DeskPosition, PositionEvent } from "../../src/live/desk";
import { horizonSearch } from "../../src/live/horizon-params";
import * as actualResearch from "../../src/live/research" with { rstest: "importActual" };
import type { ResearchCalendarData } from "../../src/live/research";
import { Route } from "../../src/routes/accounts";

/**
 * The Profile page's Events section (#3807 slice 2c; the calendar of what you hold, #5074):
 * `?section=events` is headed by the range — the page's only date control — over a lanes picture
 * of the book and the same dates as a list, in three tiers (⧗ decide by, ◆ on what you hold,
 * ○ market-wide), over three offline fixtures: human-eric holds EEM (no print — the held tier is
 * honestly empty), sauron holds META (prints Oct 28), the day-trader holds AAPL (prints Oct 29;
 * the iPhone Duo goes on sale Oct 23). The page renders through a real memory-history router; the
 * data layer is mocked, and the Overview is a stub that prints the blotter's count so the section
 * switch's `q` drop is provable without charts.
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
const RESEARCH: ResearchCalendarData = {
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
};

let plays: unknown = { linked: true, wheels: false, plays: [] };
/** A spec's own additions to one book: an option it holds, the decision due on it. */
let extra: Record<
  string,
  {
    readonly positions: readonly DeskPosition[];
    readonly decisions: readonly Pick<Decision, "id" | "symbol" | "display" | "title" | "due">[];
  }
> = {};

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
  fetchDesk: (id: string) =>
    Promise.resolve({
      desk: {
        id,
        positions: [...(DESKS[id] ?? []), ...(extra[id]?.positions ?? [])],
        decisions: extra[id]?.decisions ?? [],
      },
    }),
  fetchDeskActivity: () => Promise.resolve({ available: true, activity: [] }),
}));
rstest.mock("../../src/live/networth", () => ({
  fetchNetWorth: () => Promise.reject(new Error("not used in this spec")),
}));
rstest.mock("../../src/live/options", () => ({
  fetchPlays: () => Promise.resolve(plays),
}));
rstest.mock("../../src/live/research", () => ({
  ...actualResearch,
  // The calendar reads its slice (#3977 slice 5); the whole shelf is R&D's board's alone.
  fetchResearch: () => Promise.reject(new Error("the calendar never reads the whole shelf")),
  fetchResearchCalendar: () => Promise.resolve(RESEARCH),
}));
rstest.mock("../../src/shell/heartbeat", () => ({ PlaybooksHeadLine: () => null }));
rstest.mock("../../src/shell/bot-playbooks", () => ({ BotPlaybooksSection: () => null }));
rstest.mock("../../src/shell/accounts-overview-section", () => ({
  OverviewSection: ({
    desks,
    query,
  }: {
    desks?: readonly { desk: { positions: readonly DeskPosition[] } }[];
    query: string;
  }) => {
    const rows = (desks ?? []).flatMap((d) => d.desk.positions);
    // The real grammar: the list opens on `sort:look` (#5070), a sort that keeps every row.
    const filter = actualDesk.parseDeskQuery(query);
    const shown = rows.filter((p) => actualDesk.matchesFilter(p, filter));
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
const head = () => screen.getByRole("heading", { level: 3 });

beforeEach(() => {
  plays = { linked: true, wheels: false, plays: [] };
  extra = {};
});

describe("the range heads Events, and no other section carries a calendar (#5074)", () => {
  it("is the section's own head: arrows, the range in words, three counted options, no Day", async () => {
    mountAccounts(`/accounts?section=events&account=sauron&${OCTOBER}`);
    await screen.findByText("META earnings print");
    expect(screen.getByRole("button", { name: "Events" })).toHaveAttribute("aria-pressed", "true");
    expect(head()).toHaveTextContent("October 2026");
    expect(screen.getByText(/^Oct 1 – Oct 31 · \d+ sessions/)).toBeInTheDocument();
    // Sauron's one date on what he holds is META's print, Oct 28: none in the week of Oct 12.
    const options = within(screen.getByRole("group", { name: "Range" })).getAllByRole("button");
    expect(options.map((b) => b.getAttribute("aria-label"))).toEqual([
      "Week — 0 dates on what you hold",
      "Month — 1 date on what you hold",
      "Quarter — 1 date on what you hold",
    ]);
    expect(options[1]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("count = dates on what you hold")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Day/ })).not.toBeInTheDocument();
    expect(screen.queryByText("Market calendar")).not.toBeInTheDocument();
  });

  it("steps by the range it shows, and a pick writes the shared span", async () => {
    const router = mountAccounts(`/accounts?section=events&account=sauron&${OCTOBER}`);
    await screen.findByText("META earnings print");
    await userEvent.click(screen.getByRole("button", { name: "Next month" }));
    await waitFor(() => expect(router.state.location.search).toMatchObject({ on: "2026-11-01" }));
    await userEvent.click(screen.getByRole("button", { name: /^Quarter/ }));
    await waitFor(() => expect(router.state.location.search).toMatchObject({ span: "quarter" }));
    expect(head()).toHaveTextContent("Q4 2026");
  });

  it("reads a shared day lens as its week with that day picked", async () => {
    mountAccounts("/accounts?section=events&account=sauron&on=2026-10-28&span=day");
    await screen.findByText("META earnings print");
    expect(head()).toHaveTextContent("Oct 26 – Nov 1");
    expect(screen.getByRole("button", { name: /^Week/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/^Wed, Oct 28 · 1 on what you hold/)).toBeInTheDocument();
  });

  it("lets a shared day lens go: Show all widens to its week in one write", async () => {
    const router = mountAccounts("/accounts?section=events&account=sauron&on=2026-10-28&span=day");
    await screen.findByText(/^Wed, Oct 28 · 1 on what you hold/);
    await userEvent.click(screen.getByRole("button", { name: "Show all of Oct 26 – Nov 1 ×" }));
    await waitFor(() => expect(router.state.location.search).not.toHaveProperty("span"));
    expect(router.state.location.search).toMatchObject({ on: "2026-10-28" });
    expect(await screen.findByText(/^Oct 26 – Nov 1 · 1 on what you hold/)).toBeInTheDocument();
  });

  it("lets a shared day lens go: the pressed Week still widens to the week", async () => {
    const router = mountAccounts("/accounts?section=events&account=sauron&on=2026-10-28&span=day");
    await screen.findByText(/^Wed, Oct 28 · 1 on what you hold/);
    await userEvent.click(screen.getByRole("button", { name: /^Week/ }));
    await waitFor(() => expect(router.state.location.search).not.toHaveProperty("span"));
    expect(await screen.findByText(/^Oct 26 – Nov 1 · 1 on what you hold/)).toBeInTheDocument();
  });

  it("shows no calendar on Overview or Activity — their content never moves with a range", async () => {
    mountAccounts(`/accounts?account=sauron&${OCTOBER}`);
    await screen.findByTestId("blotter");
    expect(screen.queryByRole("group", { name: /Lens|Range/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^(Next|Previous) / })).not.toBeInTheDocument();
    expect(screen.queryByText("Market calendar")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Activity" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Activity" })).toHaveAttribute(
        "aria-pressed",
        "true",
      ),
    );
    expect(screen.queryByRole("group", { name: /Lens|Range/ })).not.toBeInTheDocument();
  });
});

describe("the lanes picture — what the range drives", () => {
  it("draws META's print on its lane and folds NVDA, which has nothing dated", async () => {
    mountAccounts(`/accounts?section=events&account=sauron&${OCTOBER}`);
    await screen.findByText("META earnings print");
    const picture = screen.getByRole("figure", { name: "Dates on what you hold, October 2026" });
    expect(within(picture).getByText("META")).toBeInTheDocument();
    expect(
      within(picture).getByRole("button", { name: "Wed, Oct 28: META earnings print" }),
    ).toBeInTheDocument();
    expect(within(picture).getByText(/^NVDA — nothing dated in this range or after/)).toBeTruthy();
    expect(within(picture).getByText("Market-wide")).toBeInTheDocument();
    // The key names only what the frame draws: a confirmed date and the market-wide prints.
    const key = picture.querySelector(".lanes-key")?.textContent ?? "";
    expect(key).toContain("confirmed date");
    expect(key).toContain("market-wide");
    expect(key).not.toContain("decide by");
    expect(key).not.toContain("estimated date");
  });

  it("draws your days as a bold outlined tile and leaves market-wide marks bare (#5098)", async () => {
    // Oct 28 is the hard case: META prints the same day the Fed decides, one mark on each lane.
    mountAccounts(`/accounts?section=events&account=sauron&${OCTOBER}`);
    await screen.findByText("META earnings print");
    const picture = screen.getByRole("figure", { name: "Dates on what you hold, October 2026" });
    const tile = (name: string | RegExp) =>
      within(picture).getByRole("button", { name }).classList.contains("lane-mark--tile");
    expect(tile("Wed, Oct 28: META earnings print")).toBe(true);
    expect(tile(/^Wed, Oct 28: FOMC rate decision/)).toBe(false);
    expect(tile(/^Wed, Oct 14: CPI/)).toBe(false);
    // The key draws what the frame draws: the held glyph on its tile, the market-wide ring bare.
    const key = picture.querySelector(".lanes-key");
    expect(key?.querySelector(".lane-tile .lane-glyph--confirmed")).toBeTruthy();
    expect(key?.querySelector(".lane-glyph--market")?.closest(".lane-tile")).toBeNull();
  });

  it("puts a decision due on its tile too — a decision on a position is on what you hold", async () => {
    extra = {
      sauron: {
        positions: [],
        decisions: [
          {
            id: "meta-print",
            symbol: "META",
            display: "META",
            title: "Hold or trim into the print",
            due: { at: "2026-10-27", reason: "event", label: "Due Oct 27" },
          },
        ],
      },
    };
    mountAccounts(`/accounts?section=events&account=sauron&${OCTOBER}`);
    const due = await screen.findByRole("button", { name: /^Tue, Oct 27: / });
    expect(due.classList.contains("lane-mark--tile")).toBe(true);
    expect(due.querySelector(".lane-glyph--decide")).toBeTruthy();
    // The print is the next day on the same lane: a day is 11px on a 330px month, a tile 22px, so
    // the two spread a tile apart instead of the print's tile covering the decision's glyph.
    const print = screen.getByRole("button", { name: "Wed, Oct 28: META earnings print" });
    const px = (el: HTMLElement): number => (Number.parseFloat(el.style.left) / 100) * 330;
    expect(px(print) - px(due)).toBeGreaterThanOrEqual(22);
  });

  it("picks a day with a tap on its mark (?events=), and Show all clears it", async () => {
    const router = mountAccounts(`/accounts?section=events&account=sauron&${OCTOBER}`);
    await screen.findByText("META earnings print");
    expect(rowTexts()).toHaveLength(4);
    await userEvent.click(screen.getByRole("button", { name: "Wed, Oct 28: META earnings print" }));
    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({ events: "2026-10-28" }),
    );
    await waitFor(() => expect(rowTexts()).toHaveLength(2));
    expect(
      screen.getByRole("button", { name: "Wed, Oct 28: META earnings print" }),
    ).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Show all of October 2026 ×" }));
    await waitFor(() => expect(router.state.location.search).not.toHaveProperty("events"));
    await waitFor(() => expect(rowTexts()).toHaveLength(4));
  });

  it("pins a lane's next date at its edge when it is past the range, and one tap moves there", async () => {
    const router = mountAccounts("/accounts?section=events&account=sauron&on=2026-10-05");
    const edge = await screen.findByRole("button", {
      name: "Move the range to Wed, Oct 28: META earnings print",
    });
    expect(edge).toHaveTextContent("Oct 28");
    await userEvent.click(edge);
    await waitFor(() => expect(router.state.location.search).toMatchObject({ on: "2026-10-28" }));
    // The lens is the shared default, untouched: the week of Oct 26 now holds the print.
    expect(router.state.location.search).not.toHaveProperty("span");
    expect(await screen.findByText("META earnings print")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Move the range to Wed, Oct 28/ })).toBeNull();
  });
});

describe("the list — the same dates in words", () => {
  it("says so when nothing held is dated (human-eric, EEM), and still lists the market-wide prints", async () => {
    mountAccounts(`/accounts?section=events&account=human-eric&${OCTOBER}`);
    await screen.findByText("Nothing dated on what you hold yet.");
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
    expect(screen.getByText("October 2026 · 1 on what you hold · 3 market-wide")).toBeTruthy();
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
    expect(within(agenda()).getByText("iPhone Duo goes on sale")).toBeInTheDocument();
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
});

describe("an empty range names the next date on what you hold (#5045)", () => {
  // No `span`: the default week, Mon Oct 5 – Sun Oct 11 — the week three members met empty.
  const QUIET_WEEK = "on=2026-10-05";

  it("names Sauron's META print three weeks out, and one tap moves the range onto it", async () => {
    const router = mountAccounts(`/accounts?section=events&account=sauron&${QUIET_WEEK}`);
    await screen.findByText("Oct 5 – Oct 11 · nothing on what you hold · 0 market-wide");
    const next = screen.getByRole("list", { name: "Next on what you hold" });
    expect(next).toHaveTextContent("META earnings print");
    const jump = screen.getByRole("button", { name: "Move the range to Oct 26 – Nov 1 ›" });
    await userEvent.click(jump);
    // The same write the head's arrow makes: the anchor moves, the shared lens stays the default.
    await waitFor(() => expect(router.state.location.search).toMatchObject({ on: "2026-10-28" }));
    expect(router.state.location.search).not.toHaveProperty("span");
    const row = (await screen.findByText("META earnings print")).closest("li") as HTMLElement;
    expect(row).toHaveTextContent("on what you hold");
    expect(screen.queryByRole("list", { name: "Next on what you hold" })).not.toBeInTheDocument();
    expect(screen.queryByText(/nothing on what you hold/)).not.toBeInTheDocument();
  });

  it("names the day-trader's iPhone Duo day, the nearer of AAPL's two", async () => {
    mountAccounts(`/accounts?section=events&account=day-trader&${QUIET_WEEK}`);
    const next = await screen.findByRole("list", { name: "Next on what you hold" });
    expect(next).toHaveTextContent("iPhone Duo goes on sale");
  });

  it("says nothing is dated on what you hold, naming no next date, when nothing ever is (human-eric)", async () => {
    mountAccounts(`/accounts?section=events&account=human-eric&${QUIET_WEEK}`);
    await screen.findByText("Nothing dated on what you hold yet.");
    expect(screen.queryByRole("list", { name: "Next on what you hold" })).not.toBeInTheDocument();
    expect(screen.queryByText(/nothing on what you hold/)).not.toBeInTheDocument();
  });

  it("says nothing later is dated when the book's only event is behind the range", async () => {
    mountAccounts("/accounts?section=events&account=sauron&on=2026-11-09");
    await screen.findByText("Nov 9 – Nov 15 · nothing on what you hold · 0 market-wide");
    expect(screen.getByText("Nothing later on what you hold is dated yet.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Move the range/ })).not.toBeInTheDocument();
  });

  it("claims nothing when the range's one event is a decision due — that is on what you hold too", async () => {
    // Sauron's NVDA call expires Fri Oct 9 and carries no event of its own that week: the week's
    // one row is the decision (⧗), so the list neither says the week is empty nor jumps past it.
    extra = {
      sauron: {
        positions: [
          {
            symbol: "NVDA261009C00180000",
            display: "NVDA Oct 9 $180 call",
            isOption: true,
            quantity: "2",
          } as unknown as DeskPosition,
        ],
        decisions: [
          {
            id: "nvda-call-expiry",
            symbol: "NVDA261009C00180000",
            display: "NVDA Oct 9 $180 call",
            title: "Expires this week: close it, roll it, or let it expire",
            due: { at: "2026-10-09", reason: "expiry", label: "Expires Oct 9" },
          },
        ],
      },
    };
    mountAccounts(`/accounts?section=events&account=sauron&${QUIET_WEEK}`);
    await screen.findByText(/dated records on/);
    await waitFor(() => expect(rowTexts()).toHaveLength(1));
    expect(rowTexts()[0]).toContain("decide by");
    expect(screen.queryByText(/nothing on what you hold/)).not.toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Next on what you hold" })).not.toBeInTheDocument();
    // The call's lane draws the decision as ⧗ on Fri Oct 9, its words beside it.
    expect(screen.getByRole("button", { name: /^Fri, Oct 9: NVDA Oct 9 \$180 call/ })).toBeTruthy();
    expect(screen.getByText("NVDA $180 long call")).toBeInTheDocument();
  });

  it("offers no jump on a picked day — the day narrows the list, the range stays put", async () => {
    mountAccounts(`/accounts?section=events&account=sauron&events=2026-10-06&${QUIET_WEEK}`);
    await screen.findByText("Tue, Oct 6 · nothing on what you hold · 0 market-wide");
    expect(screen.queryByRole("list", { name: "Next on what you hold" })).not.toBeInTheDocument();
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
