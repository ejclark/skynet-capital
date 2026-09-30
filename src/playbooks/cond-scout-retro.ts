/**
 * COND-SCOUT's retrospective (#3651 slice 4) — written the moment a shadow probe closes, from the
 * close and the hourly snapshots taken while it was open. Pure: the runner hands it both.
 *
 * THE EARLIER-EXIT SWEEP is Eric's question (2026-09-24): "If we would've closed the position
 * sooner in the process, could we have returned higher ROI (we also free up capital to place a
 * second bet in that scenario)." Everything inside the hold is already history when the probe
 * closes, so it is answered here, immediately — each checkpoint priced off that snapshot's BID,
 * the same fill rule a real exit uses. The later-exit sweep (checkpoints beyond the close) needs
 * wall-clock time to pass and is slice 5's.
 *
 * CAPITAL-TIME, NOT RAW ROI. A smaller win taken sooner frees the money for another bet, so every
 * checkpoint carries ROI per day beside raw ROI. The best-pace checkpoint only considers exits
 * held at least a day: an hour-old mark annualizes into noise, and a 5-to-14-day thesis isn't
 * answered by its first hour.
 */
import type { ConditionReading } from "./cond-scout.js";
import type { ShadowClose, ShadowSnapshot } from "./cond-scout-ledger.js";

const DAY_MS = 86_400_000;

/** A hypothetical exit at one moment inside the hold. */
export interface ExitCheckpoint {
  /** Fraction of the actual hold this checkpoint sits at (0.25, 0.5, 0.75), or the best-pace one. */
  readonly label: "25%" | "50%" | "75%" | "best pace";
  readonly at: number;
  readonly daysHeld: number;
  readonly roi: number;
  readonly roiPerDay: number;
}

export interface ProbeRetro {
  readonly probeId: string;
  readonly symbol: string;
  readonly hypothesis: ShadowClose["probe"]["hypothesis"];
  readonly condition: ShadowClose["probe"]["condition"];
  readonly reason: ShadowClose["reason"];
  readonly openedAt: number;
  readonly closedAt: number;
  readonly daysHeld: number;
  readonly roi: number;
  readonly roiPerDay: number;
  /** Did the price move the way the thesis said? Judged at the exit bid vs the entry ask. */
  readonly directionRight: boolean;
  /** Best and worst mark while open (at the bid), including the exit — the path, not just ends. */
  readonly bestMarkRoi: number;
  readonly worstMarkRoi: number;
  /** RSI / sentiment at the first and last snapshot, when both were readable. */
  readonly rsiDelta?: number;
  readonly sentimentDelta?: number;
  readonly snapshotCount: number;
  /** Earlier hypothetical exits, priced from the snapshots. Empty when no snapshot fell inside. */
  readonly earlierExits: readonly ExitCheckpoint[];
  /** True when some earlier exit (held ≥ 1 day) beat the actual exit's ROI per day. */
  readonly soonerWasBetter: boolean;
}

function checkpoint(
  label: ExitCheckpoint["label"],
  snapshot: ShadowSnapshot,
  openedAt: number,
): ExitCheckpoint {
  const daysHeld = (snapshot.at - openedAt) / DAY_MS;
  return {
    label,
    at: snapshot.at,
    daysHeld,
    roi: snapshot.markRoi,
    roiPerDay: snapshot.markRoi / Math.max(daysHeld, 1 / 24),
  };
}

/** The last snapshot at or before `at` — the price the probe could actually have exited at then. */
function latestBy(snapshots: readonly ShadowSnapshot[], at: number): ShadowSnapshot | undefined {
  let found: ShadowSnapshot | undefined;
  for (const s of snapshots) if (s.at <= at) found = s;
  return found;
}

function readingDelta(
  first: ConditionReading | undefined,
  last: ConditionReading | undefined,
  key: "rsi" | "sentiment",
): number | undefined {
  const a = first?.[key];
  const b = last?.[key];
  return a !== undefined && b !== undefined ? b - a : undefined;
}

export function probeRetro(close: ShadowClose, snapshots: readonly ShadowSnapshot[]): ProbeRetro {
  const { probe } = close;
  const inside = snapshots
    .filter((s) => s.probeId === probe.id && s.at > probe.openedAt && s.at < close.closedAt)
    .sort((a, b) => a.at - b.at);
  const all = snapshots.filter((s) => s.probeId === probe.id).sort((a, b) => a.at - b.at);

  const hold = close.closedAt - probe.openedAt;
  const earlierExits: ExitCheckpoint[] = [];
  const seen = new Set<number>();
  for (const [label, fraction] of [
    ["25%", 0.25],
    ["50%", 0.5],
    ["75%", 0.75],
  ] as const) {
    const snapshot = latestBy(inside, probe.openedAt + hold * fraction);
    if (!snapshot || seen.has(snapshot.at)) continue;
    seen.add(snapshot.at);
    earlierExits.push(checkpoint(label, snapshot, probe.openedAt));
  }
  const paced = inside
    .map((s) => checkpoint("best pace", s, probe.openedAt))
    .filter((c) => c.daysHeld >= 1)
    .sort((a, b) => b.roiPerDay - a.roiPerDay)[0];
  if (paced) earlierExits.push(paced);

  const marks = [...all.map((s) => s.markRoi), close.roi];
  const rsiDelta = readingDelta(all[0]?.reading, all.at(-1)?.reading, "rsi");
  const sentimentDelta = readingDelta(all[0]?.reading, all.at(-1)?.reading, "sentiment");
  return {
    probeId: probe.id,
    symbol: probe.symbol,
    hypothesis: probe.hypothesis,
    condition: probe.condition,
    reason: close.reason,
    openedAt: probe.openedAt,
    closedAt: close.closedAt,
    daysHeld: close.daysHeld,
    roi: close.roi,
    roiPerDay: close.roiPerDay,
    directionRight:
      probe.forecast.direction === "up"
        ? close.exitPrice > probe.entryPrice
        : close.exitPrice < probe.entryPrice,
    bestMarkRoi: Math.max(...marks),
    worstMarkRoi: Math.min(...marks),
    ...(rsiDelta !== undefined ? { rsiDelta } : {}),
    ...(sentimentDelta !== undefined ? { sentimentDelta } : {}),
    snapshotCount: all.length,
    earlierExits,
    soonerWasBetter: paced !== undefined && paced.roiPerDay > close.roiPerDay,
  };
}
