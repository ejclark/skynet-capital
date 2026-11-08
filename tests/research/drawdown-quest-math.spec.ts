import {
  alignSeries,
  blendedVol,
  callLegs,
  callValue,
  EPISODE_GAP,
  episodesOf,
  flatVol,
  gapInterval,
  moveVerdict,
  pickEntries,
  putCycle,
  putValue,
  shareReturn,
  stateAt,
  summarize,
  underHigh,
} from "../../scripts/research/drawdown-quest-math.mjs";

/**
 * The drawdown-quest study's pure half (#7028 slice 2). The failures these exist to prevent: a
 * condition that fires on the wrong half (a deep drawdown with calm VIX credited as the signal), a
 * year high that reaches past 252 sessions, entries that overlap and count one sell-off many times,
 * a put whose strike is not the delta it claims, a take-profit that is never taken, and a thin
 * sample that reads as a kill instead of `underpowered`.
 */

const bar = (i: number, close: number) => ({
  date: new Date(Date.UTC(2020, 0, 1 + i)).toISOString().slice(0, 10),
  close,
});

/** A tape of 260 flat sessions at 100, then `tail` closes. VIX is `vix` throughout the tail. */
function tape(tail: number[], vix: number) {
  const closes = [...Array(260).fill(100), ...tail];
  const index = closes.map((c, i) => bar(i, c));
  const vixBars = closes.map((_, i) => bar(i, i < 260 ? 15 : vix));
  return alignSeries(index, vixBars);
}

describe("alignSeries", () => {
  it("keeps only the dates both series have, and averages VIX over a year", () => {
    const index = [bar(0, 100), bar(1, 101), bar(2, 102)];
    const vix = [bar(0, 20), bar(2, 30)];
    const series = alignSeries(index, vix);
    expect(series.dates).toEqual([index[0]?.date, index[2]?.date]);
    expect(series.close).toEqual([100, 102]);
    expect(series.vixAvg).toEqual([null, null]);
  });

  it("drops a date whose close or VIX is not a positive number", () => {
    const series = alignSeries([bar(0, 100), bar(1, 0)], [bar(0, 20), bar(1, 20)]);
    expect(series.close).toEqual([100]);
  });
});

describe("underHigh and stateAt", () => {
  it("reads 12% under the year high with VIX 30 as both", () => {
    const series = tape([88], 30);
    const t = series.close.length - 1;
    expect(underHigh(series.close, t)).toBeCloseTo(0.12, 10);
    expect(stateAt(series, t)).toBe("both");
  });

  it("splits the two halves so neither is credited for the other", () => {
    expect(stateAt(tape([88], 18), 260)).toBe("drawdown");
    expect(stateAt(tape([95], 30), 260)).toBe("vix");
    expect(stateAt(tape([95], 18), 260)).toBe("neither");
  });

  it("puts the line at exactly 10% under and VIX exactly 25", () => {
    expect(stateAt(tape([90], 25), 260)).toBe("both");
    expect(stateAt(tape([90.01], 24.99), 260)).toBe("neither");
  });

  it("refuses a high over fewer than 252 sessions", () => {
    const series = alignSeries([bar(0, 100), bar(1, 80)], [bar(0, 30), bar(1, 30)]);
    expect(underHigh(series.close, 1)).toBeNull();
    expect(stateAt(series, 1)).toBeNull();
  });

  it("forgets a high older than 252 sessions", () => {
    const closes = [200, ...Array(300).fill(100)];
    expect(underHigh(closes, 300)).toBe(0);
    expect(underHigh(closes, 100 + 1)).toBeNull();
  });
});

describe("pickEntries and episodesOf", () => {
  it("spaces entries at least a step apart while the condition holds", () => {
    const series = tape(Array(100).fill(85), 30);
    const entries = pickEntries(series, ["both"], 21);
    expect(entries[0]).toBe(260);
    expect(entries.slice(1).every((t, k) => t - (entries[k] ?? 0) >= 21)).toBe(true);
    expect(entries.length).toBe(5);
  });

  it("gives a run of nearby entries one episode, and a long gap a new one", () => {
    expect(episodesOf([10, 31, 52, 200, 221])).toEqual([0, 0, 0, 1, 1]);
    expect(episodesOf([0, EPISODE_GAP - 1, (EPISODE_GAP - 1) * 2])).toEqual([0, 0, 0]);
    expect(episodesOf([0, EPISODE_GAP])).toEqual([0, 1]);
  });
});

describe("shareReturn", () => {
  it("is the index return over the hold, null when the tape ends first", () => {
    expect(shareReturn([100, 110, 121], 0, 2)).toBeCloseTo(0.21, 10);
    expect(shareReturn([100, 110, 121], 1, 2)).toBeNull();
  });
});

