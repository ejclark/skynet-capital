import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The positions table's `<colgroup>` (#4945; ranked columns #5071). Each `<col>` carries its
 * column's class (`pos-col-*`), like its `<th>`/`<td>`, and the stylesheets step a column aside
 * by its WIDTH, never its display:
 *  - a `<col>` that is not `display: table-column` is treated as `display: none`, so a bare
 *    `.col-detail { display: table-cell }` once dropped four widths, slid every later width one
 *    column left, and left the action column 0px wide at 1280 (#4945);
 *  - a column hidden with `display: none` leaves the table's column model, and the full-width rows
 *    under each position (`colSpan` = every column) then span past the last real one, so the
 *    browser invents unheaded columns and shares Position's room with them (Position fell to ~80px
 *    at 1280 in #5071's first build).
 * So no stylesheet may give a column's class any `display` through a selector that names its
 * `<col>`, `<th>` or `<td>`; `positions-columns.css` zeroes the width and hides the cell's one
 * `.pos-cell` instead.
 *
 * The layout outcome — no sideways scroll, the header spanning the whole table, Position keeping its
 * room, every opened row's buttons inside the visible table — is held by a real browser in
 * `e2e/positions-columns.spec.ts` and `e2e/positions-table.spec.ts`; this is the mechanical half
 * that runs in `npm test`.
 */

const STYLES = "app/src/styles";
const table = readFileSync("app/src/shell/positions-table.tsx", "utf8");
const columns = readFileSync("app/src/shell/position-columns.tsx", "utf8");
const list = columns.slice(columns.indexOf("export const POS_COLUMNS = ["));
const keys = [...list.slice(0, list.indexOf("] as const")).matchAll(/"(\w+)"/g)].map(
  (m) => m[1] as string,
);
const colClasses = keys.map((k) => `pos-col-${k}`);

interface Rule {
  readonly file: string;
  readonly selector: string;
  readonly body: string;
}

/** Every innermost `selector { body }` in the view stylesheets, comments stripped. */
const rules: readonly Rule[] = readdirSync(STYLES)
  .filter((f) => f.endsWith(".css"))
  .flatMap((file) =>
    [
      ...readFileSync(join(STYLES, file), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .matchAll(/([^{}]+)\{([^{}]*)\}/g),
    ].flatMap((m) =>
      (m[1] as string)
        .split(",")
        .map((selector) => ({ file, selector: selector.trim(), body: m[2] as string })),
    ),
  );

describe("the positions table's colgroup", () => {
  it("gives every column a <col> carrying its column's class (the premise this spec guards)", () => {
    expect(keys).toEqual(["pos", "greeks", "value", "pl", "model", "event", "best", "open"]);
    expect(table).toMatch(
      /POS_COLUMNS\.map\(\(key\) => \(\s*<col key=\{key\} className=\{colClass\(key\)\} \/>/,
    );
  });

  it("never sets a display on a column's class through a selector its col, th or td matches", () => {
    const offenders: string[] = [];
    for (const { file, selector, body } of rules) {
      const display = body.match(/display:\s*([^;]+)/)?.[1]?.trim();
      if (!display) continue;
      // The subject is the last compound; a column's elements match it unless it names another.
      const subject = selector.split(/[\s>+~]+/).pop() ?? "";
      const element = subject.match(/^[a-z][a-z0-9-]*/)?.[0];
      if (element && !["col", "th", "td"].includes(element)) continue;
      for (const cls of colClasses) {
        if (new RegExp(`\\.${cls}(?![\\w-])`).test(subject)) {
          offenders.push(`${file}: ${selector} { display: ${display} }`);
        }
      }
    }
    expect(offenders, "step a column aside by its width (positions-columns.css)").toEqual([]);
  });

  it("lets an opened row's buttons keep their own width, not .btn's 100%", () => {
    for (const selector of [".pos-open-acts .btn", ".pos-buy-acts .btn"]) {
      const own = rules.find((r) => r.selector === selector);
      expect(own?.body, selector).toMatch(/width:\s*auto/);
    }
  });
});
