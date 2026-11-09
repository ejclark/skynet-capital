import { act, cleanup, render, renderHook } from "@testing-library/react";
import { editionEventKey } from "../../../src/domain/edition-keys";
import type { Edition } from "../../src/live/edition";
import { pageKeys, usePublishPageKeys } from "../../src/live/page-keys";
import { openEditionTarget, targetedEditionAnchor } from "../../src/shell/edition-anchor";
import { EditionCalendar } from "../../src/shell/edition-calendar";
import { LANDED_MS, land } from "../../src/shell/landing";

/**
 * Moneypenny points into the landing page by key (#7167 slices 1–2). Her `/#story-<id>` and
 * `/#event-<key>` links land only if the page carries those anchors, so this pins them on the
 * rendered calendar: when slice 1d of #7077 swaps in R&D's calendar, the new rows must carry the
 * same ids or this goes red. Tapping a link opens the row and outlines it for 4 s (criterion 3).
 */

const event = {
  date: "2026-11-10",
  when: "after the close",
  what: "CoreWeave Q3 results",
  status: "confirmed" as const,
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
  next: [event],
};

afterEach(cleanup);

function renderCalendar() {
  return render(<EditionCalendar edition={edition} today="2026-11-09" storyAsk={() => null} />);
}

describe("the landing page's anchors (#7167)", () => {
  it("gives each story, each event and the calendar the id her links name", () => {
    renderCalendar();
    expect(document.getElementById("story-ai-capex")?.tagName).toBe("LI");
    const key = editionEventKey(event);
    expect(key).toBe("2026-11-10-coreweave-q3-results");
    expect(document.getElementById(`event-${key}`)?.tagName).toBe("LI");
    expect(document.getElementById("calendar")?.tagName).toBe("SECTION");
  });

  it("keeps the story's opened headline on its own id, so the row's anchor stays unique", () => {
    renderCalendar();
    expect(document.querySelectorAll('[id="story-ai-capex"]')).toHaveLength(1);
    expect(document.getElementById("story-ai-capex-headline")?.tagName).toBe("H5");
  });
});

describe("landing on a row she linked", () => {
  it("reads only this page's anchors from the hash", () => {
    expect(targetedEditionAnchor("#story-ai-capex")).toBe("story-ai-capex");
    expect(targetedEditionAnchor("#event-2026-11-10-coreweave-q3-results")).toBe(
      "event-2026-11-10-coreweave-q3-results",
    );
    expect(targetedEditionAnchor("#calendar")).toBe("calendar");
    expect(targetedEditionAnchor("#pos-NVDA")).toBeUndefined();
    expect(targetedEditionAnchor("#calendar-x")).toBeUndefined();
    expect(targetedEditionAnchor("")).toBeUndefined();
  });

  it("opens the story it names", () => {
    renderCalendar();
    const row = openEditionTarget(document, "#story-ai-capex");
    expect(row?.id).toBe("story-ai-capex");
    expect(row?.querySelector("details")?.open).toBe(true);
  });

  it("opens the event it names", () => {
    renderCalendar();
    const row = openEditionTarget(document, `#event-${editionEventKey(event)}`);
    expect(row?.querySelector("details")?.open).toBe(true);
  });

  it("finds nothing for a row the page doesn't show, so nothing lands", () => {
    renderCalendar();
    expect(openEditionTarget(document, "#story-not-here")).toBeUndefined();
  });

  it("outlines the row for 4 s, then clears", () => {
    rstest.useFakeTimers();
    try {
      renderCalendar();
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
