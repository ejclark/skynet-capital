import { describe, expect, it } from "@rstest/core";
import { RS_STYLE } from "../../src/observatory/research-style.js";

// The research surface's stylesheet carries three invariants this repo has already been bitten by.
// They are asserted here, at the sheet itself, so they survive any future re-layout of the view.

describe("RS_STYLE — the shelf header", () => {
  it("gives the calendar a real column beside the tiles", () => {
    expect(RS_STYLE).toContain(".rs-head{");
    expect(RS_STYLE).toContain("grid-template-columns:clamp(260px,26vw,320px)");
  });

  it("collapses the header to one column rather than dropping anything from it", () => {
    // The 2026-08-26 regression: a container query hid the calendar outright at narrow widths, so
    // it vanished on a phone in desktop mode. Narrow now means STACKED, never hidden.
    expect(RS_STYLE).toContain("@container stage (max-width:700px)");
    // Nothing in the header may be taken out of the document at any width. (The one legitimate
    // display:none in this sheet hides the native <details> marker, which is not a layout drop.)
    for (const rule of RS_STYLE.split("}")) {
      if (/\.rs-head|\.rs-tiles|\.mg\b/.test(rule)) expect(rule).not.toMatch(/display:\s*none/);
    }
  });

  it("keeps the symbol count as a chip on its own heading, not a header tile", () => {
    expect(RS_STYLE).toContain(".rs-headcount{");
  });
});

describe("RS_STYLE — the reading surfaces", () => {
  it("lets the decision header out-specify the prose reading cap", () => {
    // Both classes sit on the same element; the five-column call sheet needs more than 80ch.
    expect(RS_STYLE).toContain(".rs-glance.md-doc{ max-width:none; }");
    expect(RS_STYLE).toContain(".md-doc{");
  });

  it("styles the reader-side folds that keep a ledger off its method wall", () => {
    expect(RS_STYLE).toContain(".rs-fold{");
    expect(RS_STYLE).toContain(".rs-foldsize{");
  });

  it("never colours a call with the market's own semantics", () => {
    // docs/BRAND.md reserves --pos/--neg for P/L direction; a stance is not a direction.
    expect(RS_STYLE).not.toContain("var(--pos)");
    expect(RS_STYLE).not.toContain("var(--neg)");
  });
});
