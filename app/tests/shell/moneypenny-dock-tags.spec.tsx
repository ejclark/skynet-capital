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
import type { ReactElement } from "react";
import { timing, useMoneypenny } from "../../src/live/moneypenny";
import { type PageKeys, pageKeys, usePublishPageKeys } from "../../src/live/page-keys";
import { type PromptTag, usePromptTags } from "../../src/live/prompt-tags";
import { MissionRow } from "../../src/shell/mission-window";
import { MoneypennyDock } from "../../src/shell/moneypenny-dock";
import { TagMark } from "../../src/shell/tag-mark";
import { flush, mount, onboarding, stubFetch } from "./moneypenny-dock-harness";

/**
 * ✎ TAGS IN THE DOCK (#7487 slice 3): a ✎ tap puts the subject above the box as a chip and moves
 * focus to the box; each chip has its own ×; Escape folds History first, then drops every tag; the
 * tags survive navigation; a send leads the member's line with the subjects and clears them, and a
 * refused send keeps them.
 */

const ENERGY: PromptTag = { label: "Market · Energy (XLE)" };
const CPI: PromptTag = { label: "Calendar · CPI", key: "event-cpi" };
const STORY: PromptTag = { label: "Story · Fed holds", key: "story-fed" };
const PAGE: PageKeys = { edition: "2026-11-11", stories: ["fed"], events: ["cpi"] };

