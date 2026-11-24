import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import { gradeArgs, loadRound } from "../../scripts/study/grade.mjs";
import { gradeRound } from "../../scripts/study/grade-round.mjs";
import type { PlanScorecard, PlanSession } from "../../scripts/study/plan-scorecard.mjs";
import {
  chatRecall,
  median,
  planScorecard,
  planScorecardLines,
  withLostness,
} from "../../scripts/study/plan-scorecard.mjs";
import { buildReadout, copySmall, FRAME_CAP, readoutArgs } from "../../scripts/study/readout.mjs";

// The cross-feature plan's scorecard rows (#8005): phone task success, lostness and backtracks,
// and chat sensor recall, read from a round's own sessions so slice 8's re-run prints the same rows.

const chat = (n: number, said: string, drafts: string[] = []) => ({
  kind: "chat",
  n,
  said,
  drafts: drafts.map((kind) => ({ kind })),
});

const A: PlanSession = {
  rel: "5-sessions/a/w/phone/t1/run-1",
  viewport: "phone",
  success: true,
  answered: true,
  lostness: 0.2,
  backtracks: 1,
  chat: [chat(0, "where is my history?"), chat(1, "this page keeps losing my place", ["filing"])],
};
const B: PlanSession = {
  rel: "5-sessions/a/w/phone/t2/run-1",
  viewport: "phone",
  success: false,
  answered: true,
  lostness: 0.6,
  backtracks: 4,
  chat: [chat(0, "nothing here works the way I expect"), { kind: "sent", n: 1 }],
};
const C: PlanSession = {
  rel: "5-sessions/b/w/desktop/t1/run-1",
  viewport: "desktop",
  success: true,
  lostness: 0,
  backtracks: 0,
  chat: [],
};
const SESSIONS = [A, B, C];

/** One viewport's row, which the card must hold. */
function rowOf(card: PlanScorecard, viewport: string) {
  const row = card.byViewport[viewport];
  if (!row) throw new Error(`no ${viewport} row`);
  return row;
}

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
    expect(rowOf(card, "phone")).toMatchObject({
      sessions: 2,
      succeeded: 1,
      answered: 2,
      rate: 0.5,
    });
    expect(rowOf(card, "phone").wilson?.lo).toBeGreaterThan(0);
    expect(rowOf(card, "desktop")).toMatchObject({ sessions: 1, succeeded: 1, rate: 1 });
  });
  it("reports the middle session's lostness and backtracks", () => {
    expect(rowOf(card, "phone").lostness).toBe(0.4);
    expect(rowOf(card, "phone").backtracks).toBe(2.5);
  });
});

describe("withLostness — R from the fewest views a member needed to succeed at the task", () => {
  const base = { viewport: "phone", backtracks: 0, chat: [], lostness: null };
  it("fills a missing lostness from the task's best successful path, and keeps a computed one", () => {
    const out = withLostness([
      { ...base, rel: "a", task: "t1", success: true, uniqueViews: 2, totalViews: 2 },
      { ...base, rel: "b", task: "t1", success: false, uniqueViews: 4, totalViews: 6 },
      {
        ...base,
        rel: "c",
        task: "t1",
        success: true,
        uniqueViews: 3,
        totalViews: 3,
        lostness: 0.9,
      },
    ]);
    expect(out.map((s) => s.lostness)).toEqual([0, 0.601, 0.9]);
  });
  it("leaves a task no member succeeded at without one", () => {
    const out = withLostness([
      { ...base, rel: "a", task: "t2", success: false, uniqueViews: 3, totalViews: 5 },
    ]);
    expect(out[0]?.lostness).toBeNull();
  });
});

