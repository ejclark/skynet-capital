import { fireEvent, render, screen } from "@testing-library/react";
import { TimeInForceField } from "../../src/shell/tif-field";

/**
 * `TimeInForceField` (#3407 P1) — the pressed segment follows the caller's fallback until the
 * member picks, the pick is reported verbatim, and the one-line meaning under it tracks what is
 * pressed.
 */
const noop = (): void => undefined;
/** Tue 2026-10-27 11:00 ET — mid-session, so "today's session" is the honest Day sentence. */
const OPEN = new Date("2026-10-27T15:00:00Z");

describe("TimeInForceField", () => {
  it("presses the fallback when nothing is picked and explains it", () => {
    render(<TimeInForceField fallback="day" value={undefined} onChange={noop} now={OPEN} />);
    expect(screen.getByRole("button", { name: "Day" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "GTC" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText(/cancelled when today's session closes/)).toBeInTheDocument();
  });

  it("names the next open for a Day order placed after the close (#6257)", () => {
    const closed = new Date("2026-10-27T00:00:00Z"); // Mon 8:00 p.m. ET
    render(<TimeInForceField fallback="day" value={undefined} onChange={noop} now={closed} />);
    expect(screen.getByText(/waits for the Tue 9:30 ET open/)).toBeInTheDocument();
    expect(screen.queryByText(/today's session/)).not.toBeInTheDocument();
  });

  it("reports a pick and presses it over the fallback", () => {
    const picks: string[] = [];
    const { rerender } = render(
      <TimeInForceField fallback="day" value={undefined} onChange={(v) => picks.push(v)} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "GTC" }));
    expect(picks).toEqual(["gtc"]);
    rerender(<TimeInForceField fallback="day" value="gtc" onChange={noop} />);
    expect(screen.getByRole("button", { name: "GTC" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/stays working across sessions/)).toBeInTheDocument();
  });
});
