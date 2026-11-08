/**
 * THE LATEST VIX CLOSE (#7028 slice 3) — read from Cboe's own published daily history, the
 * exchange's file rather than a vendor's (`scripts/research/vix-settlement-geometry.mjs` reads the
 * same one), because the broker's data feed carries no volatility index. A conditions quest needs
 * one number from it: the last close, and the session it belongs to.
 *
 * Read-only and fail-soft: any failure (network, status, a file that isn't the shape expected, a
 * close that isn't a positive number) answers `undefined`, and the quest read then offers no
 * conditions quests and says so in `unread` — never a stale or guessed VIX. The file changes once a
 * day, so a read is shared for 30 minutes; overlapping callers share the request in flight.
 */

export const VIX_HISTORY_URL =
  "https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv";

export interface VixClose {
  /** The session the close belongs to, `YYYY-MM-DD`. */
  readonly session: string;
  readonly close: number;
}

/** What the quests route reads: the latest VIX close, or `undefined` when it can't be had. */
export type ReadVix = () => Promise<VixClose | undefined>;

const SHARE_MS = 30 * 60_000;
const TIMEOUT_MS = 8_000;

/** The last row of Cboe's CSV (`DATE,OPEN,HIGH,LOW,CLOSE`, dates `MM/DD/YYYY`), or undefined. */
export function lastVixClose(csv: string): VixClose | undefined {
  const lines = csv.split("\n");
  for (let i = lines.length - 1; i >= 1; i--) {
    const cells = (lines[i] ?? "").trim().split(",");
    if (cells.length < 5) continue;
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(cells[0] ?? "");
    const close = Number(cells[4]);
    if (!(m && Number.isFinite(close) && close > 0)) return undefined;
    return { session: `${m[3]}-${m[1]}-${m[2]}`, close };
  }
  return undefined;
}

/** A shared, 30-minute reader over `fetchText`; injectable so specs run offline on a fixed clock. */
export function vixReader(
  fetchText: () => Promise<string | undefined> = defaultFetch,
  now: () => number = Date.now,
): ReadVix {
  let cached: { at: number; value: VixClose } | undefined;
  let inFlight: Promise<VixClose | undefined> | undefined;
  return () => {
    if (cached && now() - cached.at < SHARE_MS) return Promise.resolve(cached.value);
    inFlight ??= (async () => {
      try {
        const text = await fetchText();
        const value = text ? lastVixClose(text) : undefined;
        if (value) cached = { at: now(), value };
        return value ?? cached?.value;
      } catch {
        return cached?.value;
      } finally {
        inFlight = undefined;
      }
    })();
    return inFlight;
  };
}

async function defaultFetch(): Promise<string | undefined> {
  const res = await fetch(VIX_HISTORY_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  return res.ok ? await res.text() : undefined;
}

/** The server's one live reader. */
export const readVix: ReadVix = vixReader();
