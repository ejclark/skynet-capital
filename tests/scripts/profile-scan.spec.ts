// profile-scan: every prediction Eric overturns reaches his profile (#8197 slice 2). Each of the
// capsule's four deliberate bugs turns one test here red: (1) an exact `miss` only, skipping
// `miss; …` rows; (2) the grace period counted from today, not the row's date; (3) a citation
// accepted in any file; (4) a match on the date alone.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import {
  askIdOf,
  cites,
  dueHypotheses,
  FILES,
  invalidHypotheses,
  judge,
  ledgerRows,
  MISSES_MARKER,
  matchShare,
  memberHypotheses,
  missesIssue,
  parseHypotheses,
  uncitedMisses,
} from "../../scripts/profile-scan.mjs";

const ledger = (...rows: string[]) =>
  [
    "## Ledger",
    "",
    "| Date | Class | The ask | Predicted (confidence) | Eric's answer | Score |",
    "|---|---|---|---|---|---|",
    ...rows,
    "",
  ].join("\n");

const LEDGER = ledger(
  "| 2026-10-26 | spend | #6020 · trip the breaker? | $60 (medium) | A2 | miss; a later row replaced this |",
  "| 2026-11-08 | taste | #7018 round 1 Q1 · where do you ask? | Under each story (medium; eric.md H1) | Both | miss |",
  "| 2026-11-08 | taste | #7018 round 3 Q1 · lines, tiles or bars? | C (medium) | All three | miss |",
  "| 2026-11-08 | taste | #7018 round 2 Q2 · reports? | On the story (medium) | Build | match |",
  "| 2026-11-05 | housekeeping | #6870 S1 archive? | Archive (medium) | Run it here | miss; no profile change: superseded |",
);

describe("profile-scan: which misses are owed a profile line", () => {
  it("reads a `miss; …` Score as a miss (bug 1)", () => {
    const owed = uncitedMisses(ledgerRows(LEDGER), [""], "2026-12-01").map((r) => r.cite);
    expect(owed).toContain("ALIGNMENT 2026-10-26 · #6020");
  });

  it("skips a row whose Score says `no profile change:`", () => {
    const owed = uncitedMisses(ledgerRows(LEDGER), [""], "2026-12-01").map((r) => r.askId);
    expect(owed).not.toContain("#6870");
    expect(owed).toHaveLength(3);
  });

  it("matches on date and ask id, never the date alone (bug 4)", () => {
    const profile = "… (ALIGNMENT 2026-11-08 · #7018 round 1 Q1, miss) …";
    const owed = uncitedMisses(ledgerRows(LEDGER), [profile], "2026-12-01").map((r) => r.askId);
    expect(owed).toEqual(["#6020", "#7018 round 3 Q1"]);
  });

  it("reads a citation wrapped across lines, and never a longer id as a shorter one", () => {
    expect(
      cites(
        "ALIGNMENT 2026-11-08 · #7018\n  round 3 Q1, miss",
        "ALIGNMENT 2026-11-08 · #7018 round 3 Q1",
      ),
    ).toBe(true);
    expect(
      cites("ALIGNMENT 2026-11-08 · #7018 round 1 Q1", "ALIGNMENT 2026-11-08 · #7018 round 1"),
    ).toBe(false);
  });

  it("takes the ask id before ` · `, else the first #N, else the cell", () => {
    expect(askIdOf("#7018 round 5 Q3 · where does a side thread live?")).toBe("#7018 round 5 Q3");
    expect(askIdOf("#6870 S1 done: archive it?")).toBe("#6870");
    expect(askIdOf("Archive this session?")).toBe("Archive this session?");
  });
});

describe("profile-scan: the fitness verdict (misses-reach-profile)", () => {
  const one = ledger("| 2026-11-20 | taste | #9000 · a or b? | A (medium) | B | miss |");

  it("counts the grace period from the row's date, not from today (bug 2)", () => {
    expect(judge({ ledgerMd: one, profileTexts: [""], today: "2026-11-27" }).status).toBe("pass");
    expect(judge({ ledgerMd: one, profileTexts: [""], today: "2026-11-28" }).status).toBe("fail");
  });

  it("names each late miss in its detail", () => {
    const v = judge({ ledgerMd: one, profileTexts: [""], today: "2026-12-01" });
    expect(v.detail).toContain("2026-11-20 · #9000");
  });

  it("accepts a citation only in the profile texts it is handed (bug 3)", () => {
    const cite = "ALIGNMENT 2026-11-20 · #9000";
    expect(judge({ ledgerMd: one, profileTexts: [cite], today: "2026-12-01" }).status).toBe("pass");
    // The ledger itself names the date and the ask; that is not a profile line.
    expect(
      judge({ ledgerMd: `${one}\n${cite}`, profileTexts: [""], today: "2026-12-01" }).status,
    ).toBe("fail");
  });

  it("reads the profile files and nothing else", () => {
    expect(FILES.profile.map((f) => f.split("docs/")[1])).toEqual([
      "members/eric.md",
      "READERS.md",
    ]);
  });

  it("passes on the real ledger and profile as of this slice", () => {
    const v = judge({
      ledgerMd: readFileSync(FILES.ledger, "utf8"),
      profileTexts: FILES.profile.map((f) => readFileSync(f, "utf8")),
      // Pinned: a time check here would turn unrelated PRs red; the clock contract owns "now".
      today: "2026-11-24",
    });
    expect(v).toMatchObject({ status: "pass" });
  });
});

