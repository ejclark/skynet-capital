import { readFileSync } from "node:fs";
import { TOKEN_DECLS, TOKEN_HEX } from "../../src/ui/tokens.js";

/** `docs/BRAND.md` is the human-readable contract for the palette; `src/ui/tokens.ts` is its
 *  machine-readable twin. These specs hold the two together, so a hex changed in one place and not
 *  the other fails the build instead of shipping a drifted colour. */
const BRAND = readFileSync(new URL("../../docs/BRAND.md", import.meta.url), "utf8");

/** The dark column of BRAND.md's token table: `| \`--bg\` | \`#0B0F14\` | ... |`. */
function brandDarkTokens(): Map<string, string> {
  const rows = BRAND.matchAll(/^\|\s*`(--[a-z0-9-]+)`\s*\|\s*`(#[0-9A-Fa-f]{6})`\s*\|/gm);
  return new Map([...rows].map((m) => [m[1] as string, (m[2] as string).toUpperCase()]));
}

describe("when the brand palette is read from docs/BRAND.md", () => {
  it("finds the nine documented colour tokens", () => {
    expect(brandDarkTokens().size).toBe(9);
  });

  it("defines every one of them in TOKEN_DECLS with the documented dark value", () => {
    for (const [name, hex] of brandDarkTokens()) {
      expect(TOKEN_DECLS).toContain(`${name}:${hex}`);
    }
  });

  it("exposes the same values on TOKEN_HEX for non-CSS consumers", () => {
    const documented = [...brandDarkTokens().values()].sort();
    const exported = Object.values(TOKEN_HEX)
      .map((v) => v.toUpperCase())
      .sort();
    expect(exported).toEqual(documented);
  });
});

describe("when TOKEN_DECLS is dropped into a selector", () => {
  it("emits declarations only, so a caller can add its own rules alongside", () => {
    expect(TOKEN_DECLS).not.toContain("{");
    expect(TOKEN_DECLS).not.toContain("}");
    expect(TOKEN_DECLS.trimEnd().endsWith(";")).toBe(true);
  });

  it("carries the two type stacks the pages rely on", () => {
    expect(TOKEN_DECLS).toContain("--mono:");
    expect(TOKEN_DECLS).toContain("--sans:");
  });

  it("fetches no webfonts, which is what keeps every page CSP-safe", () => {
    expect(TOKEN_DECLS).not.toContain("http");
    expect(TOKEN_DECLS).not.toContain("url(");
  });
});
