import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { editionEventKey, eventAnchor } from "../../../src/domain/edition-keys";
import type { BoardRow, BoardSnapshot } from "../../src/live/board";
import { dayLabel } from "../../src/live/book-events";
import type { Edition, EditionDate, EditionView } from "../../src/live/edition";
import { moveFigure, type SectorRow } from "../../src/live/edition-sectors";
import { GOAL_ASK, TOUR_END, VISIT_STOPPED, WELCOME } from "../../src/live/first-visit";
import { timing, useMoneypenny } from "../../src/live/moneypenny";
import { useEyeLight } from "../../src/shell/eye-light";
import { tourFacts } from "../../src/shell/first-visit-run";
import { MissionWindowFrame, openQuietly } from "../../src/shell/mission-window";
import { QuestGoal } from "../../src/shell/quest-goal";
import { flush, json, mount } from "./moneypenny-dock-harness";

/**
 * PLAYING THE FIRST VISIT (#7487 slice 7). The tour reads the page's own answers (the edition, the
 * member's quests, the party's board) for its facts; a tap on a stop opens that window by address,
 * asks the Eye to light the stop's row with its reason, and her line about the window lands in the
 * dock. The goal is collected in the dock's box (its placeholder says so) and pinned as the first
 * row of Quests, where it can be changed or cleared.
 */

afterEach(cleanup);

const sector = (name: string, fund: string, week: number, market?: true): SectorRow => ({
  name,
  fund,
  ...(market ? { market } : {}),
  moves: { day: 0, week, month: 0, ytd: 0 },
  range: { low: 1, mid: 2, high: 3, close: 2 },
  trail: [],
});

const nebius: EditionDate = {
  date: "2026-11-12",
  when: "after the close",
  what: "Nebius Q3 results",
  status: "confirmed",
};
const ppi: EditionDate = {
  date: "2026-11-11",
  when: "8:30 ET",
  what: "October producer prices",
  status: "confirmed",
};

const edition: Edition = {
  date: "2026-11-10",
  writtenBy: "Written by hand",
  ageDays: 1,
  stories: [
    {
      id: "ai-capex",
      headline: "AI capex keeps climbing.",
      line: "AI capex keeps climbing",
      symbols: ["NBIS"],
      facts: [],
      reports: [nebius],
      more: [],
    },
  ],
  next: [ppi, nebius],
  sectors: {
    source: "test",
    from: { day: "2026-11-09", week: "2026-11-03", month: "2026-10-10", ytd: "2026-01-02" },
    rangeSpan: { from: "2026-10-13", to: "2026-11-09" },
    rows: [
      sector("S&P 500", "SPY", -2.7, true),
      sector("Energy", "XLE", -12),
      sector("Communication Services", "XLC", 4.9),
      sector("Utilities", "XLU", 0.4),
    ],
  },
};
const view: EditionView = { edition, today: "2026-11-11" };

const row = (key: string, name: string, kind: BoardRow["kind"]): BoardRow => ({
  key,
  name,
  kind,
  value: "+$1",
  tone: "flat" as BoardRow["tone"],
  bar: 0,
  sortValue: 1,
});
const board: BoardSnapshot = {
  seq: 1,
  generatedAt: "2026-11-11T00:00:00Z",
  metric: "realized",
  rows: [row("tony", "Tony", "human"), row("eric", "Eric", "human"), row("sauron", "x", "bot")],
  blocks: {},
  opsApplied: 0,
};

