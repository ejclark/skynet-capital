import { readFileSync } from "node:fs";

/**
 * WCAG contrast, held mechanically (Eric, 2026-09-06, on the research rail: "I have mild red/green
 * colorblindness. Higher contrast colors make it easier… UX/accessibility audits would fail the
 * contrast ratio especially in dark mode"). This spec reads BOTH palettes out of theme.css and
 * asserts the pairs the shell actually paints: AA 4.5:1 for text, 3:1 for non-text UI. A token
 * that drifts under the line fails the build instead of shipping a frame someone cannot read.
 * Hue-only meaning is a design rule (docs/BRAND.md → Accessibility) a ratio cannot check.
 */
const THEME = readFileSync(new URL("../../app/src/styles/theme.css", import.meta.url), "utf8");

function palette(block: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of block.matchAll(/(--[a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    if (!out.has(m[1] as string)) out.set(m[1] as string, (m[2] as string).toLowerCase());
  }
  return out;
}

/** The dark palette is the bare :root; the light one is the first `prefers-color-scheme: light` block. */
const dark = palette(THEME.slice(0, THEME.indexOf("@media (prefers-color-scheme: light)")));
const lightStart = THEME.indexOf("@media (prefers-color-scheme: light)");
const light = palette(THEME.slice(lightStart, THEME.indexOf("}\n}", lightStart)));

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const TEXT_PAIRS: readonly [string, string][] = [
  ["--text", "--surface"],
  ["--text", "--bg"],
  ["--muted", "--surface"],
  ["--muted", "--bg"],
  ["--accent-contrast", "--accent"], // a pinned day, a pressed lens, any accent-filled control
];
const UI_PAIRS: readonly [string, string][] = [
  ["--accent", "--surface"],
  ["--pos", "--surface"],
  ["--neg", "--surface"],
];

for (const [name, tokens] of [
  ["dark", dark],
  ["light", light],
] as const) {
  describe(`the ${name} palette`, () => {
    it("defines every token the pairs read", () => {
      for (const [a, b] of [...TEXT_PAIRS, ...UI_PAIRS]) {
        expect(tokens.get(a), a).toBeDefined();
        expect(tokens.get(b), b).toBeDefined();
      }
    });

    it.each(TEXT_PAIRS)("reads %s on %s at AA text contrast (4.5:1)", (fg, bg) => {
      expect(contrast(tokens.get(fg) as string, tokens.get(bg) as string)).toBeGreaterThanOrEqual(
        4.5,
      );
    });

    it.each(UI_PAIRS)("reads %s on %s at AA non-text contrast (3:1)", (fg, bg) => {
      expect(contrast(tokens.get(fg) as string, tokens.get(bg) as string)).toBeGreaterThanOrEqual(
        3,
      );
    });
  });
}

describe("contrast()", () => {
  it("returns 21 for black on white and 1 for a colour on itself", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrast("#35d0ba", "#35d0ba")).toBe(1);
  });
});
