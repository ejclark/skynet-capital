import { readFileSync } from "node:fs";
import { contrast } from "../support/contrast.js";

// The one sanctioned way to put colour in a Mermaid diagram (docs/PICTURES.md → dark mode): a
// checked-in classDef snippet whose contrast holds in BOTH of GitHub's colour modes and whose
// meaning survives with the fill removed. PICTURES.md promised this snippet on 2026-08-20 and none
// existed until 2026-09-25; every "brand-styled" diagram before then was improvised hex. The rule
// this pins is BRAND.md → Accessibility: a standing reader is red/green colourblind, hue never
// carries meaning alone, text holds AA (4.5:1), a non-text signal holds 3:1 against its ground.

/** GitHub's page canvases: light and dark. The Mermaid iframe is transparent over them. */
const GITHUB_LIGHT = "#ffffff";
const GITHUB_DARK = "#0d1117";

const doc = readFileSync("docs/PICTURES.md", "utf8");
/** The one fenced block that carries the snippet — split on fences so no prose between them leaks in. */
const snippet =
  doc
    .split("```mermaid\n")
    .slice(1)
    .map((chunk) => chunk.split("```")[0] ?? "")
    .find((block) => block.includes("classDef new")) ?? "";

/** `classDef <name> k:v,k:v` → { k: v }. */
const classDef = (name: string): Record<string, string> => {
  const line = new RegExp(`^\\s*classDef ${name} (.+)$`, "m").exec(snippet)?.[1] ?? "";
  return Object.fromEntries(
    line.split(",").map((kv) => kv.split(":").map((s) => s.trim()) as [string, string]),
  );
};

/** One property of a class, loudly — a missing key is a broken snippet, never "fine". */
const prop = (name: string, key: string): string => {
  const value = classDef(name)[key];
  if (!value) throw new Error(`classDef ${name} carries no ${key}`);
  return value;
};

describe("the checked-in Mermaid classDef snippet — colour that survives both GitHub modes", () => {
  it("exists in docs/PICTURES.md and parses (the corpus lint covers the parse)", () => {
    expect(snippet).toContain("classDef new");
    expect(snippet).toContain("classDef removed");
    expect(snippet).toContain("classDef changed");
  });

  it("`new`: text on fill holds AA, and a boundary holds 3:1 on both canvases", () => {
    const [fill, color, stroke] = ["fill", "color", "stroke"].map((k) => prop("new", k)) as [
      string,
      string,
      string,
    ];
    expect(contrast(color, fill)).toBeGreaterThanOrEqual(4.5);
    for (const canvas of [GITHUB_LIGHT, GITHUB_DARK]) {
      // the fill or the stroke must separate the node from the page — whichever is stronger
      expect(Math.max(contrast(fill, canvas), contrast(stroke, canvas))).toBeGreaterThanOrEqual(3);
    }
  });

  it("`removed` and `changed` carry their meaning in the stroke, at 3:1 on both canvases", () => {
    for (const name of ["removed", "changed"]) {
      const stroke = prop(name, "stroke");
      for (const canvas of [GITHUB_LIGHT, GITHUB_DARK]) {
        expect(contrast(stroke, canvas)).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("every class has an achromatic carrier — meaning survives with the fill removed", () => {
    expect(Number.parseInt(classDef("new")["stroke-width"] ?? "0", 10)).toBeGreaterThanOrEqual(3);
    expect(classDef("removed")["stroke-dasharray"]).toBeTruthy();
    expect(Number.parseInt(classDef("changed")["stroke-width"] ?? "0", 10)).toBeGreaterThanOrEqual(
      3,
    );
  });

  it("never pins a theme — GitHub owns light and dark", () => {
    expect(snippet).not.toMatch(/theme\s*:/);
    expect(snippet).not.toMatch(/%%\{\s*init/);
  });
});
