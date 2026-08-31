import { readFileSync } from "node:fs";
import { TOKEN_HEX } from "../../src/ui/tokens.js";

/**
 * The React shell's theme (`app/src/styles/theme.css`) is held to `docs/BRAND.md`'s color table
 * the same way `src/ui/tokens.ts` is: both palettes, verbatim. The dark column must match the
 * machine-readable tokens exactly (one palette, two carriers, zero drift), and the light column —
 * implemented for the first time by this file (#738 phase 1) — must match BRAND.md's documented
 * light values.
 */

const themeCss = readFileSync("app/src/styles/theme.css", "utf8").toLowerCase();
const boardCss = readFileSync("app/src/styles/board.css", "utf8").toLowerCase();

/** sRGB relative luminance (WCAG 2.x) — 0 is black, 1 is white. */
const luminance = (hex: string): number => {
  const [r, g, b] = (hex.replace("#", "").match(/../g) ?? []).map((pair) => {
    const channel = Number.parseInt(pair, 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const rampValues = (token: "hi" | "lo"): readonly string[] =>
  [...themeCss.matchAll(new RegExp(`--ramp-${token}:\\s*(#[0-9a-f]{6})`, "g"))].map(
    (m) => m[1] as string,
  );

/** docs/BRAND.md — the light column, verbatim. */
const LIGHT_HEX = {
  bg: "#f7f9fb",
  surface: "#ffffff",
  surfaceRecessed: "#f0f4f8",
  border: "#dce3ea",
  text: "#0b0f14",
  muted: "#5a6b7b",
  accent: "#0e9f8c",
  pos: "#1a7f37",
  neg: "#cf222e",
} as const;

describe("app theme css", () => {
  it("carries every dark token from src/ui/tokens.ts verbatim", () => {
    for (const [name, hex] of Object.entries(TOKEN_HEX)) {
      expect(themeCss, `dark ${name} ${hex}`).toContain(hex.toLowerCase());
    }
  });

  it("carries every light value from docs/BRAND.md's light column", () => {
    for (const [name, hex] of Object.entries(LIGHT_HEX)) {
      expect(themeCss, `light ${name} ${hex}`).toContain(hex.toLowerCase());
    }
  });

  it("is dark-first: bare :root is the dark ground, light is the override", () => {
    const rootBlock = themeCss.slice(themeCss.indexOf(":root {"), themeCss.indexOf("}"));
    expect(rootBlock).toContain("--bg: #0b0f14");
    expect(themeCss).toContain('[data-theme="light"]');
    expect(themeCss).toContain(':root:not([data-theme="dark"])');
  });

  /**
   * The field ladder's green ramp (#1043 — "all chart greens are too light; darken the darkest").
   * The member's two acceptance criteria are structural, so they are held structurally rather than
   * by pinning hexes that a later taste round would only have to unpin: the darkest end must sit
   * in forest-green territory, and every other shade must still be *derived* from it — which is
   * what makes "proportionally lighter" true by construction instead of by inspection.
   */
  describe("the field ladder's green ramp", () => {
    const darkHi = rampValues("hi")[0] as string;
    const lightHi = rampValues("hi").slice(1);

    it("anchors on a forest green — dark enough to read as one, in the green band", () => {
      for (const hex of rampValues("hi")) {
        // #1e8348 (the pre-#1043 dark anchor) sits at 0.17; a forest/hunter green clears 0.15.
        expect(luminance(hex), `--ramp-hi ${hex} luminance`).toBeLessThanOrEqual(0.15);
        const [r, g, b] = (hex.replace("#", "").match(/../g) ?? []).map((p) =>
          Number.parseInt(p, 16),
        ) as [number, number, number];
        expect(g, `--ramp-hi ${hex} is green-dominant`).toBeGreaterThan(Math.max(r, b));
      }
    });

    it("keeps the tail proportionally lighter than the anchor in both columns", () => {
      const [darkLo, ...lightLo] = rampValues("lo");
      expect(luminance(darkLo as string)).toBeGreaterThan(luminance(darkHi));
      for (const [index, lo] of lightLo.entries()) {
        expect(luminance(lo), `light ramp-lo ${lo}`).toBeGreaterThan(
          luminance(lightHi[index] as string),
        );
      }
    });

    it("keeps the dark column's anchor above the 3:1 line where it paints the leader's value", () => {
      // .rank-val is the ramp color as TEXT on the recessed surface, so the dark column's floor is
      // a contrast one, not a taste one — deeper than this and the leader's number goes muddy.
      const recessed = luminance("#0f151c");
      const ratio = (recessed + 0.05) / (luminance(darkHi) + 0.05);
      expect(1 / ratio, `dark --ramp-hi ${darkHi} vs --surface-2`).toBeGreaterThanOrEqual(3);
    });

    it("moves the light column's two copies together", () => {
      expect(new Set(lightHi).size, "light --ramp-hi declared twice, one value").toBe(1);
    });

    it("derives every row from the two ends, so no shade is hard-coded", () => {
      for (const rule of ["background", "color"]) {
        expect(boardCss).toContain(
          `${rule}: color-mix(in oklab, var(--ramp-hi) var(--g, 100%), var(--ramp-lo))`,
        );
      }
    });
  });

  it("defines the five-level elevation ladder and the density seam", () => {
    for (const level of [
      "--elev-recessed",
      "--elev-base",
      "--elev-raised",
      "--elev-overlay",
      "--elev-sheet",
    ]) {
      expect(themeCss).toContain(level);
    }
    expect(themeCss).toContain('[data-density="compact"]');
  });
});
