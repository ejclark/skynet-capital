import { readFileSync } from "node:fs";

/**
 * The phone's cash bar (#5100, `CashSplit` in `app/src/shell/head-vitals.tsx`) is a Labelled
 * split bar (`docs/PATTERNS.md`): its smaller part keeps a 12px minimum, whichever part that is —
 * small marks get size before colour (BRAND), and each part's words carry its pattern as a swatch,
 * so a part drawn 1px wide leaves a swatch pointing at nothing. A 96% cash book is the invested
 * sliver's case; a 99.7% invested book is the cash part's, which drew 1px at 390 before this.
 *
 * The layout itself needs a browser; this is the mechanical half that runs in `npm test`. The DOM
 * half (no cash part at all when there is no cash, `data-no-cash`) is
 * `app/tests/shell/cockpit-head.spec.tsx`.
 */

const css = readFileSync("app/src/styles/profile-head.css", "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);

/** The declarations of the first rule whose selector list is exactly `selector`. */
const rule = (selector: string): string => {
  const at = css.search(new RegExp(`(^|\\})\\s*${selector.replace(/[.[\]]/g, "\\$&")}\\s*\\{`));
  if (at < 0) return "";
  const open = css.indexOf("{", at + 1);
  return css.slice(open + 1, css.indexOf("}", open));
};

describe("the phone's cash bar", () => {
  it("keeps the invested sliver at 12px", () => {
    expect(rule(".head-split .head-cash-in")).toMatch(/min-width:\s*12px/);
  });

  it("keeps the cash part at 12px too, letting the invested part give way for it", () => {
    expect(rule(".head-split .head-cash-idle")).toMatch(/min-width:\s*12px/);
    expect(rule(".head-split .head-cash-in")).toMatch(/flex-shrink:\s*1/);
  });

  it("draws no cash part at all when there is no cash", () => {
    expect(rule(".head-cash-bar[data-no-cash] .head-cash-idle")).toMatch(/display:\s*none/);
  });
});
