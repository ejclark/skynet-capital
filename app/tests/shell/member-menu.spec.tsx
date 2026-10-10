import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemberMenu } from "../../src/shell/member-menu";

/**
 * The top bar's member menu (#5037 round 2, question 9). Eric, 2026-10-10: "there are too many
 * icons available all the time - too many options are presented, competing for attention.
 * Progressive reveal to elevate what's important and move the rest to the side until it's needed."
 * The gear and the sign-out icons fold into one button; both destinations stay one tap behind it.
 */

let onboarding: unknown = {};
const realFetch = globalThis.fetch;
beforeEach(() => {
  onboarding = {};
  globalThis.fetch = ((input: RequestInfo | URL) =>
    Promise.resolve(
      new Response(JSON.stringify(String(input).includes("/api/onboarding") ? onboarding : {}), {
        status: 200,
      }),
    )) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

function Bar(): ReactElement {
  return (
    <div>
      <header className="topbar">
        <MemberMenu />
      </header>
      <Outlet />
    </div>
  );
}

function mount(path = "/leaderboard") {
  const rootRoute = createRootRoute({ component: Bar });
  const page = (p: string, text: string) =>
    createRoute({ getParentRoute: () => rootRoute, path: p, component: () => <p>{text}</p> });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      page("/leaderboard", "The league"),
      page("/settings", "The settings page"),
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

const button = () => screen.getByRole("button", { name: "Account menu" });

describe("the member menu", () => {
  it("is one button; Settings and Sign out wait behind it", async () => {
    mount();
    await screen.findByText("The league");
    expect(button()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: /Settings/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /Sign out/ })).toBeNull();
  });

  it("opens with Settings and Sign out, each one tap from there", async () => {
    mount();
    await screen.findByText("The league");
    fireEvent.click(button());
    expect(button()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /Settings/ })).toHaveAttribute("href", "/settings");
    expect(screen.getByRole("link", { name: /Sign out/ })).toHaveAttribute("href", "/logout");
  });

  it("wears the member's initial when the session names them", async () => {
    onboarding = { viewerName: "eric" };
    mount();
    await waitFor(() => expect(button()).toHaveTextContent("E"));
  });

  it("closes once Settings is picked, and the page is Settings", async () => {
    mount();
    await screen.findByText("The league");
    fireEvent.click(button());
    fireEvent.click(screen.getByRole("link", { name: /Settings/ }));
    expect(await screen.findByText("The settings page")).toBeInTheDocument();
    expect(button()).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on Escape and hands focus back to the button", async () => {
    mount();
    await screen.findByText("The league");
    fireEvent.click(button());
    fireEvent.keyDown(document, { key: "Escape" });
    expect(button()).toHaveAttribute("aria-expanded", "false");
    expect(button()).toHaveFocus();
  });
});
