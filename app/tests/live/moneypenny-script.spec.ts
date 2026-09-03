import {
  FB_OPEN,
  FB_QUESTION,
  inferKind,
  introLines,
  NUDGE,
  opsLine,
  routeNote,
  SETUP_PATH,
  scriptedDraft,
} from "../../src/live/moneypenny-script";

// Moneypenny's script (handoff 2026-09-03 §6) — the pure half of the rail. Every branch of the
// intro steer and the keyword routing, pinned without a DOM or a network.
describe("introLines", () => {
  it("steers a member without an Alpaca account toward setup and waits on the yes/no", () => {
    const intro = introLines({ connected: false, firstTradeDone: false, marketOpen: true });
    expect(intro.flow).toBe("setup");
    expect(intro.lines[0]).toMatch(/^Moneypenny · /);
    expect(intro.lines.at(-1)).toMatch(/isn't connected yet/);
  });

  it("gives a connected member first-trade instructions that know the market is open", () => {
    const intro = introLines({ connected: true, firstTradeDone: false, marketOpen: true });
    expect(intro.flow).toBe("idle");
    expect(intro.lines.at(-1)).toMatch(/the market is open right now/);
  });

  it("…or that it's closed, with the hours and the schedule-it path", () => {
    const intro = introLines({ connected: true, firstTradeDone: false, marketOpen: false });
    expect(intro.lines.at(-1)).toMatch(/closed right now \(9:30 am–4:00 pm et, weekdays\)/);
    expect(intro.lines.at(-1)).toMatch(/fills at market open/);
  });

  it("mid-thread, says hi again and steers — never the whole introduction", () => {
    const intro = introLines({
      connected: false,
      firstTradeDone: false,
      marketOpen: true,
      returning: true,
    });
    expect(intro.lines).toHaveLength(2);
    expect(intro.lines[0]).toBe("Moneypenny · hi again.");
    expect(intro.lines[1]).toMatch(/isn't connected yet/);
    expect(intro.flow).toBe("setup");
  });

  it("offers no steer once the first trade is in", () => {
    const intro = introLines({ connected: true, firstTradeDone: true, marketOpen: true });
    expect(intro.lines).toHaveLength(2);
  });
});

describe("routeNote", () => {
  it("a bare 'I want to file feedback' first asks what's confusing, broken, or missing", () => {
    expect(routeNote("I want to file feedback", "idle")).toEqual({
      kind: "say",
      lines: [FB_OPEN],
      flow: "fb",
    });
  });

  it("a real note with feedback intent gets the one sharp question", () => {
    expect(routeNote("the standings board shows the wrong equity for my bot", "idle")).toEqual({
      kind: "ask",
      note: "the standings board shows the wrong equity for my bot",
    });
  });

  it("anything typed while a filing is open is the note itself, even without keywords", () => {
    expect(routeNote("the ladder page loads blank on my phone", "fb")).toEqual({
      kind: "ask",
      note: "the ladder page loads blank on my phone",
    });
  });

  it("the answer to the question files", () => {
    expect(routeNote("on the desk; a working ticket", "fb2")).toEqual({
      kind: "file",
      answer: "on the desk; a working ticket",
    });
  });

  it("a yes to the setup offer walks the five-step path and plants 'file an issue'", () => {
    const r = routeNote("yes please", "setup");
    expect(r.kind).toBe("say");
    if (r.kind === "say") {
      expect(r.flow).toBe("idle");
      expect(r.lines[0]).toBe(SETUP_PATH[0]);
      expect(r.lines[1]).toMatch(/say “file an issue”/);
    }
  });

  it("a no to the setup offer stays friendly and clears the flow", () => {
    const r = routeNote("not now", "setup");
    expect(r).toMatchObject({ kind: "say", flow: "idle" });
  });

  it("an onboarding question outside any flow is a live chat, the short path its fallback", () => {
    expect(routeNote("where do I find my alpaca key?", "idle")).toEqual({
      kind: "chat",
      fallback: SETUP_PATH,
    });
  });

  it("anything else is a live chat, the capabilities nudge its fallback", () => {
    expect(routeNote("what's a covered call?", "idle")).toEqual({
      kind: "chat",
      fallback: [NUDGE],
    });
  });

  it("the scripted question reads exactly as designed", () => {
    expect(FB_QUESTION).toBe(
      "Moneypenny · got it. one question — where in the app does this bite you, and what would a good outcome look like?",
    );
  });
});

describe("filing helpers", () => {
  it("infers the kind from the note", () => {
    expect(inferKind("the chart is broken")).toBe("bug");
    expect(inferKind("could you add a dark mode toggle")).toBe("feature");
    expect(inferKind("the rail could show my rank")).toBe("idea");
  });

  it("the scripted draft titles from the first line, capped at 80 chars", () => {
    const note = `${"x".repeat(100)}\nsecond line`;
    const d = scriptedDraft(note, "on the board");
    expect(d.title).toHaveLength(80);
    expect(d.details).toContain("on the board");
  });

  it("the first filing's ops line names the M·02 unlock and never claims shipped", () => {
    expect(opsLine(true)).toMatch(/M·02 is now unlocked/);
    expect(opsLine(true)).not.toMatch(/shipped/);
    expect(opsLine(false)).toMatch(/on the build queue/);
  });
});
