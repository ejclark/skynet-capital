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
import { journeysTag } from "./playwright.journeys";

/**
 * THE MEMBER JOURNEYS AS ACCEPTANCE TESTS — generated at module load from every
 * `e2e/journeys/*.journey.json` (the machine-readable twin of `docs/members/<member>.md`; schema in
 * `docs/members/README.md`). One `describe` per journey × viewport, one `test` per step titled by
 * its EARS line. A step carrying `known_gap` is `test.fail()` — expected to fail today — so the
 * suite is green while the gaps are real and turns RED the day a gap is fixed. That red is the
 * ratchet: the fix then deletes the `known_gap` line, and the step guards the fix from then on.
 *
 * Runs in CI before every merge (#7031 slice 1): the default `npx playwright test` collects it in
 * two projects, `journeys-open` and `journeys-session`, each against its own boot
 * (`e2e/playwright.journeys.ts`); `playwright.journeys.config.ts` runs just those two. The server
 * picks ONE auth mode per boot (`playwright.auth.config.ts` explains), so each journey is tagged
 * with the mode its member's fixture needs — `@journeys-open` (anonymous) or `@journeys-session`
 * (OAuth with the crawl's owner-links fixture; the spec mints the `skynet_session` cookie) — and
 * each project greps for its own tag. A member the boot cannot serve is never collected there,
 * never a skipped test: the other project covers it.
 */
for (const member of loadJourneys()) {
  const wantsSession = member.fixture.kind === "session";
  const tag = journeysTag(wantsSession ? "session" : "open");
  for (const journey of member.journeys) {
    for (const viewport of viewportsFor(member, journey)) {
      test.describe(`${member.member} · ${journey.name} · ${viewport}`, { tag }, () => {
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
