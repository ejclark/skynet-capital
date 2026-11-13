import {
  CONNECT_ANCHOR,
  GOAL_MAX,
  GOAL_PICKS,
  goalOf,
  goalTag,
  isFirstVisit,
  isGoalAnswer,
  parseGoal,
  parseVisit,
  TOUR_WINDOWS,
  TOWER_ANCHOR,
  type TourFacts,
  tourStop,
  type Visit,
  visitAfter,
  visitMoves,
  WELCOME,
} from "../../src/live/first-visit";

/**
 * A MEMBER'S FIRST VISIT, AS DATA (#7487 slice 7; the handoff's § Interactions "First visit"). The
 * welcome's three moves, a tour stop's choice plus a way out, the goal's picks, and the stop the tour
 * makes on each window — read from the page's real figures, lighting nothing when there are none.
 */

const labels = (v: Visit) => visitMoves(v).map((m) => m.label);

describe("visitMoves — a choice plus a way out at every stage", () => {
  it("welcomes with the handoff's three moves, in its order", () => {
    expect(WELCOME).toBe(
      "Moneypenny · welcome. how would you like to start? play money, real markets, nothing at risk.",
    );
    expect(labels({ kind: "welcome" })).toEqual([
      "Walk me through it",
      "First step",
      "I have a goal",
    ]);
  });

  it("offers Next › and That's enough on each stop, and One last thing › on the last", () => {
    for (let step = 0; step < TOUR_WINDOWS.length - 1; step++) {
      expect(labels({ kind: "tour", step })).toEqual(["Next ›", "That's enough"]);
      expect(visitMoves({ kind: "tour", step })[0]).toEqual({
        kind: "visit",
        label: "Next ›",
        to: { kind: "tour", step: step + 1 },
      });
    }
    const last = { kind: "tour", step: TOUR_WINDOWS.length - 1 } as const;
    expect(labels(last)).toEqual(["One last thing ›", "That's enough"]);
    expect(visitMoves(last)[0]).toMatchObject({ to: { kind: "end" } });
  });

  it("never offers a lone move: every stage has two or more", () => {
    const stages: Visit[] = [
      { kind: "welcome" },
      ...TOUR_WINDOWS.map((_, step): Visit => ({ kind: "tour", step })),
      { kind: "end" },
      { kind: "goal" },
    ];
    for (const v of stages) expect(visitMoves(v).length).toBeGreaterThanOrEqual(2);
  });

  it("ends the tour on a goal or the first step", () => {
    expect(labels({ kind: "end" })).toEqual(["Set a goal", "What do I do first?"]);
  });

  it("offers the canned goals as the member's own words, then Not now", () => {
    const moves = visitMoves({ kind: "goal" });
    expect(moves.slice(0, GOAL_PICKS.length)).toEqual(
      GOAL_PICKS.map((g) => ({ kind: "say", label: g, msg: g })),
    );
    expect(moves.at(-1)).toEqual({ kind: "visit", label: "Not now", to: { kind: "stop" } });
  });
});

describe("visitAfter — where a step leaves the member", () => {
  it("keeps tour, end and goal as stages, and steps out on first and stop", () => {
    expect(visitAfter({ kind: "tour", step: 2 })).toEqual({ kind: "tour", step: 2 });
    expect(visitAfter({ kind: "end" })).toEqual({ kind: "end" });
    expect(visitAfter({ kind: "goal" })).toEqual({ kind: "goal" });
    expect(visitAfter({ kind: "first" })).toBeUndefined();
    expect(visitAfter({ kind: "stop" })).toBeUndefined();
  });
});

describe("the goal", () => {
  it("takes a statement as the goal and leaves a question for her to answer", () => {
    expect(isGoalAnswer("get comfortable with covered calls")).toBe(true);
    expect(isGoalAnswer("what is an option?")).toBe(false);
    expect(isGoalAnswer("   ")).toBe(false);
  });

  it("stores one line, cut at GOAL_MAX", () => {
    expect(goalOf("  learn\n how   options work ", 5)).toEqual({
      text: "learn how options work",
      at: 5,
    });
    expect(goalOf("x".repeat(GOAL_MAX + 40), 1).text).toHaveLength(GOAL_MAX);
  });

  it("is tagged set today on its day, then with the day it was set", () => {
    const at = new Date(2026, 10, 11, 9, 30).getTime();
    expect(goalTag(at, new Date(2026, 10, 11, 23, 59).getTime())).toBe("set today");
    expect(goalTag(at, new Date(2026, 10, 12, 0, 1).getTime())).toBe("set Nov 11");
  });
});

describe("reading a saved visit and goal back", () => {
  it("keeps well-formed values and drops anything else", () => {
    expect(parseVisit({ kind: "welcome" })).toEqual({ kind: "welcome" });
    expect(parseVisit({ kind: "tour", step: 3 })).toEqual({ kind: "tour", step: 3 });
    expect(parseVisit({ kind: "tour", step: TOUR_WINDOWS.length })).toBeUndefined();
    expect(parseVisit({ kind: "tour", step: 1.5 })).toBeUndefined();
    expect(parseVisit({ kind: "elsewhere" })).toBeUndefined();
    expect(parseVisit("welcome")).toBeUndefined();
    expect(parseGoal({ text: " practice ", at: 7 })).toEqual({ text: "practice", at: 7 });
    expect(parseGoal({ text: "", at: 7 })).toBeUndefined();
    expect(parseGoal({ text: "x", at: "today" })).toBeUndefined();
    expect(parseGoal(null)).toBeUndefined();
  });
});

