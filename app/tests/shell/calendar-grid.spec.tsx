import { fireEvent, render, screen } from "@testing-library/react";
import { rangeFor } from "../../src/live/horizon-range";
import { CalendarGrid, ClosedKey, type DayMark } from "../../src/shell/calendar-grid";

// R&D's month grid, shared with the landing page (#7077 AT10, AT11): the landing page marks a day a
// story waits on with ◆, the shape its rows carry, and a day's events ride in the cell's title.
const marks = new Map<string, DayMark>([
  ["2026-11-10", { titles: ["October consumer prices (CPI)"], glyph: "waits" }],
  ["2026-11-12", { titles: ["Nebius (NBIS) Q3 results"], glyph: "dot" }],
]);

function mount(picked?: string) {
  const picks: string[] = [];
  render(
    <CalendarGrid
      month="2026-11"
      lens="week"
      range={rangeFor("2026-11-09", "week")}
      today="2026-11-09"
      closures={[{ date: "2026-11-26", reason: "Thanksgiving Day", early: false }]}
      marks={marks}
      picked={picked}
      label="November 2026, each day's events marked"
      legend={
        <>
          ◆ a story waits on it · <ClosedKey />
        </>
      }
      onPick={(d) => picks.push(d)}
    />,
  );
  return picks;
}

const cell = (title: string): HTMLElement => screen.getByTitle(title);

describe("CalendarGrid", () => {
  it("marks a day a story waits on with ◆ and a plainly dated one with a dot", () => {
    mount();
    expect(cell("October consumer prices (CPI)").querySelector(".eh-waits")?.textContent).toBe("◆");
    expect(cell("Nebius (NBIS) Q3 results").querySelector(".eh-dot")).not.toBeNull();
    expect(cell("Nebius (NBIS) Q3 results").querySelector(".eh-waits")).toBeNull();
  });

  it("bands the week in range, strikes a closure with its reason, and hands a picked day back", () => {
    const picks = mount("2026-11-10");
    expect(cell("October consumer prices (CPI)")).toHaveClass("eh-band");
    expect(cell("October consumer prices (CPI)")).toHaveAttribute("aria-pressed", "true");
    expect(cell("Thanksgiving Day")).toHaveClass("eh-closed");
    expect(cell("Thanksgiving Day")).not.toHaveClass("eh-band");
    fireEvent.click(cell("Nebius (NBIS) Q3 results"));
    expect(picks).toEqual(["2026-11-12"]);
    expect(screen.getByRole("group", { name: /November 2026/ })).toBeInTheDocument();
  });
});