const markFor = (t: PromptTag) =>
  screen.getByRole("button", {
    name: new RegExp(
      `^Ask or say something about (this: )?${t.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
    ),
  });
const box = () => screen.getByLabelText("Message Moneypenny");
const chips = () => Array.from(document.querySelectorAll("li.mp-tag")).map((li) => li.textContent);
const historyShown = () => screen.queryByRole("region", { name: "Conversation with Moneypenny" });
const userLines = () =>
  useMoneypenny
    .getState()
    .messages.filter((m) => m.role === "user")
    .map((m) => m.text);

function Publisher(): null {
  usePublishPageKeys(PAGE);
  return null;
}

function Marks({ tags = [ENERGY, CPI, STORY] }: { readonly tags?: readonly PromptTag[] }) {
  return (
    <>
      <Publisher />
      {tags.map((t) => (
        <TagMark key={t.label} tag={t} />
      ))}
    </>
  );
}

describe("MoneypennyDock — ✎ tags", () => {
  let realFetch: typeof globalThis.fetch;
  let realSend: ReturnType<typeof useMoneypenny.getState>["send"];
  const calls: { url: string; body: unknown }[] = [];
  beforeEach(() => {
    realFetch = globalThis.fetch;
    realSend = useMoneypenny.getState().send;
    timing.typingMs = 0;
    timing.opsMs = 0;
    localStorage.clear();
    useMoneypenny.getState().reset();
    useMoneypenny.setState({ member: undefined, history: false });
    usePromptTags.setState({ tags: [], seq: 0 });
    calls.length = 0;
    stubFetch({ "/api/onboarding": () => onboarding(true) }, calls);
  });
  afterEach(() => {
    useMoneypenny.setState({ send: realSend });
    globalThis.fetch = realFetch;
    pageKeys(); // spend any stamp a case left behind
  });

  it("a ✎ tap adds a chip above the box and moves focus to the box", async () => {
    mount(<Marks />);
    await flush();
    expect(chips()).toEqual([]);
    fireEvent.click(markFor(ENERGY));
    expect(chips()).toEqual([`✎ ${ENERGY.label}×`]);
    expect(box()).toHaveFocus();
    // focus moves again on a repeat tap, with no second chip
    act(() => box().blur());
    fireEvent.click(markFor(ENERGY));
    expect(chips()).toHaveLength(1);
    expect(box()).toHaveFocus();
    // the chips lead the moves row
    expect(document.querySelector("ul.mp-moves > li")).toHaveClass("mp-tag");
  });

  it("the box's placeholder says what it is for while tags are on", async () => {
    mount(<Marks />);
    await flush();
    expect(box()).not.toHaveAttribute("placeholder", "Ask about what you tagged");
    fireEvent.click(markFor(CPI));
    expect(box()).toHaveAttribute("placeholder", "Ask about what you tagged");
    fireEvent.click(screen.getByRole("button", { name: `Remove the tag ${CPI.label}` }));
    expect(box()).not.toHaveAttribute("placeholder", "Ask about what you tagged");
  });

  it("× removes only its own tag", async () => {
    mount(<Marks />);
    await flush();
    for (const t of [ENERGY, CPI, STORY]) fireEvent.click(markFor(t));
    expect(chips()).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: `Remove the tag ${CPI.label}` }));
    expect(usePromptTags.getState().tags.map((t) => t.label)).toEqual([ENERGY.label, STORY.label]);
    expect(chips()).toEqual([`✎ ${ENERGY.label}×`, `✎ ${STORY.label}×`]);
  });

  it("Escape in the box drops every tag when History is closed", async () => {
    mount(<Marks />);
    await flush();
    fireEvent.click(markFor(ENERGY));
    fireEvent.click(markFor(CPI));
    fireEvent.keyDown(box(), { key: "Escape" });
    expect(chips()).toEqual([]);
    expect(usePromptTags.getState().tags).toEqual([]);
  });

  it("Escape closes History first, keeping the tags, and drops them on the second press", async () => {
    mount(<Marks />);
    await flush();
    fireEvent.click(markFor(ENERGY));
    act(() => useMoneypenny.setState({ history: true }));
    expect(historyShown()).toBeInTheDocument();
    fireEvent.keyDown(box(), { key: "Escape" });
    expect(historyShown()).not.toBeInTheDocument();
    expect(chips()).toHaveLength(1);
    fireEvent.keyDown(box(), { key: "Escape" });
    expect(chips()).toEqual([]);
  });

  it("the tags stay through a router navigation", async () => {
    const root = createRootRoute({
      component: () => (
        <>
          <Outlet />
          <MoneypennyDock />
        </>
      ),
    });
    const page = (p: string, body: ReactElement) =>
      createRoute({ getParentRoute: () => root, path: p, component: () => body });
    const router = createRouter({
      routeTree: root.addChildren([
        page(
          "/",
          <>
            <p>home</p>
            <TagMark tag={ENERGY} />
          </>,
        ),
        page("/trade", <p>the ticket</p>),
      ]),
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );
    await screen.findByText("home");
    fireEvent.click(markFor(ENERGY));
    expect(chips()).toHaveLength(1);
    await act(() => router.navigate({ to: "/trade" }));
    expect(await screen.findByText("the ticket")).toBeInTheDocument();
    await flush();
    expect(chips()).toEqual([`✎ ${ENERGY.label}×`]);
    await act(() => router.navigate({ to: "/trade", search: { w: "2" } as never }));
    await flush();
    expect(chips()).toEqual([`✎ ${ENERGY.label}×`]);
  });

  it("a send leads the member's line with the subjects, stamps the anchors and clears the tags", async () => {
    // Capture what the send carried and what keys were stamped at that moment.
    let stamped: PageKeys | undefined;
    let sentText: string | undefined;
    useMoneypenny.setState({
      send: (text: string) => {
        sentText = text;
        stamped = pageKeys();
        return realSend(text);
      },
    });
    mount(<Marks />);
    await flush();
    for (const t of [ENERGY, CPI, STORY]) fireEvent.click(markFor(t));
    fireEvent.change(box(), { target: { value: "how do these connect?" } });
    fireEvent.keyDown(box(), { key: "Enter" });
    await flush();
    await flush();
    const line = `✎ ${ENERGY.label} + ${CPI.label} + ${STORY.label}: how do these connect?`;
    expect(sentText).toBe(line);
    expect(userLines()).toEqual([line]);
    expect(stamped?.tagged).toEqual({ stories: ["fed"], events: ["cpi"] });
    expect(usePromptTags.getState().tags).toEqual([]);
    expect(chips()).toEqual([]);
    expect(box()).toHaveValue("");
  });

  it("a send with no tags goes out as typed", async () => {
    let sentText: string | undefined;
    useMoneypenny.setState({
      send: (text: string) => {
        sentText = text;
        return realSend(text);
      },
    });
    mount(<Marks />);
    await flush();
    fireEvent.change(box(), { target: { value: "hello" } });
    fireEvent.keyDown(box(), { key: "Enter" });
    await flush();
    expect(sentText).toBe("hello");
    expect(pageKeys()?.tagged).toBeUndefined();
  });

  it("an answer a parked card waits on goes as typed, and the tags wait for the next message", async () => {
    // A drafted filing waits on the exact word "send"; a ✎ prefix would stop it matching.
    let sentText: string | undefined;
    useMoneypenny.setState({
      send: (text: string) => {
        sentText = text;
        return Promise.resolve(true);
      },
      draft: { title: "t", body: "b" } as never,
      parkedIn: undefined,
    });
    mount(<Marks />);
    await flush();
    fireEvent.click(markFor(ENERGY));
    fireEvent.change(box(), { target: { value: "send" } });
    fireEvent.keyDown(box(), { key: "Enter" });
    await flush();
    expect(sentText).toBe("send");
    expect(chips()).toEqual([`✎ ${ENERGY.label}×`]);
    expect(pageKeys()?.tagged).toBeUndefined();
  });

  it("a refused send keeps the tags, the text, and no stale stamp", async () => {
    let sentText: string | undefined;
    useMoneypenny.setState({
      send: (text: string) => {
        sentText = text;
        return Promise.resolve(false);
      },
    });
    mount(<Marks />);
    await flush();
    fireEvent.click(markFor(CPI));
    fireEvent.change(box(), { target: { value: "when?" } });
    fireEvent.keyDown(box(), { key: "Enter" });
    await flush();
    expect(sentText).toBe(`✎ ${CPI.label}: when?`);
    expect(usePromptTags.getState().tags.map((t) => t.label)).toEqual([CPI.label]);
    expect(chips()).toEqual([`✎ ${CPI.label}×`]);
    expect(box()).toHaveValue("when?");
    expect(pageKeys()?.tagged).toBeUndefined();
  });
});

describe("TagMark inside a clickable row", () => {
  beforeEach(() => usePromptTags.setState({ tags: [], seq: 0 }));

  it("tags the MissionRow without opening it", () => {
    const onOpen = rstest.fn();
    render(
      <ul>
        <MissionRow title="Tony" sub="party" onOpen={onOpen} about={{ label: "Party · Tony" }} />
      </ul>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Ask or say something about Party · Tony" }),
    );
    expect(onOpen).not.toHaveBeenCalled();
    expect(usePromptTags.getState().tags).toEqual([{ label: "Party · Tony" }]);
    // the row itself still opens
    fireEvent.click(screen.getByRole("button", { name: "Tony party" }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("stops the tap at the button when nested in a clickable container", () => {
    const onRow = rstest.fn();
    render(
      // biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: a test container
      <div onClick={onRow}>
        <TagMark tag={ENERGY} size="inline" />
      </div>,
    );
    fireEvent.click(markFor(ENERGY));
    expect(onRow).not.toHaveBeenCalled();
    expect(usePromptTags.getState().tags).toEqual([ENERGY]);
  });
});
