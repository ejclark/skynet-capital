import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { horizonSearch } from "../../src/live/horizon-params";
import * as actualResearch from "../../src/live/research" with { rstest: "importActual" };
import type { ResearchCalendarData } from "../../src/live/research";
import { useBoardView } from "../../src/shell/board-section";

/**
 * R&D's grid reads the calendar's slice (#3977 slice 5), not the whole shelf: it paints while the
 * board's 2.5 MB shelf is still in flight, and the day lens's fog line counts the calls held
 * behind it from the slice's `called` marks — the calls themselves never cross for the grid.
 */

const event = (id: string, date: string, called: boolean) => ({
  id,
  title: id,
  date,
  symbols: [],
  researched: called,
  ...(called ? { called: true } : {}),
});
const CALENDAR: ResearchCalendarData = {
  events: [
    event("cpi-2026-10-14", "2026-10-14", true),
    event("pmi-2026-10-15", "2026-10-15", true),
    event("auction-2026-10-16", "2026-10-16", false),
    event("fomc-2026-10-28", "2026-10-28", true),
  ],
  closures: [],
  calls: [],
};

let plays: unknown = { linked: true, wheels: false, plays: [] };

rstest.mock("../../src/live/options", () => ({
  fetchPlays: () => Promise.resolve(plays),
}));
rstest.mock("../../src/live/research", () => ({
  ...actualResearch,
  // The shelf never lands in this spec — the grid must not be waiting on it.
  fetchResearch: () => new Promise(() => undefined),
  fetchResearchCalendar: () => Promise.resolve(CALENDAR),
}));

function Board() {
  const { band, body } = useBoardView({ active: true, query: "", setFilter: () => undefined });
  return (
    <>
      <aside aria-label="band">{band}</aside>
      <main>{body}</main>
    </>
  );
}

function mount(path: string) {
  const rootRoute = createRootRoute({ component: Board, validateSearch: horizonSearch });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("useBoardView — the grid reads the calendar's slice", () => {
  it("paints the grid while the board's shelf is still opening", async () => {
    plays = { linked: true, wheels: false, plays: [] };
    mount("/?on=2026-10-14");
    expect(await screen.findByText("Market calendar")).toBeInTheDocument();
    expect(screen.getByText("Opening Research…")).toBeInTheDocument();
  });

  it("counts the calls behind the day lens's fog from the slice's called marks", async () => {
    plays = { linked: true, wheels: true, plays: [] };
    mount("/?on=2026-10-14&span=week");
    // Oct 11–17: two called events; the uncalled auction and the Oct 28 FOMC stay out.
    const fog = await screen.findByText(/Day lens: Held until rung/);
    expect(fog.textContent).toMatch(/— 2 calls in range behind it\./);
  });
});
