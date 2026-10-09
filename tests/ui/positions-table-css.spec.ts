import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The positions table's `<colgroup>` (#4945). Its `<col>` elements carry the same disclosure
 * classes as their `<th>`/`<td>` cells (`col-detail`, `fold-col`) so a hidden column's width drops
 * out with it. That only works while no stylesheet gives one of those classes a CELL display: a
 * `<col>` inside a `<colgroup>` that is not `display: table-column` is treated as `display: none`,
 * so a bare `.col-detail { display: table-cell }` silently dropped four widths, slid every later
 * width one column left, and left the action column 0px wide at 1280. The rule that shows the
 * cells must name `th`/`td`; the one that shows the column says `table-column`.
 *
 * The layout outcome itself — every owner row's buttons inside their own cell and the table's
 * right edge at 1024/1100/1280/1440, on both `/app/accounts` and `/app/u/:id` — is held by a real
 * browser in `e2e/positions-table.spec.ts`; this is the mechanical half that runs in `npm test`.
 */

const STYLES = "app/src/styles";
const table = readFileSync("app/src/shell/positions-table.tsx", "utf8");
const colgroup = table.slice(table.indexOf("<colgroup>"), table.indexOf("</colgroup>"));
const colClasses = [
  ...new Set(
    [...colgroup.matchAll(/<col className="([^"]+)"/g)].flatMap((m) =>
      (m[1] as string).split(/\s+/),
    ),
  ),
];

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
  it("puts disclosure classes on its <col> elements (the premise this spec guards)", () => {
    expect(colClasses).toContain("col-detail");
    expect(colClasses).toContain("fold-col");
  });

  it("never gives a <col>'s class a non-column display through a selector a <col> matches", () => {
    const offenders: string[] = [];
    for (const { file, selector, body } of rules) {
      const display = body.match(/display:\s*([^;]+)/)?.[1]?.trim();
      if (!display || display === "none" || display === "table-column") continue;
      // The subject is the last compound; a `<col>` matches it unless it names another element.
      const subject = selector.split(/[\s>+~]+/).pop() ?? "";
      const element = subject.match(/^[a-z][a-z0-9-]*/)?.[0];
      if (element && element !== "col") continue;
      for (const cls of colClasses) {
        if (new RegExp(`\\.${cls}(?![\\w-])`).test(subject)) {
          offenders.push(`${file}: ${selector} { display: ${display} }`);
        }
      }
    }
    expect(offenders, "scope the rule to th/td (col gets display: table-column)").toEqual([]);
  });

  it("lets the action column's buttons keep their own width, not .btn's 100%", () => {
    const own = rules.find((r) => r.selector === ".act-col .btn");
    expect(own?.body).toMatch(/width:\s*auto/);
  });
});
