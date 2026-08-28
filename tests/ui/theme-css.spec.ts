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
