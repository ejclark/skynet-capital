import type { MpMessage } from "../../src/live/moneypenny";
import { CONVICTION_CHIPS } from "../../src/live/moneypenny-conviction";
import { FOLLOWUP_CHIPS } from "../../src/live/moneypenny-followup";
import {
  BACK_TO_MAIN,
  dockText,
  latestLine,
  type MoveState,
  movesFor,
} from "../../src/live/moneypenny-moves";
import { RESEARCH_ASK_CHIPS } from "../../src/live/moneypenny-research";

/**
 * HER MOVES AND HER LATEST LINE (#7487 slice 2): the dock draws whatever these say. Precedence is
 * the rail's: nothing mid-turn; a parked card's own exits; else, on the main conversation at rest,
 * the pivot (when her latest answer links two or more landing rows) ahead of the canned moves.
 */

const PIVOT_ANSWER =
  "Moneypenny · two to watch: [CoreWeave](/#story-ai-capex) and [rates](/#story-rates).";

const base: MoveState = {
  busy: false,
  inThread: false,
  flow: "idle",
  parked: { draft: false, view: false, followup: false, research: false },
  connected: true,
  firstTradeDone: true,
  latest: undefined,
};
const at = (patch: Partial<MoveState>): MoveState => ({ ...base, ...patch });
const parked = (p: Partial<MoveState["parked"]>): MoveState =>
  at({ parked: { ...base.parked, ...p } });
const labels = (s: MoveState) => movesFor(s).map((m) => m.label);
const chipLabels = (chips: readonly { label: string }[]) => chips.map((c) => c.label);

describe("movesFor — the member's moves, best first", () => {
  it("offers nothing while a turn is under way, whatever else is parked", () => {
    expect(movesFor(at({ busy: true }))).toEqual([]);
    expect(
      movesFor(
        at({
          busy: true,
          parked: { draft: true, view: true, followup: true, research: true },
          latest: { role: "mp", text: PIVOT_ANSWER },
        }),
      ),
    ).toEqual([]);
  });

  it("a parked view offers its own exits, ahead of every other parked card", () => {
    expect(labels(parked({ view: true, followup: true, research: true, draft: true }))).toEqual(
      chipLabels(CONVICTION_CHIPS),
    );
  });

  it("a parked follow-up offers its exits ahead of a research question and a draft", () => {
    expect(labels(parked({ followup: true, research: true, draft: true }))).toEqual(
      chipLabels(FOLLOWUP_CHIPS),
    );
  });

  it("a parked research question offers its exits ahead of a draft", () => {
    expect(labels(parked({ research: true, draft: true }))).toEqual(chipLabels(RESEARCH_ASK_CHIPS));
  });

  it("a parked draft offers Send it and Never mind, sent as the member's words", () => {
    expect(movesFor(parked({ draft: true }))).toEqual([
      { kind: "say", label: "Send it", msg: "send" },
      { kind: "say", label: "Never mind", msg: "never mind" },
    ]);
  });

  it("a parked card's exits show in a side thread too", () => {
    expect(labels(at({ inThread: true, parked: { ...base.parked, draft: true } }))).toEqual([
      "Send it",
      "Never mind",
    ]);
  });

  it("offers only the way back in a side thread, and nothing while a scripted beat waits", () => {
    expect(movesFor(at({ inThread: true }))).toEqual([BACK_TO_MAIN]);
    expect(movesFor(at({ flow: "setup" }))).toEqual([]);
    expect(movesFor(at({ flow: "fb2" }))).toEqual([]);
  });

  it("offers the canned moves for where the member is, at rest on the main conversation", () => {
    expect(labels(at({ connected: false }))).toEqual(["Help me get set up", "File feedback"]);
    expect(labels(at({ firstTradeDone: false }))).toEqual([
      "Walk me through my first trade",
      "File feedback",
    ]);
    expect(labels(base)).toEqual(["How am I doing?", "File feedback"]);
    expect(movesFor(base).every((m) => m.kind === "say")).toBe(true);
  });

  it("puts the pivot first when her latest line links two or more landing rows", () => {
    const moves = movesFor(at({ latest: { role: "mp", text: PIVOT_ANSWER } }));
    expect(moves[0]).toEqual({
      kind: "go",
      label: "Show just these 2 on the page",
      href: "/?show=story-ai-capex,story-rates#calendar",
    });
    expect(moves.slice(1).map((m) => m.label)).toEqual(["How am I doing?", "File feedback"]);
  });

  it("offers no pivot for one row, for a line not hers, or in a side thread", () => {
    // One row is no pivot; the place she names becomes its own move, since her line in the dock is
    // plain text and the link would be dead there (D4).
    expect(
      movesFor(at({ latest: { role: "mp", text: "Watch [CoreWeave](/#story-ai-capex)." } })),
    ).toEqual([
      { kind: "go", label: "Open CoreWeave", href: "/#story-ai-capex" },
      { kind: "say", label: "How am I doing?", msg: expect.any(String) },
      { kind: "say", label: "File feedback", msg: expect.any(String) },
    ]);
    expect(labels(at({ latest: { role: "sys", text: PIVOT_ANSWER } }))).toEqual([
      "How am I doing?",
      "File feedback",
    ]);
    expect(movesFor(at({ inThread: true, latest: { role: "mp", text: PIVOT_ANSWER } }))).toEqual([
      BACK_TO_MAIN,
    ]);
  });

  // #7487 slice 5: her line about what the Eye noticed offers its own moves — a question about it
  // and the way back — in place of the canned ones, but never over a parked card or mid-turn.
  it("offers the Eye's notice moves while her line about it is the latest", () => {
    const notice = [
      { kind: "say", label: "What moved XLE?", msg: "What moved Energy (XLE)?" },
      { kind: "go", label: "Back to where I was", href: "/" },
    ] as const;
    expect(labels(at({ notice }))).toEqual(["What moved XLE?", "Back to where I was"]);
    expect(movesFor(at({ notice, busy: true }))).toEqual([]);
    expect(labels(at({ notice, parked: { ...base.parked, view: true } }))).toEqual(
      chipLabels(CONVICTION_CHIPS),
    );
    expect(movesFor(at({ notice, inThread: true }))).toEqual([BACK_TO_MAIN]);
  });
});

