import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  retainSearchParams,
} from "@tanstack/react-router";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import {
  horizonSearch,
  liftHorizonTokens,
  parseOn,
  parseSpan,
  useHorizonRange,
} from "../../src/live/horizon-params";
import { marketToday, rangeFor } from "../../src/live/horizon-range";
import { parseSearch, stringifySearch } from "../../src/live/search-params";

/**
 * The range as root URL state (#3807 slice 2·1): `?on=&span=` validated on the root, read by
 * `useHorizonRange()` on any route, retained across navigation — the same wiring `__root.tsx`
 * uses, mounted through a real memory-history router so the writes are the real ones.
 */

describe("the root params", () => {
  it("reads a real calendar day and nothing else", () => {
    expect(parseOn("2026-09-09")).toBe("2026-09-09");
    expect(parseOn("2026-02-30")).toBeUndefined();
    expect(parseOn("tomorrow")).toBeUndefined();
    expect(parseOn(20260909)).toBeUndefined();
  });

  it("reads the five lenses and drops a span it does not know", () => {
    for (const span of ["day", "week", "month", "quarter", "all"]) {
      expect(parseSpan(span)).toBe(span);
    }
    expect(parseSpan("decade")).toBeUndefined();
    expect(parseSpan(7)).toBeUndefined();
  });

  it("validates as a pair, dropping the malformed half rather than stranding the route", () => {
    expect(horizonSearch({ on: "2026-09-09", span: "month" })).toEqual({
      on: "2026-09-09",
      span: "month",
    });
    expect(horizonSearch({ on: "2026-13-40", span: "decade", q: "x" })).toEqual({});
  });
});

describe("liftHorizonTokens — one model, two carriers", () => {
  it("lifts both tokens out of the text and keeps the rest for ?q=", () => {
    expect(liftHorizonTokens("NVDA lens:month on:2026-09-07")).toEqual({
      on: "2026-09-07",
      lens: "month",
      rest: "NVDA",
    });
  });

  it("reports lens:week as a token — it can put an explicit month back to the default", () => {
    expect(liftHorizonTokens("lens:week NVDA")).toEqual({ lens: "week", rest: "NVDA" });
  });

  it("leaves a query with no tokens alone", () => {
    expect(liftHorizonTokens("NVDA sym:AVGO")).toEqual({ rest: "NVDA sym:AVGO" });
    expect(liftHorizonTokens("")).toEqual({ rest: "" });
  });
});

function Probe({ fogged = false }: { readonly fogged?: boolean }): ReactElement {
  const h = useHorizonRange({ fogged });
  return (
    <div>
      <output data-testid="state">
        {[h.anchor, h.lens, h.pinned ? "pinned" : "free", h.range.start, h.range.end].join(" ")}
      </output>
      <button type="button" onClick={() => h.setLens("month")}>
        month
      </button>
      <button type="button" onClick={() => h.setLens("week")}>
        week
      </button>
      <button type="button" onClick={() => h.setOn("2026-09-09")}>
        pin
      </button>
      <button type="button" onClick={() => h.setOn(undefined)}>
        unpin
      </button>
      <button type="button" onClick={() => h.step(1)}>
        next
      </button>
    </div>
  );
}

/** The app's own root wiring (`__root.tsx`) around two routes — one with its own search param. */
function mount(initial: string, fogged = false) {
  const root = createRootRoute({
    validateSearch: horizonSearch,
    search: { middlewares: [retainSearchParams(["on", "span"])] },
    component: () => <Outlet />,
  });
  const a = createRoute({
    getParentRoute: () => root,
    path: "/a",
    component: () => <Probe fogged={fogged} />,
  });
  const b = createRoute({
    getParentRoute: () => root,
    path: "/b",
    validateSearch: (s: Record<string, unknown>) => ({
      ...(typeof s.q === "string" ? { q: s.q } : {}),
    }),
    component: () => <Probe />,
  });
  const router = createRouter({
    routeTree: root.addChildren([a, b]),
    history: createMemoryHistory({ initialEntries: [initial] }),
    parseSearch,
    stringifySearch,
  });
  render(<RouterProvider router={router} />);
  return router;
}

const state = () => screen.getByTestId("state").textContent ?? "";
const search = (router: ReturnType<typeof mount>) =>
  router.state.location.search as Record<string, unknown>;

describe("useHorizonRange", () => {
  it("defaults to today on the week lens, pinned to nothing, writing no param", async () => {
    const router = mount("/a");
    const today = marketToday();
    const week = rangeFor(today, "week");
    await waitFor(() => expect(state()).toBe(`${today} week free ${week.start} ${week.end}`));
    expect(search(router)).toEqual({});
  });

  it("reads a pinned day and a span from the URL", async () => {
    mount("/a?on=2026-09-09&span=month");
    await waitFor(() => expect(state()).toBe("2026-09-09 month pinned 2026-09-01 2026-09-30"));
  });

  it("drops a malformed pair back to the defaults rather than stranding the route", async () => {
    mount("/a?on=2026-13-40&span=decade");
    await waitFor(() => expect(state()).toContain(`${marketToday()} week free`));
  });

  it("writes the lens as ?span=, and the default lens as no param at all", async () => {
    const router = mount("/a");
    await screen.findByRole("button", { name: "month" });
    fireEvent.click(screen.getByRole("button", { name: "month" }));
    await waitFor(() => expect(search(router)).toEqual({ span: "month" }));
    fireEvent.click(screen.getByRole("button", { name: "week" }));
    await waitFor(() => expect(search(router)).toEqual({}));
    expect(state()).toContain(" week free ");
  });

  it("pins a day, steps by the lens, and clears the pin", async () => {
    const router = mount("/a");
    await screen.findByRole("button", { name: "pin" });
    fireEvent.click(screen.getByRole("button", { name: "pin" }));
    await waitFor(() => expect(search(router)).toEqual({ on: "2026-09-09" }));
    expect(state()).toBe("2026-09-09 week pinned 2026-09-07 2026-09-13");
    fireEvent.click(screen.getByRole("button", { name: "next" }));
    await waitFor(() => expect(search(router)).toEqual({ on: "2026-09-16" }));
    fireEvent.click(screen.getByRole("button", { name: "unpin" }));
    await waitFor(() => expect(search(router)).toEqual({}));
    expect(state()).toContain(`${marketToday()} week free`);
  });

  it("retains the range across routes, beside the next route's own params", async () => {
    const router = mount("/a?on=2026-09-09&span=month");
    await screen.findByRole("button", { name: "month" });
    await act(async () => {
      // `main.tsx` registers the app's router type globally, so this test router's own routes
      // are typed against the app's — the navigation is cast, the runtime is the real one.
      await router.navigate({ to: "/b", search: { q: "nvda" } } as never);
    });
    await waitFor(() =>
      expect(search(router)).toEqual({ q: "nvda", on: "2026-09-09", span: "month" }),
    );
    expect(state()).toBe("2026-09-09 month pinned 2026-09-01 2026-09-30");
  });

  it("reads the week for a fogged member who asks for the day lens", async () => {
    mount("/a?on=2026-09-09&span=day", true);
    await waitFor(() => expect(state()).toBe("2026-09-09 week pinned 2026-09-07 2026-09-13"));
  });
});
