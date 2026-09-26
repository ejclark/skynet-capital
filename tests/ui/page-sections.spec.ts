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

    it("says a section switch is the controls row's control role, not a new dimension", () => {
      expect(frame).toContain("A section switch is the controls row's CONTROL role");
      expect(frame).toContain("never a new dimension");
    });

    // The rail left the frame (#3807 slice 2a, docs/IA.md §8.1): two dimensions, a page's controls
    // as a row of its own stage, constant geometry by construction — each with its falsifier.
    it("names two dimensions — the topbar and the stage — and the controls row", () => {
      expect(frame).toContain(
        "TWO\n * DIMENSIONS — the TOPBAR is the app-level navigation dimension and the STAGE is the page",
      );
      expect(frame).toContain("a view's controls are a row of its own stage");
      expect(frame).toContain('className="stage-controls"');
      expect(frame).not.toContain('className="rail');
    });

    it("holds constant geometry by construction, with Settings as the flagged exception", () => {
      expect(frame).toContain("every non-Settings stage is FULL WIDTH");
      expect(frame).toContain(
        "reverses the 2026-08-28\n * constant-geometry call for this transition only (#784's revisit clause, 2026-08-29",
      );
      expect(frame).toContain(
        "the stage's left edge and width identical on /accounts, /activity, /research, /trade, /u/:id",
      );
    });

    it("keeps the calendar head's line and its falsifier (#3807 slice 2·1)", () => {
      expect(frame).toContain("AN INSTRUMENT'S HEAD IS A ROW OF THE PAGE'S OWN IDENTITY");
      expect(frame).toContain("second topbar");
    });

    it("names the bench as a composition of sections that folds, never a fourth word (#3407)", () => {
      expect(frame).toContain("a BENCH is several SECTIONS");
      expect(frame).toContain("FOLDED to ordinary exclusive sections below it");
      expect(frame).toContain("The section switch renders only when");
      expect(frame).toContain("falsifier");
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
      for (const path of [
        "app/src/routes/activity.tsx",
        "app/src/routes/trade.tsx",
        "app/src/shell/section-switch.tsx",
      ]) {
        expect(read(path)).not.toMatch(/role="tab(list)?"/);
      }
    });
  });

  describe("the shape difference (docs/BRAND.md → Accessibility)", () => {
    const row = read("app/src/styles/stage-controls.css");

    it("marks the current section with a bar underneath in the controls row, not hue alone", () => {
      expect(row).toMatch(
        /\.railctl-section\[aria-pressed="true"\]\s*\{[^}]*inset 0 -3px 0 0 var\(--accent\)/,
      );
    });

    it("moves the bar to the left only in Settings' column", () => {
      expect(row).toMatch(
        /\.settings-list \.railctl-section\[aria-pressed="true"\]\s*\{[^}]*inset 3px 0 0 0/,
      );
    });

    it("keeps the group divider visible in the row, where the labels are hidden", () => {
      expect(row).toMatch(/\.settings-list hr\s*\{[^}]*border-left: 1px solid var\(--border\)/);
      expect(row).toMatch(
        /\.stage-controls \.rail-label,\s*\.settings-list \.rail-label\s*\{\s*display: none/,
      );
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
    it("validates a section param on every page that has sections", () => {
      for (const path of [
        "app/src/routes/activity.tsx",
        "app/src/routes/settings.tsx",
        "app/src/routes/trade.tsx",
      ]) {
        expect(read(path)).toContain("search.section");
      }
    });

    it("gives Trade the same switch component — the bench folds to it (#3407)", () => {
      expect(read("app/src/routes/trade.tsx")).toContain("SectionSwitch");
    });

    it("docks Trade's sections at one bench width and hides the switch there (#3407 slice 4b)", () => {
      const trade = read("app/src/routes/trade.tsx");
      // one breakpoint, owned by the hook — never a second media query in the route
      expect(trade).toContain("useBenchWidth");
      expect(read("app/src/shell/use-bench-width.ts")).toContain("BENCH_MIN_WIDTH = 1280");
      // the switch renders only when folded (frame.tsx's doctrine) — as the stage's controls row
      // since the rail left the frame (#3807 slice 2a); docked there is no row, and the guidance
      // link (#3729 — the one pane with no other way in) rides beside the milestone strip instead
      expect(trade).toMatch(/controls=\{\s*docked \? undefined : \(\s*<SectionSwitch/);
      const docked = /const guidanceLink = docked \? \(([\s\S]*?)\) : null;/.exec(trade);
      expect(docked).not.toBeNull();
      expect(docked?.[1]).toContain("Guidance for this stock");
      expect(docked?.[1]).not.toContain("SectionSwitch");
      // the docked grid is a stylesheet of its own, imported by the index
      expect(read("app/src/styles/index.css")).toContain("./bench.css");
    });
  });
});
