import { defineConfig, devices } from "@playwright/experimental-ct-react";

/**
 * THE COMPONENT-TEST (CT) HARNESS — real Chromium, one `shell/*.tsx` component, no server.
 *
 * WHY IT EXISTS (Eric, 2026-09-19, #3333, generalising #3330's leaderboard finding): a pixel diff
 * can only adjudicate a render that reproduces, and a route-level screenshot of any surface fed by
 * live data never will. `/leaderboard`'s dollar figures and sequence numbers drift with
 * `src/observatory/history-sampler.ts`'s server-side tick — which runs even in offline mode — so
 * those routes get BEHAVIOURAL e2e coverage only (see `playwright.config.ts`). This config is the
 * other half of that trade: mount the component alone, hand it fully-controlled mock props, and the
 * same numbers render the same way every run. Live-data surfaces get their visual regression HERE,
 * never from a route spec.
 *
 * WHY IT LIVES IN `app/` AND NOT BESIDE THE OTHER TWO CONFIGS. Playwright CT bundles the component
 * under test with Vite, which must resolve `react`/`react-dom`/`@tanstack/*` from the package that
 * owns them — `app/node_modules`, not the root's. The root's `playwright.config.ts` (the open app
 * suite) and `playwright.auth.config.ts` (the `/login` suite) are untouched by this file and share
 * nothing with it: they boot the offline dashboard server, and this one boots no server at all.
 * That is the point, not an accident of layout.
 *
 * SCOPE, deliberately: pure (non-router, non-query-connected) components only, for now. The
 * provider-wrapper shape the 18 router/query-connected components need is settled empirically in
 * #3333's slice 5, against real components — not guessed at here. `playwright/index.tsx` carries
 * the wrapper seam those will grow into.
 */
export default defineConfig({
  testDir: "./ct",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["github"]] : "list",
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // Two determinism dials the route suite gets from `e2e/determinism.ts`'s `freezePage`, which
    // this suite cannot reuse (it has no `page.goto` to freeze ahead of). Reduced motion stops a
    // transition from being caught mid-flight; the viewport is fixed so a component that sizes
    // itself from the frame (`networth-condensed`'s pill row wraps) always wraps identically.
    // `reducedMotion` rides under `contextOptions` deliberately: Playwright 1.62 dropped it as a
    // top-level `use` key, and a stray top-level one is silently ignored rather than rejected.
    contextOptions: { reducedMotion: "reduce" },
    viewport: { width: 1280, height: 720 },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
