import { readFileSync } from "node:fs";

/**
 * What a click will open (#7212, `app/src/styles/click-target.css`): on the landing page and R&D's
 * market calendar, the one row or button under the pointer, or holding keyboard focus, gets a ring
 * and a faint fill. The ring itself needs a browser (the PR's before/after frames); this is
 * the mechanical half that runs in `npm test`, one test per acceptance criterion it can read.
 */

const raw = readFileSync("app/src/styles/click-target.css", "utf8");
const css = raw.replace(/\/\*[\s\S]*?\*\//g, "");
const index = readFileSync("app/src/styles/index.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/** The body of the first `@media (<query>) { … }` block, braces balanced. */
const media = (query: string): string => {
  const at = css.indexOf(`@media (${query})`);
  if (at < 0) return "";
  const open = css.indexOf("{", at);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}" && --depth === 0) return css.slice(open + 1, i);
  }
  return "";
};

/** Every rule outside an @media block, as [selectors, declarations]. */
const topLevel = (): [string[], string][] => {
  const out: [string[], string][] = [];
  let rest = css;
  for (const q of ["hover: hover", "prefers-reduced-motion: reduce"]) {
    const body = media(q);
    rest = rest.replace(body, "");
  }
  rest = rest.replace(/@media[^{]*\{\s*\}/g, "");
  for (const m of rest.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    out.push([(m[1] ?? "").split(",").map((s) => s.trim()), m[2] ?? ""]);
  }
  return out;
};

const LANDING = [".ecal-line", ".story-more > summary", ".ask-chip", ".sectors-seg button"];
const RD_CALENDAR = [
  ".eh-day:not([disabled])",
  ".eh-nav:not([disabled])",
  ".eh-lens:not([disabled])",
  ".eh-fold-toggle",
  ".cal-chip",
];

describe("what a click will open", () => {
  it("rings the landing page's rows and buttons and R&D's calendar under the pointer", () => {
    const hover = media("hover: hover");
    for (const target of [...LANDING, ...RD_CALENDAR]) {
      expect(hover).toContain(`${target}:hover`);
    }
    expect(hover).toMatch(/outline-color:\s*var\(--text\)/);
  });

  it("gives keyboard focus the same ring and fill as hover", () => {
    const focus = topLevel().find(([sel]) => sel.every((s) => s.endsWith(":focus-visible")));
    expect(focus).toBeDefined();
    for (const target of [...LANDING, ...RD_CALENDAR]) {
      expect(focus?.[0]).toContain(`${target}:focus-visible`);
    }
    const hoverBody = media("hover: hover")
      .replace(/^[^{]*\{/, "")
      .replace(/\}\s*$/, "");
    expect(focus?.[1].replace(/\s+/g, "")).toBe(hoverBody.replace(/\s+/g, ""));
  });

  it("draws a 2px outline, a shape that moves no layout, never a border", () => {
    const base = topLevel().find(([sel]) => sel.includes(".ecal-line"));
    expect(base?.[1]).toMatch(/outline:\s*2px solid transparent/);
    expect(css).not.toMatch(/(^|[;{\s])border(-width)?:/);
    expect(css).toMatch(
      /background-image:\s*linear-gradient\(\s*color-mix\(in srgb, var\(--text\)/,
    );
  });

  it("hovers only where a pointer can, so a tap leaves nothing outlined", () => {
    expect(topLevel().some(([sel]) => sel.some((s) => s.includes(":hover")))).toBe(false);
  });

  it("eases the ring in over at most 120ms, and at once with reduced motion", () => {
    const base = topLevel().find(([sel]) => sel.includes(".ecal-line"));
    const ms = Number(base?.[1].match(/transition:\s*outline-color\s+(\d+)ms/)?.[1]);
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(120);
    expect(media("prefers-reduced-motion: reduce")).toMatch(/transition:\s*none/);
  });

  it("loads after both surfaces' own sheets, so its ring wins", () => {
    const at = (f: string): number => index.indexOf(`@import "./${f}"`);
    expect(at("click-target.css")).toBeGreaterThan(at("edition-market.css"));
    expect(at("click-target.css")).toBeGreaterThan(at("edition.css"));
    expect(at("click-target.css")).toBeGreaterThan(at("calendar-head.css"));
    expect(at("click-target.css")).toBeGreaterThan(at("event-horizon.css"));
  });
});
