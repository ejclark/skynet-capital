import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import type { DeskPosition } from "../../src/live/desk";
import { LANDED_MS } from "../../src/shell/landing";
import {
  positionAnchor,
  targetedPosition,
  visiblePositionTarget,
} from "../../src/shell/position-anchor";
import { PositionsBlotter } from "../../src/shell/positions-blotter";

/**
 * Landing on a position (#4348): an Events row links `/app/accounts#pos-<symbol>`. The table row and
 * the phone's card are both in the DOM and CSS shows one, so the link has to land on whichever is
 * laid out — the row at desktop, the card at 390 — scroll it in, and mark it for a moment.
 */

// No router here; pass the card's data attributes through so its landing anchor is observable.
rstest.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    className,
    ...rest
  }: {
    children: ReactNode;
    className?: string;
    [key: string]: unknown;
  }) => {
    const data = Object.fromEntries(Object.entries(rest).filter(([k]) => k.startsWith("data-")));
    return (
      <a href="/app/trade" className={className} {...data}>
        {children}
      </a>
    );
  },
}));

const position = (symbol: string): DeskPosition =>
  ({
    symbol,
    display: symbol,
    detail: "",
    isOption: false,
    quantity: "10",
    costPerShare: "$50.00",
    price: "$51.00",
    costBasis: "$500",
    value: "$510",
    dayPl: "+$10",
    dayPct: "+2.0%",
    dayTone: "pos",
    totalPl: "+$10",
    totalPlRaw: 10,
    returnPct: "+2.0%",
    totalTone: "pos",
    weightPct: 50,
  }) as DeskPosition;

const book = [position("SPY"), position("EEM")];

function blotter(): ReactElement {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <PositionsBlotter deskId="d" positions={book} query="" onFilterChange={() => undefined} />
    </QueryClientProvider>
  );
}

// happy-dom lays nothing out, so stand in for the breakpoint: whatever sits inside `hidden` has no
// layout boxes, the way `display: none` leaves it in a browser.
const realRects = Element.prototype.getClientRects;
function breakpoint(hidden: string): void {
  Element.prototype.getClientRects = function (this: Element) {
    return (this.closest(hidden) ? [] : [{}]) as unknown as DOMRectList;
  };
}

describe("targetedPosition", () => {
  it("reads the position anchor out of the hash, decoded", () => {
    expect(targetedPosition("#pos-EEM")).toBe("pos-EEM");
    expect(targetedPosition("#pos-BRK%2EB")).toBe("pos-BRK.B");
  });

  it("ignores every other hash", () => {
    expect(targetedPosition("")).toBeUndefined();
    expect(targetedPosition("#act-ord-1")).toBeUndefined();
    expect(targetedPosition("#pos-")).toBeUndefined();
  });
});

describe("visiblePositionTarget", () => {
  afterEach(() => {
    Element.prototype.getClientRects = realRects;
    document.body.innerHTML = "";
  });

  it("picks the laid-out one of the row and the card", () => {
    document.body.innerHTML = `
      <table class="blotter-card"><tbody><tr id="pos-EEM"></tr></tbody></table>
      <ul class="pos-cards"><li><a data-pos-anchor="pos-EEM"></a></li></ul>`;
    breakpoint(".blotter-card");
    expect(visiblePositionTarget(document, "pos-EEM")?.tagName).toBe("A");
    breakpoint(".pos-cards");
    expect(visiblePositionTarget(document, "pos-EEM")?.tagName).toBe("TR");
  });
});

describe("PositionsBlotter — the position a link points at", () => {
  const scroll = rstest.fn();
  beforeEach(() => {
    scroll.mockReset();
    Element.prototype.scrollIntoView = scroll;
  });
  afterEach(() => {
    Element.prototype.getClientRects = realRects;
    window.location.hash = "";
    rstest.useRealTimers();
  });

  it("keeps the table row's id — tower-bus's REGARD_TARGETS reads it — and never repeats it", () => {
    const { container } = render(blotter());
    expect(container.querySelectorAll(`[id="${positionAnchor("EEM")}"]`)).toHaveLength(1);
    expect(container.querySelector('tr[id^="pos-"]')).not.toBeNull();
    expect(container.querySelector(`[data-pos-anchor="pos-EEM"]`)).toHaveClass("pos-card");
  });

  it("at phone width, lands on the card, not the hidden row", () => {
    breakpoint(".blotter-card");
    window.location.hash = "#pos-EEM";
    render(blotter());
    expect(scroll).toHaveBeenCalled();
    const landed = scroll.mock.contexts[0] as Element;
    expect(landed).toHaveClass("pos-card");
    expect(landed).toHaveAttribute("data-pos-anchor", "pos-EEM");
    expect(landed).toHaveAttribute("data-landed");
  });

  it("at desktop width, lands on the table row", () => {
    breakpoint(".pos-cards");
    window.location.hash = "#pos-EEM";
    render(blotter());
    const landed = scroll.mock.contexts[0] as Element;
    expect(landed.tagName).toBe("TR");
    expect(landed).toHaveAttribute("id", "pos-EEM");
  });

  it("marks the position only for a moment", () => {
    rstest.useFakeTimers();
    breakpoint(".pos-cards");
    window.location.hash = "#pos-EEM";
    const { container } = render(blotter());
    const row = container.querySelector("#pos-EEM");
    expect(row).toHaveAttribute("data-landed");
    act(() => {
      rstest.advanceTimersByTime(LANDED_MS);
    });
    expect(row).not.toHaveAttribute("data-landed");
  });

  it("follows an in-page hash change, as the Map lens's tiles make", () => {
    breakpoint(".pos-cards");
    render(blotter());
    expect(scroll).not.toHaveBeenCalled();
    act(() => {
      window.location.hash = "#pos-SPY";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(scroll.mock.contexts.at(-1)).toHaveAttribute("id", "pos-SPY");
  });

  it("leaves the page where it is with no position in the hash", () => {
    window.location.hash = "#act-ord-1";
    render(blotter());
    expect(scroll).not.toHaveBeenCalled();
  });
});
