import type { PlaybookStoreEntry } from "../../src/discovery/playbook-store.js";
import {
  considerationsFor,
  type PositionForConsiderations,
} from "../../src/observatory/considerations-view.js";

/** #3186 slice 3 — the considerations rail's pure composer: at-risk chips derived from a
 *  position's own return, opportunity chips filtered to held symbols. */

const position = (over: Partial<PositionForConsiderations> = {}): PositionForConsiderations => ({
  symbol: "AAPL",
  display: "AAPL",
  marketValue: 20_000,
  totalPl: -2_500,
  returnPct: -12.5,
  ...over,
});

const catalog = (entries: readonly PlaybookStoreEntry[]): readonly PlaybookStoreEntry[] => entries;

const play = (over: Partial<PlaybookStoreEntry> = {}): PlaybookStoreEntry => ({
  id: "nvda-earnings",
  symbol: "NVDA",
  symbols: ["NVDA"],
  description: "Long into the print.",
  enter: "D-20",
  exitTakeProfit: "none",
  exitCutLosses: "D-5",
  hold: "flat",
  evidence: "internal study",
  window: "D-20 to D-6",
  size: { conservative: 0.02, standard: 0.05, aggressive: 0.1 },
  traits: [],
  metrics: [],
  ...over,
});

describe("considerationsFor", () => {
  it("flags a position down more than the at-risk threshold", () => {
    const chips = considerationsFor([position()], catalog([]));
    expect(chips).toHaveLength(1);
    expect(chips[0]).toMatchObject({
      kind: "at-risk",
      symbol: "AAPL",
      display: "AAPL",
      notional: "$20,000",
      delta: "-$2,500",
      deltaTone: "neg",
    });
    expect(chips[0]?.reason).toContain("down 12.5%");
  });

  it("does not flag a position within the threshold", () => {
    expect(considerationsFor([position({ returnPct: -4 })], catalog([]))).toHaveLength(0);
  });

  it("does not flag a position with no cost basis to measure a return against", () => {
    expect(considerationsFor([position({ returnPct: null })], catalog([]))).toHaveLength(0);
  });

  it("surfaces an opportunity chip for a play matching a held symbol", () => {
    const chips = considerationsFor(
      [position({ symbol: "NVDA", returnPct: 5 })],
      catalog([play()]),
    );
    expect(chips).toHaveLength(1);
    expect(chips[0]).toMatchObject({
      kind: "opportunity",
      symbol: "NVDA",
      notional: "—",
      reason: "Long into the print.",
      action: { href: "/app/research?section=playbooks" },
    });
  });

  it("chips every held symbol in a multi-symbol basket, one chip each", () => {
    const chips = considerationsFor(
      [position({ symbol: "GOOG", returnPct: 5 }), position({ symbol: "NVDA", returnPct: 5 })],
      catalog([play({ symbols: ["NVDA", "GOOG"] })]),
    );
    expect(chips.map((c) => c.symbol).sort()).toEqual(["GOOG", "NVDA"]);
    expect(new Set(chips.map((c) => c.id)).size).toBe(2);
  });

  it("leaves out a tactical playbook, which has no window to suggest", () => {
    const { window: _window, size: _size, ...tactical } = play();
    expect(
      considerationsFor([position({ symbol: "NVDA", returnPct: 5 })], catalog([tactical])),
    ).toHaveLength(0);
  });

  it("omits a play whose symbol isn't held", () => {
    expect(considerationsFor([position({ returnPct: 5 })], catalog([play()]))).toHaveLength(0);
  });

  it("orders at-risk chips before opportunity chips", () => {
    const chips = considerationsFor(
      [position({ symbol: "NVDA", returnPct: -20 })],
      catalog([play()]),
    );
    expect(chips.map((c) => c.kind)).toEqual(["at-risk", "opportunity"]);
  });

  it("points a View position action at the positions tab, scoped to the symbol", () => {
    const chips = considerationsFor([position()], catalog([]));
    expect(chips[0]?.action).toEqual({
      label: "View position",
      href: "?section=positions#pos-AAPL",
    });
  });
});
