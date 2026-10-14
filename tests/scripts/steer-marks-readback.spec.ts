import { describe, expect, it } from "@rstest/core";
import { isAnswered } from "../../scripts/steer/model.mjs";
import { readback } from "../../scripts/steer/readback.mjs";
import { STATE } from "../../scripts/steer/scope.mjs";
import { META, pageOf, REC, TP, tpOf } from "./steer-marks-fixture";

// The read-back of an opening round (Eric, 2026-10-14): his own marks as a "Your marks:" list, word
// for word and flagged when they came before Claude's problems were shown; whether and when the
// problems were revealed; and his notes about the page handed back as process lines for the
// commons — never posted on the screen's issue. Old records, with none of these, read as none.

const A = "today:phone:ma1";
const B = "today:desk:mb2";
const records = (over: Record<string, unknown> = {}, meta: Record<string, unknown> = {}) => ({
  [META]: { openedAt: "2026-10-14T15:00:00Z", doneAt: "2026-10-14T15:20:00Z", taps: [], ...meta },
  [REC]: {
    pins: { [A]: "down", "today:phone:2": "up" },
    pinNotes: { [B]: "keep‮ this spacing\nas it is" },
    marks: {
      [A]: { x: 42.4, y: 30, at: "2026-10-14T15:02:00Z", beforeReveal: true },
      [B]: { x: 10, y: 90, at: "2026-10-14T15:09:00Z", beforeReveal: false },
      "today:phone:mgone": null,
      "Z:phone:mstale": { x: 1, y: 1, at: "2026-10-14T15:01:00Z", beforeReveal: true },
    },
    pick: "B",
    react: {},
    revealAt: "2026-10-14T15:05:00Z",
    ...over,
  },
});
const comment = (plan: ReturnType<typeof readback>) =>
  plan.actions.flatMap((a) => (a.kind === "comment" && a.issue === 5200 ? [a.body] : []))[0] ?? "";

describe("the read-back of his marks", () => {
  const plan = readback(TP, records());

  it("lists them under Your marks, one line each, his note word for word", () => {
    expect(comment(plan)).toContain(
      [
        "Your marks:",
        "- Today, phone · 42% across, 30% down — 👎 don't like (before Claude's problems were shown)",
        "- Today, desktop · 10% across, 90% down — “keep this spacing\n  as it is”",
      ].join("\n"),
    );
    expect(comment(plan)).not.toContain("mstale");
  });

  it("says the problems were shown, and after how many of his marks", () => {
    expect(comment(plan)).toMatch(
      /- Claude's problems: shown \w{3} \d+:05 [AP]M, after 1 of his 2 marks/,
    );
    expect(plan.reveals).toEqual([
      { issue: 5200, key: "5200-q1", revealAt: "2026-10-14T15:05:00Z" },
    ]);
  });

  it("says when they never were", () => {
    const never = readback(TP, records({ revealAt: undefined }));
    expect(comment(never)).toContain(
      "- Claude's problems: never shown — his marks are from the clean screen alone",
    );
    expect(never.reveals[0]?.revealAt).toBeNull();
  });

  it("puts his marks in the next round's instruction", () => {
    const [next] = plan.nextRound;
    expect(next?.instruction).toContain(
      "Apply his marks: Today, phone at 42% across, 30% down: don't like; Today, desktop at 10% across, 90% down: “keep this spacing\nas it is”.",
    );
  });

  it("counts a mark as an answer, and an empty one as nothing", () => {
    const d = TP.decisions[0];
    const only = {
      marks: { [A]: { x: 1, y: 2, at: "", beforeReveal: true } },
      pins: { [A]: "up" },
    };
    expect(isAnswered(only, d)).toBe(true);
    expect(isAnswered({ marks: only.marks }, d)).toBe(false);
    const p = readback(TP, { [REC]: only });
    expect(p.rollover).toEqual([]);
    expect(comment(p)).toContain("- Today, phone · 1% across, 2% down — 👍 like");
  });
});

describe("the read-back of his notes about the page", () => {
  const note = (near: string, n: string | null, at: string) => ({
    near,
    x: 50,
    y: 12.5,
    note: n,
    at,
  });
  const plan = readback(
    TP,
    records(
      {},
      {
        pageNotes: {
          b: note("the Done bar", "it covers the last row", "2026-10-14T15:10:00Z"),
          a: note(
            "the “Show what Claude found” button",
            "say how many there are",
            "2026-10-14T15:04:00Z",
          ),
          c: note("the page", null, "2026-10-14T15:11:00Z"),
        },
      },
    ),
  );

  it("quotes each under where he left it, oldest first", () => {
    expect(plan.pageNotes).toBe(
      [
        "Notes about the page:",
        "- Near the “Show what Claude found” button: “say how many there are”",
        "- Near the Done bar: “it covers the last row”",
      ].join("\n"),
    );
  });

  it("hands them back as process lines for the commons", () => {
    expect(plan.processLines).toEqual([
      { what: "say how many there are", where: "the “Show what Claude found” button" },
      { what: "it covers the last row", where: "the Done bar" },
    ]);
  });

  it("never posts them on the screen's issue", () => {
    expect(comment(plan)).not.toContain("Notes about the page");
  });

  it("reads an old round, with none of these fields, as none", () => {
    const old = readback(TP, { [META]: { openedAt: "2026-10-01T15:00:00Z" } });
    expect(old.pageNotes).toBe("");
    expect(old.processLines).toEqual([]);
    expect(old.reveals).toEqual([{ issue: 5200, key: "5200-q1", revealAt: null }]);
  });
});

describe("a round's scope on the page", () => {
  const scoped = tpOf(
    {
      q: 1,
      title: "What leads the card?",
      rec: "A",
      scope: {
        goal: "The score reads first at phone width.",
        outcomes: [
          { id: "O1", text: "The score is above the fold.", met: false },
          { id: "O2", text: "The rules stay one tap away.", met: true },
        ],
      },
      today: { phone: "t.jpg", source: "scripts/redesign/shoot.mjs", caption: "Today." },
      options: [
        {
          key: "A",
          name: "Score first",
          delta: "The score moves up.",
          phone: "a.jpg",
          serves: ["O1", "O2"],
        },
        { key: "B", name: "Nothing moves", delta: "The control.", phone: "b.jpg", serves: ["O2"] },
      ],
    },
    1,
  );
  const html = pageOf(scoped);

  it("shows the goal and each outcome with a glyph and a word for its state", () => {
    expect(html).toContain(
      '<p class="goal"><b>Goal:</b> The score reads first at phone width.</p>',
    );
    expect(html).toContain(`<span class="ostate">${STATE.open}</span> <b>O1</b>`);
    expect(html).toContain(`<span class="ostate">${STATE.met}</span> <b>O2</b>`);
    expect(STATE).toEqual({ open: "☐ open", met: "☑ met" });
  });

  it("says on each option which outcomes it serves", () => {
    const a = html.slice(html.indexOf('id="d-5200-q1-A"'), html.indexOf('id="d-5200-q1-B"'));
    expect(a).toContain('<p class="serves">serves O1, O2</p>');
  });
});
