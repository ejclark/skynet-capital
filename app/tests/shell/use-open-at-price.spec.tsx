import { fireEvent, render } from "@testing-library/react";
import type { ReactElement } from "react";
import { useRef } from "react";
import { priceRowTop, useOpenAtPrice } from "../../src/shell/use-open-at-price";

/**
 * The folded chain opens at the price row (#5234): once, only when armed, never after the member
 * has scrolled, never without a "Current price" row. Where it lands is layout — the e2e spec
 * (`e2e/trade-chain-open-at-price.spec.ts`) measures that at 390 × 844; this pins the rules.
 */

function Chain({
  armed,
  ready,
  priced = true,
}: {
  readonly armed: boolean;
  readonly ready: boolean;
  readonly priced?: boolean;
}): ReactElement {
  const root = useRef<HTMLElement>(null);
  useOpenAtPrice(root, armed, ready);
  return (
    <section ref={root}>
      {ready && priced ? <div className="straddle-divider">Current price</div> : null}
    </section>
  );
}

describe("priceRowTop", () => {
  it("puts the row's middle on the middle of what the top bar leaves visible", () => {
    // bar ends at 100 in an 844 viewport → visible middle 472; the row's middle is 1000 + 20
    expect(priceRowTop({ top: 1000, height: 40 }, 0, 100, 844)).toBe(548);
    expect(priceRowTop({ top: 1000, height: 40 }, 200, 100, 844)).toBe(748);
  });

  it("never asks for a negative scroll", () => {
    expect(priceRowTop({ top: 50, height: 40 }, 0, 100, 844)).toBe(0);
  });
});

describe("useOpenAtPrice", () => {
  const scrollTo = rstest.fn();
  const realScrollTo = window.scrollTo;
  beforeEach(() => {
    scrollTo.mockReset();
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
  });
  afterEach(() => {
    window.scrollTo = realScrollTo;
  });

  it("scrolls once, instantly, when the rows arrive", () => {
    const view = render(<Chain armed ready={false} />);
    expect(scrollTo).not.toHaveBeenCalled();
    view.rerender(<Chain armed ready />);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo.mock.calls[0]?.[0]).toMatchObject({ behavior: "instant" });
  });

  it("does not re-centre when the rows change after opening (an expiry chip, Refresh)", () => {
    const view = render(<Chain armed ready />);
    view.rerender(<Chain armed ready={false} />);
    view.rerender(<Chain armed ready />);
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it("leaves the page alone when the member scrolled before the rows arrived", () => {
    const view = render(<Chain armed ready={false} />);
    fireEvent.wheel(window);
    view.rerender(<Chain armed ready />);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("ignores keys typed into a field — only a scroll key counts as scrolling", () => {
    const view = render(
      <>
        <input aria-label="symbol" />
        <Chain armed ready={false} />
      </>,
    );
    fireEvent.keyDown(view.getByLabelText("symbol"), { key: " " });
    fireEvent.keyDown(window, { key: "a" });
    view.rerender(
      <>
        <input aria-label="symbol" />
        <Chain armed ready />
      </>,
    );
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it("does not scroll a chain with no current price", () => {
    render(<Chain armed ready priced={false} />);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("does nothing when not armed (docked — the bench owns the scroll)", () => {
    render(<Chain armed={false} ready />);
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
