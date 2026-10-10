import { render } from "@testing-library/react";
import { type ReactElement, useRef } from "react";
import {
  type ComparePlace,
  returnScroll,
  revealScroll,
  useComparePlace,
} from "../../src/shell/compare-place";

/**
 * The Leaderboard's compare moves the view once, to the result, and Clear brings it back (#5057,
 * Eric's pick on #5037 question 8 — "Keep your place; scroll the result in"). Before it, every
 * Compare tap scrolled to the top, and on a phone the top showed neither the rows to pick from nor
 * the head-to-head (its top sat ~780–950px down an 844px screen).
 */

describe("where the view goes", () => {
  it("puts the result's heading just under the sticky top bar", () => {
    // Heading 900px down the viewport, already scrolled 300, a 133px phone top bar.
    expect(revealScroll(900, 300, 133)).toBe(300 + 900 - 133 - 12);
  });

  it("never asks for a scroll above the top of the page", () => {
    expect(revealScroll(40, 0, 133)).toBe(0);
  });

  it("puts a row back where it sat on screen when it was tapped", () => {
    // Tapped at 400 down the viewport; the head-to-head above it has gone, so it now reads 1000.
    const place = { key: "eric", top: 400, scrollY: 1200 };
    expect(returnScroll(place, 1000, 1500)).toBe(1500 + 1000 - 400);
  });

  it("falls back to the old scroll when the row has left the board", () => {
    expect(returnScroll({ key: "gone", top: 400, scrollY: 1200 }, undefined, 0)).toBe(1200);
  });
});

/** A sticky top bar, the head-to-head's heading while `shown`, and one row of the Field. */
function Board({
  shown,
  out,
  rowTop,
}: {
  readonly shown: boolean;
  readonly out: { place?: ComparePlace };
  readonly rowTop: () => number;
}): ReactElement {
  const heading = useRef<HTMLHeadingElement | null>(null);
  out.place = useComparePlace(shown, heading);
  const rect = (top: number) => ({ top, bottom: top + 20 }) as DOMRect;
  return (
    <div>
      <header
        className="topbar"
        ref={(el) => {
          if (el) el.getBoundingClientRect = () => ({ top: 0, bottom: 133 }) as DOMRect;
        }}
      />
      {shown ? (
        <h2
          tabIndex={-1}
          ref={(el) => {
            if (el) el.getBoundingClientRect = () => rect(900);
            heading.current = el;
          }}
        >
          Head to head
        </h2>
      ) : null}
      <ul>
        <li
          className="rank-row"
          data-row="eric"
          ref={(el) => {
            if (el) el.getBoundingClientRect = () => rect(rowTop());
          }}
        >
          Eric
        </li>
      </ul>
    </div>
  );
}

function stillDevice(): () => void {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: query.includes("prefers-reduced-motion: reduce"),
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  });
  return () => Reflect.deleteProperty(window, "matchMedia");
}

describe("useComparePlace", () => {
  const scrollTo = rstest.fn();
  const realScrollTo = window.scrollTo;
  beforeEach(() => {
    scrollTo.mockReset();
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
  });
  afterEach(() => {
    window.scrollTo = realScrollTo;
  });

  const row = () => document.querySelector<HTMLElement>('[data-row="eric"]');

  it("brings a pair completed by a tap into view, and moves focus to its heading", () => {
    const out: { place?: ComparePlace } = {};
    const view = render(<Board shown={false} out={out} rowTop={() => 400} />);
    out.place?.tapped("eric", row(), true);
    view.rerender(<Board shown out={out} rowTop={() => 400} />);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ top: 900 - 133 - 12, behavior: "smooth" });
    expect(document.activeElement?.textContent).toBe("Head to head");
  });

  it("jumps instead of animating when the device asks for reduced motion", () => {
    const restore = stillDevice();
    try {
      const out: { place?: ComparePlace } = {};
      const view = render(<Board shown={false} out={out} rowTop={() => 400} />);
      out.place?.tapped("eric", row(), true);
      view.rerender(<Board shown out={out} rowTop={() => 400} />);
      expect(scrollTo).toHaveBeenCalledWith({ top: 900 - 133 - 12, behavior: "instant" });
    } finally {
      restore();
    }
  });

  it("leaves a pair that arrived by link where the page opened", () => {
    const out: { place?: ComparePlace } = {};
    const view = render(<Board shown={false} out={out} rowTop={() => 400} />);
    view.rerender(<Board shown out={out} rowTop={() => 400} />);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("does not move the page for the first pick", () => {
    const out: { place?: ComparePlace } = {};
    const view = render(<Board shown={false} out={out} rowTop={() => 400} />);
    out.place?.tapped("eric", row(), false);
    view.rerender(<Board shown={false} out={out} rowTop={() => 400} />);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("Clear puts the row you paired from back where it sat on screen", () => {
    let top = 400;
    const out: { place?: ComparePlace } = {};
    const view = render(<Board shown={false} out={out} rowTop={() => top} />);
    out.place?.tapped("eric", row(), true);
    view.rerender(<Board shown out={out} rowTop={() => top} />);
    scrollTo.mockReset();

    // The head-to-head above the Field goes, and the row now reads 1000 down the viewport.
    out.place?.cleared();
    top = 1000;
    view.rerender(<Board shown={false} out={out} rowTop={() => top} />);
    expect(scrollTo).toHaveBeenCalledWith({
      top: window.scrollY + 1000 - 400,
      behavior: "instant",
    });
  });

  it("holds a row still when its own toggle ends the pair above it", () => {
    let top = 300;
    const out: { place?: ComparePlace } = {};
    const view = render(<Board shown out={out} rowTop={() => top} />);
    out.place?.tapped("eric", row(), false);
    top = 900;
    view.rerender(<Board shown={false} out={out} rowTop={() => top} />);
    expect(scrollTo).toHaveBeenCalledWith({ top: window.scrollY + 900 - 300, behavior: "instant" });
  });
});