describe("latestLine — her voice in the dock", () => {
  it("picks her last line, a drafted card or a system note — never the member's", () => {
    const mp: MpMessage = { role: "mp", text: "Moneypenny · hi." };
    const draft: MpMessage = { role: "draft", text: "[bug] the wire" };
    const sys: MpMessage = { role: "sys", text: "sauron·ops · logged" };
    const user: MpMessage = { role: "user", text: "thanks" };
    expect(latestLine([mp, user])).toBe(mp);
    expect(latestLine([mp, draft, user])).toBe(draft);
    expect(latestLine([draft, sys, user, user])).toBe(sys);
  });

  it("is undefined for an empty conversation or one with only the member's lines", () => {
    expect(latestLine([])).toBeUndefined();
    expect(latestLine([{ role: "user", text: "anyone there?" }])).toBeUndefined();
  });
});

describe("dockText — a line as the dock shows it", () => {
  const text = (t: string) => dockText({ role: "mp", text: t });

  it("drops her name prefix, since the ✦ disc says who", () => {
    expect(text("Moneypenny · hi, I'm Moneypenny.")).toBe("hi, I'm Moneypenny.");
  });

  it("keeps a link's words and drops its markup", () => {
    expect(text("Moneypenny · [open Trade](/trade) and buy a stock")).toBe(
      "open Trade and buy a stock",
    );
  });

  it("flattens bold and italic markers", () => {
    expect(text("Moneypenny · watch **CRWV earnings** and __CPI__, *then* _rates_.")).toBe(
      "watch CRWV earnings and CPI, then rates.",
    );
  });

  it("leaves a lone asterisk or an underscore inside a word alone", () => {
    expect(text("2 * 3 is in snake_case")).toBe("2 * 3 is in snake_case");
  });

  it("folds every run of whitespace, newlines included, to one space, trimmed", () => {
    expect(text("Moneypenny · one\n\n- two   three\t\n")).toBe("one - two three");
  });
});

describe("movesFor — the first visit (#7487 slice 7) is one more stage of the same model", () => {
  const welcome = at({ visit: { kind: "welcome" }, connected: false, firstTradeDone: false });

  it("offers the visit's moves where the canned moves would stand", () => {
    expect(labels(welcome)).toEqual(["Walk me through it", "First step", "I have a goal"]);
    expect(labels(at({ visit: { kind: "tour", step: 1 } }))).toEqual(["Next ›", "That's enough"]);
  });

  it("waits under a turn, a parked card, a side thread and a scripted beat", () => {
    expect(movesFor({ ...welcome, busy: true })).toEqual([]);
    expect(labels({ ...welcome, parked: { ...base.parked, view: true } })).toEqual(
      chipLabels(CONVICTION_CHIPS),
    );
    expect(movesFor({ ...welcome, inThread: true })).toEqual([BACK_TO_MAIN]);
    expect(movesFor({ ...welcome, flow: "setup" })).toEqual([]);
  });

  // The order is one list (`movesFor`'s docblock): the tour the member asked for stands over the
  // Eye's unprompted notice, should the two ever meet (the Eye stays quiet during a visit).
  it("stands over a live Eye notice", () => {
    const notice = [{ kind: "go", label: "Back to where I was", href: "/" }] as const;
    expect(labels({ ...welcome, notice })).toEqual([
      "Walk me through it",
      "First step",
      "I have a goal",
    ]);
  });

  it("gives the canned moves back once the visit is over", () => {
    expect(labels(at({ connected: false, firstTradeDone: false }))).toEqual([
      "Help me get set up",
      "File feedback",
    ]);
  });
});
