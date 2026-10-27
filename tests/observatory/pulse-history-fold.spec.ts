import { appendFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dailyChangesOf } from "../../src/observatory/day-trophies.js";
import { downsampleMinMax } from "../../src/observatory/downsample.js";
import { equityDrawdownOf } from "../../src/observatory/equity-sparkline.js";
import { doubledAtOf, ordered } from "../../src/observatory/history-metrics.js";
import type { EquitySample } from "../../src/observatory/history-record.js";
import { JsonlHistoryStore } from "../../src/observatory/history-store.js";
import { InMemoryHistoryStore } from "../../src/observatory/in-memory-history-store.js";
import { pulseHistoryReader } from "../../src/observatory/pulse-history-cache.js";
import { PulseHistoryFold } from "../../src/observatory/pulse-history-fold.js";
import { lossHeadroomGauges, wireTradeVitalsFromDrawdown } from "../../src/observatory/vitals.js";

/** `days` of five-minute samples for one desk — production's grid — from a fixed-seed walk. */
function history(days: number, { from = "2026-04-01T00:00:00.000Z", seed = 11 } = {}) {
  let state = seed;
  const rnd = (): number => {
    state = (state * 1103515245 + 12345) % 2 ** 31;
    return state / 2 ** 31;
  };
  const start = Date.parse(from);
  const out: EquitySample[] = [];
  let equity = 50_000;
  for (let i = 0; i < days * 288; i++) {
    equity = Math.max(1_000, equity + Math.round((rnd() - 0.47) * 300));
    out.push({
      at: new Date(start + i * 300_000).toISOString(),
      participantId: "sauron",
      equity,
      cash: equity / 2,
      realizedPl: 0,
    });
  }
  return out;
}

const figures = (fold: PulseHistoryFold) => ({
  count: fold.count,
  first: fold.first,
  last: fold.last,
  low: fold.low,
  high: fold.high,
  drawdown: fold.drawdown(),
  doubled: fold.doubled,
  changes: fold.dailyChanges(),
  curve: fold.curve(),
  // The drawdown as of an instant inside the fold and one past it — the Wire's gauge input.
  drawdownMidway: fold.drawdownPctAt("2026-04-02T12:00:00.000Z"),
  drawdownNow: fold.drawdownPctAt("2027-01-01T00:00:00.000Z"),
});

describe("PulseHistoryFold — the same figures the per-request scans made", () => {
  const samples = history(40);
  const sorted = ordered(samples);
  const fold = PulseHistoryFold.of([...samples].reverse());

  it("keeps the extremes, drawdown, doubling and day closes of every sample", () => {
    expect(fold.count).toBe(samples.length);
    expect(fold.low).toBe(Math.min(...samples.map((s) => s.equity)));
    expect(fold.high).toBe(Math.max(...samples.map((s) => s.equity)));
    expect(fold.drawdown()).toEqual(equityDrawdownOf(sorted));
    expect(fold.doubled).toEqual(doubledAtOf(sorted));
    expect(fold.doubled).not.toBeNull();
    expect(fold.dailyChanges()).toEqual(dailyChangesOf(sorted));
  });

  it("plots every sample of a short history, exactly as the downsample did", () => {
    const short = sorted.slice(0, 600);
    const plotted = PulseHistoryFold.of(short).curve();
    expect(plotted).toEqual(
      downsampleMinMax(short, (s) => s.equity).map(({ at, equity }) => ({ at, equity })),
    );
    expect(plotted).toHaveLength(600);
  });

  it("bounds a long history's curve and never drops its lowest or highest sample", () => {
    const curve = fold.curve();
    expect(curve.length).toBeLessThanOrEqual(640);
    expect(curve.length).toBeGreaterThan(500);
    const lowest = sorted.find((s) => s.equity === fold.low);
    const highest = sorted.find((s) => s.equity === fold.high);
    expect(curve).toContainEqual({ at: lowest?.at, equity: fold.low });
    expect(curve).toContainEqual({ at: highest?.at, equity: fold.high });
    const times = curve.map((p) => p.at);
    expect([...times].sort()).toEqual(times);
  });

  it("keeps each slice of time's dip and spike that the sample-count buckets kept", () => {
    // Every point the old downsample plotted was a bucket's low or high; each must still sit inside
    // the new curve's envelope for its stretch of time — nothing the old chart showed is flattened.
    const old = downsampleMinMax(sorted, (s) => s.equity);
    const curve = fold.curve().map((p) => ({ t: Date.parse(p.at), e: p.equity }));
    for (const p of old) {
      const t = Date.parse(p.at);
      const near = curve.filter((c) => Math.abs(c.t - t) <= 6 * 3_600_000);
      expect(Math.min(...near.map((c) => c.e))).toBeLessThanOrEqual(p.equity);
      expect(Math.max(...near.map((c) => c.e))).toBeGreaterThanOrEqual(p.equity);
    }
  });

  it("folded in two parts equals folded at once", () => {
    const parts = new PulseHistoryFold();
    for (const s of sorted) parts.add(s);
    expect(figures(parts)).toEqual(figures(fold));
  });

  it("gives the Wire's loss-headroom gauge as of any instant, as the sorted scan did", () => {
    const scan = lossHeadroomGauges(samples);
    const held = wireTradeVitalsFromDrawdown((at) => fold.drawdownPctAt(at));
    const instants = [
      "2026-03-31T23:59:59.999Z", // before any sample
      sorted[0]?.at, // one sample: not yet measured
      "2026-04-01T00:02:00.000Z", // between the first two
      sorted[1]?.at,
      ...sorted.filter((_, i) => i % 97 === 0).map((s) => s.at),
      // A trade's instant written without milliseconds cuts by code unit in both.
      ...sorted.filter((_, i) => i % 1_009 === 0).map((s) => s.at.replace(".000Z", "Z")),
      "2027-01-01T00:00:00.000Z", // after every sample
    ].filter((at): at is string => at !== undefined);
    for (const at of instants) expect(held(at).lossHeadroom).toEqual(scan(at));
    expect(held(sorted[0]?.at ?? "").lossHeadroom.measured).toBe(false);
    expect(held("2027-01-01T00:00:00.000Z").lossHeadroom.measured).toBe(true);
  });
});

