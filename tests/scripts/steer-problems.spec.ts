import { describe, expect, it } from "@rstest/core";
import { designDecisions, designRound } from "../../scripts/steer/design.mjs";
import { VERBS } from "../../scripts/steer/html.mjs";
import { DONE_TRIGGER, readback } from "../../scripts/steer/readback.mjs";
import { ROUND_INTRO, renderPage } from "../../scripts/steer/render.mjs";

// The redesign commons, 2026-10-11: eight round-0 sessions reported the same misread. A round-0
// page asks "which problem should the next round fix first?", but each problem wore the design
// verbs ("Build this", "Changes:"), the intro talked about building, and the read-back filed a
// feedback + ready build from the pick. A question with `kind: "problems"` asks in its own words,
// and its read-back files nothing: it quotes him on the issue and says what the next round draws.

const NOW = "2026-10-11T06:00:00Z";
const problem = (key: string, name: string, delta: string) => ({
  key,
  name,
  delta,
  phone: `r0/${key}-phone.jpg`,
  desk: `r0/${key}-desk.jpg`,
});
const question = (over: Record<string, unknown> = {}) => ({
  q: 1,
  kind: "problems",
  topic: "/app/leaderboard · app/src/routes/leaderboard.tsx",
  title: "Which problem should the next round fix first?",
  ask: "Three problems pinned on today's leaderboard; each names the rule it breaks.",
  rec: "B",
  conf: "medium",
  wrong: "He picks A by 2026-10-14.",
  saw: ["H6 · recognition over recall, severity 3"],
  today: {
    phone: "shots/leaderboard-phone.jpg",
    desk: "shots/leaderboard-desk.jpg",
    source: "scripts/redesign/shoot.mjs",
    caption: "Today, real screenshot at 390.",
  },
  options: [
    problem("A", "Rank has no reason", "The rank number says nothing about why."),
    problem("B", "Bots and members look alike", "A bot row and a member row read the same."),
    problem("C", "The total hides below the fold", "At 390 the total is a scroll away."),
  ],
  ...over,
});

const decisions = (q = question(), round: number | string = 0) =>
  designDecisions([q], { issue: 5160, round });
const tp = designRound({ 5160: decisions() }, { now: NOW });
const html = renderPage(tp, { img: (p) => ("src" in p ? p.src : null) });
const start = html.indexOf('id="d-5160-q1"');
const q1 = html.slice(start, html.indexOf("</section>", start));

describe("a manifest question may ask which problem to fix first", () => {
  it('marks a `kind: "problems"` question, and leaves a design question as it was', () => {
    expect(decisions()[0]?.problems).toBe(true);
    expect(decisions()[0]?.kind).toBe("design");
    const design = decisions(question({ kind: undefined }), 1)[0];
    expect(design?.problems).toBeUndefined();
    expect(decisions(question({ kind: "design" }), 1)[0]?.problems).toBeUndefined();
  });

  it("refuses a kind it doesn't know, naming the two it does", () => {
    expect(() => decisions(question({ kind: "problem" }))).toThrow(
      /q1: "kind" is "design" \(the default\) or "problems", not "problem"/,
    );
  });

  it("holds one kind per page: problems and design questions together are refused", () => {
    const design = designDecisions([question({ q: 2, kind: undefined })], {
      issue: 5160,
      round: 0,
    });
    expect(() => designRound({ 5160: [...decisions(), ...design] })).toThrow(
      /one page asks which problem to fix first, or shows shapes — not both/,
    );
  });
});

describe("a problems question renders in its own words", () => {
  it("offers Fix this first · Look closer · Not a problem on each problem, never Build this", () => {
    expect(VERBS.problems).toEqual([
      ["build", "Fix this first"],
      ["more", "Look closer"],
      ["not", "Not a problem"],
    ]);
    for (const label of ["Fix this first", "Look closer", "Not a problem"]) {
      expect(q1.split(`>${label}</button>`)).toHaveLength(4);
    }
    expect(q1).not.toContain("Build this");
    expect(q1).not.toContain("More of this");
  });

  it("keeps the pressed-state values, so each press still carries its glyph, never colour alone", () => {
    const values = [...q1.matchAll(/<button[^>]*data-v="([a-z]+)"/g)].map((m) => m[1]);
    expect(new Set(values)).toEqual(new Set(["build", "more", "not"]));
  });

  it('labels each option\'s words "The problem:", not "Changes:"', () => {
    expect(q1).toContain("<b>The problem:</b> A bot row and a member row read the same.");
    expect(q1).not.toContain("<b>Changes:</b>");
  });

  it("says in the intro that a pick chooses what the next round draws, and builds nothing", () => {
    expect(ROUND_INTRO.problems).toMatch(/Fix this first/);
    expect(ROUND_INTRO.problems).toMatch(/chooses what the next round draws/);
    expect(ROUND_INTRO.problems).toMatch(/nothing is built/i);
    expect(html).toContain(ROUND_INTRO.problems);
    expect(html).not.toContain(ROUND_INTRO.design);
    expect(q1).toContain("Decision 1 of 1 · problems ·");
  });

  // steer-client.spec.ts presses Copy as text on such a page and reads "fix first B".
  it("hands the page script the flag, so Copy as text can say fix first, not build", () => {
    const data =
      /<script type="application\/json" id="tp-data">([\s\S]*?)<\/script>/.exec(html)?.[1] ?? "";
    expect(JSON.parse(data).decisions[0]).toMatchObject({ key: "5160-q1", problems: true });
  });

  it("leaves a design round's page exactly as it was", () => {
    const design = designRound({ 5160: decisions(question({ kind: undefined }), 1) }, { now: NOW });
    const page = renderPage(design, { img: (p) => ("src" in p ? p.src : null) });
    expect(page).toContain(ROUND_INTRO.design);
    expect(page).not.toContain(ROUND_INTRO.problems);
    expect(page).toContain(">Build this</button>");
    expect(page).toContain("<b>Changes:</b>");
    expect(page).not.toContain("Fix this first");
  });
});

