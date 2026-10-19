import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { Route as Accounts } from "../../src/routes/accounts";
import { Route as OldActivity } from "../../src/routes/u.$id.activity";

/**
 * Profile → Activity became the Ledger (#5281): the tab is one account's orders, and Activity is
 * the league's feed. Every old address still lands on the Ledger — a saved any-account link, a
 * Thesis marker, a bot's pass — with its narrowing, its open order and its `#act-<orderId>` row.
 */
describe("the Ledger's old addresses", () => {
  function mount(path: string) {
    const root = createRootRoute({ component: () => <Outlet /> });
    const old = OldActivity.update({
      id: "/u/$id/activity",
      path: "/u/$id/activity",
      getParentRoute: () => root,
    } as never);
    const ledger = createRoute({
      getParentRoute: () => root,
      path: "/u/$id/ledger",
      component: () => <p>the ledger</p>,
    });
    const router = createRouter({
      routeTree: root.addChildren([old, ledger]),
      history: createMemoryHistory({ initialEntries: [path] }),
    });
    render(<RouterProvider router={router} />);
    return router;
  }

  it("sends /u/<id>/activity to /u/<id>/ledger, keeping the filter, the open order and the row", async () => {
    const router = mount("/u/sauron/activity?symbol=AMD&order=ord-3#act-ord-3");
    await screen.findByText("the ledger");
    expect(router.state.location.pathname).toBe("/u/sauron/ledger");
    expect(router.state.location.search).toEqual({ symbol: "AMD", order: "ord-3" });
    expect(router.state.location.hash).toBe("act-ord-3");
  });

  it("reads Profile's ?section=activity as the Ledger", () => {
    const validateSearch = Accounts.options.validateSearch as (search: Record<string, unknown>) => {
      section?: string;
      symbol?: string;
    };
    expect(validateSearch({ section: "activity" }).section).toBe("ledger");
    expect(validateSearch({ section: "activity", symbol: "NVDA" })).toMatchObject({
      section: "ledger",
      symbol: "NVDA",
    });
  });
});
