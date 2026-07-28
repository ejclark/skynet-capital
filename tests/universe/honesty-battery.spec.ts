import { renderEmpireSkyline } from "../../src/observatory/empire-skyline.js";
import type {
  ParticipantSnapshot,
  PositionView,
} from "../../src/observatory/participant-snapshot.js";
import { MAX_STRUCTURES, projectEmpire, tailOf } from "../../src/universe/project.js";

/**
 * THE HONESTY BATTERY — property-based eval over the world projection + skyline renderer.
 * Unlike the example-based specs, this fires hundreds of seeded adversarial snapshots (NaN cash,
 * zero/negative equity, zero-basis and negative-value positions, 50-position portfolios) and asserts
 * the invariants BRAND.md marks non-negotiable ("never let a flourish imply something false about
 * markets or P/L"). Every future projection/renderer PR gets this honesty review for free —
 * the eval target #2 from the ToC survey; implements mined-eval-seed discriminator #4.
 */

// Deterministic PRNG (mulberry32) — same seed, same battery, stable CI.
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NASTY = [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -1e12, 0, -0.0001];
const TICKERS = ["NVDA", "GLD", "XOM", "SPY", "WMT", "CRWV", "META", "EEM"];

function randomNumber(r: () => number): number {
  // ~15% of values are hostile; the rest span magnitudes from cents to billions.
  if (r() < 0.15) return NASTY[Math.floor(r() * NASTY.length)] ?? 0;
  return (r() - 0.3) * 10 ** Math.floor(r() * 9);
}

function randomSnapshot(r: () => number): ParticipantSnapshot {
  const n = Math.floor(r() * (r() < 0.2 ? 50 : 12));
  const positions: PositionView[] = Array.from({ length: n }, (_, i) => ({
    symbol: `${TICKERS[Math.floor(r() * TICKERS.length)]}${i}`,
    quantity: randomNumber(r),
    avgPrice: randomNumber(r),
    marketValue: randomNumber(r),
  }));
  return {
    id: "p",
    displayName: "P",
    kind: r() < 0.5 ? "bot" : "human",
    ...(r() < 0.4 ? { personaId: "sauron" } : {}),
    cash: randomNumber(r),
    equity: randomNumber(r),
    positions,
  };
}

function walkNumbers(value: unknown, path: string, out: string[]): void {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) out.push(`${path} = ${value}`);
    return;
  }
  if (Array.isArray(value))
    value.forEach((v, i) => {
      walkNumbers(v, `${path}[${i}]`, out);
    });
  else if (value && typeof value === "object")
    for (const [k, v] of Object.entries(value)) walkNumbers(v, `${path}.${k}`, out);
}

const CASES = 300;

describe("honesty battery — projection invariants over adversarial snapshots", () => {
  const r = rng(0xe51c);

  it("never emits a non-finite number, never fabricates, and always partitions honestly", () => {
    const failures: string[] = [];
    for (let i = 0; i < CASES; i++) {
      const snap = randomSnapshot(r);
      const empire = projectEmpire(snap, { personaProminence: randomNumber(r) });

      // #4 — no NaN/Infinity anywhere in the world state.
      walkNumbers(empire, `case${i}`, failures);

      // sign(health) must match sign(real P/L); zero-basis positions read neutral.
      for (const s of empire.structures) {
        if (Math.sign(s.health) !== 0 && Math.sign(s.health) !== Math.sign(s.unrealizedPl))
          failures.push(`case${i} ${s.symbol}: health ${s.health} vs pl ${s.unrealizedPl}`);
      }

      // zero/negative/NaN equity must never fabricate a reserve.
      if (!(snap.equity > 0) && empire.reserve.share !== 0)
        failures.push(`case${i}: reserve fabricated on equity ${snap.equity}`);

      // conservation — shown + tail exactly partitions the totals (within float tolerance).
      const tail = tailOf(empire.structures);
      const shown = empire.structures.slice(0, MAX_STRUCTURES);
      const total = empire.structures.reduce((s, x) => s + x.marketValue, 0);
      const part = shown.reduce((s, x) => s + x.marketValue, 0) + (tail?.marketValue ?? 0);
      if (Math.abs(total - part) > Math.max(1e-6, Math.abs(total) * 1e-9))
        failures.push(`case${i}: partition ${part} != total ${total}`);
    }
    expect(failures).toEqual([]);
  });

  it("rendered SVG never leaks NaN/Infinity/undefined, and labels the tail iff it exists", () => {
    const failures: string[] = [];
    for (let i = 0; i < CASES; i++) {
      const snap = randomSnapshot(r);
      const svg = renderEmpireSkyline(snap, { personaProminence: randomNumber(r) });
      for (const leak of ["NaN", "Infinity", ">undefined<"])
        if (svg.includes(leak)) failures.push(`case${i}: rendered "${leak}"`);
      const shouldTail = snap.positions.length > MAX_STRUCTURES;
      if (shouldTail !== svg.includes(">OUTER<"))
        failures.push(
          `case${i}: ${snap.positions.length} positions but OUTER ${shouldTail ? "missing" : "present"}`,
        );
    }
    expect(failures).toEqual([]);
  });

  it("regression: a NaN prominence dial renders a finite landmark, not the string NaN", () => {
    const svg = renderEmpireSkyline(
      {
        id: "b",
        displayName: "B",
        kind: "bot",
        personaId: "sauron",
        cash: 0,
        equity: 100,
        positions: [{ symbol: "NVDA", quantity: 1, avgPrice: 100, marketValue: 100 }],
      },
      { personaProminence: Number.NaN },
    );
    expect(svg).toContain("persona-eye");
    expect(svg).not.toContain("NaN");
  });
});
