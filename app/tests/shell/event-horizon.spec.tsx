import { fireEvent, render, screen } from "@testing-library/react";
import { rangeFor } from "../../src/live/horizon-range";
import type { ResearchEvent } from "../../src/live/research";
import { EventHorizon } from "../../src/shell/event-horizon";

// The rail's lens row, range shading, and closed-day colouring (#1704 slice 2) — asserted the way
// a member sees them: the head's session count, the pressed lens, the title on a closed day.
const events: ResearchEvent[] = [
  { id: "cpi-2026-09-11", title: "CPI", date: "2026-09-11", symbols: [], researched: true },
];
const laborDay = { date: "2026-09-07", reason: "Labor Day", early: false };

function mount(overrides: Partial<Parameters<typeof EventHorizon>[0]> = {}) {
  const calls = { picks: [] as string[], lenses: [] as string[], steps: [] as number[] };
  render(
    <EventHorizon
      events={events}
      closures={[laborDay]}
      lens="week"
      anchor="2026-09-09"
      range={rangeFor("2026-09-09", "week")}
      today="2026-09-06"
      pinned={true}
      onPick={(d) => calls.picks.push(d)}
      onLens={(l) => calls.lenses.push(l)}
      onStep={(s) => calls.steps.push(s)}
      {...overrides}
    />,
  );
  return calls;
}

describe("EventHorizon", () => {
  it("names the week and counts four sessions when Labor Day closes one", () => {
    mount();
    expect(screen.getByText("Sep 7 – Sep 13")).toBeInTheDocument();
    expect(screen.getByText("4 sessions")).toBeInTheDocument();
  });

  it("marks the current lens pressed and reports a new pick", () => {
    const calls = mount();
    expect(screen.getByRole("button", { name: "Week" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Month" }));
    expect(calls.lenses).toEqual(["month"]);
  });

  it("steps by the lens's duration through the arrows", () => {
    const calls = mount();
    fireEvent.click(screen.getByRole("button", { name: "Next week" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
    expect(calls.steps).toEqual([1, -1]);
  });

  it("colours a closed weekday and names the reason; an event day names the event", () => {
    mount();
    const seventh = screen.getByRole("button", { name: "7" });
    expect(seventh).toHaveClass("eh-closed");
    expect(seventh).toHaveAttribute("title", "Labor Day");
    expect(screen.getByRole("button", { name: "11" })).toHaveAttribute("title", "CPI");
  });

  it("shades the range and lets any day be picked — a day with no event is a fine anchor", () => {
    const calls = mount();
    expect(screen.getByRole("button", { name: "8" })).toHaveClass("eh-in-range");
    expect(screen.getByRole("button", { name: "20" })).not.toHaveClass("eh-in-range");
    fireEvent.click(screen.getByRole("button", { name: "8" }));
    expect(calls.picks).toEqual(["2026-09-08"]);
  });

  it("draws the day-lens fog as visible, named, disabled and counted", () => {
    const calls = mount({ dayFog: { reason: "Held until rung 501 (zero-DTE)", held: 3 } });
    const day = screen.getByRole("button", { name: /^Day/ });
    expect(day).toBeDisabled();
    expect(day).toHaveAttribute("title", "Held until rung 501 (zero-DTE)");
    expect(screen.getByText(/Day lens held until rung 501/).textContent).toMatch(
      /3 calls in range behind it/,
    );
    fireEvent.click(day);
    expect(calls.lenses).toEqual([]);
  });

  it("offers Clear only while a day is pinned", () => {
    mount({ pinned: false });
    expect(screen.queryByRole("button", { name: /^Clear/ })).toBeNull();
  });
});
