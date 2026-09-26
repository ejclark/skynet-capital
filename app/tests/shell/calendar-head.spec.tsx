import { fireEvent, render, screen } from "@testing-library/react";
import { rangeFor } from "../../src/live/horizon-range";
import { CalendarHead } from "../../src/shell/calendar-head";

/**
 * The market calendar's head (#3807 slice 2·1) — the controls without the grid, as a member sees
 * them: the label that names the job, the range and its sessions, the lens row, and the day
 * lens's fog as visible text in the chip's own box.
 */
const laborDay = { date: "2026-09-07", reason: "Labor Day", early: false };
const fog = {
  door: "Held until rung 501 (zero-DTE)",
  reason:
    "Held until rung 501 (zero-DTE) is earned — the same-day view pays out like a same-day trade.",
};

function mount(overrides: Partial<Parameters<typeof CalendarHead>[0]> = {}) {
  const calls = { lenses: [] as string[], steps: [] as number[] };
  render(
    <CalendarHead
      lens="week"
      range={rangeFor("2026-09-09", "week")}
      closures={[laborDay]}
      all={{ name: "any date", count: "everything dated" }}
      onLens={(l) => calls.lenses.push(l)}
      onStep={(s) => calls.steps.push(s)}
      {...overrides}
    />,
  );
  return calls;
}

describe("CalendarHead", () => {
  it("names the instrument by its job, the range, and the sessions the closures leave", () => {
    mount();
    expect(screen.getByText("Market calendar")).toBeInTheDocument();
    expect(screen.queryByText("Event horizon")).toBeNull();
    expect(screen.getByText("Sep 7 – Sep 13")).toBeInTheDocument();
    expect(screen.getByText("4 sessions")).toBeInTheDocument();
  });

  it("marks the lens pressed, steps by its unit, and clears the pressed lens to all", () => {
    const calls = mount();
    expect(screen.getByRole("button", { name: "Week" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("button", { name: "All" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Next week" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
    fireEvent.click(screen.getByRole("button", { name: "Month" }));
    fireEvent.click(screen.getByRole("button", { name: "Week" }));
    expect(calls.steps).toEqual([1, -1]);
    expect(calls.lenses).toEqual(["month", "all"]);
  });

  it("reads the caller's words under the all lens and pages by month", () => {
    const calls = mount({ lens: "all", range: rangeFor("2026-09-09", "all") });
    expect(screen.getByText("any date")).toBeInTheDocument();
    expect(screen.getByText("everything dated")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(calls.steps).toEqual([1]);
  });

  it("seats the caller's grid between the head row and the lens row", () => {
    mount({ children: <div data-testid="grid" /> });
    const grid = screen.getByTestId("grid");
    expect(grid.previousElementSibling).toHaveClass("eh-head");
    expect(grid.nextElementSibling).toHaveClass("eh-lens-row");
  });

  it("draws the day lens's fog as visible text in the chip's own box, never only in title", () => {
    const calls = mount({ dayFog: fog });
    const day = screen.getByRole("button", { name: /^Day/ });
    expect(day).toBeDisabled();
    expect(day).toHaveAttribute("title", fog.reason);
    // The crawl's probe (scripts/crawl/probes.mjs) reads the enclosing fieldset for the reason's
    // first words — the visible line opens with the door's own name, in that box.
    expect(day.closest("fieldset")?.textContent).toContain(fog.reason.slice(0, 24));
    const described = document.getElementById(day.getAttribute("aria-describedby") ?? "");
    expect(described?.textContent).toBe("Day lens: Held until rung 501 (zero-DTE).");
    fireEvent.click(day);
    expect(calls.lenses).toEqual([]);
  });

  it("counts the calls behind the fog where the caller can count them", () => {
    mount({ dayFog: { ...fog, held: 1 } });
    expect(screen.getByText(/^Day lens: Held until rung 501/).textContent).toMatch(
      /1 call in range behind it\.$/,
    );
  });

  it("carries no fog wiring at all when nothing is fogged", () => {
    mount();
    const day = screen.getByRole("button", { name: "Day" });
    expect(day).toBeEnabled();
    expect(day).not.toHaveAttribute("aria-describedby");
    expect(document.querySelector(".eh-fog")).toBeNull();
  });
});
