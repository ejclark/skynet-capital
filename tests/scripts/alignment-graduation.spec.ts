import { readFileSync } from "node:fs";
import { describe, expect, it } from "@rstest/core";
import {
  activeGraduated,
  branchOf,
  CLASS_MAP,
  check,
  decidedOf,
  parseGraduated,
  parseLedger,
  prBody,
  RULE_FOUR_ACTS,
  ruleFour,
  ruleFourAct,
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

  // #8059: one keyword list reached only some of the seven irreversible classes, so an ask worded
  // around it graduated. Every irreversible class names its acts, and the old words still veto.
  it("names an act row for every irreversible class in CLASS_MAP", () => {
    const irreversible = Object.entries(CLASS_MAP as Record<string, [string, string]>)
      .filter(([, [verdict]]) => verdict === "irreversible")
      .map(([cls]) => cls);
    const rows = (RULE_FOUR_ACTS as [string, RegExp][]).map(([cls]) => cls);
    expect(rows.sort()).toEqual(irreversible.sort());
  });
  it("vetoes every word the old single list held", () => {
    const old =
      "spend budget credential secret token password merge arm access invite privacy outward deploy";
    for (const w of old.split(" ")) expect([w, ruleFour(w).verdict]).toEqual([w, "irreversible"]);
  });
  it("reads each class's act in plain wording", () => {
    expect(ruleFourAct("Show every member's open positions on the public /login page?")).toBe(
      "member data sharing",
    );
    expect(ruleFourAct("Land the held platter PR #8100 now?")).toBe("review queue");
    expect(ruleFourAct("Turn on the nightly research Routine?")).toBe("schedule (arming)");
    expect(ruleFourAct("Give my friend Dana a login to the app?")).toBe("member onboarding");
    expect(ruleFourAct("Rework the landing page hero on /login?")).toBeNull();
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

describe("rule 5: a class he reverses more than 1 in 4 times returns to asking", () => {
  const cls = "engineering gates";
  const kept = (date: string) => row(date, cls, "decided on his behalf");
  const reversed = (date: string) => row(date, cls, "miss (reversed)");

  it("reads a decided call's Score as kept or reversed, and nothing else as a decided call", () => {
    expect(decidedOf("decided on his behalf")).toBe("kept");
    expect(decidedOf("miss (reversed) <!-- ledger:9 -->")).toBe("reversed");
    expect(decidedOf("miss")).toBeNull();
    expect(decidedOf("match")).toBeNull();
    // a reversal is still a miss for rule 3, so a graduated class is also sent back
    expect(scoreOf("miss (reversed)")).toBe("miss");
  });

  it("treats one reversal in a young class as a data point, and a second as a rate", () => {
    expect(check(doc(kept("2026-11-24"), reversed("2026-11-25"))).tighten).toEqual([]);
    const two = check(doc(kept("2026-11-24"), reversed("2026-11-25"), reversed("2026-11-26")));
    expect(two.tighten).toEqual([cls]);
    expect(two.classes[0].tightenBack).toBe("2 of the last 3 decided calls reversed");
  });

  it("reads a full class over its last 8 decided calls: 2 reversals hold, 3 return it to asking", () => {
    const days = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"];
    const at = (d: string) => `2026-12-${d}`;
    // two old reversals fall out of the window behind eight kept calls
    const aged = doc(
      reversed(at("01")),
      reversed(at("02")),
      ...days.slice(2).map((d) => kept(at(d))),
    );
    expect(check(aged).tighten).toEqual([]);
    const holds = doc(
      ...days.slice(0, 6).map((d) => kept(at(d))),
      reversed(at("07")),
      reversed(at("08")),
    );
    expect(check(holds).tighten).toEqual([]);
    const trips = doc(
      ...days.slice(0, 5).map((d) => kept(at(d))),
      ...days.slice(5, 8).map((d) => reversed(at(d))),
    );
    expect(check(trips).tighten).toEqual([cls]);
  });

  it("counts a graduated class only from its graduation, so graduating again resets the window", () => {
    const md = withGraduated(
      doc(reversed("2026-11-01"), reversed("2026-11-02"), kept("2026-11-05")),
      {
        cls,
        date: "2026-11-04",
        pr: "x",
      },
    );
    expect(check(md).tighten).toEqual([]);
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