describe("option legs", () => {
  it("satisfies put-call parity at zero rate", () => {
    expect(callValue(100, 90, 0.4, 0.5) - putValue(100, 90, 0.4, 0.5)).toBeCloseTo(10, 8);
  });

  it("sells a put whose strike sits under the spot and keeps the premium when not assigned", () => {
    const close = [100, ...Array(40).fill(100)];
    const vol = close.map(() => 0.3);
    const cycle = putCycle({ close, vol, t: 0 });
    expect(cycle).not.toBeNull();
    expect(cycle?.assigned).toBe(false);
    expect(cycle?.premium).toBeGreaterThan(0);
    expect(cycle?.pnl).toBeCloseTo(cycle?.premium ?? 0, 12);
  });

  it("charges an assigned put its loss against the strike", () => {
    const close = [100, ...Array(40).fill(70)];
    const vol = close.map(() => 0.3);
    const cycle = putCycle({ close, vol, t: 0 });
    expect(cycle?.assigned).toBe(true);
    expect(cycle?.pnl).toBeLessThan(-0.1);
  });

  it("picks a strike farther out for a smaller delta", () => {
    const close = Array(40).fill(100);
    const vol = close.map(() => 0.3);
    const near = putCycle({ close, vol, t: 0, delta: 0.4 });
    const far = putCycle({ close, vol, t: 0, delta: 0.1 });
    expect(far?.premium ?? 1).toBeLessThan(near?.premium ?? 0);
  });

  it("returns null when the tape ends before expiry", () => {
    expect(putCycle({ close: [100, 100], vol: [0.3, 0.3], t: 0 })).toBeNull();
    expect(callLegs({ close: [100, 100], volAt: () => 0.3, t: 0 })).toBeNull();
  });

  it("loses on a flat tape and never reaches double", () => {
    const close = Array(400).fill(100);
    const legs = callLegs({ close, volAt: () => 0.25, t: 0 });
    expect(legs?.hit).toBe(false);
    expect(legs?.ran).toBeLessThan(0);
    expect(legs?.half).toBeCloseTo(legs?.ran ?? 0, 12);
  });

  it("takes profit at double and averages it with the leg that runs", () => {
    const close = [100, ...Array(400).fill(250)];
    const legs = callLegs({ close, volAt: () => 0.25, t: 0 });
    expect(legs?.hit).toBe(true);
    expect(legs?.days).toBe(1);
    expect(legs?.sold).toBeGreaterThan(1);
    expect(legs?.half).toBeCloseTo(((legs?.sold ?? 0) + (legs?.ran ?? 0)) / 2, 12);
  });
});

describe("vol reads", () => {
  it("blends VIX with its year average, and scales", () => {
    const series = {
      ...tape([88], 40),
      vixAvg: Array(261).fill(20) as (number | null)[],
    };
    expect(blendedVol(series)(260)).toBeCloseTo(0.3, 10);
    expect(blendedVol(series, 0.8)(260)).toBeCloseTo(0.24, 10);
    expect(flatVol(series)(260)).toBeCloseTo(0.4, 10);
  });
});

describe("summarize", () => {
  it("quotes the sample size, the win share, the worst decile and the worst single", () => {
    const s = summarize([-0.5, -0.1, 0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7], 3);
    expect(s.n).toBe(10);
    expect(s.episodes).toBe(3);
    expect(s.win).toBeCloseTo(0.7, 10);
    expect(s.min).toBe(-0.5);
    expect(s.p10).toBeCloseTo(-0.14, 10);
  });

  it("says plainly that nothing matured", () => {
    expect(summarize([])).toEqual({ n: 0, episodes: 0 });
  });
});

describe("gapInterval", () => {
  const rows = (year: string, values: number[]) =>
    values.map((value, k) => ({ date: `${year}-0${k + 1}-01`, value }));

  it("is reproducible and puts a clear gap above zero", () => {
    const cond = [
      ...rows("2001", [0.2, 0.2]),
      ...rows("2002", [0.25, 0.25]),
      ...rows("2003", [0.3]),
    ];
    const base = [...rows("2004", [0, 0]), ...rows("2005", [0.01, 0.01]), ...rows("2006", [0.02])];
    const a = gapInterval(cond, base);
    expect(a).toEqual(gapInterval(cond, base));
    expect(a?.lo ?? 0).toBeGreaterThan(0.15);
    expect(a?.years).toBe(3);
  });

  it("has no interval without both samples", () => {
    expect(gapInterval([], rows("2001", [1]))).toBeNull();
  });
});

describe("moveVerdict", () => {
  it("reads a thin sample as underpowered, never as a kill", () => {
    const rowsOf = Array.from({ length: 5 }, (_, k) => ({
      date: `20${10 + k}-01-01`,
      value: -0.5,
      episode: k,
    }));
    const verdict = moveVerdict(rowsOf, 0.1);
    expect(verdict.outcome).toBe("underpowered");
    expect(verdict.clusters).toBe(5);
    expect(verdict.needed).toBeGreaterThan(5);
  });

  it("passes a powered sample that beats the control in the latest era too", () => {
    const rowsOf = Array.from({ length: 40 }, (_, k) => ({
      date: `${1990 + k}-01-01`,
      value: 0.2 + (k % 2 ? 0.01 : -0.01),
      episode: k,
    }));
    expect(moveVerdict(rowsOf, 0).outcome).toBe("pass");
  });

  it("kills a powered sample that does not beat the control", () => {
    const rowsOf = Array.from({ length: 40 }, (_, k) => ({
      date: `${1990 + k}-01-01`,
      value: k % 2 ? 0.01 : -0.01,
      episode: k,
    }));
    expect(moveVerdict(rowsOf, 0).outcome).toBe("kill");
  });
});
