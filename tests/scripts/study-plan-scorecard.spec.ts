import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import { gradeArgs, loadRound } from "../../scripts/study/grade.mjs";
import { gradeRound } from "../../scripts/study/grade-round.mjs";
import {
  chatRecall,
  median,
  planScorecard,
  planScorecardLines,
} from "../../scripts/study/plan-scorecard.mjs";
import { buildReadout, readoutArgs } from "../../scripts/study/readout.mjs";

// The cross-feature plan's scorecard rows (#8005): phone task success, lostness and backtracks,
// and chat sensor recall, read from a round's own sessions so slice 8's re-run prints the same rows.

const chat = (n: number, said: string, drafts: string[] = []) => ({
  kind: "chat",
  n,
  said,
  drafts: drafts.map((kind) => ({ kind })),
});

const SESSIONS = [
  {
    rel: "5-sessions/a/w/phone/t1/run-1",
    viewport: "phone",
    success: true,
    lostness: 0.2,
    backtracks: 1,
    chat: [chat(0, "where is my history?"), chat(1, "this page keeps losing my place", ["filing"])],
  },
  {
    rel: "5-sessions/a/w/phone/t2/run-1",
    viewport: "phone",
    success: false,
    lostness: 0.6,
    backtracks: 4,
    chat: [chat(0, "nothing here works the way I expect"), { kind: "sent", n: 1 }],
  },
  {
    rel: "5-sessions/b/w/desktop/t1/run-1",
    viewport: "desktop",
    success: true,
    lostness: 0,
    backtracks: 0,
    chat: [],
  },
];

describe("median — the middle session's value", () => {
  it("takes the middle of an odd count and the mean of the two middles of an even one", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
  });
  it("skips sessions with no value and is null when none has one", () => {
    expect(median([null, 0.4, undefined])).toBe(0.4);
    expect(median([null])).toBeNull();
  });
});

describe("planScorecard — success, lostness and backtracks by viewport, phone first", () => {
  const card = planScorecard({ sessions: SESSIONS });
  it("counts the oracle's verdicts per viewport with a Wilson range", () => {
    expect(Object.keys(card.byViewport)).toEqual(["phone", "desktop"]);
    expect(card.byViewport.phone).toMatchObject({ sessions: 2, succeeded: 1, rate: 0.5 });
    expect(card.byViewport.phone.wilson?.lo).toBeGreaterThan(0);
    expect(card.byViewport.desktop).toMatchObject({ sessions: 1, succeeded: 1, rate: 1 });
  });
  it("reports the middle session's lostness and backtracks", () => {
    expect(card.byViewport.phone.lostness).toBe(0.4);
    expect(card.byViewport.phone.backtracks).toBe(2.5);
  });
});

describe("chatRecall — friction a member voiced to Moneypenny that became a draft", () => {
  it("says the messages were not labelled when no labels were written, never guesses", () => {
    expect(chatRecall(SESSIONS, null)).toEqual({ messages: 3, labelled: false });
  });
  it("counts a voiced message caught by a filing in that exchange or a later one, and only those", () => {
    const labels = [
      { session: SESSIONS[0].rel, n: 0, friction: true },
      { session: SESSIONS[0].rel, n: 1, friction: true },
      { session: SESSIONS[1].rel, n: 0, friction: true },
    ];
    expect(chatRecall(SESSIONS, labels)).toMatchObject({
      messages: 3,
      labelled: true,
      unlabelled: 0,
      voiced: 3,
      drafted: 2,
      rate: 0.667,
    });
  });
  it("leaves a lookup out of the count and an unlabelled message apart", () => {
    const labels = [{ session: SESSIONS[0].rel, n: 0, friction: false }];
    expect(chatRecall(SESSIONS, labels)).toMatchObject({ unlabelled: 2, voiced: 0, drafted: 0 });
  });
  it("never counts a view or research question as a caught friction", () => {
    const viewOnly = [{ ...SESSIONS[1], chat: [chat(0, "I think NVDA goes up", ["view"])] }];
    const labels = [{ session: SESSIONS[1].rel, n: 0, friction: true }];
    expect(chatRecall(viewOnly, labels)).toMatchObject({ voiced: 1, drafted: 0 });
  });
});

describe("planScorecardLines — the rows as the readout prints them", () => {
  it("prints success with its range, the middle lostness and backtracks, and the chat row", () => {
    const text = planScorecardLines(planScorecard({ sessions: SESSIONS })).join("\n");
    expect(text).toContain("| Row | phone | desktop |");
    expect(text).toContain("1 of 2 (50%,");
    expect(text).toContain("| Lostness, middle session (0 is a straight path) | 0.4 | 0 |");
    expect(text).toContain("Chat sensor recall: not labelled yet (3 member messages");
  });
});

describe("the readout carries the plan's rows in its scorecard section", () => {
  it("renders them from the round's own sessions", () => {
    const FIX = join(import.meta.dirname, "../fixtures/study-grade");
    const grade = gradeRound(
      loadRound(
        gradeArgs([
          "--sealed",
          join(FIX, "sealed"),
          "--round",
          join(FIX, "round"),
          "--struck",
          join(FIX, "round/struck.json"),
          "--negative",
          join(FIX, "negative"),
          "--positive",
          join(FIX, "positive"),
        ]),
      ),
    );
    const root = mkdtempSync(join(tmpdir(), "study-plan-scorecard-"));
    const gradePath = join(root, "grade.json");
    writeFileSync(gradePath, JSON.stringify(grade));
    const { markdown } = buildReadout(
      readoutArgs([
        "--grade",
        gradePath,
        "--round",
        join(FIX, "round"),
        "--study",
        "made-up-house",
        "--next-area",
        "the kitchen",
        "--cost",
        "about 90 short sessions",
        "--root",
        root,
      ]),
    );
    const card = markdown.indexOf("### The plan's scorecard (#8005)");
    expect(card).toBeGreaterThan(markdown.indexOf("## Your items, one by one"));
    expect(card).toBeLessThan(markdown.indexOf("## The design battle-test"));
    expect(markdown).toContain("| Row | phone | desktop |");
  });
});
