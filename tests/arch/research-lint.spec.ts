import { execFileSync } from "node:child_process";

// Research-document contract gate. docs/ISSUES.md measured the rule once already: a surface with a
// template, a guide AND a gate complies; a surface missing one of the three does not. Event ledgers
// had the first two. This is the third.
//
// Deliberately lenient, per the caution banked in docs/IDEAS.md: STRUCTURE fails the gate (does a
// decision header exist, does it carry a graded call), PROSE LENGTH only informs. Never tax the
// capture habit — tax the missing decision.

/** Drive the gate the way CI does — as a subprocess over stdin, never as an import. */
const lintResearchDoc = (md: string): { problems: string[]; notes: string[] } => {
  try {
    return JSON.parse(
      execFileSync("node", ["scripts/research-lint.mjs", "--stdin"], {
        input: md,
        encoding: "utf8",
      }),
    );
  } catch (error) {
    const e = error as { stdout?: Buffer };
    return JSON.parse(e.stdout?.toString() ?? '{"problems":[],"notes":[]}');
  }
};

const header = (table: string, extra = ""): string =>
  [
    "# NVDA earnings print — ledger",
    "",
    "**Kind:** earnings · **Date:** 2026-08-26 (confirmed, IR) · **Impact:** critical",
    "**Last assessed:** 2026-08-24",
    "",
    "## At a glance",
    "",
    "**TL;DR.** Guards only; implied ~7% vs ~2.8% realized.",
    "",
    table,
    "",
    "**Signals & conditions** — the triggers:",
    "",
    "- Don't buy the pop.",
    extra,
    "",
    "## Initial research",
    "",
    "Body.",
  ].join("\n");

const FULL_TABLE = [
  "| Horizon | Call | Confidence | Why | Proves it wrong |",
  "|---|---|---|---|---|",
  "| Today | Stand aside | High | no catalyst | a close over 135 by 2026-08-25 |",
  "| This week | Flat by D-1 | High | gap risk | implied under 4% by 2026-08-25 |",
  "| This month | Own it after | Medium | cheapest entries | reaction day green 3 of 4 |",
  "| This quarter | Revenue intact | Low | capex expanding | a guide cut on 2026-11-19 |",
].join("\n");

describe("research lint — the decision-header contract", () => {
  it("passes a ledger carrying a complete, graded call sheet", () => {
    const { problems } = lintResearchDoc(header(FULL_TABLE));
    expect(problems).toEqual([]);
  });

  it("fails a ledger with no decision header — the wall a reader lands on", () => {
    const { problems } = lintResearchDoc(
      "# T\n\n**Kind:** earnings · **Date:** x · **Impact:** critical\n**Last assessed:** 2026-08-24\n\n## Initial research\n\nWall.\n",
    );
    expect(problems.join(" ")).toContain("no decision header");
  });

  it("fails a header that states calls without confidence — confidence drives size", () => {
    const { problems } = lintResearchDoc(
      header(
        [
          "| Horizon | Call | Why |",
          "|---|---|---|",
          "| Today | Stand aside | no catalyst |",
          "| This week | Flat | risk |",
          "| This month | Own it | cheap |",
          "| This quarter | Intact | capex |",
        ].join("\n"),
      ),
    );
    expect(problems.join(" ")).toContain("Confidence");
  });

  it("fails a header whose calls carry no falsifier — the tape must be able to adjudicate", () => {
    const { problems } = lintResearchDoc(
      header(
        [
          "| Horizon | Call | Confidence | Why |",
          "|---|---|---|---|",
          "| Today | Stand aside | High | no catalyst |",
          "| This week | Flat | High | risk |",
          "| This month | Own it | Low | cheap |",
          "| This quarter | Intact | Low | capex |",
        ].join("\n"),
      ),
    );
    expect(problems.join(" ")).toContain("Proves it wrong");
  });

  it("fails a header missing a horizon — every timeframe gets an honest answer", () => {
    const partial = FULL_TABLE.split("\n").slice(0, 4).join("\n");
    const { problems } = lintResearchDoc(header(partial));
    expect(problems.join(" ")).toContain("this month");
  });

  it("fails a row that states no call at all", () => {
    const blank = FULL_TABLE.replace("| Today | Stand aside | High |", "| Today |  | High |");
    const { problems } = lintResearchDoc(header(blank));
    expect(problems.join(" ")).toContain("states no call");
  });

  it("keeps an undated falsifier ADVISORY — a note, never a gate", () => {
    const undated = FULL_TABLE.replace("a close over 135 by 2026-08-25", "sentiment turns");
    const { problems, notes } = lintResearchDoc(header(undated));
    expect(problems).toEqual([]);
    expect(notes.join(" ")).toContain("falsifier names no date");
  });

  it("keeps an over-long signal ADVISORY — never tax the capture habit", () => {
    const long = `- ${"x".repeat(200)}`;
    const { problems, notes } = lintResearchDoc(header(FULL_TABLE, long));
    expect(problems).toEqual([]);
    expect(notes.join(" ")).toContain("signal over");
  });

  it("does not impose the horizon contract on a multi-name study table", () => {
    const byName = [
      "| Name | The call | Confidence | Why | Proves me wrong |",
      "|---|---|---|---|---|",
      "| MU | Don't initiate | High | priced in | DRAM over +18% QoQ by 2026-10-01 |",
    ].join("\n");
    const { problems } = lintResearchDoc(header(byName));
    expect(problems.join(" ")).not.toContain("this quarter");
  });
});

describe("research budget", () => {
  it("ledgers without a usable call sheet stay within the committed budget", () => {
    expect(() =>
      execFileSync("node", ["scripts/research-lint.mjs"], { cwd: process.cwd(), stdio: "pipe" }),
    ).not.toThrow();
  });

  it("gates the weekly studies too — one contract, one eye (#1716)", () => {
    const audited = JSON.parse(
      execFileSync("node", ["scripts/research-lint.mjs", "--json"], {
        cwd: process.cwd(),
        encoding: "utf8",
        maxBuffer: 32 * 1024 * 1024,
      }),
    ) as { results: { name: string; problems: string[] }[] };
    const weeks = audited.results.filter((r) => r.name.startsWith("weeks/"));
    expect(weeks.length).toBeGreaterThan(0);
    expect(weeks.flatMap((r) => r.problems)).toEqual([]);
  });
});
