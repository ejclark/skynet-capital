import { describe, expect, it } from "@rstest/core";
import type { DeskPosition, DeskSnapshot } from "../../src/live/desk";
import { heldRows, readTime, TONE_SHAPE } from "../../src/shell/side-panels";

/**
 * #8297: the left panel's "What you hold" heads the panel when the member holds positions. WHEN
 * desks are read, it SHALL list every held position across the member's own accounts, biggest
 * weight first, and SHALL skip an account whose read came back error-tagged (its `positions: []`
 * is a failed read, never "holds nothing"). Every move SHALL wear a shape beside its sign.
 */

const pos = (symbol: string, weightPct: number): DeskPosition =>
  ({ symbol, display: symbol, weightPct }) as DeskPosition;

const snap = (name: string, positions: readonly DeskPosition[], error?: string): DeskSnapshot =>
  ({
    generatedAt: "2026-11-25T19:42:00Z",
    desk: { id: name, name, kind: "human", positions, ...(error ? { error } : {}) },
  }) as DeskSnapshot;

describe("heldRows", () => {
  it("lists every held position across accounts, biggest weight first", () => {
    const rows = heldRows([
      snap("A", [pos("AMD", 10), pos("NVDA", 60)]),
      snap("B", [pos("AAPL", 30)]),
    ]);
    expect(rows.map((r) => `${r.account}:${r.position.symbol}`)).toEqual([
      "A:NVDA",
      "B:AAPL",
      "A:AMD",
    ]);
  });

  it("skips an error-tagged account rather than reading it as empty", () => {
    expect(heldRows([snap("A", [], "unreachable"), snap("B", [pos("AAPL", 30)])])).toHaveLength(1);
  });

  it("is empty when nothing is held, so the card does not render", () => {
    expect(heldRows([snap("A", [])])).toEqual([]);
  });
});

describe("the move's shape and the read time", () => {
  it("pairs up with ▲ and down with ▼; flat wears none", () => {
    expect(TONE_SHAPE).toEqual({ pos: "▲", neg: "▼", flat: "" });
  });

  it("formats an ISO read time as a clock time, and keeps text that isn't a date", () => {
    expect(readTime("2026-11-25T19:42:00Z")).toMatch(/\d{1,2}:\d{2}/);
    expect(readTime("just now")).toBe("just now");
  });
});
