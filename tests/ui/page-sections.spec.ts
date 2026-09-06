import { readFileSync } from "node:fs";
import { type PageSection, resolveSection } from "../../app/src/shell/sections";

/**
 * The rail's section switch (#1740) — the wargame's answer to "should tabs be the shell's third
 * navigation dimension": no, a section is the rail's existing control role, one mechanism shared by
 * every page that has sections. EXCLUSIVE AT EVERY WIDTH (2026-09-06 — Eric, on the "beside" shape:
 * "sections are always visible... the whole page just feels like a hot mess"): the pressed section
 * is the only one rendered, matching Settings; there is no longer a "primary + beside" split. Two
 * halves are checked: the pure resolve logic, and — the way `desk-rail-settings.spec.ts` asserts a
 * gate it has no DOM for — that the doctrine and the shape difference are actually present in the
 * source they are claimed to live in.
 */

const SECTIONS: readonly PageSection<"feed" | "pnl" | "pulse">[] = [
  { id: "feed", label: "Trading activity" },
  { id: "pnl", label: "Booked P&L" },
  { id: "pulse", label: "Feedback pulse" },
];

const read = (path: string) => readFileSync(path, "utf8");

describe("page sections", () => {
  describe("resolveSection", () => {
    it("returns the section a URL asks for", () => {
      expect(resolveSection(SECTIONS, "pnl")).toBe("pnl");
      expect(resolveSection(SECTIONS, "pulse")).toBe("pulse");
    });

    it("falls back to the first section when nothing is asked for", () => {
      expect(resolveSection(SECTIONS, undefined)).toBe("feed");
    });

    it("falls back rather than stranding a member on a blank stage", () => {
      expect(resolveSection(SECTIONS, "does-not-exist")).toBe("feed");
      expect(resolveSection(SECTIONS, "")).toBe("feed");
    });

    it("resolves against the sections this viewer can see, not the full list", () => {
      const visible = SECTIONS.filter((s) => s.id !== "pulse");
      expect(resolveSection(visible, "pulse")).toBe("feed");
    });
  });

  describe("the rule the shell carries", () => {
    const frame = read("app/src/shell/frame.tsx");

    it("names the three words in the frame's doctrine", () => {
      expect(frame).toContain("a KIND is a filter over ONE list");
      expect(frame).toContain("a SECTION is a different SHAPE of data on the same page");
      expect(frame).toContain("a SUB-VIEW is a full view of its own");
    });

    it("says a section switch is the rail's control role, not a new dimension", () => {
      expect(frame).toContain("never a new dimension");
    });
  });

  describe("one mechanism, not two", () => {
    it("gives Settings and Activity the same switch component", () => {
      expect(read("app/src/shell/settings-toc.tsx")).toContain("SectionSwitch");
      expect(read("app/src/routes/activity.tsx")).toContain("SectionSwitch");
    });

    it("keeps Activity's filter chips tied to the section they filter", () => {
      expect(read("app/src/routes/activity.tsx")).toContain('{section === "feed" ? (');
    });

    it("builds no tab strip — no page introduces tab roles", () => {
      for (const path of ["app/src/routes/activity.tsx", "app/src/shell/section-switch.tsx"]) {
        expect(read(path)).not.toMatch(/role="tab(list)?"/);
      }
    });
  });

  describe("the shape difference (docs/BRAND.md → Accessibility)", () => {
    const rail = read("app/src/styles/rail.css");

    it("marks the current section with a bar, not hue alone", () => {
      expect(rail).toMatch(/\.railctl-section\[aria-pressed="true"\]\s*\{[^}]*inset 3px 0 0 0/);
    });

    it("moves the bar underneath where the rail is a horizontal row", () => {
      expect(rail).toMatch(/inset 0 -3px 0 0 var\(--accent\)/);
    });

    it("keeps the group divider visible on a phone, where the labels are hidden", () => {
      expect(rail).toMatch(/\.rail hr\s*\{[^}]*border-left: 1px solid var\(--border\)/);
    });
  });

  describe("exclusive at every width, not just the phone", () => {
    it("renders the pressed section alone — no primary-plus-beside split remains", () => {
      const activity = read("app/src/routes/activity.tsx");
      expect(activity).not.toContain("wire-side-col");
      expect(activity).not.toContain("wire-primary-col");
      expect(activity).not.toContain("orderSections");
    });

    it("caps a lone section at a reading width instead of stretching it edge to edge", () => {
      expect(read("app/src/styles/wire.css")).toMatch(
        /\.wire-panel\s*\{[^}]*max-width: var\(--col-read\)/,
      );
    });
  });

  describe("sections are URL-stateful", () => {
    it("validates a section param on both pages that have sections", () => {
      expect(read("app/src/routes/activity.tsx")).toContain("search.section");
      expect(read("app/src/routes/settings.tsx")).toContain("search.section");
    });
  });
});
