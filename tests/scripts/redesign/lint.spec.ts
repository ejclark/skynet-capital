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
import { MAX_PIN_LABEL } from "../../../scripts/steer/pins.mjs";

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
      "question 1 option B: phone picture nope.jpg doesn't exist",
      "question 1 option B: desk picture b-1280.jpg is 260KB — 200KB is the cap",
    ]);
  });

  it("asks for the fields the round page needs, a dated falsifier and 1–5 options", () => {
    const one = question();
    one.options = one.options.slice(0, 1);
    one.rec = String(one.options[0]?.key);
    expect(lintDesign(manifest(one), env)).toEqual([]);
    const q = question({ title: "", conf: "sure", wrong: "If he hates it.", rec: "Z" });
    q.options = [];
    expect(lintDesign(manifest(q), env)).toEqual([
      'q1: needs "title"',
      'q1: "conf" is low, medium or high',
      'q1: "wrong" needs its date (YYYY-MM-DD) — the day the tape would prove it',
      "q1: 0 options — a round shows 1–5",
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
      { n: 1, x: 130, y: 40, label: "a".repeat(MAX_PIN_LABEL + 1) },
    ];
    const long = `q1 option B pins pin 1 ("${"a".repeat(MAX_PIN_LABEL + 1)}")`;
    expect(lintDesign(manifest(withPins({ pins: bad })), env)).toEqual([
      `${long}: number 1 is used twice`,
      `${long}: x and y are % of the frame, 0–100`,
      `q1 option B pins pin 1: label is ${MAX_PIN_LABEL + 1} characters — keep it to ${MAX_PIN_LABEL}`,
    ]);
    expect(lintDesign(manifest(withPins({ pins: "pins/gone.json" })), pinsEnv)).toEqual([
      "q1 option B: pins file pins/gone.json isn't there or isn't JSON",
    ]);
  });

  it("names pins on a frame the option has no picture for", () => {
    expect(lintDesign(manifest(withPins({ desk: undefined, pinsDesk: pins })), env)).toEqual([
      "q1 option B: pinsDesk names pins on a desk picture it doesn't have",
    ]);
  });

  // Answer once (REDESIGN.md, Eric 2026-10-14): a desktop frame that only widens the phone layout
  // is left out, so one opinion takes one answer; a desktop-only finding may show the desk alone.
  it("takes a phone frame alone, or a desk frame alone, and refuses an option with neither", () => {
    expect(lintDesign(manifest(withPins({ desk: undefined })), env)).toEqual([]);
    expect(lintDesign(manifest(withPins({ phone: undefined, pins: undefined })), env)).toEqual([]);
    expect(
      lintDesign(manifest(withPins({ phone: undefined, desk: undefined, pins: undefined })), env),
    ).toEqual([
      "q1 option B: no picture — a phone frame, plus a desk frame only where the layout changes",
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

  // #5143: his banked words live in the repo (docs/design/eric-feedback/), so a fresh checkout
  // checks a quote of his with no file cited and no REDESIGN_VERBATIM set — /tmp is not a home.
  it("finds a quote of his in the repo's banked words when nothing else is cited", () => {
    const file = join(dir, "banked.json");
    const saw = ["His note: “controls that do nothing is an oxy moron”"];
    writeFileSync(file, JSON.stringify(manifest(question({ saw }))));
    const { REDESIGN_VERBATIM: _unset, ...env } = process.env;
    const out = spawnSync(process.execPath, ["scripts/redesign/lint.mjs", file], {
      encoding: "utf8",
      env,
    });
    expect(out.stderr).not.toContain("banked-words files exist");
    expect(out.stdout).toMatch(/clean/);
    expect(out.status).toBe(0);
  });
});

// Eric, 2026-10-14: "I'm redundantly navigating the same screenshots" — every problem pinned on
// ONE Today frame, each option naming its pin instead of carrying pictures of its own.
describe("one frame for every problem", () => {
  const todayPins = [
    { n: 1, x: 20, y: 20, label: "the order line" },
    { n: 2, x: 60, y: 70, label: "the total" },
  ];
  const oneFrame = (over: Record<string, unknown> = {}, pin = 2) =>
    question({
      kind: "problems",
      today: { ...question().today, pins: todayPins },
      options: [
        { key: "A", name: "The order line is buried", delta: "It sits below the chain.", pin: 1 },
        { key: "B", name: "The total hides", delta: "A scroll away at phone width.", pin },
      ],
      ...over,
    });

  it("passes problems that name a pin on Today's phone frame and carry no picture", () => {
    expect(lintDesign(manifest(oneFrame()), env)).toEqual([]);
  });

  it("names a pin number Today's frame doesn't have", () => {
    expect(lintDesign(manifest(oneFrame({}, 7)), env)).toEqual([
      `q1 option B: "pin" 7 isn't a pin on Today's phone frame`,
    ]);
  });

  it("reads Today's desk pins when Today has no phone frame", () => {
    const desk = { ...question().today, phone: undefined, pinsDesk: todayPins };
    expect(lintDesign(manifest(oneFrame({ today: desk })), env)).toEqual([]);
  });

  it("keeps a pin for problems only, and still refuses an option with neither", () => {
    const [a, b] = question().options;
    const shape = question({ options: [{ ...a, phone: undefined, desk: undefined, pin: 1 }, b] });
    expect(lintDesign(manifest(shape), env)).toEqual([
      `q1 option A: "pin" is for a problems question — a shape needs its own picture`,
    ]);
    const bare = oneFrame({
      options: [
        { key: "A", name: "The order line is buried", delta: "It sits below the chain.", pin: 1 },
        { key: "B", name: "The total hides", delta: "A scroll away." },
      ],
    });
    expect(lintDesign(manifest(bare), env)).toEqual([
      "q1 option B: no picture — a phone frame, plus a desk frame only where the layout changes",
    ]);
  });

  it("asks an opening round for Today's frames before the pins were drawn", () => {
    const clean = { ...question().today, pins: todayPins, clean: { phone: "t-390.jpg" } };
    expect(lintDesign(manifest(oneFrame({ opening: true, today: clean })), env)).toEqual([]);
    expect(lintDesign(manifest(oneFrame({ opening: true })), env)).toEqual([
      `q1 today: "opening" needs "clean" — Today's frames before pin.mjs drew on them`,
    ]);
    const gone = { ...clean, clean: { phone: "gone.jpg" } };
    expect(lintDesign(manifest(oneFrame({ opening: true, today: gone })), env)).toEqual([
      "q1 today clean: phone picture gone.jpg doesn't exist",
    ]);
  });

  it("takes an opening stage on a problems question only", () => {
    const today = { ...question().today, pins: todayPins, clean: { phone: "t-390.jpg" } };
    expect(lintDesign(manifest(oneFrame({ opening: true, today })), env)).toEqual([]);
    expect(lintDesign(manifest(question({ opening: true })), env)).toEqual([
      'q1: "opening": true is for a problems question — it hides the problems until asked',
    ]);
  });
});

// Eric, 2026-10-14: design rounds sized by the agreed scope, "only as many as needed, no more no
// less" — a goal, outcomes, and each shape naming the outcomes it serves.
describe("a round's scope", () => {
  const scope = (met = [false, true]) => ({
    goal: "The order line reads first at phone width.",
    outcomes: [
      { id: "O1", text: "The order line is above the fold.", met: met[0] },
      { id: "O2", text: "The chain stays one tap away.", met: met[1] },
    ],
  });
  const serving = (a: unknown, b: unknown) => {
    const [first, second] = question().options;
    return [
      { ...first, serves: a },
      { ...second, serves: b },
    ];
  };
  const scoped = (over: Record<string, unknown> = {}) =>
    question({ scope: scope(), options: serving(["O1"], ["O2"]), ...over });

  it("passes a scope whose shapes each serve a listed outcome", () => {
    expect(lintDesign(manifest(scoped()), env)).toEqual([]);
  });

  it("refuses a design round whose every outcome is met", () => {
    expect(lintDesign(manifest(scoped({ scope: scope([true, true]) })), env)).toEqual([
      "q1: every outcome is met — file the build instead of drawing a round",
    ]);
  });

  it("refuses a shape that serves nothing, or an outcome the scope doesn't list", () => {
    expect(lintDesign(manifest(scoped({ options: serving(undefined, ["O3"]) })), env)).toEqual([
      'q1 option A: needs "serves" — the outcome ids this shape works toward',
      "q1 option B: serves O3, which isn't one of the scope's outcomes",
    ]);
  });

  it("lets a problems question carry a scope without serves", () => {
    const q = question({ kind: "problems", scope: scope([true, true]) });
    expect(lintDesign(manifest(q), env)).toEqual([]);
  });

  it("checks nothing about scope on a question that carries none", () => {
    const q = question({ options: serving(["O9"], undefined) });
    expect(lintDesign(manifest(q), env)).toEqual([]);
  });
});

// Eric, 2026-10-14: a round narrowed to "the sections under the microscope". A `focus` label must
// name a section some frame in the question really has, or the page opens every frame whole and
// the round quietly loses the part it was narrowed to; a box must sit inside the frame.
describe("a question's focus", () => {
  const sections = [
    { label: "The order card", x: 0, y: 30, w: 100, h: 40 },
    { label: "Order line", x: 10, y: 40, w: 80, h: 10 },
  ];
  const withSections = (today: Record<string, unknown> = {}) => ({
    ...question().today,
    sections,
    ...today,
  });

  it("passes a label a frame names, case aside, inline or from a sections file", () => {
    expect(
      lintDesign(manifest(question({ focus: "order LINE", today: withSections() })), env),
    ).toEqual([]);
    const fromFile = question({
      focus: "Order line",
      today: withSections({ sections: undefined, sectionsDesk: "t-1280.sections.json" }),
    });
    const sectionsAt = (p: string) => (p === "t-1280.sections.json" ? sections : null);
    expect(lintDesign(manifest(fromFile), { ...env, sectionsAt })).toEqual([]);
  });

  it("refuses a label no frame names, naming the frames it checked", () => {
    const q = question({
      focus: "Order total",
      today: withSections(),
      options: question().options.map((o, i) => (i === 0 ? { ...o, sections } : o)),
    });
    expect(lintDesign(manifest(q), env)).toEqual([
      'q1: "focus" “Order total” isn\'t a section on any frame — checked today phone, option A phone',
    ]);
  });

  it("refuses a label when no frame names its sections at all", () => {
    expect(lintDesign(manifest(question({ focus: "Order line" })), env)).toEqual([
      'q1: "focus" “Order line” names a section, but no frame names its sections — add "sections" (or use a box)',
    ]);
  });

  it("passes a box per frame inside 0–100, and refuses one outside it", () => {
    expect(lintDesign(manifest(question({ focus: { phone: [10, 20, 30, 40] } })), env)).toEqual([]);
    expect(
      lintDesign(
        manifest(question({ focus: { phone: [10, 20, 130, 40], desk: [80, 0, 30, 10] } })),
        env,
      ),
    ).toEqual([
      "q1 focus phone: every number is % of the frame, 0–100",
      "q1 focus desk: the box runs past the frame's edge",
    ]);
  });

  it("refuses a focus that is neither a label nor a box per frame", () => {
    expect(lintDesign(manifest(question({ focus: [1, 2, 3, 4] })), env)).toEqual([
      'q1: "focus" is a section\'s label, or { "phone": [x, y, w, h], "desk": [...] }',
    ]);
    expect(lintDesign(manifest(question({ focus: { tablet: [0, 0, 1, 1] } })), env)).toEqual([
      'q1 focus: "tablet" isn\'t a frame — "phone" or "desk"',
    ]);
  });
});
