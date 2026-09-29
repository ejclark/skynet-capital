import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { Route } from "../../src/routes/settings";
import { usePrefs } from "../../src/shell/prefs";

/**
 * Settings' account section speaks in places that exist. `/claim` is a bare redirect to this section
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
let owner = false;
rstest.mock("../../src/live/admin", () => ({
  fetchGuestList: () => Promise.resolve({ owner }),
  fetchClaims: () =>
    Promise.resolve(
      owner
        ? {
            owner: true,
            accounts: [{ id: "bot-orphan", displayName: "Orphan", kind: "bot", linked: false }],
          }
        : { owner: false },
    ),
}));
rstest.mock("../../src/live/controls", () => ({
  fetchControls: () =>
    Promise.resolve(
      owner
        ? {
            owner: true,
            fleet: {
              allSuspended: false,
              bots: [{ id: "sauron", displayName: "Sauron", suspended: false }],
              companionModel: "claude-sonnet-5",
              companionModels: ["claude-sonnet-5"],
            },
          }
        : { owner: false },
    ),
  postControlAction: () => Promise.reject(new Error("not used in this spec")),
}));

const realFetch = globalThis.fetch;
beforeEach(() => {
  owner = false;
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

describe("Settings → Account for a fund owner who holds no account (#3816 slice 7)", () => {
  it("still shows Mission Control and the unclaimed accounts beside the no-account note", async () => {
    owner = true;
    mountSettings("/settings?section=account");
    expect(await screen.findByText(/doesn't resolve to an account yet/)).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: /Mission Control/ })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: /Unclaimed accounts/ })).toBeInTheDocument();
  });

  it("shows a member with no account neither card", async () => {
    mountSettings("/settings?section=account");
    await screen.findByText(/doesn't resolve to an account yet/);
    expect(screen.queryByRole("heading", { name: /Mission Control/ })).toBeNull();
    expect(screen.queryByRole("heading", { name: /Unclaimed accounts/ })).toBeNull();
  });
});

/**
 * Settings → Preferences → "Tower motion" (#3807 slice 3b-1): the member's own pause for the
 * tower's ambient motion (WCAG 2.2.2). Moving is the default; the reason is visible text; a device
 * that asks for reduced motion reads Still, locked, with its own line.
 */
describe("Settings → Preferences, the tower's motion", () => {
  afterEach(() => {
    act(() => usePrefs.getState().setCrest("live"));
    Reflect.deleteProperty(window, "matchMedia");
  });

  it("offers Moving (pressed by default) and Still, with the reason under it; Still takes at once", async () => {
    mountSettings("/settings?section=preferences");
    const group = await screen.findByRole("group", { name: "Tower motion" });
    const moving = within(group).getByRole("button", { name: /Moving/ });
    const still = within(group).getByRole("button", { name: /Still/ });
    expect(moving.getAttribute("aria-pressed")).toBe("true");
    expect(still.getAttribute("aria-pressed")).toBe("false");
    const reason = screen.getByText(
      "Still shows one frame and moves only when the Eye looks at something you pick.",
    );
    expect(group.getAttribute("aria-describedby")).toBe(reason.id);
    fireEvent.click(still);
    expect(usePrefs.getState().crest).toBe("still");
    expect(still.getAttribute("aria-pressed")).toBe("true");
  });

  it("under the device's reduced motion: reads Still, locked, and says why", async () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }),
    });
    mountSettings("/settings?section=preferences");
    const group = await screen.findByRole("group", { name: "Tower motion" });
    expect(group).toBeDisabled();
    expect(within(group).getByRole("button", { name: /Still/ }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(
      screen.getByText("Your device asks for reduced motion, so the tower stays still."),
    ).toBeInTheDocument();
    expect(usePrefs.getState().crest).toBe("live");
  });
});
