import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// Research-document contract gate. docs/ISSUES.md measured the rule once already: a surface with a
// template, a guide AND a gate complies; a surface missing one of the three does not. Event ledgers
// had the first two. This is the third.
//
// Deliberately lenient, per the caution banked in docs/IDEAS.md: STRUCTURE fails the gate (does a
// decision header exist, does it carry a graded call), PROSE LENGTH only informs. Never tax the
// capture habit — tax the missing decision.

/** Drive the gate the way CI does — as a subprocess over stdin, never as an import. */
const lintResearchDoc = (
  md: string,
  today = "2026-10-18",
): { problems: string[]; notes: string[]; callLine?: string } => {
  try {
    return JSON.parse(
      execFileSync("node", ["scripts/research-lint.mjs", "--stdin", `--today=${today}`], {
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
    "- **Buy signal:** no — guards only into the print.",
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

  it("notes a non-empty probe-ref.blocked array as advisory, never a failure (#1711)", () => {
    const md = header(FULL_TABLE).replace(
      "**Last assessed:** 2026-08-24",
      '**Last assessed:** 2026-08-24\n<!-- probe-ref: {"symbols":{"NVDA":182.43},"vix":15.2,' +
        '"daysBand":"critical:8+","adjacentIds":[],"screenStreak":0,' +
        '"blocked":[{"url":"https://nyse.com/x","status":"EGRESS_BLOCKED","at":"2026-09-06"}]} -->',
    );
    const { problems, notes } = lintResearchDoc(md);
    expect(problems).toEqual([]);
    expect(notes.join(" ")).toContain(
      "1 blocked source(s) recorded — prefix must be the secondary's",
    );
  });

  it("stays silent on blocked sources when probe-ref carries no `blocked` field", () => {
    const md = header(FULL_TABLE).replace(
      "**Last assessed:** 2026-08-24",
      '**Last assessed:** 2026-08-24\n<!-- probe-ref: {"symbols":{"NVDA":182.43},"vix":15.2,' +
        '"daysBand":"critical:8+","adjacentIds":[],"screenStreak":0} -->',
    );
    const { problems, notes } = lintResearchDoc(md);
    expect(problems).toEqual([]);
    expect(notes.join(" ")).not.toContain("blocked source(s)");
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

describe("research lint — the buy line position guidance reads (#3729)", () => {
  const without = (md: string) => md.replace(/- \*\*Buy signal:\*\*.*\n/, "");

  it("fails an earnings ledger with no Buy signal line — guidance would read silence as no", () => {
    const { problems } = lintResearchDoc(without(header(FULL_TABLE)));
    expect(problems.join(" ")).toContain("no `- **Buy signal:** yes|no");
  });

  it("holds the line to yes or no — a hedge is not a signal the guidance can act on", () => {
    const hedged = header(FULL_TABLE).replace("**Buy signal:** no", "**Buy signal:** maybe");
    expect(lintResearchDoc(hedged).problems.join(" ")).toContain('says "maybe"');
    const yes = header(FULL_TABLE).replace("**Buy signal:** no", "**Buy signal:** Yes");
    expect(lintResearchDoc(yes).problems).toEqual([]);
  });

  it("asks nothing of a ledger the guidance never reads", () => {
    const macro = without(header(FULL_TABLE)).replace("**Kind:** earnings", "**Kind:** macro");
    expect(lintResearchDoc(macro).problems).toEqual([]);
  });
});

describe("research lint — the ledger's Call line is advisory, never a gate (#4807)", () => {
  const upcoming = header(FULL_TABLE).replace("2026-08-26 (confirmed", "2026-11-04 (confirmed");
  const stated = (line: string) => upcoming.replace("\n**Signals", `\n${line}\n\n**Signals`);

  it("counts an upcoming-event ledger without the line as missing, and fails nothing", () => {
    const r = lintResearchDoc(upcoming);
    expect(r.problems).toEqual([]);
    expect(r.callLine).toBe("missing");
  });

  it("asks nothing of a ledger whose event has passed", () => {
    expect(lintResearchDoc(header(FULL_TABLE)).callLine).toBe("n/a");
    expect(lintResearchDoc(upcoming, "2026-11-05").callLine).toBe("n/a");
  });

  it("reads a well-formed line as stated, with no note", () => {
    const r = lintResearchDoc(stated("**Call:** hold until 2026-11-09"));
    expect(r.callLine).toBe("stated");
    expect(r.problems).toEqual([]);
    expect(r.notes.join(" ")).not.toContain("**Call:**");
  });

  it("notes a malformed line, never fails it", () => {
    for (const [line, note] of [
      ["**Call:** accumulate until 2026-11-09", "expected buy"],
      ["**Call:** hold", "no `until YYYY-MM-DD`"],
      ["**Call:** hold until 2026-02-31", "not a real day"],
    ] as const) {
      const r = lintResearchDoc(stated(line));
      expect(r.problems).toEqual([]);
      expect(r.notes.join(" ")).toContain(note);
    }
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

  it("gates the convictions too — a member's view is one call-sheet row per claim (#5482)", () => {
    const audited = JSON.parse(
      execFileSync("node", ["scripts/research-lint.mjs", "--json"], {
        cwd: process.cwd(),
        encoding: "utf8",
        maxBuffer: 32 * 1024 * 1024,
      }),
    ) as { results: { name: string; problems: string[] }[] };
    const convictions = audited.results.filter((r) => r.name.startsWith("convictions/"));
    expect(convictions.map((r) => r.name)).toContain("convictions/ai-dip-2026-10.md");
    expect(convictions.flatMap((r) => r.problems)).toEqual([]);
  });
});

// Honest degradation: a missing input is a named state, never a quiet pass. Each case runs the
// real gate in a seeded temp dir (its ROOT is the cwd).
describe("research lint — missing inputs are named", () => {
  const SCRIPT = resolve("scripts/research-lint.mjs");
  const gate = (seed: {
    events?: boolean;
    weeks?: boolean;
    convictions?: string;
    budget?: string;
  }) => {
    const dir = mkdtempSync(join(tmpdir(), "research-lint-"));
    try {
      if (seed.events) {
        mkdirSync(join(dir, "docs", "research", "events"), { recursive: true });
        writeFileSync(join(dir, "docs", "research", "events", "nvda.md"), header(FULL_TABLE));
      }
      if (seed.weeks) mkdirSync(join(dir, "docs", "research", "weeks"), { recursive: true });
      if (seed.convictions !== undefined) {
        mkdirSync(join(dir, "docs", "research", "convictions"), { recursive: true });
        if (seed.convictions)
          writeFileSync(join(dir, "docs", "research", "convictions", "view.md"), seed.convictions);
      }
      if (seed.budget !== undefined) writeFileSync(join(dir, "research-budget.json"), seed.budget);
      return spawnSync("node", [SCRIPT], { cwd: dir, encoding: "utf8" });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };
  const BUDGET = '{ "uncalledLedgers": 0 }\n';

  it("passes a seeded checkout with every input present, and prints no note", () => {
    const res = gate({ events: true, weeks: true, convictions: "", budget: BUDGET });
    expect(res.status).toBe(0);
    expect(res.stderr).toBe("");
  });

  it("counts a conviction with no call sheet as debt, the same as a ledger", () => {
    const res = gate({
      events: true,
      weeks: true,
      convictions: "# A view\n\n**Kind:** conviction\n**Last assessed:** 2026-10-16\n\nProse.\n",
      budget: BUDGET,
    });
    expect(res.status).toBe(1);
    expect(res.stdout).toContain("convictions/view.md");
  });

  it("still gates the ledgers without a convictions dir, and prints a note naming it", () => {
    const res = gate({ events: true, weeks: true, budget: BUDGET });
    expect(res.status).toBe(0);
    expect(res.stderr).toMatch(
      /^· no research dir at .*convictions — its documents were not checked$/m,
    );
  });

  it("exits 2 UNKNOWN when there is no ledger dir, instead of passing zero documents", () => {
    const res = gate({ weeks: true, budget: BUDGET });
    expect(res.status).toBe(2);
    expect(res.stderr).toMatch(/UNKNOWN — no ledger dir at .*events; nothing was checked/);
  });

  it("exits 2 UNKNOWN when there is no budget, instead of capping the debt at itself", () => {
    const res = gate({ events: true, weeks: true });
    expect(res.status).toBe(2);
    expect(res.stderr).toContain("UNKNOWN — no usable uncalledLedgers");
  });

  it("treats a budget without uncalledLedgers the same as no budget", () => {
    const res = gate({ events: true, weeks: true, budget: "{}\n" });
    expect(res.status).toBe(2);
  });

  it("still gates the ledgers without a weekly-studies dir, and prints a note naming it", () => {
    const res = gate({ events: true, budget: BUDGET });
    expect(res.status).toBe(0);
    expect(res.stderr).toMatch(/^· no research dir at .*weeks — its documents were not checked$/m);
  });

  it("notes a malformed probe-ref block instead of skipping the blocked-source check silently", () => {
    const md = `${header(FULL_TABLE)}\n\n<!-- probe-ref: {"blocked": [} -->\n`;
    const { problems, notes } = lintResearchDoc(md);
    expect(problems).toEqual([]);
    expect(notes).toContain("note: probe-ref block is malformed — blocked sources not checked");
  });
});
