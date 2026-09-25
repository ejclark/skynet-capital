import type {
  GuidanceGoal,
  GuidanceMarket,
  GuidanceSnapshot,
  GuidanceStake,
} from "../../../src/options/position-guidance-types";

/**
 * POSITION GUIDANCE, CLIENT SIDE (#3729 step 3). The route answers with the MARKET only — quotes,
 * spot, the research's stance, the freshness checks — and this browser applies the member's stake
 * to it (`positionGuidance({ ...market, stake })`). So the stake is never in a URL, a log or a
 * request, and one read serves every stake: the query key is the symbol alone, and editing a
 * field re-runs the pure engine without another ~30 broker calls.
 *
 * The stake and the last-seen snapshot live in this browser's own storage, per symbol. Both are
 * conveniences, never records: every read is wrapped, and a viewer without storage still gets
 * full guidance for the session.
 */

export type GuidanceAnswer =
  | { readonly market: GuidanceMarket }
  | { readonly reason: string; readonly note: string };

export async function fetchGuidance(symbol: string, refresh = false): Promise<GuidanceAnswer> {
  const url = `/api/trade/guidance?symbol=${encodeURIComponent(symbol)}${refresh ? "&refresh=1" : ""}`;
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return (await res.json()) as GuidanceAnswer;
}

export const guidanceKey = (symbol: string) => ["guidance", symbol] as const;

/**
 * One market read per symbol. Never refetched on window focus: a full read is ~30 broker calls,
 * and the freshness strip already says how old each input is — the Refresh button is how a member
 * asks for a new one. Fifteen seconds matches the server's own coalescing window.
 */
export function guidanceQuery(symbol: string) {
  return {
    queryKey: guidanceKey(symbol),
    queryFn: () => fetchGuidance(symbol),
    enabled: symbol !== "",
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  };
}

const STAKE_KEY = (symbol: string) => `skynet-guidance-stake:${symbol}`;
const SNAPSHOT_KEY = (symbol: string) => `skynet-guidance-seen:${symbol}`;
const GOALS: readonly GuidanceGoal[] = ["income", "keep-shares", "exit"];

const positive = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) && v > 0 ? v : undefined;

/** Only the fields the engine reads, each one a positive finite number — storage is untrusted. */
export function cleanStake(raw: unknown): GuidanceStake {
  const r = (raw ?? {}) as Record<string, unknown>;
  const shares = positive(r.shares);
  const costBasis = positive(r.costBasis);
  const cash = positive(r.cash);
  const happyToOwnAt = positive(r.happyToOwnAt);
  const goal = GOALS.find((g) => g === r.goal);
  return {
    ...(shares !== undefined ? { shares: Math.floor(shares) } : {}),
    ...(costBasis !== undefined ? { costBasis } : {}),
    ...(cash !== undefined ? { cash } : {}),
    ...(happyToOwnAt !== undefined ? { happyToOwnAt } : {}),
    ...(goal ? { goal } : {}),
  };
}

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* no storage: the session still has it */
  }
}

export const readStake = (symbol: string): GuidanceStake => cleanStake(readJson(STAKE_KEY(symbol)));
export const writeStake = (symbol: string, stake: GuidanceStake): void =>
  writeJson(STAKE_KEY(symbol), cleanStake(stake));

export function readSnapshot(symbol: string): GuidanceSnapshot | undefined {
  const s = readJson(SNAPSHOT_KEY(symbol)) as GuidanceSnapshot | undefined;
  return s && typeof s.spot === "number" && Array.isArray(s.calls) ? s : undefined;
}
export const writeSnapshot = (symbol: string, snapshot: GuidanceSnapshot): void =>
  writeJson(SNAPSHOT_KEY(symbol), snapshot);