describe("isFirstVisit — returning members never see the welcome", () => {
  const fresh = {
    member: "m-1",
    introDone: false,
    messages: [],
    visit: undefined,
    connected: false,
    messaged: false,
    firstTradeDone: false,
  };

  it("is a first visit for a bound member the server has no record of", () => {
    expect(isFirstVisit(fresh)).toBe(true);
  });

  it("is not one for anyone else", () => {
    expect(isFirstVisit({ ...fresh, member: undefined })).toBe(false);
    expect(isFirstVisit({ ...fresh, member: "anon" })).toBe(false);
    expect(isFirstVisit({ ...fresh, introDone: true })).toBe(false);
    expect(isFirstVisit({ ...fresh, messages: [{}] })).toBe(false);
    expect(isFirstVisit({ ...fresh, visit: { kind: "goal" } })).toBe(false);
    expect(isFirstVisit({ ...fresh, connected: true })).toBe(false);
    expect(isFirstVisit({ ...fresh, messaged: true })).toBe(false);
    expect(isFirstVisit({ ...fresh, firstTradeDone: true })).toBe(false);
    // Facts not read yet are not "no record".
    expect(isFirstVisit({ ...fresh, connected: undefined })).toBe(false);
  });
});

describe("tourStop — one window, one real row, one or two plain sentences", () => {
  const facts: TourFacts = {
    lead: { name: "Communication Services", anchor: "sector-XLC", figure: "+4.9%" },
    sectorCount: 11,
    event: {
      what: "Nebius Q3 results",
      day: "Thu, Nov 12",
      anchor: "event-2026-11-12-nebius",
      waited: true,
    },
    connected: false,
    members: 4,
    tower: true,
  };
  const sentences = (line: string) => line.replace(/^Moneypenny · /, "").split(/\.\s/).length;

  it("visits Market, Calendar, Quests and Party, in that order", () => {
    expect(TOUR_WINDOWS).toEqual(["market", "calendar", "quests", "party"]);
    for (const w of TOUR_WINDOWS) {
      const stop = tourStop(w, facts);
      expect(stop.window).toBe(w);
      expect(stop.line.startsWith("Moneypenny · ")).toBe(true);
      expect(sentences(stop.line)).toBeLessThanOrEqual(2);
    }
  });

  it("lights the sector that led the week, with its figure from the edition", () => {
    const stop = tourStop("market", facts);
    expect(stop).toMatchObject({ anchor: "sector-XLC", reason: "led the week" });
    expect(stop.line).toContain("11 sectors");
    expect(stop.line).toContain("Communication Services led, +4.9%");
  });

  it("lights the event a story waits on, or else the next one", () => {
    expect(tourStop("calendar", facts)).toMatchObject({
      anchor: "event-2026-11-12-nebius",
      reason: "a story waits on it",
    });
    expect(tourStop("calendar", facts).line).toContain("Nebius Q3 results, Thu, Nov 12");
    const next = tourStop("calendar", {
      ...facts,
      event: { ...(facts.event as NonNullable<TourFacts["event"]>), waited: false },
    });
    expect(next.reason).toBe("next up");
    expect(next.line).toContain("next up: Nebius Q3 results");
  });

  it("starts a new member at connecting a paper account, play money only", () => {
    const stop = tourStop("quests", facts);
    expect(stop).toMatchObject({ anchor: CONNECT_ANCHOR, reason: "start here" });
    expect(stop.line).toContain("play money, nothing at risk");
  });

  it("lights a connected member's best quest, and says so plainly when there is none", () => {
    expect(
      tourStop("quests", { ...facts, connected: true, quest: { label: "x", anchor: "quest-q1" } }),
    ).toMatchObject({ anchor: "quest-q1", reason: "best first" });
    const none = tourStop("quests", { ...facts, connected: true });
    expect(none.anchor).toBeUndefined();
    expect(none.line).toContain("none holds for your account right now");
  });

  it("puts the Eye on The Tower, and ranks no member", () => {
    const stop = tourStop("party", facts);
    expect(stop).toMatchObject({ anchor: TOWER_ANCHOR, reason: "who we play against" });
    expect(stop.line).toContain("4 members play together against The Tower");
    expect(stop.line).toContain("no one is ranked");
  });

  it("lights nothing and invents nothing when the data is missing", () => {
    const bare: TourFacts = { connected: false, tower: false };
    for (const w of ["market", "calendar", "party"] as const) {
      const stop = tourStop(w, bare);
      expect(stop.anchor).toBeUndefined();
      expect(stop.line).not.toMatch(/[+−-]\d/);
    }
    expect(tourStop("calendar", bare).line).toContain("nothing is dated this week yet");
  });

  it("never reads as a buy or sell call", () => {
    for (const w of TOUR_WINDOWS)
      for (const f of [facts, { ...facts, connected: true }])
        expect(tourStop(w, f).line).not.toMatch(/\b(buy|sell|should)\b/i);
  });
});
