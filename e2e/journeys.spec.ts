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
 * Runs only under `playwright.journeys.config.ts` (`npm run test:e2e:journeys[:open]`, and
 * `scripts/crawl/run.mjs`); the default config lists it in `testIgnore`, so `npm run test:e2e`
 * never collects it. CI wiring is a platter item, because workflow files are the irreversible
 * class. The server picks ONE auth mode per boot (`playwright.auth.config.ts` explains), so
 * `JOURNEYS_MODE` says which fixtures this boot can serve: `open` (anonymous fixtures) or `session`
 * (OAuth with the crawl's owner-links fixture; the spec mints the `skynet_session` cookie). A
 * member whose fixture the boot cannot serve is left out at load time, never collected as a
 * skipped test — the other mode's run covers it.
 */
const MODE = process.env.JOURNEYS_MODE === "session" ? "session" : "open";

for (const member of loadJourneys()) {
  const wantsSession = member.fixture.kind === "session";
  if (wantsSession !== (MODE === "session")) continue;
  for (const journey of member.journeys) {
    for (const viewport of viewportsFor(member, journey)) {
      test.describe(`${member.member} · ${journey.name} · ${viewport}`, () => {
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
