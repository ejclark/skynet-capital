import { readFileSync } from "node:fs";

/**
 * Campaign's Trade window segments (#7487 slice 6 review): `.mctl-seg` clips its buttons to its
 * rounded corners, so the page's outside focus ring (2px offset, shell.css) would be cut to a
 * sliver the same colour as the pressed ring. Focus must draw inside the button, far enough in to
 * leave a gap from the pressed state's 2px inset ring, so focus and "selected" differ by shape.
 */

const css = readFileSync("app/src/styles/mission.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/** The declarations of the rule whose selector list is exactly `selector`. */
const rule = (selector: string): string => {
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sels = (m[1] ?? "").split(",").map((s) => s.trim());
    if (sels.includes(selector)) return m[2] ?? "";
  }
  return "";
};

const px = (decls: string, prop: string): number | undefined => {
  const m = new RegExp(`(?:^|;|\\s)${prop}:\\s*(-?\\d+(?:\\.\\d+)?)px`).exec(decls);
  return m ? Number(m[1]) : undefined;
};

describe("Trade window segment focus", () => {
  it("draws a segment button's focus ring inside the clipped segment", () => {
    const seg = rule(".mctl-seg");
    const focus = rule(".mctl-seg-btn:focus-visible");
    if (/overflow:\s*hidden/.test(seg)) {
      const offset = px(focus, "outline-offset");
      expect(offset).toBeDefined();
      // Inside the button, and clear of the pressed ring's 2px band (ring width 2 + gap 2).
      expect(offset ?? 0).toBeLessThanOrEqual(-6);
    }
    expect(focus).toMatch(/outline:\s*2px solid var\(--focus\)/);
  });

  it("keeps the pressed state an inset ring, so focus never shares its band", () => {
    expect(rule('.mctl-seg-btn[aria-pressed="true"]')).toMatch(
      /box-shadow:\s*inset 0 0 0 2px var\(--accent\)/,
    );
  });

  it("dims a stepper end held by aria-disabled, as it would a disabled one", () => {
    expect(rule('.mctl-seg-btn[aria-disabled="true"]')).toMatch(/cursor:\s*not-allowed/);
  });
});
