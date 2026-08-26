import { todayCallOf } from "../../src/server/research-event-calls.js";

// Full behavioral coverage of the call-sheet contract lives in research-service.spec.ts, which
// exercises todayCallOf through the re-export research-service.ts keeps for existing importers.
// This spec imports the module directly (its actual home since 2026-08-26) so the fitness gate's
// per-file coverage check has a direct edge onto it too — the same behavior, one more anchor.

describe("todayCallOf — imported from its own module", () => {
  it("reads the Today row's call, horizon, and confidence when the header states one", () => {
    const md =
      "# T\n\n## At a glance\n\n**TL;DR.** Something.\n\n| Horizon | Call | Confidence | Why | Proves it wrong |\n|---|---|---|---|---|\n| Today | Stand aside | High | no catalyst | a close over 135 |\n\n## Initial research\n\nBody.\n";
    expect(todayCallOf(md)).toEqual({ call: "Stand aside", horizon: "Today", confidence: "High" });
  });

  it("returns null rather than guessing when the doc states no call at all", () => {
    expect(todayCallOf("# T\n\n## Initial research\n\nNo decision header here.\n")).toBeNull();
  });
});
