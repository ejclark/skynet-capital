import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DeskPulse } from "../../src/live/pulse";
import { Route as LayoutRoute } from "../../src/routes/u.$id";
import { Route as ActivityRoute } from "../../src/routes/u.$id.activity";
import { Route as PulseRoute } from "../../src/routes/u.$id.pulse";

/**
 * The any-account page keeps its head while a section reads (#4951). The head and its section
 * switch belong to the `/u/:id` layout route; a section's pending read waits under them, so the
 * tabs never vanish and come back. Real layout and section routes on a memory-history router; the
 * reads are mocked, and the pulse read is held open until the spec lets it go.
 */

let releasePulse: (pulse: DeskPulse) => void = () => undefined;

rstest.mock("../../src/live/desk", () => ({
  fetchDesk: (id: string) =>
    Promise.resolve({
      generatedAt: "10:00",
      desk: { id, name: "Sauron", kind: "bot", positions: [] },
    }),
  fetchDeskActivity: () => Promise.resolve({ available: true, activity: [] }),
}));
rstest.mock("../../src/live/pulse", () => ({
  fetchDeskPulse: () =>
    new Promise<DeskPulse>((resolve) => {
      releasePulse = resolve;
    }),
}));
rstest.mock("../../src/live/settings", () => ({
  fetchSettings: () => Promise.resolve({ accounts: [] }),
  ownsAccount: () => false,
}));
// The head's bot line reads the heartbeat; it has its own spec.
rstest.mock("../../src/shell/heartbeat", () => ({ PlaybooksHeadLine: () => null }));

const PULSE: DeskPulse = { curve: null, weeks: [], tiles: [], race: null, streaks: [] };

function mount(path: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const layout = LayoutRoute.update({
    id: "/u/$id",
    path: "/u/$id",
    getParentRoute: () => rootRoute,
  } as never);
  const child = (route: typeof ActivityRoute | typeof PulseRoute, path: string) =>
    route.update({ id: path, path, getParentRoute: () => layout } as never);
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layout.addChildren([child(ActivityRoute, "/activity"), child(PulseRoute, "/pulse")]),
    ]),
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

const sections = () => screen.getByRole("navigation", { name: "Sections" });

describe("the account head while a section reads", () => {
  it("draws the head and the section switch over a section whose read is still pending", async () => {
    mount("/u/sauron/pulse");
    expect(await screen.findByText("Taking the pulse…")).toBeVisible();
    expect(screen.getByRole("heading", { level: 1, name: "Sauron" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Pulse" })).toHaveAttribute("aria-current", "page");
  });

  it("keeps the very same head in place when a tap moves to a section that has to read", async () => {
    mount("/u/sauron/activity");
    expect(await screen.findByText("No recorded orders in the ledger's window.")).toBeVisible();
    const head = sections();

    await userEvent.click(screen.getByRole("link", { name: "Pulse" }));
    expect(await screen.findByText("Taking the pulse…")).toBeVisible();
    // The same node, not a fresh one: the head was never torn down while the pulse read.
    expect(sections()).toBe(head);

    releasePulse(PULSE);
    expect(await screen.findByText("Equity curve")).toBeVisible();
    expect(sections()).toBe(head);
  });
});
