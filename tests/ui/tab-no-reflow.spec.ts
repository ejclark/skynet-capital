import { readFileSync } from "node:fs";

/**
 * The profile's tabs stay put when one is selected (#4946). EARS: WHEN a member switches profile
 * sections, the x-position of every other tab SHALL stay unchanged. A heavier font weight on the
 * current tab widens its label and pushes every sibling after it, so the current state must keep
 * the resting weight and read bolder through `text-shadow` instead — the pattern
 * `stage-controls.css` settled for the rail. No DOM layout here, so this asserts the rule in the
 * source it lives in, the way `page-sections.spec.ts` does.
 */

const css = readFileSync("app/src/styles/cockpit.css", "utf8");

/** The declarations of the first rule whose selector is exactly `selector`. */
function block(selector: string): string {
  const at = css.indexOf(`${selector} {`);
  if (at < 0) throw new Error(`${selector} not found in cockpit.css`);
  return css.slice(at, css.indexOf("}", at));
}
const weight = (decls: string) => decls.match(/font-weight:\s*(\d+)/)?.[1];

describe("profile tabs do not reflow on selection (#4946)", () => {
  for (const [rest, current] of [
    [".cockpit-nav-btn", '.cockpit-nav-btn[aria-pressed="true"]'],
    [".acct-switch a", '.acct-switch a[aria-current="page"]'],
  ] as const) {
    it(`${current} keeps ${rest}'s font weight`, () => {
      expect(weight(block(rest))).toBe("500");
      expect(weight(block(current)) ?? "500").toBe(weight(block(rest)));
    });

    it(`${current} reads bolder through text-shadow, not glyph metrics`, () => {
      expect(block(current)).toMatch(/text-shadow:\s*0 0 0\.35px currentColor/);
    });

    it(`${current} still marks the tab by shape, not hue alone`, () => {
      expect(block(current)).toMatch(/border-bottom-color:\s*var\(--accent\)/);
    });
  }
});
