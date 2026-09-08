import { fireEvent, render, screen } from "@testing-library/react";
import type { ChainRow } from "../../src/live/options";
import { StraddleView } from "../../src/shell/straddle-view";

/**
 * `StraddleView`'s call/put cell picking (#2017 Phase 0 task 4e, `onPickSide`) — a call or put
 * price cell becomes its own preset when the caller wires up `onPickSide`, reporting the row's
 * strike and which side was clicked; the strike button's own preset (`onPickStrike`) is untouched
 * and covered by `../live/straddle.spec.ts`'s pure helpers, not here. With `onPickSide` omitted,
 * cells render exactly as before — plain, non-interactive text, no button at all.
 */

const row = (strike: number, bid: number, ask: number): ChainRow => ({
  strike,
  occSymbol: `NVDA${strike}`,
  bid,
  ask,
});

const calls: readonly ChainRow[] = [row(180, 4.8, 5.2)];
const puts: readonly ChainRow[] = [row(180, 3.1, 3.4)];

describe("StraddleView — chain cell picking", () => {
  it('calls onPickSide with the strike and "call" when a call cell is clicked', () => {
    const onPickSide = rstest.fn();
    render(
      <StraddleView
        symbol="NVDA"
        expiration="2026-09-18"
        spot={180}
        calls={calls}
        puts={puts}
        onPickSide={onPickSide}
      />,
    );

    // Both bid and ask cells for a strike/side share the same aria-label — click the bid cell.
    // getAllByRole throws (rather than returning []) when nothing matches, so index 0 is safe.
    fireEvent.click(screen.getAllByRole("button", { name: "Pick the 180 call" })[0] as HTMLElement);

    expect(onPickSide).toHaveBeenCalledWith(180, "call");
  });

  it('calls onPickSide with the strike and "put" when a put cell is clicked', () => {
    const onPickSide = rstest.fn();
    render(
      <StraddleView
        symbol="NVDA"
        expiration="2026-09-18"
        spot={180}
        calls={calls}
        puts={puts}
        onPickSide={onPickSide}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Pick the 180 put" })[0] as HTMLElement);

    expect(onPickSide).toHaveBeenCalledWith(180, "put");
  });

  it("renders call/put cells with no button when onPickSide is not provided", () => {
    render(
      <StraddleView symbol="NVDA" expiration="2026-09-18" spot={180} calls={calls} puts={puts} />,
    );

    expect(screen.queryByRole("button", { name: /pick the/i })).not.toBeInTheDocument();
    expect(screen.getByText("$4.80")).toBeInTheDocument();
  });
});
