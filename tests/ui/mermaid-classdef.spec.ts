import { readFileSync } from "node:fs";
import { contrast } from "../support/contrast.js";

// The sanctioned ways to put colour in a Mermaid diagram (docs/PICTURES.md → dark mode): checked-in
// classDef snippets whose contrast holds in BOTH of GitHub's colour modes and whose meaning survives
// with the fill removed. PICTURES.md promised the first snippet on 2026-08-20 and none existed until
// 2026-09-25; every "brand-styled" diagram before then was improvised hex. The round-3 design
// session (plan #3786, 2026-09-26) added a second look, ink mode, verified here and not yet
// promoted — so this spec reads EVERY classDef on the page as a registry instead of the one block,
// and the same bars apply to each: BRAND.md → Accessibility, a standing reader is red/green
// colourblind, hue never carries meaning alone, text holds AA (4.5:1), a non-text signal holds 3:1
// against its ground. A class that carries only a font (`classDef default font-size…`) is not
// colour and is skipped; a class that carries a hex is checked wherever it appears, starters
// included, because a starter is copied whole.

/** GitHub's page canvases: light and dark. The Mermaid iframe is transparent over them. */
const GITHUB_LIGHT = "#ffffff";
const GITHUB_DARK = "#0d1117";

const doc = readFileSync("docs/PICTURES.md", "utf8");

/** Every fenced mermaid block on the page, in order. */
const blocks = doc
  .split("```mermaid\n")
  .slice(1)
  .map((chunk) => chunk.split("```")[0] ?? "");

type ClassDef = { name: string; props: Record<string, string>; block: number };

/** `classDef <name> k:v,k:v` → { name, props }, for every class in every block. */
const registry: ClassDef[] = blocks.flatMap((block, i) =>
  [...block.matchAll(/^\s*classDef ([\w-]+) (.+)$/gm)].map((m) => ({
    name: m[1] ?? "",
    block: i,
    props: Object.fromEntries(
      (m[2] ?? "").split(",").map((kv) => kv.split(":").map((s) => s.trim()) as [string, string]),
    ),
  })),
);

const isHex = (v: string | undefined): v is string => !!v && /^#[0-9a-f]{6}$/i.test(v);
/** Classes that carry a colour at all; font-only classes are not this spec's business. */
const coloured = registry.filter((c) => isHex(c.props.fill) || isHex(c.props.stroke));

/** The strongest separation a class has from a canvas: its fill or its stroke, whichever wins. */
const boundary = (c: ClassDef, canvas: string): number =>
  Math.max(
    isHex(c.props.fill) ? contrast(c.props.fill, canvas) : 0,
    isHex(c.props.stroke) ? contrast(c.props.stroke, canvas) : 0,
  );

describe("the checked-in Mermaid classDef snippets — colour that survives both GitHub modes", () => {
  it("the house teal snippet exists (new / removed / changed), and ink mode beside it", () => {
    const names = new Set(registry.map((c) => c.name));
    for (const n of ["new", "removed", "changed", "paper", "gold", "defect"]) {
      expect(names.has(n), n).toBe(true);
    }
  });

  it("reads a registry, not one block — every coloured class on the page is under test", () => {
    expect(coloured.length).toBeGreaterThanOrEqual(6);
  });

  it("text on a fill holds AA (4.5:1) — the fill and the text are fixed together, theme-free", () => {
    for (const c of coloured.filter((c) => isHex(c.props.fill))) {
      const color = c.props.color;
      expect(isHex(color), `classDef ${c.name} has a fill but no text colour`).toBe(true);
      if (isHex(color)) {
        expect(
          contrast(color, c.props.fill as string),
          `${c.name} text/fill`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("every coloured class separates from BOTH canvases at 3:1, by fill or by stroke", () => {
    for (const c of coloured) {
      for (const [label, canvas] of [
        ["light", GITHUB_LIGHT],
        ["dark", GITHUB_DARK],
      ] as const) {
        expect(boundary(c, canvas), `${c.name} boundary on ${label}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("every coloured class has an achromatic carrier — meaning survives with the fill removed", () => {
    for (const c of coloured) {
      const width = Number.parseInt(c.props["stroke-width"] ?? "0", 10);
      const dashed = !!c.props["stroke-dasharray"];
      expect(width >= 3 || dashed, `${c.name} carries neither a 3px stroke nor a dash`).toBe(true);
    }
  });

  it("ink mode is one block of four classes — a look switched whole, never mixed with teal", () => {
    const ink = blocks.findIndex((b) => b.includes("classDef paper"));
    expect(ink).toBeGreaterThanOrEqual(0);
    const names = registry
      .filter((c) => c.block === ink)
      .map((c) => c.name)
      .sort();
    expect(names).toEqual(["defect", "gold", "paper", "removed"]);
    expect(blocks[ink]).not.toContain("classDef new");
  });

  it("never pins a theme — GitHub owns light and dark", () => {
    for (const block of blocks) {
      expect(block).not.toMatch(/^\s*theme\s*:/m);
      expect(block).not.toMatch(/%%\{\s*init/);
    }
  });
});
