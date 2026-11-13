import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { EXPANDED_KEY, meetMoneypenny, timing, useMoneypenny } from "../../src/live/moneypenny";
import { MoneypennyDock } from "../../src/shell/moneypenny-dock";
import { flush, json, mount, onboarding } from "./moneypenny-dock-harness";

/**
 * THE DOCK'S CONVERSATION PANE (Eric, 2026-11-13: "Consolidate the chat and history windows. The
 * ability to expand/collapse window size is enough"). The conversation is always in the dock:
 * compact by default, expanded on the member's ask and remembered for this browser; Escape and a
 * link of hers drop it back to compact; navigation keeps the member's size. There is no separate
 * "latest line" repeating the start of her answer.
 */

const pane = () => screen.getByRole("region", { name: "Conversation with Moneypenny" });
const sizeToggle = () => screen.getByRole("button", { name: /^(Expand|Collapse)/ });

describe("MoneypennyDock — the conversation pane", () => {
  let realFetch: typeof globalThis.fetch;
  beforeEach(() => {
    realFetch = globalThis.fetch;
    timing.typingMs = 0;
    timing.opsMs = 0;
    localStorage.clear();
    useMoneypenny.getState().reset();
    useMoneypenny.setState({ expanded: false, focusSeq: 0 });
    globalThis.fetch = ((url: string) =>
      Promise.resolve(
        url === "/api/onboarding"
          ? json({ ...onboarding(true), viewerId: "member-1" })
          : new Response("{}", { status: 404 }),
      )) as typeof globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("shows the conversation compact by default, with the box and no separate latest line", async () => {
    act(() =>
      useMoneypenny.setState({ messages: [{ role: "mp", text: "Moneypenny · hi there." }] }),
    );
    mount();
    await flush();
    expect(pane()).toHaveAttribute("data-size", "compact");
    expect(within(pane()).getByText(/hi there\./)).toBeInTheDocument();
    expect(screen.getAllByText(/hi there\./)).toHaveLength(1);
    expect(sizeToggle()).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByLabelText("Message Moneypenny")).toBeInTheDocument();
  });

  it("expands and collapses from its toggle, and remembers the size for this browser", async () => {
    mount();
    await flush();
    fireEvent.click(sizeToggle());
    expect(pane()).toHaveAttribute("data-size", "expanded");
    expect(sizeToggle()).toHaveAttribute("aria-expanded", "true");
    expect(localStorage.getItem(EXPANDED_KEY)).toBe("1");
    expect(screen.getByRole("button", { name: "New conversation" })).toBeInTheDocument();
    fireEvent.click(sizeToggle());
    expect(pane()).toHaveAttribute("data-size", "compact");
    expect(localStorage.getItem(EXPANDED_KEY)).toBe("0");
  });

  it("drops to compact on Escape inside the box", () => {
    mount();
    act(() => useMoneypenny.setState({ expanded: true }));
    fireEvent.keyDown(screen.getByLabelText("Message Moneypenny"), { key: "Escape" });
    expect(pane()).toHaveAttribute("data-size", "compact");
  });

  it("keeps its size across a router navigation, a `?w=` change included", async () => {
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
      routeTree: root.addChildren([page("/", "home"), page("/trade", "the ticket")]),
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );
    await screen.findByText("home");
    act(() => useMoneypenny.setState({ expanded: true }));
    expect(pane()).toHaveAttribute("data-size", "expanded");
    await act(() => router.navigate({ to: "/trade" }));
    expect(await screen.findByText("the ticket")).toBeInTheDocument();
    expect(pane()).toHaveAttribute("data-size", "expanded");
    await act(() => router.navigate({ to: "/trade", search: { w: "2" } as never }));
    expect(pane()).toHaveAttribute("data-size", "expanded");
  });

  it("an ask from outside shows her typing and then her answer in the pane, at its size", async () => {
    mount();
    await flush();
    act(() => {
      useMoneypenny.getState().ask("what's moving today?");
    });
    expect(within(pane()).getByText(/typing ···/)).toBeInTheDocument();
    await flush();
    await flush();
    expect(useMoneypenny.getState().expanded).toBe(false);
    expect(within(pane()).queryByText(/typing ···/)).not.toBeInTheDocument();
    expect(useMoneypenny.getState().messages.some((m) => m.role === "user")).toBe(true);
  });

  it("meetMoneypenny plays her intro in the pane and focuses the box", async () => {
    mount();
    await flush();
    const box = screen.getByLabelText("Message Moneypenny");
    expect(box).not.toHaveFocus();
    await act(() => meetMoneypenny());
    await flush();
    expect(box).toHaveFocus();
    expect(
      await screen.findByText(/^Moneypenny · hi, I'm Moneypenny/, { selector: ".mp-list *" }),
    ).toBeInTheDocument();
  });
});
