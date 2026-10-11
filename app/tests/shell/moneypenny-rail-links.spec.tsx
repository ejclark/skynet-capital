import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useMoneypenny } from "../../src/live/moneypenny";
import { MoneypennyRail } from "../../src/shell/moneypenny-rail";

// #5238 — a place she names is a link that takes you there: on a phone the rail closes so the
// place shows; wider, the rail stays open beside it.

/** happy-dom has no `matchMedia` — the ≥861 default. A phone installs one that matches. */
function phone(): () => void {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: () => ({
      matches: true,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  });
  return () => Reflect.deleteProperty(window, "matchMedia");
}

async function mountAt(path: string) {
  const root = createRootRoute({
    component: () => (
      <>
        <Outlet />
        <MoneypennyRail />
      </>
    ),
  });
  const page = (p: string, text: string) =>
    createRoute({ getParentRoute: () => root, path: p, component: () => <p>{text}</p> });
  const router = createRouter({
    routeTree: root.addChildren([page("/", "home"), page("/trade", "the ticket")]),
    basepath: "/app",
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  await screen.findByText("home");
  return router;
}

const say = (text: string) =>
  act(() => useMoneypenny.setState({ open: true, messages: [{ role: "mp", text }] }));

describe("MoneypennyRail · places she names", () => {
  let restore: (() => void) | undefined;
  beforeEach(() => {
    localStorage.clear();
    useMoneypenny.getState().reset();
  });
  afterEach(() => {
    restore?.();
    restore = undefined;
  });

  it("renders the place as an underlined link to its real URL", async () => {
    await mountAt("/app/");
    await say("Moneypenny · [open Trade](/trade) and buy a stock (rung 101).");
    const link = screen.getByRole("link", { name: "open Trade" });
    expect(link).toHaveAttribute("href", "/app/trade");
    expect(link).toHaveClass("mp-place");
    expect(screen.queryByText(/\[open Trade\]/)).not.toBeInTheDocument();
  });

  it("at desktop width, takes you there and keeps the rail open beside it", async () => {
    const router = await mountAt("/app/");
    await say("Moneypenny · [open Trade](/trade) now");
    fireEvent.click(screen.getByRole("link", { name: "open Trade" }));
    expect(await screen.findByText("the ticket")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/trade");
    expect(screen.getByRole("complementary", { name: "Moneypenny" })).toBeInTheDocument();
  });

  it("on a phone, closes the rail so the place shows", async () => {
    restore = phone();
    await mountAt("/app/");
    await say("Moneypenny · [open Trade](/trade) now");
    fireEvent.click(screen.getByRole("link", { name: "open Trade" }));
    expect(await screen.findByText("the ticket")).toBeInTheDocument();
    expect(screen.queryByRole("complementary", { name: "Moneypenny" })).not.toBeInTheDocument();
  });

  it("leaves a place off the allow-list as plain words", async () => {
    await mountAt("/app/");
    await say("Moneypenny · try [the vault](/vault)");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Moneypenny · try the vault")).toBeInTheDocument();
  });
});
