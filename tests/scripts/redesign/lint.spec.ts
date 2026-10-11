import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import {
  copyProblems,
  type LintEnv,
  lintDesign,
  quoteFound,
  splitQuotes,
  titleRuns,
} from "../../../scripts/redesign/lint-rules.mjs";

// #5143: the mechanical half of the critic pass. A model critic then judges taste only — so this
// must catch what a script can: missing or heavy pictures, designer jargon, a name the app never
// uses, and a quote of Eric's he never wrote.

const dir = mkdtempSync(join(tmpdir(), "redesign-lint-"));
for (const name of ["t-390.jpg", "t-1280.jpg", "a-390.jpg", "a-1280.jpg", "b-390.jpg"]) {
  writeFileSync(join(dir, name), Buffer.alloc(1024));
}
writeFileSync(join(dir, "b-1280.jpg"), Buffer.alloc(260 * 1024));

const NOTES = "Eric: I can't find the order line. The total matters more than today.";
const ui = { text: "Review order\nGuidance\nTrading ladder", lower: "" };
ui.lower = ui.text.toLowerCase();
const env: LintEnv = {
  pictureSize: (p) => (existsSync(join(dir, p)) ? statSync(join(dir, p)).size : null),
  sourcesFor: () => NOTES,
  ui,
};

const question = (over: Record<string, unknown> = {}) => ({
  q: 1,
  topic: "/trade · app/src/routes/trade.tsx",
  title: "What leads the trade form at phone width?",
  ask: "This round varies only the order.",
  rec: "A",
  conf: "low",
  wrong: "He pins 'put the chain back on top' by 2026-10-17.",
  saw: ["His note: 'I can't find the order line'", "H6 · recognition over recall, severity 3"],
  today: {
    phone: "t-390.jpg",
    desk: "t-1280.jpg",
    source: "scripts/redesign/shoot.mjs",
    caption: "Today, real screenshot.",
  },
  options: [
    {
      key: "A",
      name: "The order line first",
      phone: "a-390.jpg",
      desk: "a-1280.jpg",
      delta: "The order line moves above the Guidance tab.",
    },
    {
      key: "B",
      name: "Nothing moves",
      phone: "b-390.jpg",
      desk: "a-1280.jpg",
      delta: "Today, the control.",
    },
  ],
  ...over,
});
const manifest = (q = question()) => ({ issue: 5150, round: 1, questions: [q] });

describe("lintDesign", () => {
  it("passes a complete round", () => {
    expect(lintDesign(manifest(), env)).toEqual([]);
  });

  it("names a question number that isn't a number, and missing or heavy pictures", () => {
    const q = question({
      q: "q1",
      options: [
        { key: "A", name: "First", phone: "a-390.jpg", delta: "Moves." },
        { key: "B", name: "Second", phone: "nope.jpg", desk: "b-1280.jpg", delta: "Moves." },
      ],
    });
    expect(lintDesign(manifest(q), env)).toEqual([
      'question 1: "q" is a number (1, 2, …), not "q1"',
      "question 1 option A: no desk picture",
      "question 1 option B: phone picture nope.jpg doesn't exist",
      "question 1 option B: desk picture b-1280.jpg is 260KB — 200KB is the cap",
    ]);
  });

  it("asks for the fields the round page needs, a dated falsifier and 2–5 options", () => {
    const q = question({ title: "", conf: "sure", wrong: "If he hates it.", rec: "Z" });
    q.options = q.options.slice(0, 1);
    expect(lintDesign(manifest(q), env)).toEqual([
      'q1: needs "title"',
      'q1: "conf" is low, medium or high',
      'q1: "wrong" needs its date (YYYY-MM-DD) — the day the tape would prove it',
      "q1: 1 options — a round shows 2–5",
      'q1: "rec" Z is not an option\'s key',
    ]);
    expect(lintDesign([question()], env)).toEqual([
      "manifest: wrap the questions as { issue, round, questions: [...] }",
    ]);
  });

  it("refuses a quote of his that isn't in the sources, and takes one cut with an ellipsis", () => {
    const saw = ['His note: "the total… than today"', "Eric: “I never said this”"];
    expect(lintDesign(manifest(question({ saw })), env)).toEqual([
      "q1 saw[1]: “I never said this” isn't in the cited sources or his banked words — quote exactly, mark cuts with …",
    ]);
  });
});

// The redesign commons, 2026-10-11: round 0 picks a problem, not a shape. Its questions carry
// `kind: "problems"`, so the page asks "Fix this first" and the read-back files nothing.
describe("round 0 asks which problem to fix first", () => {
  const problems = (over: Record<string, unknown> = {}) => question({ kind: "problems", ...over });
  const round0 = (q = problems()) => ({ issue: 5150, round: 0, questions: [q] });

  it('passes a round-0 question that sets kind "problems", and a later round that asks one', () => {
    expect(lintDesign(round0(), env)).toEqual([]);
    expect(lintDesign(manifest(problems()), env)).toEqual([]);
  });

  it("names a round-0 question that would ask for a build, and a kind it doesn't know", () => {
    expect(lintDesign(round0(question()), env)).toEqual([
      'q1: round 0 picks a problem — set "kind": "problems" so a pick files no build',
    ]);
    expect(lintDesign(manifest(question({ kind: "problem" })), env)).toEqual([
      'q1: "kind" is "design" (the default) or "problems", not "problem"',
    ]);
  });

  it("asks a problem for its words, not for what it changes", () => {
    const [a, b] = question().options;
    const q = problems({ options: [{ ...a, delta: "" }, b] });
    expect(lintDesign(round0(q), env)).toEqual([
      'q1 option A: needs "delta" — the problem, in a few words',
    ]);
  });

  it("lets copy name the page's own buttons", () => {
    expect(copyProblems("q1 ask", "Mark Fix this first, or Look closer.", ui)).toEqual([]);
  });
});

