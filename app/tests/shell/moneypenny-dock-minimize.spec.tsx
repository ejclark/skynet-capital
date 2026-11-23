import { act, fireEvent, screen, within } from "@testing-library/react";
import {
  EXPANDED_KEY,
  MINIMIZED_KEY,
  meetMoneypenny,
  timing,
  useMoneypenny,
} from "../../src/live/moneypenny";
import { SWIPE_PX, swipeStep } from "../../src/shell/moneypenny-dock";
import { flush, json, mount, onboarding } from "./moneypenny-dock-harness";

/**
 * MINIMIZE THE DOCK (#7933, Eric: "On mobile, the chat window occupies ~50% of the viewport and
 * blocks view of the page content… there's no way to dismiss or minimize it without leaving the
 * page"). Done when: on a phone the chat folds away to show at least 80% of the page and opens again
 * without leaving it. Minimized keeps only the pane's header and the box; Hide or a swipe down the
 * header folds it, Show or a swipe up opens it, and the member's own send brings it back so her
 * answer lands where they can read it.
 */

const pane = () => screen.getByRole("region", { name: "Conversation with Moneypenny" });
const head = () => {
  const h = pane().querySelector("header");
  if (!h) throw new Error("no pane header");
  return h;
};
const swipe = (dy: number) => {
  fireEvent.pointerDown(head(), { clientY: 400 });
  fireEvent.pointerUp(head(), { clientY: 400 + dy });
};

describe("MoneypennyDock — minimized to its header (#7933)", () => {
  let realFetch: typeof globalThis.fetch;
  beforeEach(() => {
    realFetch = globalThis.fetch;
    timing.typingMs = 0;
    timing.opsMs = 0;
    localStorage.clear();
    useMoneypenny.getState().reset();
    useMoneypenny.setState({
      expanded: false,
      minimized: false,
      focusSeq: 0,
      flow: "idle",
      messages: [{ role: "mp", text: "Moneypenny · hi there." }],
    });
    globalThis.fetch = ((url: string) =>
      Promise.resolve(
        url === "/api/onboarding"
          ? json({ ...onboarding(true), viewerId: "member-1" })
          : new Response("{}", { status: 404 }),
      )) as typeof globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
    useMoneypenny.setState({ minimized: false, expanded: false });
  });

  it("Hide folds the pane to its header and keeps the box; Show opens it again", async () => {
    const { container } = mount();
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Hide" }));
    expect(pane()).toHaveAttribute("data-size", "minimized");
    expect(container.querySelector(".mp-list")).toHaveAttribute("hidden");
    expect(container.querySelector(".mp-moves")).toBeNull();
    expect(screen.getByLabelText("Message Moneypenny")).toBeInTheDocument();
    expect(within(pane()).getByText(/Moneypenny · 1 turns/)).toBeInTheDocument();
    expect(localStorage.getItem(MINIMIZED_KEY)).toBe("1");

    fireEvent.click(screen.getByRole("button", { name: "Show" }));
    expect(pane()).toHaveAttribute("data-size", "compact");
    expect(container.querySelector(".mp-list")).not.toHaveAttribute("hidden");
    expect(localStorage.getItem(MINIMIZED_KEY)).toBe("0");
  });

  it("a swipe down the header folds one size at a time, and a swipe up opens one", async () => {
    mount();
    await flush();
    act(() => useMoneypenny.setState({ expanded: true }));
    swipe(SWIPE_PX + 10);
    expect(pane()).toHaveAttribute("data-size", "compact");
    swipe(SWIPE_PX + 10);
    expect(pane()).toHaveAttribute("data-size", "minimized");
    swipe(-(SWIPE_PX + 10));
    expect(pane()).toHaveAttribute("data-size", "compact");
    swipe(-(SWIPE_PX + 10));
    expect(pane()).toHaveAttribute("data-size", "expanded");
    expect(localStorage.getItem(EXPANDED_KEY)).toBe("1");
  });

  it("a tap on the header is not a swipe", async () => {
    mount();
    await flush();
    swipe(4);
    expect(pane()).toHaveAttribute("data-size", "compact");
    expect(swipeStep(SWIPE_PX - 1)).toBeUndefined();
    expect(swipeStep(-(SWIPE_PX - 1))).toBeUndefined();
  });

  it("the member's own ask shows the pane again, so her answer lands in view", async () => {
    mount();
    await flush();
    act(() => useMoneypenny.getState().minimize());
    expect(pane()).toHaveAttribute("data-size", "minimized");
    act(() => {
      useMoneypenny.getState().ask("what's moving today?");
    });
    expect(pane()).toHaveAttribute("data-size", "compact");
    expect(within(pane()).getByText(/typing ···/)).toBeInTheDocument();
    await flush();
  });

  it("Talk to Moneypenny shows the pane again", async () => {
    mount();
    await flush();
    act(() => useMoneypenny.getState().minimize());
    act(() => {
      void meetMoneypenny();
    });
    await flush();
    expect(pane()).toHaveAttribute("data-size", "compact");
  });

  it("her own unprompted line leaves a minimized pane folded: hiding her is the member's call", async () => {
    mount();
    await flush();
    act(() => useMoneypenny.getState().minimize());
    act(() =>
      useMoneypenny.setState((s) => ({
        messages: [...s.messages, { role: "mp", text: "Moneypenny · the open is in ten." }],
      })),
    );
    expect(pane()).toHaveAttribute("data-size", "minimized");
  });

  it("Expand from compact clears minimized, so the two are never both on", () => {
    act(() => useMoneypenny.getState().minimize());
    act(() => useMoneypenny.getState().toggleExpanded());
    expect(useMoneypenny.getState()).toMatchObject({ expanded: true, minimized: false });
    expect(localStorage.getItem(MINIMIZED_KEY)).toBe("0");
  });
});
