import { fireEvent, render, screen } from "@testing-library/react";
import { TimeInForceField } from "../../src/shell/tif-field";

/**
 * `TimeInForceField` (#3407 P1) — the pressed segment follows the caller's fallback until the
 * member picks, the pick is reported verbatim, and the one-line meaning under it tracks what is
 * pressed.
 */
const noop = (): void => undefined;

describe("TimeInForceField", () => {
  it("presses the fallback when nothing is picked and explains it", () => {
    render(<TimeInForceField fallback="day" value={undefined} onChange={noop} />);
    expect(screen.getByRole("button", { name: "Day" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "GTC" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText(/cancelled when today's session closes/)).toBeInTheDocument();
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
