import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";

/**
 * A `/trade` page around one element, for specs whose subject renders router links — the ticket's
 * receipt links to the Orders pane and the Sell ticket (`order-receipt.tsx`). The route keeps
 * every search param it is handed, so a spec can read where a link points from its `href`.
 * Returns the router, so a spec can also follow a click.
 */
export function renderOnTrade(element: ReactElement, client = new QueryClient()) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const trade = createRoute({
    getParentRoute: () => rootRoute,
    path: "/trade",
    validateSearch: (search: Record<string, unknown>) => search,
    component: () => element,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([trade]),
    history: createMemoryHistory({ initialEntries: ["/trade"] }),
  });
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}
