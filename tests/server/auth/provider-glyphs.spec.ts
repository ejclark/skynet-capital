import { providerGlyph } from "../../../src/server/auth/provider-glyphs.js";

describe("providerGlyph", () => {
  describe("for each provider", () => {
    it("returns self-contained inline svg markup (no external assets)", () => {
      for (const id of ["google", "github"] as const) {
        const glyph = providerGlyph(id);
        expect(glyph.startsWith("<svg")).toBe(true);
        expect(glyph.endsWith("</svg>")).toBe(true);
        expect(glyph).not.toContain("http"); // inline paths only — nothing fetched
      }
    });

    it("is decorative: hidden from assistive tech so the button label carries meaning", () => {
      expect(providerGlyph("google")).toContain('aria-hidden="true"');
      expect(providerGlyph("github")).toContain('aria-hidden="true"');
    });
  });

  describe("for google", () => {
    it("renders the four-color Google brand mark", () => {
      const glyph = providerGlyph("google");
      for (const brandColor of ["#EA4335", "#4285F4", "#FBBC05", "#34A853"]) {
        expect(glyph).toContain(brandColor);
      }
    });
  });

  describe("for github", () => {
    it("renders a monochrome mark that inherits the button's text color", () => {
      const glyph = providerGlyph("github");
      expect(glyph).toContain('fill="currentColor"');
      expect(glyph).not.toContain("#"); // no hard-coded colors — theme decides
    });
  });

  it("gives each provider a distinct glyph", () => {
    expect(providerGlyph("google")).not.toBe(providerGlyph("github"));
  });
});