describe("profile-scan: hypotheses", () => {
  const md = [
    "- _hypothesis H2 (2026-09-26, rewritten 2026-11-23) — he reads the left edge first. Proves it",
    "  wrong (check by 2026-12-31): a pin right of 50%._",
    "- _hypothesis — an old guess. Proves it wrong: someday._",
    "  - _hypothesis H9 (2026-11-23) — no falsifier here._",
  ].join("\n");

  it("parses id, dates and falsifier across wrapped lines", () => {
    const [h2] = parseHypotheses(md, "eric.md");
    expect(h2).toMatchObject({
      id: "H2",
      written: "2026-09-26",
      checkBy: "2026-12-31",
      falsifier: true,
    });
  });

  it("flags every unchecked one in eric.md, and only numbered ones elsewhere", () => {
    expect(invalidHypotheses(parseHypotheses(md, "eric.md"))).toHaveLength(2);
    expect(invalidHypotheses(parseHypotheses(md, "scenarios.md")).map((h) => h.id)).toEqual(["H9"]);
  });

  it("lists a hypothesis as due on its check-by date", () => {
    const hyps = parseHypotheses(md, "eric.md");
    expect(dueHypotheses(hyps, "2026-12-30")).toHaveLength(0);
    expect(dueHypotheses(hyps, "2026-12-31").map((h) => h.id)).toEqual(["H2"]);
  });

  it("holds every member file to the grammar (the --validate format check)", () => {
    expect(invalidHypotheses(memberHypotheses())).toEqual([]);
    expect(
      parseHypotheses(readFileSync(join(FILES.members, "eric.md"), "utf8")).length,
    ).toBeGreaterThanOrEqual(8);
  });
});

describe("profile-scan: review fixes", () => {
  it("cites the whole cell when a bare #N would be shared by two asks on one day", () => {
    const rows = ledgerRows(
      ledger(
        "| 2026-11-05 | x | #6870 S1: archive? | A | B | miss |",
        "| 2026-11-05 | x | #6870 S2: merge? | A | B | miss |",
      ),
    );
    expect(rows.map((r) => r.askId)).toEqual(["#6870 S1: archive?", "#6870 S2: merge?"]);
    const owed = uncitedMisses(rows, ["ALIGNMENT 2026-11-05 · #6870 S1: archive?"], "2026-12-01");
    expect(owed.map((r) => r.askId)).toEqual(["#6870 S2: merge?"]);
  });

  it("cites the whole cell when two `#N · question` asks share an issue and a day (#8342)", () => {
    // answer-readback writes one `#N · <question>` row per question on a card, all dated the reply.
    const rows = ledgerRows(
      ledger(
        "| 2026-12-01 | taste | #8300 · which layout? | A (medium) | B | miss |",
        "| 2026-12-01 | taste | #8300 · which colour? | A (medium) | C | miss |",
      ),
    );
    expect(new Set(rows.map((r) => r.cite)).size).toBe(2);
    const owed = uncitedMisses(
      rows,
      ["(ALIGNMENT 2026-12-01 · #8300 · which layout?, miss)"],
      "2026-12-20",
    );
    expect(owed.map((r) => r.askId)).toEqual(["#8300 · which colour?"]);
    // One line citing the bare id clears neither: it no longer names a single ask.
    expect(
      uncitedMisses(rows, ["(ALIGNMENT 2026-12-01 · #8300, miss)"], "2026-12-20"),
    ).toHaveLength(2);
  });

  it("keeps the short `#N` cite for a `#N · question` ask alone on its day", () => {
    const [row] = ledgerRows(
      ledger("| 2026-12-01 | taste | #8300 · which layout? | A | B | miss |"),
    );
    expect(row?.cite).toBe("ALIGNMENT 2026-12-01 · #8300");
  });

  it("never swallows the next hypothesis when text follows a closing underscore", () => {
    const md = [
      "- _hypothesis H9 (2026-12-01) — guess. Proves it wrong: x._ (#9001)",
      "- _hypothesis H10 (2026-12-01) — guess. Proves it wrong (check by 2027-01-01): y._",
    ].join("\n");
    const hyps = parseHypotheses(md, "eric.md");
    expect(hyps.map((h) => [h.id, h.checkBy])).toEqual([
      ["H9", null],
      ["H10", "2027-01-01"],
    ]);
  });

  it("escapes a pipe in a routed row", () => {
    const rows = ledgerRows(ledger("| 2026-11-20 | x | #1 · a? | A | A \\| B, both | miss |"));
    const issue = missesIssue(uncitedMisses(rows, [""], "2026-12-01"));
    expect(issue.body).toContain("| A \\| B, both |");
  });
});

describe("profile-scan: the routed issue and the match share", () => {
  it("files one ready feedback issue found by its marker, naming the line a prediction leaned on", () => {
    const issue = missesIssue(uncitedMisses(ledgerRows(LEDGER), [""], "2026-12-01"));
    expect(issue.labels).toEqual(["feedback", "ready"]);
    expect(issue.body.startsWith(MISSES_MARKER)).toBe(true);
    expect(issue.body).toContain("| `ALIGNMENT 2026-11-08 · #7018 round 1 Q1` |");
    expect(issue.body).toContain("| H1 |");
    expect(issue.title).toBe("Change Eric's profile for 3 overturned predictions");
  });

  it("reads the match share over rows dated after the audit only", () => {
    const rows = ledgerRows(
      ledger(
        "| 2026-11-23 | x | #1 · a? | A | B | miss |",
        "| 2026-11-24 | x | #2 · a? | A | A | match |",
        "| 2026-11-25 | x | #3 · a? | A | B | miss; why |",
        "| 2026-11-25 | x | #4 · a? | A | — | pending |",
      ),
    );
    expect(matchShare(rows)).toEqual({ match: 1, scored: 2, share: 0.5 });
  });
});
