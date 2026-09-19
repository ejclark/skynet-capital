import type { Locator } from "@playwright/experimental-ct-core";
import { expect } from "@playwright/experimental-ct-react";

/**
 * The CT suite's screenshot tail — the component-level counterpart of `e2e/determinism.ts`'s
 * `captureWholeFrame`. The two cannot share code (that module imports `@playwright/test` from the
 * ROOT package, which `app/` does not depend on), but they share the discipline: one named
 * tolerance, asserted the same way everywhere, so raising it is a visible edit rather than a number
 * nudged upward until a test stops complaining.
 */

/**
 * Near-zero on purpose, and lower than the route suite's `FROZEN_DIFF_RATIO` (0.002) can afford to
 * be: a route screenshot freezes a live page's stochastic inputs, while a mounted component has
 * none to freeze — the props are literals in the spec. There is no legitimate source of drift here,
 * so anything above antialiasing noise is a real change.
 */
const CT_DIFF_RATIO = 0.001;

/**
 * Assert a mounted component against its committed baseline. `toHaveScreenshot` already waits for
 * two consecutive identical captures, so nothing extra is needed to settle the render — unlike the
 * route suite, which must first wait out in-flight queries.
 */
export async function expectComponentShot(component: Locator, name: string): Promise<void> {
  await expect(component).toHaveScreenshot(name, { maxDiffPixelRatio: CT_DIFF_RATIO });
}
