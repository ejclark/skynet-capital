import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import {
  empireHealth,
  empireTheme,
  projectEmpire,
  projectWorld,
} from "../../src/universe/project.js";

/**
 * The World Projection's mapping rules, pinned as behavior. These are the honesty invariants the
 * whole Living Universe renders by — if a rule drifts, every renderer lies at once, so the rules
 * get the tests, not the renderers.
 */

function snap(over: Partial<ParticipantSnapshot> = {}): ParticipantSnapshot {
  return {
    id: over.id ?? "human-eric",
    displayName: over.displayName ?? "Eric",
    kind: over.kind ?? "human",
    cash: over.cash ?? 250_000,
    equity: over.equity ?? 1_000_000,
    positions: over.positions ?? [],
    ...(over.personaId ? { personaId: over.personaId } : {}),
  };
}

const pos = (symbol: string, quantity: number, avgPrice: number, marketValue: number) => ({
  symbol,
  quantity,
  avgPrice,
  marketValue,
});

describe("projectEmpire", () => {
  it("R1 — mass is relative to the empire's largest position, largest first", () => {
    const e = projectEmpire(
      snap({ positions: [pos("NVDA", 10, 100, 4000), pos("GLD", 10, 100, 1000)] }),
    );
    expect(e.structures[0]?.symbol).toBe("NVDA");
    expect(e.structures[0]?.mass).toBe(1);
    expect(e.structures[1]?.mass).toBeCloseTo(0.25);
  });

  it("R2 — health is signed real P/L over cost basis, clamped to ±1", () => {
    const e = projectEmpire(
      snap({
        positions: [
          pos("NVDA", 10, 100, 1500), // +50% → +0.5
          pos("XOM", 10, 100, 600), // −40% → −0.4
          pos("CRWV", 10, 1, 1000), // +9900% → clamped to +1
        ],
      }),
    );
    const bySym = new Map(e.structures.map((s) => [s.symbol, s]));
    expect(bySym.get("NVDA")?.health).toBeCloseTo(0.5);
    expect(bySym.get("XOM")?.health).toBeCloseTo(-0.4);
    expect(bySym.get("CRWV")?.health).toBe(1);
  });

  it("R3 — theme reads the dominant sector; mixed under 50% is DIVERSIFIED", () => {
    expect(empireTheme([pos("NVDA", 1, 1, 900), pos("GLD", 1, 1, 100)])).toBe("TECH");
    expect(
      empireTheme([pos("NVDA", 1, 1, 400), pos("GLD", 1, 1, 300), pos("XOM", 1, 1, 300)]),
    ).toBe("DIVERSIFIED");
  });

  it("R4 — the reserve is the cash share of equity; zero equity never fabricates", () => {
    expect(projectEmpire(snap({ cash: 250_000, equity: 1_000_000 })).reserve.share).toBeCloseTo(
      0.25,
    );
    expect(projectEmpire(snap({ cash: 100, equity: 0 })).reserve.share).toBe(0);
  });

  it("R5 — a persona landmark carries the caller's prominence dial, clamped", () => {
    const e = projectEmpire(snap({ kind: "bot", personaId: "sauron" }), {
      personaProminence: 1.7,
    });
    expect(e.landmark).toEqual({ kind: "eye", personaId: "sauron", prominence: 1 });
    expect(projectEmpire(snap()).landmark).toBeUndefined();
  });

  it("an empty portfolio is a FOUNDING state, not a blank — frontier theme, unfounded", () => {
    const e = projectEmpire(snap({ positions: [] }));
    expect(e.founded).toBe(false);
    expect(e.theme).toBe("FRONTIER");
    expect(e.structures).toEqual([]);
  });

  it("projects ALL positions — nothing silently truncated (tailOf aggregates for display)", async () => {
    const many = Array.from({ length: 12 }, (_, i) => pos(`T${i}`, 1, 100, 1000 - i * 10));
    const e = projectEmpire(snap({ positions: many }));
    expect(e.structures).toHaveLength(12);
    const { tailOf, MAX_STRUCTURES } = await import("../../src/universe/project.js");
    const tail = tailOf(e.structures);
    expect(tail?.count).toBe(12 - MAX_STRUCTURES);
    expect(tailOf(e.structures.slice(0, 3))).toBeUndefined();
  });

  it("R2b — footprint is cost basis relative to the empire's largest commitment", () => {
    const e = projectEmpire(
      snap({ positions: [pos("NVDA", 10, 100, 4000), pos("GLD", 10, 25, 1000)] }),
    );
    expect(e.structures[0]?.footprint).toBe(1); // 1000 basis
    expect(e.structures[1]?.footprint).toBeCloseTo(0.25); // 250 basis
  });

  it("is deterministic — same snapshot, same world", () => {
    const s = snap({ positions: [pos("NVDA", 10, 100, 1500), pos("GLD", 5, 200, 900)] });
    expect(projectEmpire(s)).toEqual(projectEmpire(s));
  });
});

describe("projectWorld", () => {
  it("applies per-participant prominence and preserves order", () => {
    const w = projectWorld(
      [snap({ id: "a", kind: "bot", personaId: "sauron" }), snap({ id: "b" })],
      new Map([["a", 0.62]]),
    );
    expect(w.empires.map((e) => e.id)).toEqual(["a", "b"]);
    expect(w.empires[0]?.landmark?.prominence).toBeCloseTo(0.62);
  });
});

describe("empireHealth", () => {
  it("aggregates the R2 rule across the whole desk — unrealized over basis, clamped", () => {
    // NVDA: basis 1000, value 1500 (+500) · GLD: basis 1000, value 700 (−300) → +200 / 2000
    const s = snap({ positions: [pos("NVDA", 10, 100, 1500), pos("GLD", 5, 200, 700)] });
    expect(empireHealth(s)).toBeCloseTo(0.1);
  });

  it("is 0 for an empty desk and clamps a runaway winner to 1 — never fabricated, never unbounded", () => {
    expect(empireHealth(snap())).toBe(0);
    const moon = snap({ positions: [pos("NVDA", 10, 100, 5000)] });
    expect(empireHealth(moon)).toBe(1);
  });
});
