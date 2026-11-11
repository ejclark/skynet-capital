import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  editionEventKey,
  isRowAnchor,
  landingRowAnchor,
  PIVOT_MAX,
  parsePivot,
  pivotHref,
} from "../../../src/domain/edition-keys";
import type { Edition, EditionDate } from "../../src/live/edition";
import { horizonSearch } from "../../src/live/horizon-params";
import { useMoneypenny } from "../../src/live/moneypenny";
import { pivotOf } from "../../src/live/moneypenny-links";
import { calendarShows, LandingCalendar } from "../../src/shell/landing-calendar";
import { MoneypennyRail } from "../../src/shell/moneypenny-rail";

/**
 * THE PAGE PIVOTS TO HER ANSWER (#7167 slice 3; #7018 round 4, Eric's "More of B": "pivots the
 * calendar to the three reports she named, and ✕ or Back returns"). When her answer links two or
 * more of the landing page's rows, one line under it narrows the calendar to just those rows. The
 * pivot is a page address (`/?show=…#calendar`), so the member's tap is the only thing that changes
 * the page, and Back or ✕ undoes it.
 */

const coreweave: EditionDate = {
  date: "2026-11-10",
  when: "after the close",
  what: "CoreWeave Q3 results",
  status: "confirmed" as const,
};
const cpi: EditionDate = {
  date: "2026-11-12",
  when: "8:30 ET",
  what: "October CPI",
  status: "confirmed" as const,
};
const jobs: EditionDate = {
  date: "2026-12-05",
  when: "8:30 ET",
  what: "November jobs report",
  status: "estimate" as const,
};

const story = (id: string, line: string) => ({
  id,
  headline: `${line}.`,
  line,
  symbols: [],
  facts: [],
  reports: [],
  more: [],
});

const edition: Edition = {
  date: "2026-11-06",
  writtenBy: "Written by hand",
  ageDays: 3,
  stories: [story("ai-capex", "AI capex keeps climbing"), story("rates", "Rates drift lower")],
  next: [coreweave, cpi, jobs],
};

const ev = (e: EditionDate) => `event-${editionEventKey(e)}`;
const week = { lens: "week" as const, pinned: false, anchor: "2026-11-09" };

afterEach(cleanup);

describe("the pivot's address (src/domain/edition-keys.ts)", () => {
  it("names rows by the keys her links already use, and lands on the calendar", () => {
    expect(pivotHref(["story-ai-capex", ev(jobs)])).toBe(
      "/?show=story-ai-capex,event-2026-12-05-november-jobs-report#calendar",
    );
  });

  it("reads back only story and event anchors, de-duplicated and bounded", () => {
    expect(parsePivot(`story-ai-capex,${ev(cpi)},story-ai-capex`)).toEqual([
      "story-ai-capex",
      ev(cpi),
    ]);
    expect(parsePivot("calendar,pos-NVDA,story-,event-Bad Key,<script>")).toEqual([]);
    expect(parsePivot(42)).toEqual([]);
    const many = Array.from({ length: 9 }, (_, i) => `story-s${String(i)}`).join(",");
    expect(parsePivot(many)).toHaveLength(PIVOT_MAX);
  });

  it("tells a row anchor from the calendar section and from other pages' anchors", () => {
    expect(isRowAnchor("story-ai-capex")).toBe(true);
    expect(isRowAnchor(ev(coreweave))).toBe(true);
    expect(isRowAnchor("calendar")).toBe(false);
    expect(isRowAnchor("pos-NVDA")).toBe(false);
    expect(landingRowAnchor("/#story-ai-capex")).toBe("story-ai-capex");
    expect(landingRowAnchor("/#calendar")).toBeUndefined();
    expect(landingRowAnchor("/accounts#pos-NVDA")).toBeUndefined();
  });
});

describe("her answer offers the pivot (live/moneypenny-links.ts)", () => {
  it("offers it when she links two or more rows, in the order she named them", () => {
    const answer = `Two to watch: [CoreWeave](/#${ev(coreweave)}) and [the AI story](/#story-ai-capex). [2 more on the calendar](/#calendar)`;
    expect(pivotOf(answer)).toEqual({
      href: `/?show=${ev(coreweave)},story-ai-capex#calendar`,
      count: 2,
    });
  });

  it("offers none for one row: her link already lands on it", () => {
    expect(pivotOf(`Watch [CoreWeave](/#${ev(coreweave)}).`)).toBeUndefined();
  });

  it("offers none for places that are not the landing page's rows", () => {
    expect(
      pivotOf("See [NVDA](/accounts#pos-NVDA), [Trade](/trade) and [the calendar](/#calendar)."),
    ).toBeUndefined();
  });

  it("counts a row named twice once", () => {
    const answer = `[CoreWeave](/#${ev(coreweave)}), again [CoreWeave](/#${ev(coreweave)}), and [CPI](/#${ev(cpi)})`;
    expect(pivotOf(answer)?.count).toBe(2);
  });
});

