import type { Page } from "@playwright/test";

/**
 * The determinism harness every screenshot spec runs through — call it BEFORE `page.goto`.
 *
 * WHY THIS EXISTS (measured on 2026-09-19, #3325). A pixel diff can only adjudicate a render that
 * reproduces. `/login` did not: two back-to-back runs of the same commit differed by 24,653–30,318
 * pixels (ratio 0.03–0.04). The page composes four full-viewport canvases — `#rain` (matrix rain),
 * `#stage` (the market/forecast telestrator), `#vfx`, `#eyevfx` — whose inputs are irreproducible
 * by construction:
 *
 *   1. **Unseeded randomness.** `src/server/auth/authenticator.ts` rolls `Math.random()` 47 times
 *      for the skyline silhouettes, the rain glyph columns and the forecast jitter. The
 *      reduced-motion path is not exempt — it paints 26 rain frames from fresh draws.
 *   2. **Wall-clock time.** `marketLife()` reads New York time and dims the skyline by trading
 *      session, so the same commit renders differently at 10:00 ET than at 22:00 ET.
 *
 * `prefers-reduced-motion` stops the ANIMATION but neither of those, which is why the suite's first
 * screenshot was clipped to a small text element: scoping narrow made the corruption small enough
 * to hide under a 0.02 tolerance rather than fixing it. It had already outgrown that tolerance —
 * the committed `#herosub` baseline drifted 0.07–0.08 against it, and would have failed the next
 * code-touching PR. (Nobody saw it because the e2e job only runs when a PR touches code, and every
 * PR between that baseline landing and this one was docs-only.)
 *
 * WHAT THIS DOES — replaces the two irreproducible inputs with fixed ones, entirely from the test
 * side: a seeded PRNG stands in for `Math.random`, and the clock is pinned. Nothing in `src/`
 * changes, so the page a member loads is untouched, and the canvases stay IN the frame instead of
 * being hidden out of it. Measured result: three consecutive clean runs at a 0.002 tolerance.
 *
 * REJECTED ALTERNATIVES, and why they are worse — both were built and measured, not reasoned about:
 *
 *   - **Hiding the canvases** (`visibility:hidden`) also reproduces, but surrenders the entire
 *     cinematic composition — the skyline, the rain, the forecast telestrator — which is most of
 *     what this page IS. Deterministic and blind is not a trade worth making.
 *   - **`fullPage: true`** looks like the wider frame and is the opposite. The capture resizes the
 *     layout viewport, which clears every canvas bitmap, and the reduced-motion path never repaints
 *     (it returns before the rAF loop) — so the baseline came back with the composition WIPED and
 *     ~40% dead space below the fold, at 1.39MB versus 1.1MB for the honest frame. See
 *     `docs/ENGINEERING.md` → "Visual regression".
 */

// mulberry32 — a small, fast, well-distributed PRNG. The constant is arbitrary; what matters is
// that it is fixed, so every run draws the same sequence in the same order.
const SEEDED_RANDOM = `
  (() => {
    let s = 0x9e3779b9;
    Math.random = () => {
      s |= 0; s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  })();
`;

/**
 * 10:00 America/New_York — deliberately inside regular trading hours, so the skyline renders at
 * full `marketLife()` liveliness. Pinning it to a quiet overnight hour would bake a dimmed city
 * into the baseline and quietly drop the lit-window detail out of visual regression.
 */
const FIXED_CLOCK = new Date("2026-09-19T14:00:00Z");

export async function freezePage(page: Page): Promise<void> {
  await page.clock.setFixedTime(FIXED_CLOCK);
  await page.addInitScript(SEEDED_RANDOM);
  await page.emulateMedia({ reducedMotion: "reduce" });
}

/**
 * Tolerance for a frozen screenshot. Near-zero on purpose: once the stochastic inputs are pinned
 * the render is stable across runs, so anything above noise is a real change. Named rather than
 * inlined so raising it is a visible, arguable edit instead of a number quietly nudged upward until
 * the test stops complaining — the drift that makes a visual suite decorative.
 */
export const FROZEN_DIFF_RATIO = 0.002;
