import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import { editionEventKey } from "../../../src/domain/edition-keys";
import type { Edition } from "../../src/live/edition";
import { horizonSearch } from "../../src/live/horizon-params";
import { pageKeys, usePublishPageKeys } from "../../src/live/page-keys";
import { openEditionTarget, targetedEditionAnchor } from "../../src/shell/edition-anchor";
import { LANDED_MS, land } from "../../src/shell/landing";
import { calendarShows, LandingCalendar } from "../../src/shell/landing-calendar";

/**
 * Moneypenny points into the landing page by key (#7167 slices 1–2). Her `/#story-<id>` and
 * `/#event-<key>` links land only if the page carries those anchors, so this pins them on the
 * rendered calendar, R&D's since slice 1d of #7077 (`landing-calendar.tsx`): if its rows drop
 * the ids, this goes red. Only events in the calendar's selected range have a row, so only their
 * keys are "on screen" (`calendarShows`). Tapping a link opens the row and outlines it for 4 s (criterion 3).
 */

const event = {
  date: "2026-11-10",
  when: "after the close",
  what: "CoreWeave Q3 results",
  status: "confirmed" as const,
};

const later = {
  date: "2026-12-05",
  when: "8:30 ET",
  what: "November jobs report",
  status: "estimate" as const,
};

const edition: Edition = {
  date: "2026-11-06",
  writtenBy: "Written by hand",
  ageDays: 3,
  stories: [
    {
      id: "ai-capex",
      headline: "The AI build-out keeps spending.",
      line: "AI capex keeps climbing",
      symbols: ["CRWV"],
      facts: [{ label: "CRWV", value: "−4.1%", move: "down" }],
      reports: [event],
      more: [],
    },
  ],
  next: [event, later],
};

afterEach(cleanup);

/** The calendar on the root route, where its range lives (`?on=&span=`). Monday 2026-11-09 with
 *  nothing pinned is the week of the 9th: `event` is inside it, `later` is not. */
async function renderCalendar(path = "/") {
  const rootRoute = createRootRoute({ component: () => <Outlet />, validateSearch: horizonSearch });
  const landing = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <LandingCalendar edition={edition} today="2026-11-09" storyAsk={() => null} />,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([landing]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  render(<RouterProvider router={router} />);
  await screen.findByText("The calendar");
}

describe("the landing page's anchors (#7167)", () => {
  it("gives each story, each event and the calendar the id her links name", async () => {
    await renderCalendar();
    expect(document.getElementById("story-ai-capex")?.tagName).toBe("LI");
    const key = editionEventKey(event);
    expect(key).toBe("2026-11-10-coreweave-q3-results");
    expect(document.getElementById(`event-${key}`)?.tagName).toBe("LI");
    expect(document.getElementById("calendar")?.tagName).toBe("SECTION");
  });

  it("keeps the story's opened headline on its own id, so the row's anchor stays unique", async () => {
    await renderCalendar();
    expect(document.querySelectorAll('[id="story-ai-capex"]')).toHaveLength(1);
    expect(document.getElementById("edition-headline-ai-capex")?.tagName).toBe("H5");
  });
});

describe("what is on screen follows the calendar's range (#7167 port onto #7220)", () => {
  const range = { lens: "week" as const, pinned: false, anchor: "2026-11-09" };

  it("counts only the events inside the selected range", () => {
    expect(calendarShows(edition, "2026-11-09", range).inside).toEqual([event]);
  });

  it("draws a row for exactly those events, so every key she gets has a row to land on", async () => {
    await renderCalendar();
    expect(document.getElementById(`event-${editionEventKey(event)}`)).not.toBeNull();
    expect(document.getElementById(`event-${editionEventKey(later)}`)).toBeNull();
  });

  it("moves with the range: step to December and the jobs report is on screen instead", async () => {
    const december = { lens: "week" as const, pinned: true, anchor: "2026-12-05" };
    expect(calendarShows(edition, "2026-11-09", december).inside).toEqual([later]);
    await renderCalendar("/?on=2026-12-05&span=week");
    expect(document.getElementById(`event-${editionEventKey(later)}`)).not.toBeNull();
    expect(document.getElementById(`event-${editionEventKey(event)}`)).toBeNull();
  });
});

describe("landing on a row she linked", () => {
  it("reads only this page's anchors from the hash", () => {
    expect(targetedEditionAnchor("#story-ai-capex")).toBe("story-ai-capex");
    expect(targetedEditionAnchor("#event-2026-11-10-coreweave-q3-results")).toBe(
      "event-2026-11-10-coreweave-q3-results",
    );
    expect(targetedEditionAnchor("#calendar")).toBe("calendar");
    expect(targetedEditionAnchor("#%63alendar")).toBe("calendar");
    expect(targetedEditionAnchor("#pos-NVDA")).toBeUndefined();
    expect(targetedEditionAnchor("#calendar-x")).toBeUndefined();
    expect(targetedEditionAnchor("")).toBeUndefined();
  });

  it("opens the story it names", async () => {
    await renderCalendar();
    const row = openEditionTarget(document, "#story-ai-capex");
    expect(row?.id).toBe("story-ai-capex");
    expect(row?.querySelector("details")?.open).toBe(true);
  });

  it("opens the event it names", async () => {
    await renderCalendar();
    const row = openEditionTarget(document, `#event-${editionEventKey(event)}`);
    expect(row?.querySelector("details")?.open).toBe(true);
  });

  it("finds nothing for a row the page doesn't show, so nothing lands", async () => {
    await renderCalendar();
    expect(openEditionTarget(document, "#story-not-here")).toBeUndefined();
  });

  it("outlines the row for 4 s, then clears", async () => {
    await renderCalendar();
    rstest.useFakeTimers();
    try {
      const row = openEditionTarget(document, "#story-ai-capex");
      if (!row) throw new Error("no row");
      land(row);
      expect(row.hasAttribute("data-landed")).toBe(true);
      act(() => {
        rstest.advanceTimersByTime(LANDED_MS - 1);
      });
      expect(row.hasAttribute("data-landed")).toBe(true);
      act(() => {
        rstest.advanceTimersByTime(1);
      });
      expect(row.hasAttribute("data-landed")).toBe(false);
    } finally {
      rstest.useRealTimers();
    }
  });
});

describe("the page's context stamp (#7167 slice 1)", () => {
  it("publishes the page's keys while it is mounted, and withdraws them after", () => {
    const keys = { edition: "2026-11-06", stories: ["ai-capex"], events: ["2026-11-10-x"] };
    const { unmount } = renderHook(() => usePublishPageKeys(keys));
    expect(pageKeys()).toEqual(keys);
    unmount();
    expect(pageKeys()).toBeUndefined();
  });

  it("publishes nothing for a page with no edition", () => {
    renderHook(() => usePublishPageKeys(undefined));
    expect(pageKeys()).toBeUndefined();
  });
});
