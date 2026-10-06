import { expect, type Page } from "@playwright/test";

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
 * Friday 2026-09-18, 10:00 America/New_York — a regular-session weekday (not in
 * `MARKET_CLOSURES`, src/domain/market-calendar.ts), 30 minutes after the open. Two surfaces read
 * this: the login skyline renders at full `marketLife()` liveliness, and the topbar market clock
 * (#3690) draws its open-session state. The instant was 2026-09-19 until #3690 exposed that it was
 * a Saturday — every baseline had quietly captured "MARKET CLOSED · opens Mon 9:30". A weekend or
 * holiday bakes the closed state in; so would an overnight hour (and a dimmed city). If this ever
 * moves, keep it a weekday session hour and check the calendar — `isMarketClosed(date)` must be
 * false. Friday also keeps the research fixture's ledgers (e2e/fixtures/research) in the same week.
 */
const FIXED_CLOCK = new Date("2026-09-18T14:00:00Z");

/**
 * The board's live channel (`/events?by=…`, app/src/live/channel.ts) is the third irreproducible
 * input. Once the league card joined the tower column on every Profile section (#4133, #4143), the
 * topbar pill began reading `live · seq N` there instead of `connecting…` — and N is however many
 * hub ticks the offline server had run before the capture (measured 2, 3, 5, 6, 8, 10 across local
 * runs of one commit). The label's width slides the market clock beside it, so the same commit drew
 * a different topbar per run: ~940–1,130 pixels per shot, about a third of the shortest page's
 * FROZEN_DIFF_RATIO budget spent on noise. Refusing the stream holds every page at `connecting…`,
 * the state every baseline has always captured; the board snapshot the league card draws from is a
 * plain fetch and still lands.
 */
const isBoardChannel = (url: URL): boolean => url.pathname === "/events";

export async function freezePage(page: Page): Promise<void> {
  await page.clock.setFixedTime(FIXED_CLOCK);
  await page.addInitScript(SEEDED_RANDOM);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route(isBoardChannel, (route) => route.abort());
}

/**
 * Tolerance for a frozen screenshot. Near-zero on purpose: once the stochastic inputs are pinned
 * the render is stable across runs, so anything above noise is a real change. Named rather than
 * inlined so raising it is a visible, arguable edit instead of a number quietly nudged upward until
 * the test stops complaining — the drift that makes a visual suite decorative.
 */
export const FROZEN_DIFF_RATIO = 0.002;

/**
 * The topbar market clock, asserted on its own at a FIXED size on every whole-frame page (#4094).
 *
 * WHY (measured 2026-09-30). The whole-frame ratio above scales with page height (resized to content,
 * 1,843–6,215 px of budget across the suite), while a wrong market state is a fixed-size change in
 * the topbar: 1,257 px locally with the clock moved to a Saturday, and all seven route shots passed
 * it. A fixed PIXEL budget on the whole frame is no fix either: CI runners disagree on glyph
 * antialiasing by up to 1,846 px per frame (run 36684412259, the same commit on retry), which lands
 * on top of the market-state signal. Inside this element the same CI images differ by 0 px, so the
 * clock gets its own shot and a small fixed budget, and the frame keeps its ratio for text noise.
 */
const MARKET_CLOCK = ".market-session";
const MARKET_CLOCK_DIFF_PIXELS = 50;

/**
 * Resize the viewport to the page's actual content height, then screenshot the (now full-content)
 * viewport instead of using `fullPage: true`.
 *
 * WHY (measured 2026-09-19, #3325 follow-up): `/research` — a genuine scrolling document, exactly
 * the case docs/ENGINEERING.md says to use `fullPage: true` for — still failed Playwright's own
 * "two consecutive stable screenshots" check, oscillating between 5949px and 5950px tall forever.
 * `document.body.scrollHeight` polled directly was rock-stable at 5949px across 4.5s (15 samples);
 * the jitter only appeared once an actual `fullPage` screenshot was taken. Root cause: `fullPage`
 * capture resizes/scrolls the page in segments to stitch the image, and that resize cycle itself
 * is what introduced the 1px difference — not the app. Manually resizing the viewport to the
 * measured content height ONCE, then taking a plain (non-fullPage) screenshot, reproduced
 * byte-identical across 8 consecutive captures. Use this instead of `fullPage: true` for any
 * route-level whole-frame shot; `fullPage: true` itself is now suspect for any page whose layout
 * reacts to viewport size (a `min-height: 100vh` shell wrapper, `.shell`/`.shell-app` in this
 * app's case) rather than a safe default for "a real scrolling document."
 */
export async function resizeToContentHeight(page: Page, width = 1280): Promise<void> {
  const height = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewportSize({ width, height });
}

/**
 * The common tail of a route's whole-frame screenshot spec: wait for in-flight queries to settle
 * (avoids the fog-of-war-style race found on /research, where a second query's resolution changes
 * what's rendered), resize to content height (see resizeToContentHeight), then assert the shot.
 * Call `freezePage(page)` before `page.goto`, and wait for the page's own content marker to be
 * visible, before calling this — it only owns the settle → resize → screenshot tail every route
 * spec shares, plus the fixed-size market clock assertion (MARKET_CLOCK above).
 */
export async function captureWholeFrame(page: Page, name: string): Promise<void> {
  await page.waitForLoadState("networkidle");
  await resizeToContentHeight(page);
  await expect(page).toHaveScreenshot(name, { maxDiffPixelRatio: FROZEN_DIFF_RATIO });
  await expect(page.locator(MARKET_CLOCK)).toHaveScreenshot(
    name.replace(/\.png$/, "-market-clock.png"),
    {
      maxDiffPixels: MARKET_CLOCK_DIFF_PIXELS,
    },
  );
}
