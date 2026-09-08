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

  // Review fix (2026-09-08): the cell button sits INSIDE the row's own onClick (onPickStrike),
  // with no stopPropagation — a cell click used to fire both callbacks. Only the more specific one
  // (onPickSide) should fire.
  it("clicking a call/put cell calls onPickSide but not the row's own onPickStrike", () => {
    const onPickSide = rstest.fn();
    const onPickStrike = rstest.fn();
    render(
      <StraddleView
        symbol="NVDA"
        expiration="2026-09-18"
        spot={180}
        calls={calls}
        puts={puts}
        onPickStrike={onPickStrike}
        onPickSide={onPickSide}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Pick the 180 call" })[0] as HTMLElement);

    expect(onPickSide).toHaveBeenCalledWith(180, "call");
    expect(onPickStrike).not.toHaveBeenCalled();
  });
});

/**
 * The scroll-out stat columns (#2017 Phase 1 slice 14) — OI/volume/greeks past the base
 * Bid/Ask/Strike/Bid/Ask five, in the SAME `.straddle-scroll` container. Two rows: one with full
 * stats on both sides (proves the formatting), one with everything absent (proves the "—" path).
 */
describe("StraddleView — scroll-out stat columns", () => {
  const fullRow: ChainRow = {
    strike: 180,
    occSymbol: "NVDA180C",
    bid: 4.8,
    ask: 5.2,
    openInterest: 8213,
    volume: 1450,
    delta: 0.42,
    gamma: 0.0138,
    theta: -0.19,
    vega: 0.534,
  };
  const fullPut: ChainRow = {
    strike: 180,
    occSymbol: "NVDA180P",
    bid: 3.1,
    ask: 3.4,
    openInterest: 4021,
    volume: 812,
    delta: -0.38,
    gamma: 0.012,
    theta: -0.15,
    vega: 0.481,
  };
  const bareRow: ChainRow = { strike: 175, occSymbol: "NVDA175C" };
  const barePut: ChainRow = { strike: 175, occSymbol: "NVDA175P" };

  it("renders OI/Vol as comma-grouped integers and each greek to two decimals, on both sides", () => {
    render(
      <StraddleView
        symbol="NVDA"
        expiration="2026-09-18"
        spot={180}
        calls={[fullRow]}
        puts={[fullPut]}
      />,
    );
    // Call side.
    expect(screen.getByText("8,213")).toBeInTheDocument();
    expect(screen.getByText("1,450")).toBeInTheDocument();
    expect(screen.getByText("0.42")).toBeInTheDocument();
    expect(screen.getByText("-0.19")).toBeInTheDocument();
    expect(screen.getByText("0.53")).toBeInTheDocument();
    // Put side.
    expect(screen.getByText("4,021")).toBeInTheDocument();
    expect(screen.getByText("812")).toBeInTheDocument();
    expect(screen.getByText("-0.38")).toBeInTheDocument();
    expect(screen.getByText("0.48")).toBeInTheDocument();
    // Gamma rounds to "0.01" on both sides (0.0138 and 0.012) — assert both cells, not the text.
    expect(screen.getAllByText("0.01")).toHaveLength(2);
  });

  it('renders "—" for all six new cells on both sides when everything is absent, never 0/0.00', () => {
    render(
      <StraddleView
        symbol="NVDA"
        expiration="2026-09-18"
        spot={170}
        calls={[bareRow]}
        puts={[barePut]}
      />,
    );
    const dashes = screen.getAllByText("—");
    // 6 stat cells × 2 sides = 12 dashes from the stat columns (Bid/Ask also render "—" for this
    // row, but those aren't asserted here — only that no stat cell ever shows a fabricated number).
    expect(dashes.length).toBeGreaterThanOrEqual(12);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(screen.queryByText("0.00")).not.toBeInTheDocument();
  });

  it("expands the header group colSpan to 8 per side and the divider row's colSpan to 17", () => {
    const { container } = render(
      <StraddleView symbol="NVDA" expiration="2026-09-18" spot={180} calls={[fullRow]} puts={[]} />,
    );
    const callsHeader = container.querySelector(".straddle-side-calls");
    const putsHeader = container.querySelector(".straddle-side-puts");
    expect(callsHeader?.getAttribute("colspan")).toBe("8");
    expect(putsHeader?.getAttribute("colspan")).toBe("8");
    const divider = container.querySelector(".straddle-divider td");
    expect(divider?.getAttribute("colspan")).toBe("17");
  });

  it("orders calls' stats on the outer edge and Bid/Ask adjacent to Strike, mirrored on puts", () => {
    const { container } = render(
      <StraddleView
        symbol="NVDA"
        expiration="2026-09-18"
        spot={180}
        calls={[fullRow]}
        puts={[fullPut]}
      />,
    );
    const subHeaders = Array.from(container.querySelectorAll(".straddle-sub th")).map(
      (th) => th.textContent,
    );
    // Calls: stats first (outer edge), then Bid/Ask (adjacent to Strike) — Puts: unchanged.
    expect(subHeaders).toEqual([
      "OI",
      "Vol",
      "Δ",
      "Γ",
      "Θ",
      "Vega",
      "Bid",
      "Ask",
      "", // Strike's empty sub-header cell.
      "Bid",
      "Ask",
      "OI",
      "Vol",
      "Δ",
      "Γ",
      "Θ",
      "Vega",
    ]);

    const rowCells = Array.from(
      container.querySelectorAll("tbody tr.straddle-row")[0]?.children ?? [],
    );
    // Same order in the body row: calls' first cell is the OI stat, not Bid — the outer edge — and
    // the 7th/8th cells (Bid/Ask) sit immediately left of Strike (the 9th).
    expect(rowCells[0]?.textContent).toBe("8,213"); // calls OI
    expect(rowCells[5]?.textContent).toBe("0.53"); // calls vega
    expect(rowCells[6]?.textContent).toBe("$4.80"); // calls bid
    expect(rowCells[7]?.textContent).toBe("$5.20"); // calls ask
    expect(rowCells[8]?.textContent).toBe("180"); // strike
    expect(rowCells[9]?.textContent).toBe("$3.10"); // puts bid
    expect(rowCells[10]?.textContent).toBe("$3.40"); // puts ask
  });

  it("opens scrolled past calls' stat columns so the base five are visible by default", () => {
    const { container } = render(
      <StraddleView symbol="NVDA" expiration="2026-09-18" spot={180} calls={calls} puts={puts} />,
    );
    const scroll = container.querySelector(".straddle-scroll") as HTMLDivElement | null;
    expect(scroll).not.toBeNull();
    // 6 stat columns × 44px (`.straddle-col-stat` in straddle.css) = 264px — set imperatively by
    // the mount effect, not by real layout (happy-dom doesn't compute pixel widths), so this
    // asserts the effect ran and wrote the expected offset, not rendered geometry.
    expect(scroll?.scrollLeft).toBe(264);
  });

  it("re-scrolls to the base five when the expiration changes (no remount boundary at either call site)", () => {
    const { container, rerender } = render(
      <StraddleView symbol="NVDA" expiration="2026-09-18" spot={180} calls={calls} puts={puts} />,
    );
    const scroll = container.querySelector(".straddle-scroll") as HTMLDivElement;
    // Simulate a member having scrolled away from the default offset before the expiration changes.
    scroll.scrollLeft = 0;
    rerender(
      <StraddleView symbol="NVDA" expiration="2026-10-16" spot={180} calls={calls} puts={puts} />,
    );
    expect(scroll.scrollLeft).toBe(264);
  });
});
