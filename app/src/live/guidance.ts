import { cleanStake } from "../../../src/options/guidance-stake-parse";
import type {
  GuidanceMarket,
  GuidanceSnapshot,
  GuidanceStake,
  OpenCall,
} from "../../../src/options/position-guidance-types";
import { parseOccSymbol } from "../../../src/trading/option-symbols";
import type { DeskSnapshot } from "./desk";
import type { OptionPositions } from "./options";

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

// `cleanStake` moved to src/options/guidance-stake-parse.ts (#3968) so the server can validate a
// saved position's stake with the exact same rules this browser applies to localStorage — re-export
// so nothing importing it from here needs to change.
export { cleanStake };

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

/** Stakes remembered per symbol — the saved one, the account's, and a few what-ifs. The form
 *  commits on blur, so this is a handful of real entries, never one per keystroke. */
const SEEN_PER_SYMBOL = 5;

const isSnapshot = (s: unknown): s is GuidanceSnapshot =>
  typeof s === "object" &&
  s !== null &&
  typeof (s as GuidanceSnapshot).spot === "number" &&
  Array.isArray((s as GuidanceSnapshot).calls);

/** Last looks for one symbol, one per stake (`stakeFingerprint`). A pre-#3729 value — one bare
 *  snapshot for the whole symbol, stake unknown — reads as empty: better no diff than a false one. */
function readSeen(symbol: string): Record<string, GuidanceSnapshot> {
  const raw = readJson(SNAPSHOT_KEY(symbol));
  if (typeof raw !== "object" || raw === null || Array.isArray(raw) || isSnapshot(raw)) return {};
  return Object.fromEntries(Object.entries(raw).filter(([, s]) => isSnapshot(s)));
}

/** This stake's last look at `symbol` — never another stake's, which would show the stake's own
 *  effect as if the market had moved. */
export function readSnapshot(symbol: string, stakeId: string): GuidanceSnapshot | undefined {
  return readSeen(symbol)[stakeId];
}

export function writeSnapshot(symbol: string, stakeId: string, snapshot: GuidanceSnapshot): void {
  const { [stakeId]: _replaced, ...rest } = readSeen(symbol);
  // Newest last; the oldest stakes fall off the front.
  const kept = Object.entries(rest).slice(-(SEEN_PER_SYMBOL - 1));
  writeJson(SNAPSHOT_KEY(symbol), Object.fromEntries([...kept, [stakeId, snapshot]]));
}

const num = (s: string): number => Number(s.replace(/[^0-9.-]/g, ""));

/**
 * The member's paper position in `symbol`, as a stake (#3729 step 4): shares and average cost from
 * the account the trade page is already reading. Stock only — an option row is not "shares you
 * hold". Undefined when the account holds none, so a hypothetical stake is never overwritten.
 */
export function heldStake(
  desk: DeskSnapshot | undefined,
  symbol: string,
  quotes?: OptionPositions,
): GuidanceStake | undefined {
  const positions = desk?.desk.positions ?? [];
  const held = positions.find((p) => !p.isOption && p.symbol === symbol);
  if (!held) return undefined;
  const shares = Math.floor(num(held.quantity));
  const costBasis = num(held.costPerShare);
  if (!(shares > 0)) return undefined;
  // Calls already sold on this stock (a short call is a negative quantity) — those lots are taken.
  const callsSold = positions
    .filter((p) => p.isOption && num(p.quantity) < 0)
    .filter((p) => {
      const parts = parseOccSymbol(p.symbol);
      return parts?.underlying === symbol && parts.type === "call";
    })
    .reduce((n, p) => n - num(p.quantity), 0);
  const openCalls = openCallsOf(desk, symbol, quotes);
  return {
    shares,
    ...(costBasis > 0 ? { costBasis } : {}),
    ...(callsSold > 0 ? { callsSold } : {}),
    ...(openCalls.length ? { openCalls } : {}),
  };
}

/**
 * The covered calls already open on `symbol`, for "Calls you've sold" (#3729): the account's short
 * call positions, joined by OCC symbol to the Option positions card's own quotes (bid/ask per
 * share). The premium received is the position's average price, which the broker reports PER
 * CONTRACT for options (src/observatory/position-plain.ts) — so ÷ 100 for per share. A contract
 * with no quote yet still appears; the engine then says it has no price to buy it back at.
 */
export function openCallsOf(
  desk: DeskSnapshot | undefined,
  symbol: string,
  quotes?: OptionPositions,
): OpenCall[] {
  const rows = new Map((quotes?.available ? quotes.rows : []).map((r) => [r.symbol, r]));
  return (desk?.desk.positions ?? []).flatMap((p) => {
    const parts = p.isOption ? parseOccSymbol(p.symbol) : undefined;
    const contracts = -num(p.quantity);
    if (!(parts?.underlying === symbol && parts.type === "call" && contracts > 0)) return [];
    const premium = num(p.costPerShare) / 100;
    if (!(premium > 0)) return [];
    const q = rows.get(p.symbol);
    return [
      {
        occ: p.symbol,
        strike: parts.strike,
        expiration: parts.expiration,
        contracts,
        premium,
        ...(q?.bid !== undefined ? { bid: q.bid } : {}),
        ...(q?.ask !== undefined ? { ask: q.ask } : {}),
      },
    ];
  });
}
