import {
  type CouncilDeps,
  submitThesis as submitFn,
  councilWeekView as viewFn,
} from "../../src/server/council-form.js";

/**
 * The Council's action + read authority (`council-form.ts`) — one line valid, bounded, and
 * trimmed; a resubmit within the same week replaces rather than duplicates.
 */

function deps(overrides: Partial<CouncilDeps> = {}): CouncilDeps {
  const weeks: Record<string, Record<string, { text: string; at: string }>> = {};
  return {
    load: () => ({ weeks }),
    submit: (week, memberId, text, at) => {
      weeks[week] = { ...weeks[week], [memberId]: { text, at: at.toISOString() } };
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

  it("a resubmit within the same week replaces the member's own line", () => {
    const d = deps();
    submitFn("first take", "abc123", d);
    submitFn("revised take", "abc123", d);
    expect(viewFn(d, "abc123").entries).toHaveLength(1);
    expect(viewFn(d, "abc123").mine?.text).toBe("revised take");
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
});
