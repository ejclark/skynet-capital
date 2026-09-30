/**
 * COND-SCOUT's bots→app wire (#3651 slice 7a) — the shadow ledger's current state, sent whole on
 * every `/controls` poll over the private, secret-authenticated bridge (`insights-listener.ts`).
 *
 * WHY A FULL SNAPSHOT, NOT A CURSOR. Retros keep changing after a probe closes (later exits fill
 * in, the market benchmark lands the next session), so they can't ride `decision.v1`, whose rows
 * are immutable. The ledger is small by construction — at most 10 open probes and the newest 50
 * retros — so sending it whole each poll costs tens of KB on the private network and removes every
 * cursor-drift failure mode `decision-replication-client.ts` had to document. The app keeps only
 * the latest snapshot; a redeploy is healed by the next poll.
 *
 * FAIL-CLOSED. Same house style as `decision-wire.ts`: every field checked, counts and strings
 * bounded, numbers finite, enums from their real sets. Anything off → undefined → HTTP 400.
 */
import {
  SCOUT_CONDITIONS,
  SCOUT_HYPOTHESES,
  type ScoutCondition,
  type ScoutHypothesisId,
} from "../playbooks/cond-scout.js";
import type {
  ExitCheckpoint,
  LaterExit,
  MarketBenchmark,
  ProbeRetro,
} from "../playbooks/cond-scout-retro.js";
import { isRecord } from "../storage/parse-guards.js";

export const COND_SCOUT_KIND = "cond-scout.v1";
export const MAX_OPEN_PROBES = 20;
export const MAX_RETROS = 50;
const MAX_ID = 64;
const MAX_CHECKPOINTS = 8;

/** What the Heartbeat needs to draw one open probe — narrower than the runner's own record. */
export interface OpenProbeView {
  readonly id: string;
  readonly symbol: string;
  readonly hypothesis: ScoutHypothesisId;
  readonly condition: ScoutCondition;
  readonly openedAt: number;
  readonly expiresAt: number;
  readonly entryPrice: number;
  readonly stopPrice: number;
  readonly notional: number;
  /** Return if closed at the latest snapshot's bid; absent before the first snapshot. */
  readonly markRoi?: number;
}

export interface CondScoutSnapshot {
  readonly kind: typeof COND_SCOUT_KIND;
  /** The bot account the scout runs beside — the only Heartbeat that shows it. */
  readonly hostPersonaId: string;
  readonly at: number;
  readonly open: readonly OpenProbeView[];
  readonly retros: readonly ProbeRetro[];
}

const id = (v: unknown): string | undefined =>
  typeof v === "string" && v.length > 0 && v.length <= MAX_ID ? v : undefined;
const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;
const hypothesisOf = (v: unknown) => SCOUT_HYPOTHESES.find((h) => h === v);
const conditionOf = (v: unknown) => SCOUT_CONDITIONS.find((c) => c === v);

function list<T>(v: unknown, max: number, parse: (x: unknown) => T | undefined): T[] | undefined {
  if (!Array.isArray(v) || v.length > max) return undefined;
  const out: T[] = [];
  for (const item of v) {
    const parsed = parse(item);
    if (parsed === undefined) return undefined;
    out.push(parsed);
  }
  return out;
}

function parseOpen(v: unknown): OpenProbeView | undefined {
  if (!isRecord(v)) return undefined;
  const pid = id(v.id);
  const symbol = id(v.symbol);
  const hypothesis = hypothesisOf(v.hypothesis);
  const condition = conditionOf(v.condition);
  const [openedAt, expiresAt, entryPrice, stopPrice, notional] = [
    num(v.openedAt),
    num(v.expiresAt),
    num(v.entryPrice),
    num(v.stopPrice),
    num(v.notional),
  ];
  if (
    !(pid && symbol && hypothesis && condition) ||
    openedAt === undefined ||
    expiresAt === undefined ||
    entryPrice === undefined ||
    stopPrice === undefined ||
    notional === undefined
  ) {
    return undefined;
  }
  const markRoi = num(v.markRoi);
  if (v.markRoi !== undefined && markRoi === undefined) return undefined;
  return {
    id: pid,
    symbol,
    hypothesis,
    condition,
    openedAt,
    expiresAt,
    entryPrice,
    stopPrice,
    notional,
    ...(markRoi !== undefined ? { markRoi } : {}),
  };
}

const EARLIER_LABELS: readonly ExitCheckpoint["label"][] = ["25%", "50%", "75%", "best pace"];

