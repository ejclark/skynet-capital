import type { HealthFinding, HealthLevel } from "./book-health-view.js";

/**
 * BOOK HEALTH OVER TIME (#5493 slice 5) — the readings the detectors take, kept so a finding can
 * say how long it has stood and whether it is getting better or worse ("idle has grown for 5
 * days"). Pure: no I/O, no clock — the store (`src/server/book-health-history-store.ts`) persists
 * what this shapes, and the sampler hands it the time.
 *
 * ONE SAMPLE PER ACCOUNT PER HOUR. A finding's identity is its detector, play, symbol and loop
 * kind; a sample lists the findings standing at that moment with their level and a severity (one
 * number where bigger is worse). A finding absent from a sample was clear then, so a streak is
 * the unbroken run of samples that hold it.
 *
 * BOUNDED BY CONSTRUCTION, so the file can never grow without limit: samples older than
 * `RETENTION_MS` are dropped on every append, an account keeps at most `MAX_SAMPLES` of them, a
 * sample at most `MAX_FINDINGS` findings, and a second sample inside the same hour replaces the
 * first instead of adding to it.
 */

export const SAMPLE_BUCKET_MS = 60 * 60 * 1000;
export const RETENTION_MS = 14 * 24 * SAMPLE_BUCKET_MS;
export const MAX_SAMPLES = 14 * 24;
export const MAX_FINDINGS = 40;
/** How far back "getting better or worse" looks. */
const TREND_WINDOW_MS = 24 * SAMPLE_BUCKET_MS;
/** A severity must move by this share of where it was to count as a change, not noise. */
const TREND_EPSILON = 0.1;

interface SampledFinding {
  /** `findingKey`. */
  readonly k: string;
  readonly l: HealthLevel;
  /** `severityOf`: bigger is worse. */
  readonly s: number;
}

export interface HealthSample {
  readonly at: string;
  readonly f: readonly SampledFinding[];
}

type Trend = "new" | "worse" | "better" | "steady";

export interface Standing {
  /** When the unbroken run of samples holding this finding began (now, for a new one). */
  readonly since: string;
  readonly standingMs: number;
  readonly trend: Trend;
}

/** Who a finding is about: detector, play, name and, for a looping play, what it keeps hitting. */
export function findingKey(
  f: Pick<HealthFinding, "detector" | "playbookId" | "symbol" | "loop">,
): string {
  return [f.detector, f.playbookId ?? "", f.symbol ?? "", f.loop ?? ""].join("|");
}

/** One number, bigger worse. An imbalance against a target is its distance from the target; the
 *  untargeted placeholder (a share past 90% or under 10%) is how far the share is out to its end. */
export function severityOf(f: HealthFinding): number {
  if (f.detector === "imbalanced") {
    if (f.band) return Math.abs(f.band.drift);
    return f.reading >= 0.5 ? f.reading : 1 - f.reading;
  }
  return f.reading;
}

const RANK: Record<HealthLevel, number> = { signal: 1, gate: 2 };

export function sampleOf(asOf: string, findings: readonly HealthFinding[]): HealthSample {
  const seen = new Set<string>();
  const f: SampledFinding[] = [];
  for (const finding of findings) {
    const k = findingKey(finding);
    if (seen.has(k)) continue; // two findings sharing a key keep the first (gate comes first)
    seen.add(k);
    f.push({ k, l: finding.level, s: severityOf(finding) });
    if (f.length >= MAX_FINDINGS) break;
  }
  return { at: asOf, f };
}

const bucketOf = (at: string): number => Math.floor(Date.parse(at) / SAMPLE_BUCKET_MS);

/** Add a sample to an account's history, oldest first: the same hour replaces, the old fall away,
 *  the count is capped. A sample with an unreadable time, or older than the newest, is ignored. */
export function appendSample(
  samples: readonly HealthSample[],
  sample: HealthSample,
): readonly HealthSample[] {
  const now = Date.parse(sample.at);
  if (!Number.isFinite(now)) return samples;
  const last = samples[samples.length - 1];
  if (last && Date.parse(last.at) > now) return samples;
  const kept = samples.filter((s) => now - Date.parse(s.at) <= RETENTION_MS);
  const tail = kept[kept.length - 1];
  if (tail && bucketOf(tail.at) === bucketOf(sample.at)) kept.pop();
  kept.push(sample);
  return kept.length > MAX_SAMPLES ? kept.slice(kept.length - MAX_SAMPLES) : kept;
}

/** How long `finding` has stood and which way it is going, against the account's samples. */
export function standingOf(
  samples: readonly HealthSample[],
  finding: HealthFinding,
  asOf: string,
): Standing {
  const now = Date.parse(asOf);
  const key = findingKey(finding);
  const run: { at: number; level: HealthLevel; severity: number }[] = [];
  for (let i = samples.length - 1; i >= 0; i--) {
    const sample = samples[i];
    if (!sample) break;
    const at = Date.parse(sample.at);
    if (at > now) continue; // a clock step back must not make a finding older than the present
    const held = sample.f.find((x) => x.k === key);
    if (!held) break;
    run.unshift({ at, level: held.l, severity: held.s });
  }
  const first = run[0];
  const ref = run.find((r) => now - r.at <= TREND_WINDOW_MS) ?? run[run.length - 1];
  if (!(first && ref)) return { since: asOf, standingMs: 0, trend: "new" };
  const standingMs = Math.max(0, now - first.at);
  const since = new Date(first.at).toISOString();
  if (RANK[finding.level] !== RANK[ref.level]) {
    return { since, standingMs, trend: RANK[finding.level] > RANK[ref.level] ? "worse" : "better" };
  }
  const change = (severityOf(finding) - ref.severity) / Math.max(Math.abs(ref.severity), 1e-9);
  const trend: Trend =
    change > TREND_EPSILON ? "worse" : change < -TREND_EPSILON ? "better" : "steady";
  return { since, standingMs, trend };
}
