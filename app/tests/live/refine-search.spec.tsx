import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  retainSearchParams,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { horizonSearch, useHorizonRange } from "../../src/live/horizon-params";
import { useRefineSearch } from "../../src/live/refine-search";
import { parseSearch, stringifySearch } from "../../src/live/search-params";
import { LensSwitch, useLens } from "../../src/shell/positions-lens";

/**
 * Same-page refinements keep the scroll position (#4944). The router scrolls the window to the
 * top after every navigation unless the call opts out, so a filter chip tapped halfway down the
 * Profile page jumped it to the top ~300ms later. Mounted through a real memory-history router
 * (the app's root wiring, as `horizon-params.spec.tsx` does) with `window.scrollTo` spied, the
 * inverse of `profile-door.spec.tsx`'s spy: a refinement must not scroll to the top, while a
 * section switch still does (that one proves the spy sees the router's reset at all).
 */

/** The window's scroll, as the spied `scrollTo` moves it — a member halfway down the page. */
const READING_AT = 600;
let scrollY = READING_AT;
const moveWindow = (a?: ScrollToOptions | number, b?: number) => {
  const top = typeof a === "number" ? b : a?.top;
  if (top !== undefined) scrollY = top;
};
/** EARS (#4944): unchanged, ±4px, once the write has settled. */
const keptPlace = () => Math.abs(scrollY - READING_AT) <= 4;
/** The router's reset runs on `onRendered`, a beat after the new search reaches the page. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 50));

/** One page with the controls #4944 names: a debounced filter (the Profile page's discipline), a
 *  lens switch, the calendar range — and a section switch, a whole-view change that resets. */
function Page(): ReactElement {
  const search = useSearch({ strict: false }) as { q?: string; section?: string };
  const refine = useRefineSearch();
  const navigate = useNavigate();
  const [lens, setLens] = useLens();
  const horizon = useHorizonRange();
  const [query, setQuery] = useState(search.q ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const onFilter = (next: string) => {
    setQuery(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => refine((prev) => ({ ...prev, q: next === "" ? undefined : next })),
      300,
    );
  };
  return (
    <div>
      <output data-testid="url">
        {[search.q ?? "-", lens, horizon.lens, horizon.anchor, search.section ?? "-"].join(" ")}
      </output>
      <input aria-label="Filter" value={query} onChange={(e) => onFilter(e.target.value)} />
      <LensSwitch lens={lens} onChange={setLens} />
      <button type="button" onClick={() => horizon.setLens("month")}>
        month
      </button>
      <button type="button" onClick={() => horizon.step(1)}>
        next
      </button>
      <button
        type="button"
        onClick={() =>
          void navigate({
            search: ((prev: Record<string, unknown>) => ({ ...prev, section: "events" })) as never,
            replace: true,
          })
        }
      >
        Events
      </button>
    </div>
  );
}

function mount() {
  const root = createRootRoute({
    validateSearch: horizonSearch,
    search: { middlewares: [retainSearchParams(["on", "span"])] },
    component: () => <Outlet />,
  });
  const page = createRoute({ getParentRoute: () => root, path: "/accounts", component: Page });
  const router = createRouter({
    routeTree: root.addChildren([page]),
    history: createMemoryHistory({ initialEntries: ["/accounts?on=2026-09-09"] }),
    parseSearch,
    stringifySearch,
  });
  render(<RouterProvider router={router} />);
  return router;
}

const url = () => screen.getByTestId("url").textContent ?? "";

describe("a same-page refinement keeps the page where it is", () => {
  let scrollTo: ReturnType<typeof rstest.spyOn>;
  beforeEach(() => {
    scrollTo = rstest.spyOn(window, "scrollTo").mockImplementation(moveWindow as never);
  });
  afterEach(() => {
    rstest.useRealTimers();
    scrollTo.mockRestore();
  });

  it("types a filter, and the URL follows 300ms later without a jump to the top", async () => {
    mount();
    await screen.findByRole("textbox", { name: "Filter" });
    scrollY = READING_AT;
    rstest.useFakeTimers();
    fireEvent.change(screen.getByRole("textbox", { name: "Filter" }), {
      target: { value: "NVDA" },
    });
    rstest.advanceTimersByTime(299);
    expect(url()).toMatch(/^- /);
    rstest.advanceTimersByTime(1);
    rstest.useRealTimers();
    await waitFor(() => expect(url()).toMatch(/^NVDA /));
    await settled();
    expect(keptPlace()).toBe(true);
  });

  it("switches the positions lens in place", async () => {
    mount();
    await screen.findByRole("button", { name: "Map" });
    scrollY = READING_AT;
    fireEvent.click(screen.getByRole("button", { name: "Map" }));
    await waitFor(() => expect(url()).toContain(" map "));
    await settled();
    expect(keptPlace()).toBe(true);
  });

  it("changes the calendar range — lens and step — in place", async () => {
    mount();
    await screen.findByRole("button", { name: "month" });
    scrollY = READING_AT;
    fireEvent.click(screen.getByRole("button", { name: "month" }));
    await waitFor(() => expect(url()).toContain(" month 2026-09-09"));
    fireEvent.click(screen.getByRole("button", { name: "next" }));
    await waitFor(() => expect(url()).toContain(" month 2026-10-01"));
    await settled();
    expect(keptPlace()).toBe(true);
  });

  it("still opens a section switch at its top — the spy sees the router's reset", async () => {
    mount();
    await screen.findByRole("button", { name: "Events" });
    scrollY = READING_AT;
    fireEvent.click(screen.getByRole("button", { name: "Events" }));
    await waitFor(() => expect(url()).toMatch(/ events$/));
    await waitFor(() => expect(scrollY).toBe(0));
  });
});
