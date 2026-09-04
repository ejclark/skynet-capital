import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The React shell is FLUID (Eric, 2026-09-04: "the page template should be fluid and take full
 * screen real estate" — for every view, the ones that exist and the ones not built yet). The
 * frame tracks the window up to `--shell-max`, the stage takes everything the rail doesn't, and a
 * view sizes its panels by SHAPE on the width scale in `app/src/styles/theme.css`
 * (`--col-read` / `--col-wide`), never with a bare pixel cap of its own. That last clause is the
 * one a future view drifts on — a 640px card looks right on the author's laptop and leaves
 * two-thirds of a monitor empty — so it is held here, mechanically, the same way `theme-css.spec.ts`
 * holds the palette: every `max-width` in a view stylesheet must come from the scale (or be a
 * text measure in `ch`, a percentage, or `none`); a pixel ceiling on the frame or the stage in
 * `shell.css` is the regression that started this.
 */

const STYLES = "app/src/styles";
const css = (file: string): string => readFileSync(join(STYLES, file), "utf8");

/** Strip `@media (...) { ... }` blocks — a breakpoint's `max-width` is a query, not a cap. */
const withoutMediaQueries = (text: string): string =>
  text.replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, "");

const pixelCaps = (text: string): readonly string[] =>
  [...withoutMediaQueries(text).matchAll(/max-width:\s*([^;]+);/g)]
    .map((m) => (m[1] as string).trim())
    .filter((value) => /^\d+(\.\d+)?px$/.test(value));

describe("the fluid shell", () => {
  it("declares the width scale in theme.css", () => {
    const theme = css("theme.css");
    for (const token of ["--shell-max", "--rail-w", "--gutter", "--col-wide", "--col-read"]) {
      expect(theme, token).toContain(`${token}:`);
    }
  });

  it("caps the frame only at --shell-max and leaves the stage uncapped", () => {
    const shell = withoutMediaQueries(css("shell.css"));
    const frame = shell.slice(
      shell.indexOf(".frame {"),
      shell.indexOf("}", shell.indexOf(".frame {")),
    );
    expect(frame).toContain("max-width: var(--shell-max)");
    expect(frame).toContain("grid-template-columns: var(--rail-w) minmax(0, 1fr)");
    const stage = shell.slice(
      shell.indexOf(".stage {"),
      shell.indexOf("}", shell.indexOf(".stage {")),
    );
    expect(stage).not.toContain("max-width");
  });

  it("lets no view stylesheet cap a panel with a bare pixel width", () => {
    const offenders: string[] = [];
    for (const file of readdirSync(STYLES).filter((f) => f.endsWith(".css"))) {
      for (const cap of pixelCaps(css(file))) offenders.push(`${file}: max-width: ${cap}`);
    }
    expect(offenders, "use var(--col-read) / var(--col-wide) from theme.css instead").toEqual([]);
  });
});
