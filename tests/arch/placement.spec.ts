import { advisoryScan } from "../support/advisory-scan.js";

// The placement check (scripts/crawl/placement.mjs, plan #8005 slice 2) over this branch against
// its merge base with origin/main: every member-facing addition (a route, a section, a nav label,
// a dock entry, a new shell or route part) names the IA group it extends, or is flagged homeless.
// ADVISORY, the way the cohesion census is (docs/COACHES.md → Cohesion): a homeless addition or a
// census count above cohesion-budget.json prints here and never fails the suite. The rules are
// pinned over fixtures in tests/scripts/crawl-placement.spec.ts; `ship.sh open` prints the same
// verdict before the push, where the builder can still place the thing in one line.

describe("IA placement", () => {
  it("names each member-facing addition's IA group, or flags it, without blocking CI (advisory)", () => {
    advisoryScan("scripts/crawl/placement.mjs");
  });
});
