// Visual harness for a failed route (#4614, slice 2 of #4612) — what a member sees when one page
// breaks: the error inside the route area, the topbar still there to leave by. From the REAL built
// shell over stub APIs. The failure is a realistic one, not a planted throw: `/api/wire` answers in
// a shape this build doesn't know (`{ wire: {} }`, no trades list), the version-skew case the audit
// measured, so Activity throws while rendering. Phone first (docs/PICTURES.md), then desktop.
// JPEG ≤100KB.
// Usage: npm run build --prefix app && npm run shoot:route-error [outdir]
import { openShell } from "./shell.mjs";

const { page, origin, shoot, close } = await openShell({
  name: "route-error",
  viewport: { width: 390, height: 844 },
  stubs: { "/api/wire": { wire: {} } },
});

// The stage fades in on every route (`motion.css`, 260ms) and the error panel lands at once, so a
// frame taken on first paint catches it half-transparent. Wait out the finite animations first.
const settled = () =>
  page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Number.POSITIVE_INFINITY)
        .map((a) => a.finished),
    ),
  );

await page.goto(`${origin}/app/activity`);
await page.getByRole("heading", { name: "This page hit an error" }).waitFor();
await page.locator("header.topbar").waitFor();
await settled();
await shoot("route-error-phone");

await page.setViewportSize({ width: 1280, height: 900 });
await page.getByRole("heading", { name: "This page hit an error" }).waitFor();
await settled();
await shoot("route-error-desktop");

await close();