function parseEarlier(v: unknown): ExitCheckpoint | undefined {
  if (!isRecord(v)) return undefined;
  const label = EARLIER_LABELS.find((l) => l === v.label);
  const [at, daysHeld, roi, roiPerDay] = [num(v.at), num(v.daysHeld), num(v.roi), num(v.roiPerDay)];
  if (
    !label ||
    at === undefined ||
    daysHeld === undefined ||
    roi === undefined ||
    roiPerDay === undefined
  ) {
    return undefined;
  }
  return { label, at, daysHeld, roi, roiPerDay };
}

function parseLater(v: unknown): LaterExit | undefined {
  if (!isRecord(v)) return undefined;
  const label = id(v.label);
  const [horizonDays, dueAt] = [num(v.horizonDays), num(v.dueAt)];
  if (!label || horizonDays === undefined || dueAt === undefined) return undefined;
  const filled = v.roi !== undefined;
  const [roi, roiPerDay, filledAt] = [num(v.roi), num(v.roiPerDay), num(v.filledAt)];
  if (filled && (roi === undefined || roiPerDay === undefined || filledAt === undefined)) {
    return undefined;
  }
  return {
    label,
    horizonDays,
    dueAt,
    ...(filled && roi !== undefined && roiPerDay !== undefined && filledAt !== undefined
      ? { roi, roiPerDay, filledAt, priceBasis: "daily close" as const }
      : {}),
  };
}

function parseMarket(v: unknown): MarketBenchmark | undefined {
  if (!isRecord(v)) return undefined;
  const symbol = id(v.symbol);
  const [roi, excess] = [num(v.roi), num(v.excess)];
  return symbol && roi !== undefined && excess !== undefined ? { symbol, roi, excess } : undefined;
}

const REASONS: readonly ProbeRetro["reason"][] = ["invalidated", "horizon"];

function parseRetro(v: unknown): ProbeRetro | undefined {
  if (!isRecord(v)) return undefined;
  const probeId = id(v.probeId);
  const symbol = id(v.symbol);
  const hypothesis = hypothesisOf(v.hypothesis);
  const condition = conditionOf(v.condition);
  const reason = REASONS.find((r) => r === v.reason);
  const nums = {
    openedAt: num(v.openedAt),
    closedAt: num(v.closedAt),
    daysHeld: num(v.daysHeld),
    roi: num(v.roi),
    roiPerDay: num(v.roiPerDay),
    bestMarkRoi: num(v.bestMarkRoi),
    worstMarkRoi: num(v.worstMarkRoi),
    snapshotCount: num(v.snapshotCount),
    entryPrice: num(v.entryPrice),
  };
  if (!(probeId && symbol && hypothesis && condition && reason)) return undefined;
  if (Object.values(nums).some((n) => n === undefined)) return undefined;
  if (typeof v.directionRight !== "boolean" || typeof v.soonerWasBetter !== "boolean") {
    return undefined;
  }
  const earlierExits = list(v.earlierExits, MAX_CHECKPOINTS, parseEarlier);
  const laterExits = list(v.laterExits, MAX_CHECKPOINTS, parseLater);
  if (!(earlierExits && laterExits)) return undefined;
  const market = v.market === undefined ? undefined : parseMarket(v.market);
  if (v.market !== undefined && !market) return undefined;
  const rsiDelta = num(v.rsiDelta);
  const sentimentDelta = num(v.sentimentDelta);
  return {
    probeId,
    symbol,
    hypothesis,
    condition,
    reason,
    openedAt: nums.openedAt as number,
    closedAt: nums.closedAt as number,
    daysHeld: nums.daysHeld as number,
    roi: nums.roi as number,
    roiPerDay: nums.roiPerDay as number,
    directionRight: v.directionRight,
    bestMarkRoi: nums.bestMarkRoi as number,
    worstMarkRoi: nums.worstMarkRoi as number,
    snapshotCount: nums.snapshotCount as number,
    earlierExits,
    soonerWasBetter: v.soonerWasBetter,
    entryPrice: nums.entryPrice as number,
    laterExits,
    ...(market ? { market } : {}),
    ...(rsiDelta !== undefined ? { rsiDelta } : {}),
    ...(sentimentDelta !== undefined ? { sentimentDelta } : {}),
  };
}

export function parseCondScoutSnapshot(value: unknown): CondScoutSnapshot | undefined {
  if (!isRecord(value) || value.kind !== COND_SCOUT_KIND) return undefined;
  const hostPersonaId = id(value.hostPersonaId);
  const at = num(value.at);
  const open = list(value.open, MAX_OPEN_PROBES, parseOpen);
  const retros = list(value.retros, MAX_RETROS, parseRetro);
  if (!hostPersonaId || at === undefined || !open || !retros) return undefined;
  return { kind: COND_SCOUT_KIND, hostPersonaId, at, open, retros };
}