describe("chatRecall — friction a member voiced to Moneypenny that became a draft", () => {
  it("says the messages were not labelled when no labels were written, never guesses", () => {
    expect(chatRecall(SESSIONS, null)).toEqual({ messages: 3, labelled: false });
  });
  it("counts a voiced message caught by a filing in that exchange or a later one, and only those", () => {
    const labels = [
      { session: A.rel, n: 0, friction: true },
      { session: A.rel, n: 1, friction: true },
      { session: B.rel, n: 0, friction: true },
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
    const labels = [{ session: A.rel, n: 0, friction: false }];
    expect(chatRecall(SESSIONS, labels)).toMatchObject({ unlabelled: 2, voiced: 0, drafted: 0 });
  });
  it("never counts a view or research question as a caught friction", () => {
    const viewOnly = [{ ...B, chat: [chat(0, "I think NVDA goes up", ["view"])] }];
    const labels = [{ session: B.rel, n: 0, friction: true }];
    expect(chatRecall(viewOnly, labels)).toMatchObject({ voiced: 1, drafted: 0 });
  });
});

describe("planScorecardLines — the rows as the readout prints them", () => {
  it("prints success with its range, the middle lostness and backtracks, and the chat row", () => {
    const text = planScorecardLines(planScorecard({ sessions: SESSIONS })).join("\n");
    expect(text).toContain("| Row | phone | desktop |");
    expect(text).toContain("1 of 2 (50%,");
    expect(text).toContain(
      "| Answered right, from the page or the chat (the place unseen is allowed) | 2 of 2 | 0 of 1 |",
    );
    expect(text).toContain(
      "| Lostness, middle session (0 is a straight path; R = fewest views a member needed to succeed) | 0.4 | 0 |",
    );
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

describe("the readout's stop says what silence does (#8037)", () => {
  it("prints the default under the one question when --silence is given", () => {
    const FIX = join(import.meta.dirname, "../fixtures/study-grade");
    const grade = gradeRound(
      loadRound(gradeArgs(["--sealed", join(FIX, "sealed"), "--round", join(FIX, "round")])),
    );
    const root = mkdtempSync(join(tmpdir(), "study-silence-"));
    const gradePath = join(root, "grade.json");
    writeFileSync(gradePath, JSON.stringify(grade));
    const args = ["--grade", gradePath, "--round", join(FIX, "round"), "--study", "made-up-house"];
    args.push("--next-area", "the kitchen", "--cost", "about 90 short sessions", "--root", root);
    const quiet = buildReadout(readoutArgs(args)).markdown;
    expect(quiet).not.toContain("If you say nothing");
    const said = buildReadout(
      readoutArgs([
        ...args,
        "--silence",
        "the kitchen round starts on Friday\nunless you hold it.",
      ]),
    ).markdown;
    const q = said.indexOf("## One question");
    expect(
      said.indexOf(
        "**If you say nothing:** the kitchen round starts on Friday unless you hold it.",
      ),
    ).toBeGreaterThan(q);
  });
});

describe("copySmall — a frame over the cap is shrunk where the session runs", () => {
  it("turns a large non-JPEG frame into a JPEG under 100KB (sips on a Mac, ImageMagick elsewhere)", () => {
    // A 24-bit BMP gradient, 1600×1000: ~4.8MB, not a JPEG, so it must be shrunk.
    const w = 1600;
    const h = 1000;
    const row = Math.ceil((w * 3) / 4) * 4;
    const buf = Buffer.alloc(54 + row * h);
    buf.write("BM", 0);
    buf.writeUInt32LE(buf.length, 2);
    buf.writeUInt32LE(54, 10);
    buf.writeUInt32LE(40, 14);
    buf.writeInt32LE(w, 18);
    buf.writeInt32LE(h, 22);
    buf.writeUInt16LE(1, 26);
    buf.writeUInt16LE(24, 28);
    buf.writeUInt32LE(row * h, 34);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const o = 54 + y * row + x * 3;
        buf[o] = (x * 255) / w;
        buf[o + 1] = (y * 255) / h;
        buf[o + 2] = 128;
      }
    }
    const dir = mkdtempSync(join(tmpdir(), "study-shrink-"));
    const src = join(dir, "big.bmp");
    writeFileSync(src, buf);
    const out = copySmall(src, join(dir, "small.jpg"));
    const bytes = readFileSync(out);
    expect(bytes.length).toBeLessThanOrEqual(FRAME_CAP);
    expect(bytes.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
  });
});