describe("pulseHistoryReader — folds only what was appended", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "pulse-fold-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const lines = (rows: readonly EquitySample[]): string =>
    rows.map((r) => `${JSON.stringify(r)}\n`).join("");

  it("matches a fresh fold after each append, without re-reading earlier lines", async () => {
    const store = new JsonlHistoryStore(dir);
    const all = history(5);
    await writeFile(join(dir, "sauron.jsonl"), lines(all.slice(0, 1000)));
    const read = pulseHistoryReader(store);
    expect(figures(await read("sauron"))).toEqual(figures(PulseHistoryFold.of(all.slice(0, 1000))));

    const since = rstest.spyOn(store, "since");
    await appendFile(join(dir, "sauron.jsonl"), lines(all.slice(1000)));
    expect(figures(await read("sauron"))).toEqual(figures(PulseHistoryFold.of(all)));
    expect(since).toHaveBeenCalledTimes(1);
    expect(since.mock.calls[0]?.[1]).toBeGreaterThan(0);
  });

  it("leaves a half-written line for the next read", async () => {
    const store = new JsonlHistoryStore(dir);
    const all = history(1);
    const file = join(dir, "sauron.jsonl");
    const torn = JSON.stringify(all[10]);
    await writeFile(file, lines(all.slice(0, 10)) + torn.slice(0, 20));
    const read = pulseHistoryReader(store);
    expect((await read("sauron")).count).toBe(10);
    await appendFile(file, `${torn.slice(20)}\n`);
    expect(figures(await read("sauron"))).toEqual(figures(PulseHistoryFold.of(all.slice(0, 11))));
  });

  it("rebuilds when an appended sample is older than the last one folded", async () => {
    const store = new JsonlHistoryStore(dir);
    const all = history(2);
    const file = join(dir, "sauron.jsonl");
    await writeFile(file, lines(all.slice(100)));
    const read = pulseHistoryReader(store);
    await read("sauron");
    await appendFile(file, lines(all.slice(0, 100)));
    expect(figures(await read("sauron"))).toEqual(figures(PulseHistoryFold.of(all)));
  });

  it("rebuilds when the file was replaced by a shorter one", async () => {
    const store = new JsonlHistoryStore(dir);
    const all = history(2);
    const file = join(dir, "sauron.jsonl");
    await writeFile(file, lines(all));
    const read = pulseHistoryReader(store);
    await read("sauron");
    await writeFile(file, lines(all.slice(0, 50)));
    expect(figures(await read("sauron"))).toEqual(figures(PulseHistoryFold.of(all.slice(0, 50))));
  });

  it("folds an append once when two reads land together", async () => {
    const store = new JsonlHistoryStore(dir);
    const all = history(1);
    const file = join(dir, "sauron.jsonl");
    await writeFile(file, lines(all.slice(0, 100)));
    const read = pulseHistoryReader(store);
    await read("sauron");
    await appendFile(file, lines(all.slice(100)));
    const [a, b] = await Promise.all([read("sauron"), read("sauron")]);
    expect(a.count).toBe(all.length);
    expect(b.count).toBe(all.length);
  });

  it("folds a store with no append-aware read from its full list", async () => {
    const store = new InMemoryHistoryStore();
    const all = history(1);
    for (const s of all) await store.save(s);
    expect(figures(await pulseHistoryReader(store)("sauron"))).toEqual(
      figures(PulseHistoryFold.of(all)),
    );
  });
});