describe("tourFacts — the tour reads the page's own answers", () => {
  it("names the week's leading sector, the event a story waits on, and the party", () => {
    const f = tourFacts(view, null, board, false);
    expect(f.lead).toEqual({
      name: "Communication Services",
      anchor: "sector-XLC",
      figure: moveFigure(4.9),
    });
    expect(f.sectorCount).toBe(3);
    // PPI is sooner, but a story waits on Nebius's results, so the Eye goes there.
    expect(f.event).toEqual({
      what: "Nebius Q3 results",
      day: dayLabel("2026-11-12"),
      anchor: eventAnchor(editionEventKey(nebius)),
      waited: true,
    });
    expect(f).toMatchObject({ connected: false, members: 2, tower: true });
  });

  it("leaves a fact out when its read failed, rather than inventing one", () => {
    const f = tourFacts(undefined, undefined, undefined, false);
    expect(f).toEqual({ connected: false, tower: false });
  });
});

describe("the first visit in the dock", () => {
  let realFetch: typeof globalThis.fetch;
  beforeEach(() => {
    realFetch = globalThis.fetch;
    timing.typingMs = 0;
    localStorage.clear();
    useMoneypenny.getState().reset();
    useEyeLight.setState({ request: undefined });
    useMoneypenny.setState({
      member: "m-1",
      connected: false,
      firstTradeDone: false,
      messaged: false,
      introDone: true,
      visit: { kind: "welcome" },
      messages: [{ role: "mp", text: WELCOME }],
    });
    globalThis.fetch = ((url: string) => {
      if (url === "/api/edition") return Promise.resolve(json(view));
      if (url.startsWith("/api/board")) return Promise.resolve(json({ ...board, view: board }));
      return Promise.resolve(new Response("{}", { status: 404 }));
    }) as typeof globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("shows the welcome and its three moves", () => {
    mount();
    expect(screen.getByRole("button", { name: /^Moneypenny: welcome/ })).toBeTruthy();
    const moves = screen.getByRole("list", { name: "Your moves" });
    expect(moves.textContent).toContain("Walk me through it");
    expect(moves.textContent).toContain("First step");
    expect(moves.textContent).toContain("I have a goal");
  });

  it("walks the tour: each window by address, the Eye on its row with a reason, her line", async () => {
    const { router } = mount();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Walk me through it" }));
    });
    await waitFor(() => expect(useMoneypenny.getState().visit).toEqual({ kind: "tour", step: 0 }));
    expect(router.state.location.search).toEqual({ w: "market" });
    expect(useEyeLight.getState().request).toMatchObject({
      anchor: "sector-XLC",
      reason: "led the week",
    });
    expect(useMoneypenny.getState().messages.at(-1)?.text).toContain("Communication Services led");
    expect(screen.getByRole("button", { name: "That's enough" })).toBeTruthy();

    for (const [w, anchor] of [
      ["calendar", eventAnchor(editionEventKey(nebius))],
      ["quests", "quest-connect"],
      ["party", "party-tower"],
    ] as const) {
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "Next ›" }));
      });
      await waitFor(() => expect(router.state.location.search).toEqual({ w }));
      await waitFor(() => expect(useEyeLight.getState().request?.anchor).toBe(anchor));
    }
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "One last thing ›" }));
    });
    await waitFor(() => expect(useMoneypenny.getState().messages.at(-1)?.text).toBe(TOUR_END));
    expect(screen.getByRole("button", { name: "Set a goal" })).toBeTruthy();
  });

  it("steps out on That's enough, and her canned moves come back", async () => {
    mount();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Walk me through it" }));
    });
    await waitFor(() => screen.getByRole("button", { name: "That's enough" }));
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "That's enough" }));
    });
    await waitFor(() => expect(useMoneypenny.getState().messages.at(-1)?.text).toBe(VISIT_STOPPED));
    expect(useMoneypenny.getState().visit).toBeUndefined();
    expect(screen.getByRole("button", { name: "Help me get set up" })).toBeTruthy();
  });

  it("drops a tour step whose reads land after the member stopped the tour", async () => {
    // Mid-tour, the edition read is still out when "Next ›" is tapped; the member stops the tour
    // meanwhile. The stale step must not open its window, light the Eye or restart the tour.
    let release: () => void = () => undefined;
    const gate = new Promise<void>((ok) => {
      release = ok;
    });
    const served = globalThis.fetch;
    globalThis.fetch = ((url: string, init?: RequestInit) =>
      url === "/api/edition"
        ? gate.then(() => served(url, init))
        : served(url, init)) as typeof globalThis.fetch;
    useMoneypenny.setState({ visit: { kind: "tour", step: 0 } });
    const { router } = mount();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Next ›" }));
    });
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "That's enough" }));
    });
    await waitFor(() => expect(useMoneypenny.getState().messages.at(-1)?.text).toBe(VISIT_STOPPED));
    release();
    await flush();
    await flush();
    expect(useMoneypenny.getState().visit).toBeUndefined();
    expect(router.state.location.search).not.toEqual({ w: "calendar" });
    expect(useEyeLight.getState().request).toBeUndefined();
    expect(useMoneypenny.getState().messages.at(-1)?.text).toBe(VISIT_STOPPED);
  });

  it("keeps focus in the dock through the tour: on the next move, not <body>", async () => {
    mount();
    const walk = screen.getByRole("button", { name: "Walk me through it" });
    walk.focus();
    act(() => {
      fireEvent.click(walk);
    });
    await waitFor(() => expect(screen.getByRole("button", { name: "Next ›" })).toHaveFocus());
    // "One last thing ›" replaces itself with the end's moves; focus follows to the first of them.
    useMoneypenny.setState({ visit: { kind: "tour", step: 3 } });
    const last = await screen.findByRole("button", { name: "One last thing ›" });
    last.focus();
    act(() => {
      fireEvent.click(last);
    });
    await waitFor(() => expect(screen.getByRole("button", { name: "Set a goal" })).toHaveFocus());
  });

  it("a window the tour opens leaves focus in the dock; one the member switches to takes it", () => {
    const frame = () => (
      <MissionWindowFrame
        id="market"
        side={1}
        title="Market"
        sub=""
        links={[]}
        open={() => undefined}
      >
        <p>rows</p>
      </MissionWindowFrame>
    );
    openQuietly("market");
    render(frame());
    expect(screen.getByRole("heading", { name: "Market" })).not.toHaveFocus();
    cleanup();
    render(frame());
    expect(screen.getByRole("heading", { name: "Market" })).toHaveFocus();
  });

  it("collects a goal in the box, then pins it as the first row of Quests", async () => {
    mount(
      <ul>
        <QuestGoal />
      </ul>,
    );
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "I have a goal" }));
    });
    await waitFor(() => expect(useMoneypenny.getState().messages.at(-1)?.text).toBe(GOAL_ASK));
    const box = screen.getByRole("textbox", { name: "Message Moneypenny" }) as HTMLInputElement;
    expect(box.placeholder).toBe("Your goal, in your own words");
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Practice with small amounts" }));
    });
    await waitFor(() =>
      expect(useMoneypenny.getState().goal?.text).toBe("Practice with small amounts"),
    );
    expect(screen.getByText("“Practice with small amounts”")).toBeTruthy();
    expect(screen.getByText("set today")).toBeTruthy();
    expect(box.placeholder).not.toBe("Your goal, in your own words");

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Clear your goal" }));
    });
    expect(useMoneypenny.getState().goal).toBeUndefined();
    // Clear unmounts itself; focus lands on the "Set a goal" row that replaces it, not <body>.
    await waitFor(() => expect(screen.getByRole("button", { name: /Set a goal/ })).toHaveFocus());
  });

  it("tags the goal row with the day it was set once that day has passed", () => {
    useMoneypenny.setState({
      goal: { text: "Learn how options work", at: new Date(2026, 10, 9, 10).getTime() },
    });
    render(
      <ul>
        <QuestGoal now={new Date(2026, 10, 11, 10).getTime()} />
      </ul>,
    );
    expect(screen.getByText("set Nov 9")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Change your goal" })).toBeTruthy();
  });
});