// Eric, 2026-10-11: a reaction on each pin. The manifest names the pins pin.mjs drew — the same
// JSON, inline or by its file — so the lint holds them to the steer builder's rules before he
// sees the page, and holds their labels to the same plain words as the rest of the copy.
describe("pins on a picture", () => {
  const pins = [
    { n: 1, x: 50, y: 12, label: "range strip", side: "right" },
    { n: 2, x: 30, y: 40, label: "order line" },
  ];
  const withPins = (over: Record<string, unknown>) => {
    const [a, b] = question().options;
    return question({ options: [a, { ...b, ...over }] });
  };
  const pinsEnv: LintEnv = {
    ...env,
    pinsAt: (p) => (p === "pins/b.json" ? { pins } : null),
  };

  it("passes pins inline, by the file pin.mjs read, and on today", () => {
    expect(lintDesign(manifest(withPins({ pins })), env)).toEqual([]);
    expect(lintDesign(manifest(withPins({ pins: "pins/b.json" })), pinsEnv)).toEqual([]);
    const today = { ...question().today, pins: [pins[0]] };
    expect(lintDesign(manifest(question({ today })), env)).toEqual([]);
  });

  it("names a repeated number, a spot off the frame, a long label and a missing file", () => {
    const bad = [
      { n: 1, x: 50, y: 12, label: "range strip" },
      { n: 1, x: 130, y: 40, label: "a".repeat(61) },
    ];
    expect(lintDesign(manifest(withPins({ pins: bad })), env)).toEqual([
      'q1 option B pins pin 1 ("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"): number 1 is used twice',
      'q1 option B pins pin 1 ("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"): x and y are % of the frame, 0–100',
      "q1 option B pins pin 1: label is 61 characters — keep it to 60",
    ]);
    expect(lintDesign(manifest(withPins({ pins: "pins/gone.json" })), pinsEnv)).toEqual([
      "q1 option B: pins file pins/gone.json isn't there or isn't JSON",
    ]);
  });

  it("names pins on a frame the option has no picture for", () => {
    expect(lintDesign(manifest(withPins({ desk: undefined, pinsDesk: pins })), env)).toEqual([
      "q1 option B: no desk picture",
      "q1 option B: pinsDesk names pins on a desk picture it doesn't have",
    ]);
  });

  it("holds a pin's label to plain words", () => {
    const chip = [{ n: 1, x: 5, y: 5, label: "the filter chip clips" }];
    expect(lintDesign(manifest(withPins({ pins: chip })), env)).toEqual([
      "q1 option B pins pin 1: “chip” is jargon — say “button”, “filter” or “tag”",
    ]);
  });
});

describe("plain language", () => {
  it("bans designer jargon outside quotes, and leaves his own words alone", () => {
    expect(
      copyProblems("q1 ask", "A status pill and a chip in the hero, then a modal.", ui),
    ).toEqual([
      "q1 ask: “status pill” is jargon — say what it shows (the label reading “Open”)",
      "q1 ask: “chip” is jargon — say “button”, “filter” or “tag”",
      "q1 ask: “hero” is jargon — name it (“the total at the top”)",
      "q1 ask: “modal” is jargon — say “a pop-up window” or “a confirmation step”",
    ]);
    expect(copyProblems("q1 saw[0]", 'His note: "put it in the slot"', ui)).toEqual([]);
    expect(copyProblems("q1 ask", "A modal sheet opens.", ui)).toEqual([]);
  });

  it("flags a Title-Cased name the app never says, not the app's own or a sentence's first word", () => {
    expect(
      titleRuns("Today the Decision Strip leads, and Guidance follows. October is busy"),
    ).toEqual(["Decision Strip", "Guidance"]);
    expect(
      copyProblems("q1 option A name", "The Decision Strip on the Trading Ladder", ui),
    ).toEqual(["q1 option A name: “Decision Strip” isn't a name the app uses — say what it does"]);
  });
});

describe("quotes", () => {
  it("finds quoted spans in straight, curly and single quotes, apostrophes kept", () => {
    expect(splitQuotes(`His note: 'I can't find it' and "two" and “three”`).quotes).toEqual([
      "two",
      "three",
      "I can't find it",
    ]);
    expect(quoteFound("I can’t find the order line", NOTES)).toBe(true);
    expect(quoteFound("order line... than today", NOTES)).toBe(true);
    expect(quoteFound("than today… order line", NOTES)).toBe(false);
  });
});

describe("the lint command", () => {
  it("exits 1 with one line per problem, and 0 on a clean round", () => {
    const bad = join(dir, "bad.json");
    writeFileSync(bad, JSON.stringify(manifest(question({ q: "1" }))));
    const run = (f: string) =>
      spawnSync(process.execPath, ["scripts/redesign/lint.mjs", f], {
        encoding: "utf8",
        env: { ...process.env, REDESIGN_VERBATIM: "" },
      });
    const failed = run(bad);
    expect(failed.status).toBe(1);
    expect(failed.stdout).toContain('question 1: "q" is a number (1, 2, …), not "1"');
    const notes = join(dir, "notes.md");
    writeFileSync(notes, NOTES);
    const good = join(dir, "good.json");
    writeFileSync(good, JSON.stringify({ ...manifest(), sources: ["notes.md"] }));
    const passed = run(good);
    expect(passed.stdout).toMatch(/clean \(1 question\(s\), 2 options\)/);
    expect(passed.status).toBe(0);
  });
});
