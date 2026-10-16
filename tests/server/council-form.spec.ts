import {
  type CouncilDeps,
  retractThesis as retractFn,
  submitThesis as submitFn,
  councilWeekView as viewFn,
} from "../../src/server/council-form.js";

/**
 * The Council's action + read authority (`council-form.ts`) — one line valid, bounded, and
 * trimmed; a resubmit within the same week replaces rather than duplicates.
 */

function deps(overrides: Partial<CouncilDeps> = {}): CouncilDeps {
  const weeks: Record<
    string,
    Record<string, { text: string; at: string; playbookId?: string }>
  > = {};
  return {
    load: () => ({ weeks }),
    submit: (week, memberId, text, at, playbookId) => {
      weeks[week] = {
        ...weeks[week],
        [memberId]: { text, at: at.toISOString(), ...(playbookId ? { playbookId } : {}) },
      };
    },
    retract: (week, memberId) => {
      const { [memberId]: _gone, ...rest } = weeks[week] ?? {};
      weeks[week] = rest;
    },
    now: () => new Date("2026-09-07T12:00:00.000Z"),
    ...overrides,
  };
}

describe("submitThesis", () => {
  it("accepts a bounded line, trimmed", () => {
    const d = deps();
    const result = submitFn("  NVDA runs, because volume confirms it.  ", "abc123", d);
    expect(result).toEqual({ ok: true });
    const view = viewFn(d, "abc123");
    expect(view.mine?.text).toBe("NVDA runs, because volume confirms it.");
  });

  it("strips bidi overrides and flattens control characters to one line (#2224 shape 3, H2)", () => {
    const d = deps();
    expect(submitFn("long \u202Eevil\u202C\nNVDA\tinto print", "member-1", d)).toEqual({
      ok: true,
    });
    expect(viewFn(d, "member-1").mine?.text).toBe("long evil NVDA into print");
  });

  it("refuses a line that is only control characters", () => {
    expect(submitFn("\u202E\n\u2066", "member-1", deps())).toMatchObject({ ok: false });
  });

  it("refuses an empty line without touching the store", () => {
    const d = deps();
    expect(submitFn("   ", "abc123", d)).toEqual({
      ok: false,
      error: "Say something — even one line.",
    });
    expect(viewFn(d, "abc123").mine).toBeUndefined();
  });

  it("refuses a line over 280 characters", () => {
    const d = deps();
    const result = submitFn("x".repeat(281), "abc123", d);
    expect(result.ok).toBe(false);
    expect(viewFn(d, "abc123").mine).toBeUndefined();
  });

  it("accepts a real house playbook id and carries it through to the view", () => {
    const d = deps();
    const result = submitFn("riding S1 this week", "abc123", d, "S1-NVDA");
    expect(result).toEqual({ ok: true });
    expect(viewFn(d, "abc123").mine?.playbookId).toBe("S1-NVDA");
  });

  it("refuses an unknown playbook id without touching the store", () => {
    const d = deps();
    const result = submitFn("bullish", "abc123", d, "NOT-A-REAL-PLAY");
    expect(result).toEqual({ ok: false, error: "Unknown play — pick one from the list." });
    expect(viewFn(d, "abc123").mine).toBeUndefined();
  });

  it("a resubmit within the same week replaces the member's own line", () => {
    const d = deps();
    submitFn("first take", "abc123", d);
    submitFn("revised take", "abc123", d);
    expect(viewFn(d, "abc123").entries).toHaveLength(1);
    expect(viewFn(d, "abc123").mine?.text).toBe("revised take");
  });

  // Replies under a line (#5097) treat the line's `at` as its version: a reply sent against an
  // older `at` is refused, and a reply stored under one is marked "Answered an earlier version".
  // Pressing Update with nothing changed is not an edit, so it must not move that version.
  it("keeps the line's version when Update changes nothing", () => {
    let clock = new Date("2026-09-07T12:00:00.000Z");
    const d = deps({ now: () => clock });
    submitFn("NVDA runs", "abc123", d, "S1-NVDA");
    const first = viewFn(d, "abc123").mine?.at;
    clock = new Date("2026-09-07T12:05:00.000Z");
    expect(submitFn("  NVDA runs  ", "abc123", d, "S1-NVDA")).toEqual({ ok: true });
    expect(viewFn(d, "abc123").mine?.at).toBe(first);
  });

  it("moves the version when the words or the tagged play change", () => {
    let clock = new Date("2026-09-07T12:00:00.000Z");
    const d = deps({ now: () => clock });
    submitFn("NVDA runs", "abc123", d, "S1-NVDA");
    clock = new Date("2026-09-07T12:05:00.000Z");
    submitFn("NVDA runs", "abc123", d);
    expect(viewFn(d, "abc123").mine).toMatchObject({ at: clock.toISOString() });
    expect(viewFn(d, "abc123").mine?.playbookId).toBeUndefined();
    clock = new Date("2026-09-07T12:10:00.000Z");
    submitFn("NVDA runs hard", "abc123", d);
    expect(viewFn(d, "abc123").mine).toMatchObject({
      text: "NVDA runs hard",
      at: clock.toISOString(),
    });
  });
});

describe("councilWeekView", () => {
  it("lists this week's entries newest first, and names the viewer's own", () => {
    const d = deps();
    submitFn("older", "member-1", d);
    d.submit("2026-W37", "member-2", "newer", new Date("2026-09-07T13:00:00.000Z"));
    const view = viewFn(d, "member-2");
    expect(view.week).toBe("2026-W37");
    expect(view.entries.map((e) => e.text)).toEqual(["newer", "older"]);
    expect(view.mine?.text).toBe("newer");
  });

  it("omits mine for a signed-out viewer or one who hasn't spoken this week", () => {
    const d = deps();
    submitFn("someone else's line", "member-1", d);
    expect(viewFn(d, undefined).mine).toBeUndefined();
    expect(viewFn(d, "member-2").mine).toBeUndefined();
  });

  it("always lists the house roster as tag options, regardless of who's spoken", () => {
    const d = deps();
    expect(viewFn(d, undefined).plays).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "S1-NVDA", symbol: "NVDA" })]),
    );
  });
});

describe("retractThesis", () => {
  it("removes only the caller's own line for this week", () => {
    const d = deps();
    submitFn("mine", "member-1", d);
    submitFn("theirs", "member-2", d);
    expect(retractFn("member-1", d)).toEqual({ ok: true });
    const view = viewFn(d, "member-1");
    expect(view.mine).toBeUndefined();
    expect(view.entries.map((e) => e.text)).toEqual(["theirs"]);
  });

  it("is a no-op, not an error, when there is nothing to take back", () => {
    const d = deps();
    expect(retractFn("member-1", d)).toEqual({ ok: true });
    expect(viewFn(d).entries).toEqual([]);
  });
});
