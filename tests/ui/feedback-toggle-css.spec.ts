import { readFileSync } from "node:fs";

/**
 * The Feedback section's Active / All switch (#5150, `RecentFeedback` in
 * `app/src/shell/feedback-recent.tsx`) keeps its words at phone width. The shared `Toggle` swaps
 * each label for its initial below 860px (`shell.css`), which turned this switch into "A" / "A";
 * the section opts back into the words the way Settings does (`settings.css`, #3807 slice 3b-1).
 * Its pressed option carries an outline, so the answer never rests on a surface tint alone
 * (BRAND → Accessibility).
 *
 * The layout itself needs a browser (`npm run shoot:feedback` draws the phone frame); this is the
 * mechanical half that runs in `npm test`.
 */

const css = readFileSync("app/src/styles/feedback.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/** The declarations of the first rule whose selector list is exactly `selector`. */
const rule = (selector: string): string => {
  const at = css.search(new RegExp(`(^|\\})\\s*${selector.replace(/[.[\]]/g, "\\$&")}\\s*\\{`));
  if (at < 0) return "";
  const open = css.indexOf("{", at + 1);
  return css.slice(open + 1, css.indexOf("}", open));
};

describe("the Feedback section's Active / All switch", () => {
  it("shows the full words at every width", () => {
    expect(rule(".fb-recent-head .toggle-group .toggle-text")).toMatch(/display:\s*inline/);
  });

  it("never shows the one-letter abbreviation", () => {
    expect(rule(".fb-recent-head .toggle-abbr")).toMatch(/display:\s*none/);
  });

  it("outlines the pressed option, so the pressed state is a shape and not only a tint", () => {
    expect(rule('.fb-recent-head .toggle-group button[aria-pressed="true"]')).toMatch(
      /inset 0 0 0 1\.5px var\(--text\)/,
    );
  });
});
