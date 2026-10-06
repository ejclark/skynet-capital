import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import { PLAYBOOK_MODES } from "../../src/domain/types.js";
import {
  AUTHORED_PLAY_BOUNDS,
  type AuthoredPlayProblem,
  type AuthoredPlayRejection,
  type AuthoredPlaySpec,
  type AuthoredTrigger,
  authoredPlayId,
  authoredRoster,
  compileAuthoredPlay,
  validateAuthoredPlay,
} from "../../src/playbooks/authored-play.js";
import { playbookIntents } from "../../src/playbooks/playbook.js";
import { G1_GOOG, HC_SAURON, S1_NVDA, TACO_DJT } from "../../src/playbooks/registry.js";
import { aContext, aPortfolio } from "../support/builders.js";

/**
 * The bounded authoring model (#809 slice 2). These specs exist to prove three things a comment
 * cannot: that every stated bound actually refuses, that a compiled play's window is the two
 * numbers its author typed, and that an authored play only ever reaches its own author's account.
 */

const spec = (overrides: Partial<AuthoredPlaySpec> = {}): AuthoredPlaySpec => ({
  slug: "earnings-runup",
  authorAccountId: "acct-1",
  authorDisplayName: "Ada",
  symbols: ["NVDA"],
  thesis: "long the pre-print drift, out well before the dead final week",
  trigger: { kind: "pre-print-window", enterDaysBefore: 20, exitDaysBefore: 6 },
  size: { conservative: 0.01, standard: 0.02, aggressive: 0.03 },
  ...overrides,
});

const problemsOf = (s: AuthoredPlaySpec): readonly AuthoredPlayProblem[] => {
  const verdict = validateAuthoredPlay(s);
  return verdict.ok ? [] : verdict.problems;
};

const problemFields = (s: AuthoredPlaySpec): string[] =>
  problemsOf(s).map((problem) => problem.field);

const cal = (symbol: string, date: string, status: EarningsPrint["status"]): EarningsPrint[] => [
  { symbol, date, status, source: "test" },
];

describe("validateAuthoredPlay", () => {
  it("accepts a well-formed spec", () => {
    expect(validateAuthoredPlay(spec())).toEqual({ ok: true });
  });

  it("reports EVERY failed bound at once, not just the first", () => {
    const fields = problemFields(
      spec({ slug: "Not A Slug", thesis: "too short", symbols: ["nvda"] }),
    );
    expect(fields).toEqual(expect.arrayContaining(["slug", "thesis", "symbols"]));
  });

  it("refuses a slug that isn't kebab-case, or one that's too long", () => {
    expect(problemFields(spec({ slug: "Earnings_Runup" }))).toContain("slug");
    expect(problemFields(spec({ slug: "a".repeat(33) }))).toContain("slug");
  });

  it("refuses an account id carrying a separator the compiled id grammar uses", () => {
    expect(problemFields(spec({ authorAccountId: "acct:1" }))).toContain("authorAccountId");
    expect(problemFields(spec({ authorAccountId: "acct,1" }))).toContain("authorAccountId");
    expect(problemFields(spec({ authorAccountId: "" }))).toContain("authorAccountId");
  });

  it("refuses a multi-line thesis — it is carried into a one-line order reason", () => {
    expect(problemFields(spec({ thesis: "long the pre-print\ndrift into the print" }))).toContain(
      "thesis",
    );
  });

  it("requires exactly one symbol, upper-case, ticker- or crypto-pair-shaped", () => {
    expect(validateAuthoredPlay(spec({ symbols: ["BTC/USD"] }))).toEqual({ ok: true });
    expect(problemFields(spec({ symbols: [] }))).toContain("symbols");
    expect(problemFields(spec({ symbols: ["NVDA", "AMD"] }))).toContain("symbols");
    expect(problemFields(spec({ symbols: ["nvda"] }))).toContain("symbols");
  });

  it("refuses a size above the house roster's own ceiling, or at or below zero", () => {
    expect(
      problemFields(spec({ size: { conservative: 0.01, standard: 0.02, aggressive: 0.5 } })),
    ).toContain("size.aggressive");
    expect(
      problemFields(spec({ size: { conservative: 0, standard: 0.02, aggressive: 0.03 } })),
    ).toContain("size.conservative");
  });

  it("refuses a size axis that shrinks as the preset gets more aggressive", () => {
    expect(
      problemFields(spec({ size: { conservative: 0.03, standard: 0.02, aggressive: 0.01 } })),
    ).toContain("size");
  });

  it("refuses a pre-print window whose exit is not inside its entry", () => {
    const trigger: AuthoredTrigger = {
      kind: "pre-print-window",
      enterDaysBefore: 6,
      exitDaysBefore: 6,
    };
    expect(problemFields(spec({ trigger }))).toContain("trigger.exitDaysBefore");
  });

  it("refuses a pre-print entry further out than the bound, or a fractional day count", () => {
    expect(
      problemFields(
        spec({ trigger: { kind: "pre-print-window", enterDaysBefore: 61, exitDaysBefore: 6 } }),
      ),
    ).toContain("trigger.enterDaysBefore");
    expect(
      problemFields(
        spec({ trigger: { kind: "pre-print-window", enterDaysBefore: 20.5, exitDaysBefore: 6 } }),
      ),
    ).toContain("trigger");
  });

  it("refuses an event hold window outside 1..480 minutes", () => {
    expect(
      validateAuthoredPlay(spec({ trigger: { kind: "event-window", holdMinutes: 90 } })),
    ).toEqual({ ok: true });
    expect(problemFields(spec({ trigger: { kind: "event-window", holdMinutes: 0 } }))).toContain(
      "trigger.holdMinutes",
    );
    expect(problemFields(spec({ trigger: { kind: "event-window", holdMinutes: 481 } }))).toContain(
      "trigger.holdMinutes",
    );
  });

  it("refuses a trigger kind outside the fixed menu — the no-free-form-logic criterion", () => {
    const rogue = {
      kind: "run-this-code",
      source: "buy()",
    } as unknown as AuthoredPlaySpec["trigger"];
    expect(problemFields(spec({ trigger: rogue }))).toContain("trigger");
  });
});

