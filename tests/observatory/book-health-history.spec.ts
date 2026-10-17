import {
  appendSample,
  findingKey,
  type HealthSample,
  MAX_FINDINGS,
  MAX_SAMPLES,
  RETENTION_MS,
  SAMPLE_BUCKET_MS,
  sampleOf,
  severityOf,
  standingOf,
} from "../../src/observatory/book-health-history.js";
import type { HealthFinding } from "../../src/observatory/book-health-view.js";

/** #5493 slice 5 — the findings' history: how long one has stood, which way it is going, and the
 *  bounds that keep the record from growing without limit. */

const T0 = Date.parse("2026-10-10T14:00:00.000Z");
const at = (hours: number) => new Date(T0 + hours * SAMPLE_BUCKET_MS).toISOString();

const idle = (reading: number, level: HealthFinding["level"] = "signal"): HealthFinding => ({
  detector: "idle",
  level,
  reading,
  threshold: 0.6,
  words: "idle",
});
const sampleAt = (hours: number, findings: readonly HealthFinding[]): HealthSample =>
  sampleOf(at(hours), findings);
const build = (rows: readonly (readonly [number, readonly HealthFinding[]])[]) =>
  rows.reduce<readonly HealthSample[]>((acc, [h, f]) => appendSample(acc, sampleAt(h, f)), []);

describe("findingKey and severityOf", () => {
  it("keys a finding on detector, play, name and loop kind", () => {
    const a = findingKey({ detector: "looping", playbookId: "P", loop: "options-level" });
    const b = findingKey({ detector: "looping", playbookId: "P", loop: "no-window" });
    expect(a).not.toBe(b);
    expect(findingKey({ detector: "stuck", playbookId: "P", symbol: "A" })).not.toBe(
      findingKey({ detector: "stuck", playbookId: "P", symbol: "B" }),
    );
  });

  it("reads an imbalance against a target as its distance, and the placeholder as its far end", () => {
    const band = {
      target: 0.7,
      direction: "under" as const,
      drift: -0.08,
      signal: 0.05,
      gate: 0.1,
    };
    const base = {
      detector: "imbalanced" as const,
      level: "signal" as const,
      threshold: 0.1,
      words: "",
    };
    expect(severityOf({ ...base, reading: 0.62, band })).toBeCloseTo(0.08);
    expect(severityOf({ ...base, reading: 0.95 })).toBe(0.95);
    expect(severityOf({ ...base, reading: 0.04 })).toBeCloseTo(0.96);
    expect(severityOf(idle(0.7))).toBe(0.7);
  });
});

describe("appendSample — the bound on the record", () => {
  it("replaces a second sample inside the same hour instead of adding one", () => {
    const first = sampleOf("2026-10-10T14:05:00.000Z", [idle(0.65)]);
    const second = sampleOf("2026-10-10T14:50:00.000Z", [idle(0.7)]);
    expect(appendSample(appendSample([], first), second)).toEqual([second]);
  });

  it("drops samples older than the retention window", () => {
    const old = sampleAt(0, [idle(0.65)]);
    const fresh = sampleOf(new Date(T0 + RETENTION_MS + SAMPLE_BUCKET_MS).toISOString(), []);
    expect(appendSample([old], fresh)).toEqual([fresh]);
  });

  it("caps the count per account, keeping the newest", () => {
    let samples: readonly HealthSample[] = [];
    for (let h = 0; h < MAX_SAMPLES + 50; h++) samples = appendSample(samples, sampleAt(h, []));
    expect(samples).toHaveLength(MAX_SAMPLES);
    expect(samples.at(-1)?.at).toBe(at(MAX_SAMPLES + 49));
  });

  it("caps the findings per sample", () => {
    const many = Array.from({ length: MAX_FINDINGS + 10 }, (_, i) => ({
      ...idle(0.7),
      detector: "stuck" as const,
      symbol: `S${i}`,
    }));
    expect(sampleOf(at(0), many).f).toHaveLength(MAX_FINDINGS);
  });

  it("keeps one entry for two findings sharing a key, and ignores a sample with no readable time", () => {
    expect(sampleOf(at(0), [idle(0.7, "gate"), idle(0.65)]).f).toEqual([
      { k: "idle|||", l: "gate", s: 0.7 },
    ]);
    const samples = build([[0, []]]);
    expect(appendSample(samples, { at: "nonsense", f: [] })).toBe(samples);
  });

  it("ignores a sample older than the newest rather than reordering the record", () => {
    const samples = build([[5, []]]);
    expect(appendSample(samples, sampleAt(2, []))).toBe(samples);
  });
});

describe("standingOf — how long, and which way", () => {
  it("calls a finding with no earlier sample new, standing since now", () => {
    expect(standingOf([], idle(0.65), at(3))).toEqual({
      since: at(3),
      standingMs: 0,
      trend: "new",
    });
  });

  it("counts the unbroken run of samples that hold it", () => {
    const samples = build([
      [0, [idle(0.65)]],
      [1, []],
      [2, [idle(0.65)]],
      [3, [idle(0.65)]],
    ]);
    const s = standingOf(samples, idle(0.65), at(4));
    expect(s.since).toBe(at(2)); // the hour-1 clear broke the earlier run
    expect(s.standingMs).toBe(2 * SAMPLE_BUCKET_MS);
  });

  it("starts a new run when the latest sample no longer holds it", () => {
    const samples = build([
      [0, [idle(0.65)]],
      [1, []],
    ]);
    expect(standingOf(samples, idle(0.65), at(2)).trend).toBe("new");
  });

  it("reads a growing reading as worse, a shrinking one as better, a flat one as steady", () => {
    const samples = build([
      [0, [idle(0.65)]],
      [1, [idle(0.65)]],
    ]);
    expect(standingOf(samples, idle(0.8), at(2)).trend).toBe("worse");
    expect(standingOf(samples, idle(0.55), at(2)).trend).toBe("better");
    expect(standingOf(samples, idle(0.66), at(2)).trend).toBe("steady");
  });

  it("reads a move from signal to gate as worse, and back as better, whatever the numbers", () => {
    const signal = build([[0, [idle(0.9)]]]);
    expect(standingOf(signal, idle(0.9, "gate"), at(1)).trend).toBe("worse");
    const gate = build([[0, [idle(0.5, "gate")]]]);
    expect(standingOf(gate, idle(0.9), at(1)).trend).toBe("better");
  });

  it("compares against the earliest sample in the last day, not the start of a long run", () => {
    const rows: (readonly [number, readonly HealthFinding[]])[] = [];
    for (let h = 0; h <= 100; h++) rows.push([h, [idle(h < 70 ? 0.9 : 0.7)]]);
    const s = standingOf(build(rows), idle(0.7), at(101));
    expect(s.standingMs).toBe(101 * SAMPLE_BUCKET_MS);
    expect(s.trend).toBe("steady"); // 0.9 → 0.7 happened days ago; the last day was flat
  });

  it("ignores samples stamped after the moment asked about", () => {
    const samples = build([
      [0, [idle(0.65)]],
      [10, [idle(0.65)]],
    ]);
    expect(standingOf(samples, idle(0.65), at(1)).standingMs).toBe(SAMPLE_BUCKET_MS);
  });
});
