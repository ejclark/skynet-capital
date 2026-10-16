import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { useState } from "react";
import type { DeskPosition } from "../../src/live/desk";
import { easeHold, placeFor } from "../../src/shell/keep-place";
import { PositionsBlotter } from "../../src/shell/positions-blotter";

/**
 * A refinement keeps the page still (#5021). The positions block is the last thing on the
 * Overview, so a chip that shortens the list shortens the page, and the browser clamps `scrollY`
 * to the new bottom — the page moved under the member's finger. happy-dom lays nothing out, so
 * these specs give the page a small, honest layout model and assert what the member would see:
 * where the filter bar sits on screen after the tap. `e2e/positions-refine-scroll.spec.ts` holds
 * the same line in a real Chromium at 390 and 1280.
 */

rstest.mock("@tanstack/react-router", () => ({
  Link: ({ children, className }: { children: ReactElement; className?: string }) => (
    <a href="/app/trade" className={className}>
      {children}
    </a>
  ),
}));

const position = (symbol: string, totalPlRaw: number): DeskPosition =>
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
    totalPl: totalPlRaw > 0 ? "+$10" : "−$10",
    totalPlRaw,
    returnPct: "+2.0%",
    totalTone: totalPlRaw > 0 ? "pos" : "neg",
    weightPct: 10,
  }) as DeskPosition;

// Ten positions, three of them below cost: "Below cost" cuts the list from ten rows to three.
const BOOK = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"].map((s, i) =>
  position(s, i < 3 ? -10 : 10),
);

/**
 * The page, as the browser lays it out: 1000px above the filter bar, the 100px bar, one 100px row
 * per position (or the region's held `min-height`, if larger), 100px under it — and, optionally, a
 * column beside it `side` px tall (the tower column at 1280), the page being the taller of the two.
 * The scroll offset clamps to the bottom whenever layout is read, and the clamp sticks — exactly
 * what Chromium does to a page that got shorter than `scrollY + innerHeight`.
 */
const ABOVE = 1000;
const ROW = 100;
const VIEW = 800;

function layOut(side = 0) {
  let offset = 0;
  const region = () => document.querySelector<HTMLElement>(".positions-result");
  const rows = () => document.querySelectorAll(".pos-card").length;
  const regionHeight = () =>
    Math.max(rows() * ROW, Number.parseFloat(region()?.style.minHeight || "0"));
  const page = () => Math.max(side, ABOVE + 100 + regionHeight() + 100);
  const scrollY = () => {
    offset = Math.min(offset, Math.max(0, page() - VIEW));
    return offset;
  };
  const rect = (top: number, height: number) =>
    ({ top, bottom: top + height, height, left: 0, right: 0, width: 0, x: 0, y: top }) as DOMRect;

  Object.defineProperty(window, "innerHeight", { configurable: true, value: VIEW });
  Object.defineProperty(window, "scrollY", { configurable: true, get: scrollY });
  Object.defineProperty(document.documentElement, "scrollHeight", {
    configurable: true,
    get: page,
  });
  const scrollTo = rstest.fn((opts: ScrollToOptions | number) => {
    offset = typeof opts === "number" ? opts : (opts.top ?? offset);
    scrollY();
  });
  window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
  const proto = HTMLElement.prototype;
  const original = proto.getBoundingClientRect;
  proto.getBoundingClientRect = function (this: HTMLElement) {
    if (this.classList.contains("filter-bar")) return rect(ABOVE - scrollY(), 100);
    if (this.classList.contains("positions-result"))
      return rect(ABOVE + 100 - scrollY(), regionHeight());
    return original.call(this);
  };
  return {
    scrollTo,
    /** The member scrolls the page themselves. */
    scrollBy(dy: number) {
      offset = Math.max(0, scrollY() + dy);
      window.dispatchEvent(new Event("scroll"));
    },
    barTop: () => ABOVE - scrollY(),
    region: () => region(),
    restore() {
      proto.getBoundingClientRect = original;
    },
  };
}

function Harness(): ReactElement {
  const [query, setQuery] = useState("");
  return (
    <QueryClientProvider client={new QueryClient()}>
      <PositionsBlotter deskId="d" positions={BOOK} query={query} onFilterChange={setQuery} />
    </QueryClientProvider>
  );
}