describe("the authored size ceiling is the house roster's own", () => {
  it("is at least every house play's largest per-mode exposure", () => {
    const houseMax = Math.max(
      ...[S1_NVDA, G1_GOOG, TACO_DJT, HC_SAURON].flatMap((play) =>
        PLAYBOOK_MODES.map((mode) => play.size[mode]),
      ),
    );
    expect(AUTHORED_PLAY_BOUNDS.maxSizeFraction).toBeGreaterThanOrEqual(houseMax);
  });
});

describe("compileAuthoredPlay", () => {
  it("namespaces the id by author and marks it member-authored", () => {
    expect(authoredPlayId(spec())).toBe("U-acct-1-earnings-runup");
    expect(compileAuthoredPlay(spec()).id).toBe("U-acct-1-earnings-runup");
  });

  it("carries an evidence line that says there is no research citation", () => {
    const { evidence } = compileAuthoredPlay(spec());
    expect(evidence).toContain("member-authored by Ada");
    expect(evidence).toContain("no docs/research/ citation");
  });

  it("derives the horizon from the trigger, never from a separate field", () => {
    expect(compileAuthoredPlay(spec()).horizon).toBe("medium");
    expect(
      compileAuthoredPlay(spec({ trigger: { kind: "event-window", holdMinutes: 90 } })).horizon,
    ).toBe("short");
  });

  it("declares no exit-safety dial — an authored play cannot opt itself into autonomous closes", () => {
    expect(compileAuthoredPlay(spec()).exitSafety).toBeUndefined();
  });

  describe("a pre-print window, compiled", () => {
    const play = compileAuthoredPlay(spec());
    const confirmed = cal("NVDA", "2026-08-26", "confirmed");

    it("wants long from the author's entry day through the day before their exit", () => {
      expect(play.desiredState("2026-08-06T15:00:00Z", confirmed)).toBe("long"); // D-20
      expect(play.desiredState("2026-08-19T15:00:00Z", confirmed)).toBe("long"); // D-7
    });

    it("wants flat from the author's exit day onward", () => {
      expect(play.desiredState("2026-08-20T15:00:00Z", confirmed)).toBe("flat"); // D-6
      expect(play.desiredState("2026-08-26T15:00:00Z", confirmed)).toBe("flat"); // D
    });

    it("has no window before the entry day, or with no print scheduled", () => {
      expect(play.desiredState("2026-08-05T15:00:00Z", confirmed)).toBe("no-window"); // D-21
      expect(play.desiredState("2026-08-06T15:00:00Z", [])).toBe("no-window");
    });

    it("stays dark on an ESTIMATE — the date policy applies to authored plays too", () => {
      expect(play.desiredState("2026-08-06T15:00:00Z", cal("NVDA", "2026-08-26", "estimate"))).toBe(
        "no-window",
      );
    });

    it("exits a position that somehow survived the print", () => {
      expect(play.desiredState("2026-08-27T15:00:00Z", confirmed)).toBe("flat");
    });
  });

  describe("an event window, compiled", () => {
    const play = compileAuthoredPlay(
      spec({ symbols: ["DJT"], trigger: { kind: "event-window", holdMinutes: 90 } }),
    );
    const event = { symbol: "DJT", detectedAt: "2026-08-29T14:00:00Z" };

    it("has no window at all until an event for its own symbol arrives", () => {
      expect(play.desiredState("2026-08-29T14:30:00Z", [])).toBe("no-window");
      expect(play.desiredState("2026-08-29T14:30:00Z", [], [{ ...event, symbol: "NVDA" }])).toBe(
        "no-window",
      );
    });

    it("wants long while the event is younger than the author's hold window", () => {
      expect(play.desiredState("2026-08-29T14:01:00Z", [], [event])).toBe("long");
      expect(play.desiredState("2026-08-29T15:29:00Z", [], [event])).toBe("long");
    });

    it("converges to flat once every event has aged out", () => {
      expect(play.desiredState("2026-08-29T15:31:00Z", [], [event])).toBe("flat");
    });

    it("ignores an event stamped in the future rather than treating it as fresh", () => {
      expect(play.desiredState("2026-08-29T13:00:00Z", [], [event])).toBe("flat");
    });

    it("ignores an unparseable timestamp rather than throwing", () => {
      expect(
        play.desiredState(
          "2026-08-29T14:30:00Z",
          [],
          [{ symbol: "DJT", detectedAt: "not a date" }],
        ),
      ).toBe("flat");
    });
  });

  it("runs through the same engine as a house play — attribution and sizing included", () => {
    const play = compileAuthoredPlay(spec());
    const intents = playbookIntents(
      [{ playbook: play, mode: "standard" }],
      aContext({ NVDA: { last: 100 } }, "2026-08-06T15:00:00Z"),
      aPortfolio({ cash: 100_000 }),
      cal("NVDA", "2026-08-26", "confirmed"),
    );
    expect(intents).toHaveLength(1);
    expect(intents[0]).toMatchObject({
      symbol: "NVDA",
      side: "buy",
      playbookId: "U-acct-1-earnings-runup",
      playbookMode: "standard",
    });
    // 2% of a $100k book at the builder's $100.05 ask — the same arithmetic every house play gets.
    expect(intents[0]?.quantity).toBe(19);
  });
});

describe("authoredRoster — the own-account rule", () => {
  it("compiles this account's own valid plays", () => {
    const roster = authoredRoster([spec()], "acct-1");
    expect(roster.accountId).toBe("acct-1");
    expect(roster.plays.map((p) => p.id)).toEqual(["U-acct-1-earnings-runup"]);
    expect(roster.rejected).toEqual([]);
  });

  it("skips another member's play silently — it is not this account's to run", () => {
    const roster = authoredRoster([spec({ authorAccountId: "acct-2" })], "acct-1");
    expect(roster.plays).toEqual([]);
    expect(roster.rejected).toEqual([]);
  });

  it("reports an own play that failed a bound, so its author learns which field did it", () => {
    const roster = authoredRoster([spec({ slug: "ok-slug", thesis: "short" })], "acct-1");
    expect(roster.plays).toEqual([]);
    const expected: AuthoredPlayRejection[] = [
      { slug: "ok-slug", problems: [{ field: "thesis", problem: expect.any(String) }] },
    ];
    expect(roster.rejected).toEqual(expected);
  });

  it("is empty for an account with no authored plays", () => {
    expect(authoredRoster([], "acct-1")).toEqual({
      accountId: "acct-1",
      plays: [],
      rejected: [],
    });
  });
});