describe("the read-back of a problems question files nothing", () => {
  const records = {
    [`tp/${tp.id}`]: { openedAt: NOW, doneAt: "2026-10-11T06:08:00Z", taps: [0, 60_000] },
    [`tp/${tp.id}/decisions/5160-q1`]: {
      pick: "B",
      react: { A: "more", C: "not" },
      note: "bots need a mark\n\nnot just a colour",
    },
  };
  const comments = [
    { anchorKey: "#d-5160-q1-B", text: "the robot glyph is too small", at: NOW },
    { anchorKey: "save-bar", text: `${DONE_TRIGGER} ${tp.id}: 1 of 1 answered.`, at: NOW },
  ];
  const plan = readback(tp, records, comments);
  const comment = plan.actions.find((a) => a.kind === "comment" && a.issue === 5160);
  const body = comment && "body" in comment ? comment.body : "";

  it("opens no issue and moves no label from a pick", () => {
    expect(plan.actions.filter((a) => a.kind === "issue")).toEqual([]);
    expect(plan.actions.filter((a) => a.kind === "labels")).toEqual([]);
    expect(plan.actions.map((a) => a.kind)).toEqual(["comment"]);
  });

  it("quotes the pick, the marks, his note and his pinned comment on the screen's issue", () => {
    expect(body).toContain('- Fix first: problem B, "Bots and members look alike"');
    expect(body).toContain('- Look closer: A ("Rank has no reason")');
    expect(body).toContain('- Not a problem: C ("The total hides below the fold")');
    expect(body).toContain("> bots need a mark\n>\n> not just a colour");
    expect(body).toContain("On option B:\n\n> the robot glyph is too small");
    expect(body).toContain("nothing is filed from a problem pick");
    expect(body).not.toContain(DONE_TRIGGER);
    expect(body).not.toMatch(/^- Build:/m);
  });

  it("prints the next round's instruction: round 1 draws the picked problem", () => {
    expect(plan.nextRound).toEqual([
      {
        issue: 5160,
        key: "5160-q1",
        pick: "B",
        instruction:
          'Round 1 on #5160: draw 2–5 shapes that fix problem B, "Bots and members look alike". ' +
          'Look closer at A ("Rank has no reason"): show it again, closer. ' +
          'Drop C ("The total hides below the fold"): he says it is not a problem. ' +
          "Nothing is filed from this pick.",
      },
    ]);
    expect(plan.followUps).toContainEqual({
      kind: "next-round",
      issue: 5160,
      key: "5160-q1",
      why: plan.nextRound[0]?.instruction,
    });
  });

  it("with no pick, says the next round asks again and still files nothing", () => {
    const marks = {
      [`tp/${tp.id}/decisions/5160-q1`]: { pick: null, react: { A: "more" }, note: "" },
    };
    const open = readback(tp, marks);
    expect(open.actions.filter((a) => a.kind === "issue")).toEqual([]);
    expect(open.nextRound[0]?.instruction).toBe(
      "No problem picked on #5160: the next round asks again. " +
        'Look closer at A ("Rank has no reason"): show it again, closer. ' +
        "Nothing is filed.",
    );
  });

  it("rolls a skipped problems question over untouched, as any round's question", () => {
    const noted = readback(tp, { [`tp/${tp.id}/decisions/5160-q1`]: { note: "rank first" } });
    expect(noted.followUps.map((f) => f.kind)).toEqual(["next-round", "read-note"]);
    const skipped = readback(tp, {});
    expect(skipped.actions).toEqual([]);
    expect(skipped.nextRound).toEqual([]);
    expect(skipped.rollover.map((r) => r.key)).toEqual(["5160-q1"]);
  });
});
