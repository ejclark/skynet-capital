import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useMoneypenny } from "../../src/live/moneypenny";
import { MoneypennyDock } from "../../src/shell/moneypenny-dock";
import { inHistory } from "./moneypenny-dock-harness";

// #5238 — a place she names is a link that takes you there. In the dock (#7487 slice 2) her links
// live in History, and History folds away on the tap at every width so the place shows; the dock
// itself stays under the page.

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
        <MoneypennyDock />
      </>
    ),
  });
  const page = (p: string, text: string) =>
    createRoute({ getParentRoute: () => root, path: p, component: () => <p>{text}</p> });
  const router = createRouter({
    routeTree: root.addChildren([
      page("/", "home"),
      page("/trade", "the ticket"),
      page("/accounts", "the profile"),
    ]),
    basepath: "/app",
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  await screen.findByText(path.startsWith("/app/accounts") ? "the profile" : "home");
  return router;
}

const say = (text: string) =>
  act(() => useMoneypenny.setState({ history: true, messages: [{ role: "mp", text }] }));

describe("MoneypennyDock · places she names", () => {
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
    const link = inHistory().getByRole("link", { name: "open Trade" });
    expect(link).toHaveAttribute("href", "/app/trade");
    expect(link).toHaveClass("mp-place");
    expect(screen.queryByText(/\[open Trade\]/)).not.toBeInTheDocument();
  });

  const historyShown = () => screen.queryByRole("region", { name: "Conversation with Moneypenny" });

  it("at desktop width, takes you there, folds History away and keeps the dock", async () => {
    const router = await mountAt("/app/");
    await say("Moneypenny · [open Trade](/trade) now");
    fireEvent.click(inHistory().getByRole("link", { name: "open Trade" }));
    expect(await screen.findByText("the ticket")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/trade");
    expect(historyShown()).not.toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Moneypenny" })).toBeInTheDocument();
  });

  it("on a phone, the same: History folds away so the place shows, the dock stays", async () => {
    restore = phone();
    await mountAt("/app/");
    await say("Moneypenny · [open Trade](/trade) now");
    fireEvent.click(inHistory().getByRole("link", { name: "open Trade" }));
    expect(await screen.findByText("the ticket")).toBeInTheDocument();
    expect(historyShown()).not.toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Moneypenny" })).toBeInTheDocument();
  });

  // #7167: a row she points at on the page already open. The router's pushState fires no
  // `hashchange`, and the page's landing listens for exactly that, so the link announces it.
  it("re-lands a row on the page already open by announcing the hash change", async () => {
    const router = await mountAt("/app/accounts");
    const heard = rstest.fn();
    window.addEventListener("hashchange", heard);
    try {
      await say("Moneypenny · look at [your NVDA shares](/accounts#pos-NVDA)");
      const link = inHistory().getByRole("link", { name: "your NVDA shares" });
      expect(link).toHaveAttribute("href", "/app/accounts#pos-NVDA");
      fireEvent.click(link);
      await waitFor(() => expect(heard).toHaveBeenCalledTimes(1));
      expect(router.state.location.hash).toBe("pos-NVDA");
      expect(screen.getByText("the profile")).toBeInTheDocument();
    } finally {
      window.removeEventListener("hashchange", heard);
    }
  });

  it("leaves a place off the allow-list as plain words", async () => {
    await mountAt("/app/");
    await say("Moneypenny · try [the vault](/vault)");
    expect(inHistory().queryByRole("link")).not.toBeInTheDocument();
    expect(inHistory().getByText("Moneypenny · try the vault")).toBeInTheDocument();
  });
});
