import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * THE ORDERS PANE FRAME KEEPS ITS RULES (C1; the deletion was #3467).
 *
 * `.wr-panel` / `.wr-h` / `.wr-list` / `.wr-more` were born in `wire-row.css`. #3467 retired the
 * who-else-traded row and deleted its sheet, but four panes (Working orders, Alerts, Expiries and
 * assignments, Your recent orders) had borrowed the frame and kept the classes, so for three weeks
 * they rendered as browser-default h3s and indented bullet lists. Nothing failed: a className with
 * no rule is not an error anywhere in the toolchain. So this is the gate for that one family: every
 * `wr-*` class written in `app/src` has a `.wr-*` selector in `app/src/styles`, and every `.wr-*`
 * selector still has a user (the reverse drift — a sheet carrying a frame nobody draws).
 */
const ROOT = process.cwd();
const SRC = join(ROOT, "app/src");
const STYLES = join(SRC, "styles");

const walk = (dir: string, ext: RegExp): string[] =>
  readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((path) => ext.test(path))
    .map((path) => join(dir, path));

/** Comments out, so a header comment naming `.wr-*` is never read as a use or a rule. */
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:\\"'])\/\/.*$/gm, "$1");

/** Every `wr-*` class token a TS/TSX source writes. */
function usedWrClasses(source: string): string[] {
  return [...stripComments(source).matchAll(/(?<![\w-])wr-[a-z][a-z0-9-]*/g)].map((m) => m[0]);
}

/** Every `.wr-*` class a stylesheet gives a rule. */
function styledWrClasses(css: string): string[] {
  return [...stripComments(css).matchAll(/\.(wr-[a-z][a-z0-9-]*)(?![\w-])/g)].map(
    (m) => m[1] ?? "",
  );
}

const used = new Map<string, string[]>();
for (const file of walk(SRC, /\.tsx?$/)) {
  for (const cls of usedWrClasses(readFileSync(file, "utf8"))) {
    used.set(cls, [...(used.get(cls) ?? []), file.slice(ROOT.length + 1)]);
  }
}
const styled = new Set(
  walk(STYLES, /\.css$/).flatMap((file) => styledWrClasses(readFileSync(file, "utf8"))),
);

describe("the Orders pane frame keeps its rules (#3467's deletion)", () => {
  it("reads a class out of a className and a rule out of a sheet, ignoring comments", () => {
    expect(
      usedWrClasses('<h3 className="wr-h">x</h3> {/* wr-ghost */} "wo-panel wr-panel"'),
    ).toEqual(["wr-h", "wr-panel"]);
    expect(styledWrClasses("/* .wr-ghost */ .wr-list { margin: 0 } .wr-h:last-child {}")).toEqual([
      "wr-list",
      "wr-h",
    ]);
  });

  it("sees the four panes that wear the frame — the scan must not go blind", () => {
    const files = new Set([...used.values()].flat());
    for (const consumer of [
      "app/src/shell/working-orders.tsx",
      "app/src/shell/desk-alerts.tsx",
      "app/src/shell/option-lifecycle-card.tsx",
      "app/src/shell/recent-orders-strip.tsx",
    ]) {
      expect(files.has(consumer)).toBe(true);
    }
  });

  it("gives every wr-* class used in app/src a rule in app/src/styles", () => {
    const unstyled = [...used]
      .filter(([cls]) => !styled.has(cls))
      .map(([cls, at]) => `${cls} ← ${at.join(", ")}`);
    expect(unstyled).toEqual([]);
  });

  it("keeps no .wr-* rule nobody draws", () => {
    expect([...styled].filter((cls) => !used.has(cls))).toEqual([]);
  });
});
