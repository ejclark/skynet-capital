import { etWall } from "../domain/et-wall.js";
import { finiteOrUndefined } from "../domain/finite.js";
import { BAR_MINUTES, type FetchIntradayBars, type IntradayBar } from "../domain/intraday-bar.js";
import type { AlpacaTradingTransport } from "./trading-transport.js";

/**
 * 5-minute regular-hours bars for one ticker from Alpaca's market-data host (#5489) — the feed the
 * dip-to-bounce playbook watches. It is the same host, the same bot credential and the same free
 * IEX feed the daily-bars reader already uses (`AlpacaOptionsClient.getBars`): no new source, no
 * new key. A READ ONLY seam: it is handed a `get` and nothing else, so it cannot place or change an
 * order whatever it is wired to.
 *
 * IEX VOLUME IS A SLICE OF THE TAPE. The study (`docs/research/intraday-dip-bounce-2026-10.md`) read
 * consolidated Yahoo bars; IEX prints a few percent of the volume, so session VWAP here is IEX's own
 * volume-weighted price and a thin 5-minute window can have no bar at all. Ranges and the dip itself
 * carry over; the equivalence is what the dark run measures, which is why every signal records the
 * quote beside it.
 *
 * Fail-soft in the house way: `undefined` means the feed could not be read (no transport answer, a
 * non-2xx, a throw), an EMPTY array a real answer of no bars. A bar missing any OHLCV field is
 * dropped whole, never completed from its neighbours.
 */

// The regular session, in ET minutes: 9:30 up to (not including) 16:00.
const OPEN_MINUTES = 570;
const CLOSE_MINUTES = 960;
const PAGE_LIMIT = 10_000;
/** A window of ~20 sessions is one page; three is headroom, not a loop to a cursor that never ends. */
const MAX_PAGES = 3;

function barOf(raw: Record<string, unknown>): IntradayBar | undefined {
  const at = typeof raw.t === "string" ? Date.parse(raw.t) : Number.NaN;
  const wall = etWall(at);
  const [open, high, low, close, volume] = [raw.o, raw.h, raw.l, raw.c, raw.v].map(
    finiteOrUndefined,
  );
  if (
    !wall ||
    open === undefined ||
    high === undefined ||
    low === undefined ||
    close === undefined ||
    volume === undefined
  ) {
    return undefined;
  }
  // Regular hours only; pre- and after-market prints are another game.
  if (wall.minutes < OPEN_MINUTES || wall.minutes + BAR_MINUTES > CLOSE_MINUTES) return undefined;
  return { date: wall.date, minutes: wall.minutes, open, high, low, close, volume };
}

interface Page {
  readonly bars: readonly IntradayBar[];
  readonly next: string | undefined;
}

/** One page of the bars endpoint, or undefined on a non-2xx. */
async function readPage(
  data: Pick<AlpacaTradingTransport, "get">,
  symbol: string,
  window: { readonly startDate: string; readonly endDate: string },
  pageToken: string | undefined,
): Promise<Page | undefined> {
  const query = new URLSearchParams({
    timeframe: "5Min",
    // Midnight UTC covers the whole ET day at either end.
    start: `${window.startDate}T00:00:00Z`,
    end: `${window.endDate}T23:59:59Z`,
    limit: String(PAGE_LIMIT),
    feed: "iex",
    adjustment: "split",
    sort: "asc",
    ...(pageToken ? { page_token: pageToken } : {}),
  });
  const response = await data.get(
    `/v2/stocks/${encodeURIComponent(symbol)}/bars?${query.toString()}`,
  );
  if (response.status < 200 || response.status >= 300) return undefined;
  const body = response.body as {
    bars?: Record<string, unknown>[] | null;
    next_page_token?: string | null;
  } | null;
  return {
    bars: (body?.bars ?? []).flatMap((raw) => barOf(raw) ?? []),
    next: body?.next_page_token ?? undefined,
  };
}

export function alpacaIntradayBars(data: Pick<AlpacaTradingTransport, "get">): FetchIntradayBars {
  return async (symbol, startDate, endDate) => {
    try {
      const bars: IntradayBar[] = [];
      let pageToken: string | undefined;
      for (let page = 0; page < MAX_PAGES; page += 1) {
        const read = await readPage(data, symbol, { startDate, endDate }, pageToken);
        if (!read) return undefined;
        bars.push(...read.bars);
        pageToken = read.next;
        if (!pageToken) {
          return bars.sort((a, b) =>
            a.date === b.date ? a.minutes - b.minutes : a.date < b.date ? -1 : 1,
          );
        }
      }
      // Pages left over means the newest bars (the ones that matter) were never read: say so as
      // an unreadable feed rather than hand back a window that stops short.
      return undefined;
    } catch {
      return undefined;
    }
  };
}
