import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import type { HeldBook } from "../../src/live/held-events";
import { horizonSearch } from "../../src/live/horizon-params";
import { HeldEventsLine } from "../../src/shell/held-events-line";

/**
 * The line under the net-worth card (#3807 slice 2·1) on an empty range: it leads with the range,
 * in the same words as the Events section's note (#5045, F-c5ebc986e1 — "Nothing dated on what
 * you hold Oct 5 – Oct 11" buried the range and is not a phrase anyone says). EEM's next event is
 * the jobs report on Fri Oct 2, so the week of Sep 28 carries it market-wide and the week of
 * Oct 5 carries nothing.
 */

rstest.mock("../../src/live/options", () => ({
  fetchPlays: () => Promise.resolve({ linked: true, wheels: false, plays: [] }),
}));

const DESKS: readonly HeldBook[] = [
  {
    desk: {
      id: "human-eric",
      positions: [
        {
          symbol: "EEM",
          nextEvent: {
            label: "Jobs report Oct 2",
            at: "2026-10-02",
            beforeExpiry: false,
            scope: "market",
          },
        },
      ],
    },
  },
];

function mount(initialPath: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet />, validateSearch: horizonSearch });
  const accounts = createRoute({
    getParentRoute: () => rootRoute,
    path: "/accounts",
    component: () => <HeldEventsLine desks={DESKS} />,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([accounts]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

const line = async (): Promise<string> =>
  (await screen.findByText(/on what you hold/)).closest(".held-events")?.textContent ?? "";

describe("HeldEventsLine — an empty range leads with the range (#5045)", () => {
  it("names the week first, then says nothing on what you hold is in it", async () => {
    mount("/accounts?on=2026-10-05");
    expect(await line()).toBe("Oct 5 – Oct 11: nothing on what you hold");
  });

  it("keeps the market-wide print beside it", async () => {
    mount("/accounts?on=2026-09-28");
    expect(await line()).toMatch(/^Sep 28 – Oct 4: nothing on what you hold · ○ market-wide: /);
  });

  it("says any date on the all lens", async () => {
    mount("/accounts?on=2026-10-05&span=all");
    expect(await line()).toMatch(/^Any date: nothing on what you hold/);
  });
});