describe("a refinement that shrinks the positions list (#5021)", () => {
  let page: ReturnType<typeof layOut>;
  beforeEach(() => {
    page = layOut();
  });
  afterEach(() => {
    cleanup();
    page.restore();
  });

  it("keeps the filter bar where the member tapped it", () => {
    render(<Harness />);
    // The bar 100px from the top of the view, the long list running past the bottom.
    page.scrollBy(ABOVE - 100);
    expect(page.barTop()).toBe(100);

    fireEvent.click(screen.getByRole("button", { name: "Below cost" }));

    expect(document.querySelectorAll(".pos-card")).toHaveLength(3);
    expect(page.barTop(), "the bar stays under the finger").toBe(100);
  });

  it("holds only the height the view needs, never a whole old list", () => {
    render(<Harness />);
    page.scrollBy(ABOVE - 100);
    fireEvent.click(screen.getByRole("button", { name: "Below cost" }));
    // The view ends 700px below the bar's top: 100px of bar, the region, then 100px of page under
    // it. So the region needs 500px to keep the page that long — not the 1,000px ten rows took.
    expect(page.region()?.style.minHeight).toBe("500px");
  });

  it("holds enough even when a taller column beside the list sets the page's height", () => {
    page.restore();
    // The three rows' page would be 1,500px, but the column beside it is 1,600px: a plain
    // shortfall (1,700 − 1,600) would hold 100px too few and the bar would still slip 100px.
    page = layOut(1600);
    render(<Harness />);
    page.scrollBy(ABOVE - 100);
    fireEvent.click(screen.getByRole("button", { name: "Below cost" }));
    expect(page.region()?.style.minHeight).toBe("500px");
    expect(page.barTop()).toBe(100);
  });

  it("leaves the page alone on first render and when the list grows", () => {
    render(<Harness />);
    expect(page.region()?.style.minHeight).toBe("");
    expect(page.scrollTo).not.toHaveBeenCalled();

    page.scrollBy(ABOVE - 100);
    fireEvent.click(screen.getByRole("button", { name: "Below cost" }));
    fireEvent.click(screen.getByRole("button", { name: "All" }));

    expect(document.querySelectorAll(".pos-card")).toHaveLength(10);
    expect(page.region()?.style.minHeight, "a list that fills the view needs no hold").toBe("");
    expect(page.barTop()).toBe(100);
  });

  it("gives the held space back as the member scrolls up, without moving what they see", () => {
    render(<Harness />);
    page.scrollBy(ABOVE - 100);
    fireEvent.click(screen.getByRole("button", { name: "Below cost" }));
    expect(page.region()?.style.minHeight).toBe("500px");

    act(() => page.scrollBy(-150));
    expect(page.region()?.style.minHeight, "the 150px now under the view goes").toBe("350px");
    expect(page.barTop()).toBe(250);

    act(() => page.scrollBy(-300));
    expect(page.region()?.style.minHeight, "once the rows fill it, the hold is gone").toBe("");
    expect(page.barTop()).toBe(550);
  });
});

describe("placeFor", () => {
  const settled = {
    before: 100,
    now: 100,
    scrollY: 900,
    viewport: 800,
    page: 2200,
    regionTop: 200,
  };

  it("asks for nothing when the page can still hold the bar where it was", () => {
    expect(placeFor(settled)).toEqual({ scrollTo: 900, reach: undefined });
  });

  it("scrolls back what the browser clamped, and reaches the region to the view's bottom", () => {
    // Ten rows became three: the page fell to 1,500px and the browser pulled scrollY to 700. Back
    // at 900, the view ends at 1,700; the region starts at 1,100, so it must reach 600px.
    expect(placeFor({ ...settled, now: 300, scrollY: 700, page: 1500, regionTop: 400 })).toEqual({
      scrollTo: 900,
      reach: 600,
    });
  });

  it("follows the bar when content above it went away (the Map lens drops the decision card)", () => {
    expect(placeFor({ ...settled, now: -20 })).toEqual({ scrollTo: 780, reach: undefined });
  });

  it("never scrolls above the top of the page", () => {
    expect(placeFor({ ...settled, before: 600, scrollY: 0, now: 300 }).scrollTo).toBe(0);
  });
});

describe("easeHold", () => {
  it("keeps the hold while nothing sits under the view", () => {
    expect(easeHold(500, 0, 300)).toBe(500);
  });

  it("gives back what the member scrolled up past", () => {
    expect(easeHold(500, 150, 300)).toBe(350);
  });

  it("lets go once the rows fill the view on their own", () => {
    expect(easeHold(350, 300, 300)).toBeUndefined();
  });
});
