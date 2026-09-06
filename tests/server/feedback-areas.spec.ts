import { renderShell } from "../../src/observatory/dashboard-shell.js";
import { AREA_PROMPT_CLAUSE, areaFrom, FEEDBACK_AREAS } from "../../src/server/feedback-areas.js";

/**
 * The "where in the app" list, tested for the one failure it actually had: going stale.
 *
 * #449 and #455 were both filed with `Area: Somewhere else` — not because the members were vague,
 * but because the places they meant (Portfolio, The Wire, Collections, Milestones) had no option.
 * The list now mirrors the drawer, so the drift these cases watch for is the nav growing a view
 * the form cannot name.
 */

/** Every label in the drawer's "Views" section — the places a member can name by clicking them. */
function drawerViewLabels(): readonly string[] {
  const html = renderShell(
    { active: "board", canAdd: true, authed: true, currentId: "p-1" },
    "<p>x</p>",
    "2026-08-26T12:00:00Z",
  );
  const views = html.split('<nav class="drawer-nav" aria-label="Views">')[1]?.split("</nav>")[0];
  return [...(views ?? "").matchAll(/<span class="dnav-label">([^<]*)<\/span>/g)].map(
    (m) => m[1] ?? "",
  );
}

describe("the feedback area list", () => {
  it("names every view the drawer offers, so no member has to answer 'Somewhere else'", () => {
    const labels = drawerViewLabels();
    // Guard the guard: an extraction that silently found nothing would pass the filter below
    // vacuously and watch for drift forever without ever seeing any.
    expect(labels).toContain("Standings");
    expect(labels.length).toBeGreaterThanOrEqual(5);

    const missing = labels.filter(
      (label) => !(FEEDBACK_AREAS as readonly string[]).includes(label),
    );

    expect(missing).toEqual([]);
  });

  it("keeps an escape hatch for what the drawer does not cover", () => {
    expect(FEEDBACK_AREAS).toContain("Somewhere else");
  });

  it("offers the two surfaces that have no drawer link but plenty of feedback", () => {
    // A member can hit a broken sign-in or a confusing form without ever reaching the nav.
    expect(FEEDBACK_AREAS).toContain("The login");
    expect(FEEDBACK_AREAS).toContain("This feedback form");
  });

  it("lists each area exactly once", () => {
    expect(new Set(FEEDBACK_AREAS).size).toBe(FEEDBACK_AREAS.length);
  });
});

describe("the area a coach draft claims", () => {
  it("is kept when it is one we offer", () => {
    expect(areaFrom({ area: "Activity" })).toEqual({ area: "Activity" });
  });

  it("is dropped, not guessed, when the model invents one", () => {
    // A wrong pre-selection is worse than none: the member has no reason to re-check a field
    // that already looks answered.
    expect(areaFrom({ area: "the wire" })).toEqual({});
    expect(areaFrom({ area: "The Tower" })).toEqual({});
    expect(areaFrom({})).toEqual({});
    expect(areaFrom({ area: 7 })).toEqual({});
  });
});

describe("the clause the coach's prompt enumerates", () => {
  it("offers every area the form does, so the two can never disagree", () => {
    for (const area of FEEDBACK_AREAS) {
      expect(AREA_PROMPT_CLAUSE).toContain(area);
    }
  });

  it("glosses each bare drawer word with what it covers", () => {
    // The option text stays the drawer word for the member; the model needs the route.
    expect(AREA_PROMPT_CLAUSE).toContain("/activity");
    expect(AREA_PROMPT_CLAUSE).toContain("/learn");
  });

  it("asks for the bare name back, since the gloss would fail validation", () => {
    expect(AREA_PROMPT_CLAUSE).toContain("without the parenthetical");
  });
});
