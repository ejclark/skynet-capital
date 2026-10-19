import { axisDollars, MINUS, percentTone, signedPercent, signOf, withMinus } from "../../src/ui";

/**
 * The number shapes every member screen shares (#5204). WHEN a loss, drawdown or negative change is
 * shown, THE number SHALL carry a real minus (U+2212), never a hyphen; WHEN a chart axis shows
 * dollars, THE ticks SHALL carry '$' and thousands separators. Precision stays each call site's
 * today (the consistency round picks one), so the shapes take it as an argument.
 */

describe("MINUS", () => {
  it("is the real minus sign, not a hyphen", () => {
    expect(MINUS).toBe("−");
    expect(MINUS).not.toBe("-");
  });
});

describe("withMinus", () => {
  it("rewrites a server figure's leading hyphen as a real minus", () => {
    expect(withMinus("-$412")).toBe(`${MINUS}$412`);
    expect(withMinus("-3.2%")).toBe(`${MINUS}3.2%`);
  });

  it("leaves a gain, a dash and an inner hyphen alone", () => {
    expect(withMinus("+$412")).toBe("+$412");
    expect(withMinus("—")).toBe("—");
    expect(withMinus("Sep 1-2")).toBe("Sep 1-2");
  });
});

describe("signOf", () => {
  it("leads a gain with a plus, a loss with a real minus, and zero with nothing", () => {
    expect(signOf(5)).toBe("+");
    expect(signOf(-5)).toBe(MINUS);
    expect(signOf(0)).toBe("");
  });
});

describe("signedPercent", () => {
  it("writes a gain and a loss with a written sign at the precision asked for", () => {
    expect(signedPercent(3.5, 1)).toBe("+3.5%");
    expect(signedPercent(-0.75, 2)).toBe(`${MINUS}0.75%`);
    expect(signedPercent(-12.345, 1)).toBe(`${MINUS}12.3%`);
  });

  it("never prints a hyphen for a loss", () => {
    expect(signedPercent(-0.8, 1)).not.toContain("-");
  });

  it("writes zero, and a move that rounds to zero, unsigned — '+0.0%' would claim a gain", () => {
    expect(signedPercent(0, 1)).toBe("0.0%");
    expect(signedPercent(-0.01, 1)).toBe("0.0%");
    expect(signedPercent(0.004, 2)).toBe("0.00%");
  });
});

describe("percentTone", () => {
  it("tones the figure signedPercent prints, so a move that reads '0.0%' is flat, not a loss", () => {
    expect(percentTone(-0.04, 1)).toBe("flat");
    expect(percentTone(0.04, 1)).toBe("flat");
    expect(percentTone(0, 1)).toBe("flat");
    expect(percentTone(-1.2, 1)).toBe("neg");
    expect(percentTone(3.5, 1)).toBe("pos");
  });
});

describe("axisDollars", () => {
  it("writes an equity tick in whole dollars with $ and thousands commas", () => {
    expect(axisDollars(1_007_500)).toBe("$1,007,500");
    expect(axisDollars(99_999.6)).toBe("$100,000");
    expect(axisDollars(0)).toBe("$0");
  });

  it("puts a real minus ahead of the dollar sign below zero", () => {
    expect(axisDollars(-1_200)).toBe(`${MINUS}$1,200`);
  });
});
