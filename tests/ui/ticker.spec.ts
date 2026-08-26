import {
  type RollDirection,
  renderTicker,
  rollDirection,
  TICKER_STYLE,
  type TickerCell,
  type TickerOptions,
  tickerCells,
} from "../../src/ui/ticker.js";

// The ticker is the first thing in this app that animates a number, so the specs guard two things
// that are easy to get wrong and expensive to ship wrong: the DIRECTION convention (an increase must
// roll down, always), and the honesty rules — a count must never tint green, and a digit position
// that did not exist before must never roll in from a fabricated `0`.

/** How many times a marker appears — the cheap way to count rolling cells without a DOM. */
function occurrences(html: string, needle: string): number {
  return html.split(needle).length - 1;
}

const base: TickerOptions = { previous: "1,299", next: "1,300", direction: "down" };

describe("when a value changes", () => {
  it("rolls only the digit positions that actually differ", () => {
    // 1,299 → 1,300 moves three digits. The leading 1 and the comma must sit still, or a one-unit
    // move reads on screen as the whole number detonating.
    const html = renderTicker(base);
    expect(occurrences(html, "tick-strip")).toBe(3);
  });

  it("leaves separators as still cells", () => {
    expect(renderTicker(base)).toContain('<span class="tick-cell">,</span>');
  });

  it("moves nothing when the value is unchanged", () => {
    const html = renderTicker({ previous: "1,300", next: "1,300", direction: "none" });
    expect(occurrences(html, "tick-strip")).toBe(0);
    expect(html).not.toContain("tick-down");
    expect(html).not.toContain("tick-up");
  });
});

describe("when the direction convention is applied", () => {
  it("calls an increase a downward roll and a decrease an upward one", () => {
    const up: RollDirection = rollDirection(1299, 1300);
    const down: RollDirection = rollDirection(1300, 1299);
    expect(up).toBe("down");
    expect(down).toBe("up");
    expect(rollDirection(7, 7)).toBe("none");
  });

  it("puts the direction on the container so one class drives every cell", () => {
    expect(renderTicker(base)).toContain('class="tick tick-down"');
    expect(renderTicker({ previous: "1,300", next: "1,299", direction: "up" })).toContain(
      'class="tick tick-up"',
    );
  });

  it("orders each strip so the RESTING transform lands on the new digit", () => {
    // This is the invariant that makes reduced motion correct by construction: with the animation
    // killed, `.tick-down` rests at translateY(0) (first child) and `.tick-up` at -1em (second
    // child) — either way the reader is left looking at the NEW digit, never a stale one.
    // Rolling down, the NEW digit is the first child (rest = translateY(0))…
    expect(renderTicker({ previous: "2", next: "3", direction: "down" })).toContain(
      '<span class="tick-strip"><span>3</span><span>2</span></span>',
    );
    // …rolling up, it is the second (rest = translateY(-1em)).
    expect(renderTicker({ previous: "8", next: "5", direction: "up" })).toContain(
      '<span class="tick-strip"><span>8</span><span>5</span></span>',
    );
    expect(TICKER_STYLE).toContain(".tick-down .tick-strip{ transform:translateY(0);");
    expect(TICKER_STYLE).toContain(".tick-up .tick-strip{ transform:translateY(-1em);");
  });
});

describe("when the values are diffed into cells", () => {
  it("right-aligns them so a carry rolls the tail, not the whole row", () => {
    const cells = tickerCells("1,299", "1,300");
    expect(cells.map((c) => c.rolls)).toEqual([false, false, true, true, true]);
  });

  it("rolls a brand-new leading position in from EMPTY, never from a fabricated zero", () => {
    // Absence renders as absent — the same rule the rest of the app holds to.
    const first = tickerCells("999", "1,000")[0] as TickerCell;
    expect(first).toEqual({ to: "1", from: "", rolls: true });
  });

  it("never rolls a position where either side is a separator", () => {
    const comma = tickerCells("1,299", "1,300")[1] as TickerCell;
    expect(comma).toEqual({ to: ",", from: ",", rolls: false });
  });
});

describe("when the reader has asked for stillness", () => {
  it("emits flat cells with no strip at all", () => {
    const html = renderTicker({ ...base, reducedMotion: true });
    expect(html).not.toContain("tick-strip");
    expect(html).not.toContain("tick-down");
    expect(html).toContain('<span class="tick-cell">3</span>');
  });

  it("also disables the animation in CSS for the reader who never round-trips the server", () => {
    expect(TICKER_STYLE).toContain("@media (prefers-reduced-motion:reduce)");
    expect(TICKER_STYLE).toContain(".tick-strip{ animation:none; }");
  });
});

describe("when the ticker is coloured", () => {
  it("stays NEUTRAL by default, so a count can never imply a P/L direction", () => {
    const html = renderTicker(base);
    expect(html).not.toContain("tick-gain");
    expect(html).not.toContain("tick-loss");
    expect(html).not.toContain("--pos");
    expect(html).not.toContain("--neg");
  });

  it("reaches market green or red only through the explicit opt-in", () => {
    expect(renderTicker({ ...base, meaning: "market" })).toContain("tick-gain");
    expect(
      renderTicker({ previous: "1,300", next: "1,299", direction: "up", meaning: "market" }),
    ).toContain("tick-loss");
  });

  it("borrows the shared tokens rather than inventing a parallel palette", () => {
    expect(TICKER_STYLE).not.toContain("#");
    expect(TICKER_STYLE).toContain("var(--text)");
  });
});

describe("when text is interpolated", () => {
  it("reads the plain value to a screen reader instead of digit-by-digit", () => {
    expect(renderTicker(base)).toContain('<span class="tick-sr">1,300</span>');
    expect(renderTicker(base)).toContain('<span class="tick-row" aria-hidden="true">');
  });

  it("escapes the label and the value", () => {
    const html = renderTicker({ ...base, label: '<img src=x onerror="y">' });
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img src=x onerror=&quot;y&quot;&gt;");
  });
});
