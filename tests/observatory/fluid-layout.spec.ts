import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { NavContext } from "../../src/observatory/dashboard-shell.js";
import { renderShell } from "../../src/observatory/dashboard-shell.js";
import { FLUID_LAYOUT_TOKENS } from "../../src/observatory/fluid-layout.js";

const NAV: NavContext = { active: "board", canAdd: false, authed: true };
const AS_OF = "2026-08-22T14:30:00Z";

describe("the fluid layout scale", () => {
  it("caps every column with a percentage that stops at a maximum, never a bare pixel width", () => {
    // `min(100%, …)` is the whole contract: below the cap the column tracks whatever room it has,
    // at the cap it stops. A bare `max-width:900px` would only do the second half.
    const caps = [...FLUID_LAYOUT_TOKENS.matchAll(/--col-[a-z]+:([^;]+);/g)].map((m) => m[1]);

    expect(caps.length).toBeGreaterThan(0);
    for (const cap of caps) expect(cap).toMatch(/^min\(100%,/);
  });

  it("stops the whole shell expanding at 2.5k, and paints past the cap in our own black", () => {
    const html = renderShell(NAV, "<p>board</p>", AS_OF);

    expect(html).toContain("--shell-max:2560px");
    // Centred and capped — an ultrawide gets a deliberate canvas, not a stretched leaderboard row.
    expect(html).toMatch(/\.app\{[^}]*max-width:var\(--shell-max\)/s);
    expect(html).toMatch(/\.app\{[^}]*margin-inline:auto/s);
    // The letterbox beyond the cap is ours, not the browser's default dark canvas.
    expect(html).toMatch(/\.app\{[^}]*box-shadow:0 0 0 100vmax var\(--bg\)/s);
  });

  it("scales the drawer with the viewport instead of pinning it to 250px", () => {
    const html = renderShell(NAV, "<p>board</p>", AS_OF);

    expect(html).toContain("--drawer-w:clamp(200px,17vw,280px)");
    expect(html).toMatch(/\.drawer\{ flex:0 0 var\(--drawer-w\); width:var\(--drawer-w\)/);
    expect(html).not.toContain("flex:0 0 250px");
  });

  it("makes the content box the thing breakpoints measure, so the drawer's width is accounted for", () => {
    const html = renderShell(NAV, "<p>board</p>", AS_OF);

    expect(html).toMatch(/\.obs \{[^}]*container-type:inline-size/s);
    expect(html).toMatch(/\.obs \{[^}]*container-name:stage/s);
    expect(html).toContain(
      "@container stage (max-width:640px){ .indiv-hero{ grid-template-columns:1fr; } }",
    );
  });

  it("gives the bare embeddable body the same scale and the same ceiling", () => {
    // No drawer, no stage — but a published Artifact still has to stop growing somewhere.
    const html = renderShell(undefined, "<p>content</p>", AS_OF);

    expect(html).toContain("--shell-max:2560px");
    expect(html).toMatch(/\.obs \{[^}]*max-width:var\(--shell-max\)/s);
    expect(html).toMatch(/\.obs \{[^}]*container-type:inline-size/s);
  });
});

describe("the observatory stylesheets", () => {
  // The regression this guards: a viewport `@media` fires on the WINDOW, but a view only ever gets
  // the window minus the drawer — so on a 768px tablet a `max-width:640px` collapse never runs even
  // though the content has ~500px. Width breakpoints belong on the container; the one exception is
  // the drawer itself, which is chrome outside the container and genuinely does watch the window.
  const DIR = "src/observatory";
  const files = readdirSync(DIR).filter((f) => f.endsWith(".ts"));

  it("breaks on the container, never on the viewport (the drawer alone excepted)", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(join(DIR, file), "utf8");
      for (const [match] of src.matchAll(/@media\s*\(max-width:[^)]+\)\s*\{/g)) {
        if (file === "shell-style.ts" && match.includes("760px")) continue;
        offenders.push(`${file}: ${match.trim()}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it("leaves no page-level column pinned to a bare pixel width", () => {
    // Icons, glyphs and inputs keep their pixel sizes; a COLUMN cap must come from the scale (or be
    // a `ch` measure, which is fluid with the type).
    const offenders: string[] = [];
    for (const file of files) {
      // Strip breakpoint conditions first — `@container stage (max-width:640px)` is a query, not a
      // width anyone is pinned to.
      const src = readFileSync(join(DIR, file), "utf8").replace(/\((max-width:[^)]*)\)/g, "()");
      for (const [match, px] of src.matchAll(/max-width:(\d+)px/g)) {
        if (Number(px) < 400) continue; // a progress bar or a badge, not a page column
        offenders.push(`${file}: ${match}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
