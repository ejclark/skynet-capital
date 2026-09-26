import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { Route } from "../../src/routes/settings";

/**
 * Settings' account section speaks in places that exist. `/claim` is a bare redirect to Settings
 * now, so a signed-in member with no linked account is told who can link one — never sent to a
 * page that only bounces back here.
 */

rstest.mock("../../src/live/settings", () => ({
  fetchSettings: () =>
    Promise.resolve({
      authConfigured: true,
      adminWired: true,
      accounts: [],
      fleetSuspended: false,
      timezones: [],
    }),
}));
rstest.mock("../../src/live/admin", () => ({
  fetchGuestList: () => Promise.resolve({ owner: false }),
}));

const realFetch = globalThis.fetch;
beforeEach(() => {
  globalThis.fetch = (() =>
    Promise.resolve(new Response(JSON.stringify({}), { status: 200 }))) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

function mountSettings(initialPath: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const settingsRoute = Route.update({
    id: "/settings",
    path: "/settings",
    getParentRoute: () => rootRoute,
  } as never);
  const router = createRouter({
    routeTree: rootRoute.addChildren([settingsRoute]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("Settings → Account with no linked account", () => {
  it("says a league owner links one, never pointing at the /claim redirect", async () => {
    mountSettings("/settings?section=account");
    const line = await screen.findByText(/doesn't resolve to an account yet/);
    expect(line.textContent).toContain("ask a league owner to link one to your sign-in");
    expect(line.textContent).not.toContain("/claim");
  });
});
