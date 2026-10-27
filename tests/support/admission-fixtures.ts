// Shared fixtures for the admission-gate specs (tests/scripts/moneypenny/admission-*.spec.ts):
// the capsule/issue/mode builders and the injected "reads nothing live" defaults.

export const capsule = (surface: string) =>
  `**Do the thing.**\n\n| | |\n|---|---|\n| **Status** | ready |\n| **Surface** | ${surface} |\n| **Size** | ~1 PR |\n`;

export const issue = (number: number, surface: string | null, labels: string[] = []) => ({
  number,
  body: surface === null ? "no capsule here" : capsule(surface),
  labels: labels.map((name) => ({ name })),
});

export const mode = (position: "halt" | "conserve" | "normal" | "surge", inFlightCap = 3) => ({
  position,
  caps: { inFlightCap },
});

/**
 * "No plan is waiting to continue" — the continuation context `claimNext` and `peekNext` BOTH
 * consult. Every sweep `deps` in admission-sweep.spec.ts injects it, so no suite falls back to `continuationContext()`,
 * which reads live GitHub (`gatherContinuationDeps` → `ghRestAll`).
 *
 * Left uninjected, these suites read the real repo's open plans. Two ways that showed up on
 * 2026-10-04: `peekNext` returned live issue #3913 where the fixture named #8, so the spec went red
 * on a clean checkout of `main` — and the `claimNext` suites went green only by luck, because
 * `nowMs = 0` makes `0 - mergedMs` negative so the 24h merge window filters nothing out, and
 * `pickContinuation` handed back a real plan. What stopped a local `npm test` from acting on it was
 * one branch: `continueNext` bails when the plan's claim tag is stamped later than its merge
 * (`index.mjs:599`). The very next line is `releaseClaim(slug)` — a live `DELETE` of
 * `refs/tags/claim/plan-<n>` — followed by a real `postContinuationReceipt` comment on the issue.
 * So the suite was one expired lease away from a test run deleting a production claim and
 * commenting on a live plan.
 *
 * That is the whole reason this is injected rather than tolerated, and it is what the admission specs' own
 * header already promised: "no `gh`, no network."
 */
export const noContinuation = () => ({
  continuations: { candidates: [], caps: { continuationsPerDay: 3 } },
  inFlight: [],
  mode: mode("normal"),
  now: Date.parse("2026-10-04T00:00:00Z"),
});

/** "No open PR names anything" — injected beside `noContinuation`, for the same reason: the
 *  default reads live GitHub (`ghRestAll("pulls?state=open")`). */
export const noOpenPrs = () => new Map<number, number>();

/** "No plan is open" — the started-plan cap's read (#4393 slice 4), injected for the same reason:
 *  the default is `ghRestAll("issues?state=open&labels=plan")` against live GitHub. */
export const noOpenPlans = () => [];

/** "No plan's state block holds it" — the #5707 hold's read, injected for the same reason: the
 *  default reads each plan pick's comments from live GitHub (`readPickupHold`). */
export const noHold = () => null;
