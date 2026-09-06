import {
  adjacentIdsOf,
  horizonCallsOf,
  horizonRowsOf,
  tldrOf,
  todayCallOf,
} from "../../src/server/research-event-calls.js";

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

describe("horizonCallsOf — every horizon row, keyed by lens (#1704)", () => {
  const header = (table: string): string =>
    `# T\n\n## At a glance\n\n**TL;DR.** Something.\n\n${table}\n\n## Initial research\n\nBody.\n`;
  const FOUR =
    "| Horizon | Call | Confidence | Why | Proves it wrong |\n|---|---|---|---|---|\n" +
    "| Today (D-13) | **Stand aside** | High | quiet | a 2% move |\n" +
    "| This week | Watch | Medium | CPI Thursday | odds under 50% |\n" +
    "| This month | Accumulate small | Low | seasonality | a close under 100 |\n" +
    "| This quarter | Never size to this | High | second-order only | rate above 1.25% |";

  it("reads all four rows verbatim, emphasis stripped, keyed today/week/month/quarter", () => {
    expect(horizonCallsOf(header(FOUR))).toEqual({
      today: { call: "Stand aside", horizon: "Today (D-13)", confidence: "High" },
      week: { call: "Watch", horizon: "This week", confidence: "Medium" },
      month: { call: "Accumulate small", horizon: "This month", confidence: "Low" },
      quarter: { call: "Never size to this", horizon: "This quarter", confidence: "High" },
    });
  });

  it("omits a horizon the table does not state rather than borrowing a neighbour", () => {
    const md = header("| Horizon | Call | Why |\n|---|---|---|\n| This week | Watch | pending |");
    expect(horizonCallsOf(md)).toEqual({ week: { call: "Watch", horizon: "This week" } });
  });

  it("returns an empty record when the doc states no usable table", () => {
    expect(horizonCallsOf("# T\n\n## Initial research\n\nNothing.\n")).toEqual({});
    expect(horizonCallsOf(header("| Horizon | Why |\n|---|---|\n| Today | no call |"))).toEqual({});
  });

  it("agrees with todayCallOf on the Today row", () => {
    expect(horizonCallsOf(header(FOUR)).today).toEqual(todayCallOf(header(FOUR)));
  });

  describe("horizonRowsOf — the same rows read whole, for a citing document (#1716)", () => {
    it("carries the Why and falsifier cells with their authoring markup intact", () => {
      expect(horizonRowsOf(header(FOUR)).week).toEqual({
        call: "Watch",
        horizon: "This week",
        confidence: "Medium",
        why: "CPI Thursday",
        provesWrong: "odds under 50%",
      });
    });

    it("keeps emphasis in a quoted cell while still normalising the call itself", () => {
      const md = header(
        "| Horizon | Call | Confidence | Why | Proves it wrong |\n|---|---|---|---|---|\n" +
          "| This week | **Stand aside** | High | **23** tracked events | VIX over **18** by 09-10 |",
      );
      expect(horizonRowsOf(md).week).toEqual({
        call: "Stand aside",
        horizon: "This week",
        confidence: "High",
        why: "**23** tracked events",
        provesWrong: "VIX over **18** by 09-10",
      });
    });

    it("reads an absent Why or falsifier column as empty, never as a missing row", () => {
      const md = header("| Horizon | Call | Why |\n|---|---|---|\n| This week | Watch | pending |");
      expect(horizonRowsOf(md).week).toEqual({
        call: "Watch",
        horizon: "This week",
        why: "pending",
        provesWrong: "",
      });
    });

    it("keys the same rows as horizonCallsOf, so the two readers never drift", () => {
      expect(Object.keys(horizonRowsOf(header(FOUR)))).toEqual(
        Object.keys(horizonCallsOf(header(FOUR))),
      );
    });
  });
});

describe("tldrOf / adjacentIdsOf — the digest's other two fields", () => {
  it("reads the TL;DR paragraph as plain text, links and emphasis stripped", () => {
    const md =
      "# T\n\n## At a glance\n\n**TL;DR.** **Stand aside** — see [the Fed](fomc.md); nothing\nhere is ours.\n\n| Horizon | Call |\n|---|---|\n| Today | x |\n";
    expect(tldrOf(md)).toBe("Stand aside — see the Fed; nothing here is ours.");
    expect(
      tldrOf("# T\n\n## At a glance\n\n| Horizon | Call |\n|---|---|\n| Today | x |\n"),
    ).toBeNull();
  });

  it("reads adjacentIds from the probe-ref line and treats junk as no edges", () => {
    const md =
      '# T\n<!-- probe-ref: {"symbols":{},"adjacentIds":["a-1","b-2",3],"screenStreak":0} -->\n';
    expect(adjacentIdsOf(md)).toEqual(["a-1", "b-2"]);
    expect(adjacentIdsOf("# T\n<!-- probe-ref: {not json} -->\n")).toEqual([]);
    expect(adjacentIdsOf("# T\n")).toEqual([]);
  });
});
