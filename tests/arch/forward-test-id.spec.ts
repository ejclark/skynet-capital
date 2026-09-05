import { advisoryScan } from "../support/advisory-scan.js";

// Forward-test id collision gate (docs/COACHES.md: the race the event-research automation lane
// can hit — concurrent sessions each computing "the next FT number" off a shared file's live tip).
// Advisory, same as every other debt gate since Eric's 2026-08-29 call. The blocking half of this
// scan (placement — one fragment per event, issue #1449) lives in forward-tests-fragments.spec.ts.
describe("forward-test id collisions (advisory)", () => {
  it("reports duplicate FT-... ids across docs/research/forward-tests/*.md without blocking CI", () => {
    advisoryScan("scripts/forward-test-id-scan.mjs");
  });
});
