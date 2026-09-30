import { fireEvent, render, screen } from "@testing-library/react";
import { rangeFor } from "../../src/live/horizon-range";
import { headLine } from "../../src/shell/calendar-head";
import { CalendarSheet } from "../../src/shell/calendar-sheet";

/**
 * The market calendar on a phone (#3977, the phone face): at ≤860 the head leaves the page's flow
 * for one sheet and a chip names the range it holds; from 861 the head is the row it always was.
 */

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

const line = { name: "Sep 28 – Oct 4", count: "5 sessions" };

describe("CalendarSheet", () => {
  it("keeps the head in the row at desktop width — no chip, no sheet", () => {
    render(
      <CalendarSheet className="cal-head" line={line} below={<p>the line</p>}>
        <button type="button">Week</button>
      </CalendarSheet>,
    );
    expect(screen.getByRole("region", { name: "Market calendar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Week" })).toBeInTheDocument();
    expect(screen.getByText("the line")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Market calendar:/ })).toBeNull();
    expect(document.querySelector("dialog")).toBeNull();
  });

  it("on a phone, names the range on one chip and holds the head in a closed sheet", () => {
    const restore = phone();
    try {
      render(
        <CalendarSheet className="cal-head" line={line} below={<p>the line</p>}>
          <button type="button">Week</button>
        </CalendarSheet>,
      );
      const chip = screen.getByRole("button", { name: /Market calendar:/ });
      expect(chip).toHaveTextContent("Sep 28 – Oct 4");
      expect(chip).toHaveTextContent("5 sessions");
      expect(chip).toHaveAttribute("aria-haspopup", "dialog");
      // The line under the head stays in flow; the controls wait in the sheet.
      expect(screen.getByText("the line")).toBeVisible();
      const sheet = document.querySelector("dialog.cal-sheet") as HTMLDialogElement;
      expect(sheet.open).toBe(false);
      fireEvent.click(chip);
      expect(sheet.open).toBe(true);
      fireEvent.click(screen.getByRole("button", { name: "Done" }));
      expect(sheet.open).toBe(false);
    } finally {
      restore();
    }
  });

  it("hands a pick that finishes the visit the sheet's close", () => {
    const restore = phone();
    try {
      render(
        <CalendarSheet className="cal-head" line={line}>
          {(close) => (
            <button type="button" onClick={close}>
              30
            </button>
          )}
        </CalendarSheet>,
      );
      const sheet = document.querySelector("dialog.cal-sheet") as HTMLDialogElement;
      fireEvent.click(screen.getByRole("button", { name: /Market calendar:/ }));
      expect(sheet.open).toBe(true);
      fireEvent.click(screen.getByText("30"));
      expect(sheet.open).toBe(false);
    } finally {
      restore();
    }
  });
});

describe("headLine", () => {
  it("reads the range and the sessions the closures leave — the chip and the head say the same", () => {
    const laborDay = { date: "2026-09-07", reason: "Labor Day", early: false };
    const all = { name: "any date", count: "everything dated" };
    expect(
      headLine({ lens: "week", range: rangeFor("2026-09-09", "week"), closures: [laborDay], all }),
    ).toEqual({ name: "Sep 7 – Sep 13", count: "4 sessions" });
    expect(
      headLine({ lens: "all", range: rangeFor("2026-09-09", "week"), closures: [], all }),
    ).toEqual(all);
  });
});
