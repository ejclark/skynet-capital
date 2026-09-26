import { expect, test } from "@playwright/test";
import { mintSession } from "../scripts/crawl/mint-session";
import {
  expectHolds,
  loadJourneys,
  performAct,
  sessionCookie,
  stepRunsAt,
  VIEWPORTS,
  viewportsFor,
} from "../scripts/crawl/steps.mjs";

/**
 * THE MEMBER JOURNEYS AS ACCEPTANCE TESTS — generated at module load from every
 * `e2e/journeys/*.journey.json` (the machine-readable twin of `docs/members/<member>.md`; schema in
 * `docs/members/README.md`). One `describe` per journey × viewport, one `test` per step titled by
 * its EARS line. A step carrying `known_gap` is `test.fail()` — expected to fail today — so the
 * suite is green while the gaps are real and turns RED the day a gap is fixed. That red is the
 * ratchet: the fix then deletes the `known_gap` line, and the step guards the fix from then on.
 *
 * Gated behind `JOURNEYS=1` (run by `scripts/crawl/run.mjs` and by hand); CI wiring is a platter
 * item, because workflow files are the irreversible class. The server picks ONE auth mode per boot
 * (`playwright.auth.config.ts` explains), so `JOURNEYS_MODE` says which fixtures this boot can
 * serve: `open` (the default config, anonymous fixtures) or `session` (`playwright.journeys.config.ts`,
 * which boots OAuth with the crawl's owner-links fixture and mints the `skynet_session` cookie).
 */
const GATED = !process.env.JOURNEYS;
const MODE = process.env.JOURNEYS_MODE === "session" ? "session" : "open";

for (const member of loadJourneys()) {
  const wantsSession = member.fixture.kind === "session";
  for (const journey of member.journeys) {
    for (const viewport of viewportsFor(member, journey)) {
      test.describe(`${member.member} · ${journey.name} · ${viewport}`, () => {
        test.skip(
          GATED,
          "set JOURNEYS=1 — run by scripts/crawl and locally; CI wiring is a platter item (workflow files are protected)",
        );
        test.skip(
          wantsSession !== (MODE === "session"),
          `a ${member.fixture.kind} fixture needs the ${wantsSession ? "session" : "open"} boot (JOURNEYS_MODE=${MODE})`,
        );
        test.use(VIEWPORTS[viewport]);
        test.beforeEach(async ({ context, baseURL }) => {
          if (wantsSession && baseURL) {
            await context.addCookies([sessionCookie(mintSession(member.fixture.email), baseURL)]);
          }
        });
        for (const step of journey.steps) {
          if (!stepRunsAt(step, viewport)) continue;
          test(`${step.id} — ${step.ears}`, async ({ page }) => {
            test.fail(Boolean(step.known_gap), step.known_gap ?? "");
            await page.goto(step.goto);
            for (const entry of step.expect) {
              const result = await expectHolds(page, entry);
              expect(result.ok, result.detail).toBe(true);
            }
            await performAct(page, step.act);
          });
        }
      });
    }
  }
}
