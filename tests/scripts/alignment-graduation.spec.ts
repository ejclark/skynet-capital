import { readFileSync } from "node:fs";
import { describe, expect, it } from "@rstest/core";
import {
  activeGraduated,
  branchOf,
  check,
  parseGraduated,
  parseLedger,
  prBody,
  ruleFour,
  scoreOf,
  withGraduated,
  withoutGraduated,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/alignment-graduation.mjs";

// #7939 slice 3. Rule 3 of docs/process/ALIGNMENT.md: a class with three matches in a row and no
// miss in its last five may graduate to "decide and report", by Eric's one tap. Rule 4: the
// irreversible class never does. Nothing ran the check before this, so nothing ever graduated.

const head = [
  "# ledger",
  "",
  "## Ledger",
  "",
  "| Date | Class | The ask | Predicted (confidence) | Eric's answer | Score |",
  "|---|---|---|---|---|---|",
];
const row = (date: string, cls: string, score: string, ask = "q") =>
  `| ${date} | ${cls} | ${ask} | p | a | ${score} |`;
const doc = (...rows: string[]) => [...head, ...rows, ""].join("\n");

describe("scoreOf: only match and miss are evidence", () => {
  it("reads the first word and ignores the rest of the cell", () => {
    expect(scoreOf("match")).toBe("match");
    expect(scoreOf("miss; a measurement replaced this prediction")).toBe("miss");
    expect(scoreOf("match <!-- ledger:1/2/0 -->")).toBe("match");
  });
  it("counts nothing else either way", () => {
    for (const s of [
      "pending",
      "not predicted",
      "decided on his behalf",
      "unclear (deferred: not now)",
      "score by hand (the prediction is prose)",
    ])
      expect(scoreOf(s)).toBeNull();
  });
});

describe("parseLedger", () => {
  it("orders rows by date, ledger order within a day, and keeps an escaped pipe inside its cell", () => {
    const rows = parseLedger(
      doc(
        row("2026-11-09", "a", "match", "later"),
        row("2026-11-08", "a", "miss", "first"),
        row("2026-11-08", "a", "match", "x \\| y"),
      ),
    );
    expect(rows.map((r: { ask: string }) => r.ask)).toEqual(["first", "x | y", "later"]);
  });
});

describe("check: rule 3", () => {
  const cls = "screen design (taste)";
  it("is eligible at three matches in a row with no miss in the last five", () => {
    const md = doc(
      row("2026-11-01", cls, "miss"),
      row("2026-11-02", cls, "match"),
      row("2026-11-03", cls, "match"),
      row("2026-11-04", cls, "match"),
      row("2026-11-05", cls, "match"),
      row("2026-11-06", cls, "match"),
    );
    const c = check(md).classes[0];
    expect([c.streak, c.lastFiveMisses, c.eligible]).toEqual([5, 0, true]);
    expect(check(md).eligible).toEqual([cls]);
  });
  it("is not eligible with a streak of three but a miss inside the last five", () => {
    const md = doc(
      row("2026-11-01", cls, "match"),
      row("2026-11-02", cls, "miss"),
      row("2026-11-03", cls, "match"),
      row("2026-11-04", cls, "match"),
      row("2026-11-05", cls, "match"),
    );
    const c = check(md).classes[0];
    expect([c.streak, c.lastFiveMisses, c.eligible]).toEqual([3, 1, false]);
  });
  it("lets pending and unpredicted rows neither extend nor break a streak", () => {
    const md = doc(
      row("2026-11-01", cls, "match"),
      row("2026-11-02", cls, "pending"),
      row("2026-11-03", cls, "match"),
      row("2026-11-04", cls, "not predicted"),
      row("2026-11-05", cls, "match"),
    );
    const c = check(md).classes[0];
    expect([c.streak, c.unscored, c.eligible]).toEqual([3, 2, true]);
  });
});

describe("check: rule 4 is a table, and unknown is not eligible", () => {
  const streak = (cls: string) =>
    doc(
      row("2026-11-01", cls, "match"),
      row("2026-11-02", cls, "match"),
      row("2026-11-03", cls, "match"),
    );
  it("never makes spend, credentials or the merge queue eligible", () => {
    for (const cls of ["spend limits", "credentials", "review queue", "schedule (arming)"]) {
      const c = check(streak(cls)).classes[0];
      expect([c.rule3, c.rule4, c.eligible]).toEqual([true, "irreversible", false]);
    }
  });
  it("holds an unmapped class, and reads rule-4 words in one as irreversible", () => {
    expect(check(streak("pizza toppings")).classes[0]).toMatchObject({
      rule4: "unmapped",
      eligible: false,
    });
    expect(ruleFour("token rotation").verdict).toBe("irreversible");
  });
});

describe("Graduated classes: read, write, send back", () => {
  const cls = "session housekeeping";
  const base = doc(
    row("2026-11-01", cls, "match"),
    row("2026-11-02", cls, "match"),
    row("2026-11-03", cls, "match"),
  );

  it("creates the section above the Ledger, then reads it back as graduated", () => {
    const md = withGraduated(base, { cls, date: "2026-11-04", pr: "`x`" });
    expect(md.indexOf("## Graduated classes")).toBeLessThan(md.indexOf("## Ledger"));
    expect(parseGraduated(md)).toEqual([{ cls, date: "2026-11-04", pr: "`x`" }]);
    const c = check(md).classes[0];
    expect([c.eligible, c.sendBack]).toEqual([false, null]);
    expect(activeGraduated(md)).toEqual([cls]);
  });

  it("flags a miss on or after graduation as a send-back, and drops the class from the live list", () => {
    const grad = withGraduated(base, { cls, date: "2026-11-04", pr: "`x`" });
    const fixed = grad.replace(
      row("2026-11-03", cls, "match"),
      `${row("2026-11-03", cls, "match")}\n${row("2026-11-04", cls, "miss", "reversed")}`,
    );
    const c = check(fixed).classes[0];
    expect(c.sendBack).toContain("miss on 2026-11-04");
    expect(activeGraduated(fixed)).toEqual([]);
    const back = withoutGraduated(fixed, { cls, date: "2026-11-05", why: c.sendBack });
    expect(parseGraduated(back)).toEqual([]);
    expect(back).toContain("- 2026-11-05 · session housekeeping sent back: miss on 2026-11-04");
  });

  it("sends back a graduated class that rule 4 holds, whatever its record", () => {
    const md = withGraduated(doc(row("2026-11-01", "credentials", "match")), {
      cls: "credentials",
      date: "2026-11-02",
      pr: "x",
    });
    expect(check(md).sendBack).toEqual(["credentials"]);
    expect(activeGraduated(md)).toEqual([]);
  });
});

describe("prBody: the held PR Eric judges in ten seconds", () => {
  it("passes the picture contract's shape: a table, a filled caption, short Summary bullets", () => {
    const cls = "screen design (taste)";
    const md = doc(
      row("2026-11-01", cls, "match"),
      row("2026-11-02", cls, "match"),
      row("2026-11-03", cls, "match"),
    );
    const body = prBody(check(md).classes[0]);
    expect(body.startsWith("## The picture")).toBe(true);
    expect(body).toMatch(/^_Caption — .{3,}/m);
    const summary = body.split("## Summary")[1].split("<details>")[0];
    for (const l of summary.split("\n").filter((x: string) => x.startsWith("- ")))
      expect(l.length).toBeLessThanOrEqual(120);
    expect(branchOf(cls)).toBe("alignment/graduate-screen-design-taste");
  });
});

describe("the real ledger", () => {
  it("parses every dated row of docs/process/ALIGNMENT.md and classes rule 4 conservatively", () => {
    const md = readFileSync("docs/process/ALIGNMENT.md", "utf8");
    const result = check(md);
    expect(result.counts.match).toBeGreaterThan(0);
    for (const c of result.classes) if (c.eligible) expect(c.rule4).toBe("reversible");
  });
});