describe("what a pivot shows (calendarShows)", () => {
  it("shows exactly the named rows, whatever the range, and nothing else", () => {
    const shows = calendarShows(edition, "2026-11-09", week, ["story-rates", ev(jobs)]);
    expect(shows.inside).toEqual([jobs]);
    expect(shows.stories.map((s) => s.id)).toEqual(["rates"]);
  });

  it("without a pivot, shows the range's events and every story, as before", () => {
    const shows = calendarShows(edition, "2026-11-09", week);
    expect(shows.inside).toEqual([coreweave, cpi]);
    expect(shows.stories).toHaveLength(2);
  });
});

/** The landing page in miniature: the calendar on `/`, reading and clearing `?show=` the way
 *  `routes/index.tsx` does, with the rail beside it. */
async function mount(path: string) {
  const root = createRootRoute({
    validateSearch: horizonSearch,
    component: () => (
      <>
        <Outlet />
        <MoneypennyRail />
      </>
    ),
  });
  function Page() {
    const search: { show?: string } = useSearch({ strict: false });
    const navigate = useNavigate();
    return (
      <LandingCalendar
        edition={edition}
        today="2026-11-09"
        storyAsk={() => null}
        pivot={parsePivot(search.show)}
        onClearPivot={() =>
          void navigate({
            to: "/",
            search: (prev: Record<string, unknown>) => ({ ...prev, show: undefined }),
          })
        }
      />
    );
  }
  const landing = createRoute({ getParentRoute: () => root, path: "/", component: Page });
  const router = createRouter({
    routeTree: root.addChildren([landing]),
    basepath: "/app",
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  await screen.findByText("The calendar");
  return router;
}

const rowShown = (anchor: string) => document.getElementById(anchor) !== null;

describe("the landing page pivots to her answer", () => {
  beforeEach(() => {
    localStorage.clear();
    useMoneypenny.getState().reset();
  });

  it("draws only the named rows, under a bar that says they are her answer", async () => {
    await mount(`/app/?show=story-ai-capex,${ev(jobs)}`);
    expect(rowShown("story-ai-capex")).toBe(true);
    expect(rowShown(ev(jobs))).toBe(true);
    expect(rowShown("story-rates")).toBe(false);
    expect(rowShown(ev(coreweave))).toBe(false);
    expect(screen.getByText(/Moneypenny's answer: 2 rows of the calendar/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Show the whole calendar/ })).toBeInTheDocument();
  });

  it("says so when the rows it names have left the edition, rather than drawing nothing", async () => {
    await mount("/app/?show=story-gone,story-also-gone");
    expect(screen.getByText(/aren't in this edition any more/)).toBeInTheDocument();
    expect(rowShown("story-ai-capex")).toBe(false);
  });

  it("✕ brings the whole calendar back", async () => {
    const router = await mount(`/app/?show=story-ai-capex,${ev(cpi)}`);
    fireEvent.click(screen.getByRole("button", { name: /Show the whole calendar/ }));
    await waitFor(() => expect(rowShown("story-rates")).toBe(true));
    expect(rowShown(ev(coreweave))).toBe(true);
    expect(router.state.location.search).not.toHaveProperty("show");
    expect(screen.queryByText(/Moneypenny's answer/)).not.toBeInTheDocument();
  });

  it("her answer's line pivots the page on a tap, and Back undoes it", async () => {
    const router = await mount("/app/");
    expect(rowShown("story-rates")).toBe(true);
    await act(() =>
      useMoneypenny.setState({
        open: true,
        messages: [
          {
            role: "mp",
            text: `Two to watch: [CoreWeave](/#${ev(coreweave)}) and [CPI](/#${ev(cpi)}).`,
          },
        ],
      }),
    );
    // The chat never changes the page on its own: her answer alone leaves every row in place.
    expect(rowShown("story-rates")).toBe(true);
    const line = screen.getByRole("link", { name: "Show just these 2 on the page ›" });
    expect(line).toHaveAttribute("href", `/app/?show=${ev(coreweave)},${ev(cpi)}#calendar`);
    fireEvent.click(line);
    await waitFor(() => expect(rowShown("story-rates")).toBe(false));
    expect(rowShown(ev(coreweave))).toBe(true);
    expect(rowShown(ev(cpi))).toBe(true);
    act(() => {
      router.history.back();
    });
    await waitFor(() => expect(rowShown("story-rates")).toBe(true));
  });
});
