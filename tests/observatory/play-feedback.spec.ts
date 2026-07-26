import { type PlayOutcome, renderPlayFeedbackLog } from "../../src/observatory/play-feedback.js";

const o = (over: Partial<PlayOutcome>): PlayOutcome => ({
  character: "SAURON",
  play: "IRON CONDOR",
  result: "hit",
  pnl: 420,
  ...over,
});

describe("renderPlayFeedbackLog", () => {
  it("shows an honest idle line when nothing is in flight (no fake rows)", () => {
    const html = renderPlayFeedbackLog([]);
    expect(html).toContain("play-feedback-idle");
    expect(html).not.toContain("pf-row");
  });

  it("renders one row per character — many at once", () => {
    const html = renderPlayFeedbackLog([
      o({
        character: "SAURON",
        play: "SHORT STRADDLE",
        result: "hit",
        pnl: 1180,
        note: "premium kept",
      }),
      o({
        character: "JARVIS",
        play: "CALL LADDER",
        result: "miss",
        pnl: -421,
        note: "stopped out",
      }),
      o({ character: "GOLD BUG", play: "COVERED CALL", result: "live", pnl: 0 }),
    ]);
    expect((html.match(/pf-row/g) ?? []).length).toBe(3);
    expect(html).toContain("SAURON");
    expect(html).toContain("JARVIS");
    expect(html).toContain("GOLD BUG");
  });

  it("labels the result and colours the damage/reward by sign", () => {
    const win = renderPlayFeedbackLog([o({ result: "hit", pnl: 500 })]);
    expect(win).toContain("HIT");
    expect(win).toContain("pf-pos");
    expect(win).toContain("+$500");
    const loss = renderPlayFeedbackLog([o({ result: "miss", pnl: -300 })]);
    expect(loss).toContain("MISS");
    expect(loss).toContain("pf-neg");
    expect(loss).toContain("−$300");
  });

  it("shows a live play as unresolved (no fabricated P/L)", () => {
    expect(renderPlayFeedbackLog([o({ result: "live", pnl: 0 })])).toContain("…");
  });

  it("escapes untrusted character/play/note text", () => {
    const html = renderPlayFeedbackLog([o({ character: "<script>", note: "a & b" })]);
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("a &amp; b");
    expect(html).not.toContain("<script>");
  });
});
