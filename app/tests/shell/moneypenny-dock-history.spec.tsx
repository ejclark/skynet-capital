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
import { meetMoneypenny, timing, useMoneypenny } from "../../src/live/moneypenny";
import { MoneypennyDock } from "../../src/shell/moneypenny-dock";
import { flush, json, mount, onboarding } from "./moneypenny-dock-harness";

/**
 * THE DOCK'S HISTORY SHEET (#7487 slice 2, D2): closed by default; her latest line (or "History N")
 * opens it; Escape inside the dock and every navigation close it; asking her from outside opens
 * nothing, since her answer arrives in the dock's latest line; "Talk to Moneypenny" from a page
 * (`meetMoneypenny`) opens it and puts the member in the box.
 */

const historyShown = () => screen.queryByRole("region", { name: "Conversation with Moneypenny" });
const latest = () => screen.getByRole("button", { name: /^Moneypenny: / });

describe("MoneypennyDock — History", () => {
  let realFetch: typeof globalThis.fetch;
  beforeEach(() => {
    realFetch = globalThis.fetch;
    timing.typingMs = 0;
    timing.opsMs = 0;
    localStorage.clear();
    useMoneypenny.getState().reset();
    useMoneypenny.setState({ history: false, focusSeq: 0 });
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

  it("is closed by default, with her latest line and the box on screen", async () => {
    mount();
    await flush();
    expect(historyShown()).not.toBeInTheDocument();
    expect(latest()).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByLabelText("Message Moneypenny")).toBeInTheDocument();
  });

  it("opens when her latest line is tapped, and closes on a second tap", async () => {
    act(() =>
      useMoneypenny.setState({ messages: [{ role: "mp", text: "Moneypenny · hi there." }] }),
    );
    mount();
    await flush();
    expect(latest()).toHaveTextContent("hi there.");
    fireEvent.click(latest());
    await flush();
    expect(historyShown()).toBeInTheDocument();
    expect(latest()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /^History \d+/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    fireEvent.click(latest());
    expect(historyShown()).not.toBeInTheDocument();
  });

  it("closes on Escape inside the box", () => {
    mount();
    act(() => useMoneypenny.setState({ history: true }));
    expect(historyShown()).toBeInTheDocument();
    fireEvent.keyDown(screen.getByLabelText("Message Moneypenny"), { key: "Escape" });
    expect(historyShown()).not.toBeInTheDocument();
  });

  it("closes from its own Close button", () => {
    mount();
    act(() => useMoneypenny.setState({ history: true }));
    fireEvent.click(screen.getByRole("button", { name: /^Close/ }));
    expect(historyShown()).not.toBeInTheDocument();
  });

  it("closes on a router navigation", async () => {
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
    act(() => useMoneypenny.setState({ history: true }));
    expect(historyShown()).toBeInTheDocument();
    await act(() => router.navigate({ to: "/trade" }));
    expect(await screen.findByText("the ticket")).toBeInTheDocument();
    await waitFor(() => expect(historyShown()).not.toBeInTheDocument());
    // a search-only change (a `?w=` window) counts as a navigation too
    act(() => useMoneypenny.setState({ history: true }));
    await act(() => router.navigate({ to: "/trade", search: { w: "2" } as never }));
    await waitFor(() => expect(historyShown()).not.toBeInTheDocument());
  });

  it("an ask from outside opens nothing; the dock's latest line carries it", async () => {
    mount();
    await flush();
    act(() => {
      useMoneypenny.getState().ask("what's moving today?");
    });
    expect(historyShown()).not.toBeInTheDocument();
    expect(latest()).toHaveTextContent("typing ···");
    await flush();
    await flush();
    expect(useMoneypenny.getState().history).toBe(false);
    expect(historyShown()).not.toBeInTheDocument();
    expect(latest()).not.toHaveTextContent("typing ···");
    expect(useMoneypenny.getState().messages.some((m) => m.role === "user")).toBe(true);
  });

  it("meetMoneypenny opens History, plays her intro and focuses the box", async () => {
    mount();
    await flush();
    const box = screen.getByLabelText("Message Moneypenny");
    expect(box).not.toHaveFocus();
    await act(() => meetMoneypenny());
    await flush();
    expect(historyShown()).toBeInTheDocument();
    expect(box).toHaveFocus();
    expect(
      await screen.findByText(/^Moneypenny · hi, I'm Moneypenny/, { selector: ".mp-list *" }),
    ).toBeInTheDocument();
  });
});
