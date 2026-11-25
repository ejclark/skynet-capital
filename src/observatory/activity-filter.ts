import { parseOccSymbol } from "../trading/option-symbols.js";
import type { ActivityItem } from "./spread-activity.js";

/**
 * NARROWING AN ACCOUNT'S ACTIVITY (#4650, plan #4642) — by the stock an order trades and by the
 * playbook that placed it, decided on the server BEFORE the page is cut, so the cursor walks the
 * narrowed list and "load older" never skips a match the first page happened to drop. A filter run
 * in the browser over one page would only ever narrow the newest 30 orders.
 *
 * A row's stock is its underlying: a share's ticker, an option contract's root, and for a bot's
 * folded spread — whose broker symbol is none (`""`) — the stock its decision named. A row's
 * playbook is read through the same exact order-id join that attaches its decision, a spread by the
 * spread's own order id, never a leg's.
 */

/** The stock an Activity row trades. */
function activityUnderlying(item: ActivityItem): string {
  if (item.kind === "spread") return item.spread.underlying.trim().toUpperCase();
  const symbol = item.record.symbol.trim().toUpperCase();
  return parseOccSymbol(symbol)?.underlying ?? symbol;
}

/** The order id whose decision explains the row — the spread's own for a folded spread. */
function activityOrderId(item: ActivityItem): string {
  return item.kind === "spread" ? item.spread.orderId : item.record.orderId;
}

/** `?symbol=` as a stock: trimmed and upper-cased, an option contract read as its root, blank as
 *  no filter at all. Anything else is matched as typed, so a symbol nothing traded matches nothing —
 *  an empty list that says so, never the whole ledger posing as the filtered one. */
export function requestedUnderlying(raw: string | null | undefined): string | undefined {
  const symbol = (raw ?? "").trim().toUpperCase();
  if (symbol === "") return undefined;
  return parseOccSymbol(symbol)?.underlying ?? symbol;
}

/** The playbook that placed an order, by its id — undefined for an order no playbook placed. */
export type PlaybookOf = (orderId: string) => string | undefined;

/** The decision store's exact order-id join, read only for the intent's playbook. */
export type FindOrderIntent = (
  orderId: string,
) => { readonly intent: { readonly playbookId?: string | undefined } } | undefined;

/**
 * `findByOrderId` narrowed to the playbook, remembered for the process (#8397). Since #8254 every
 * signed-in member's read of a bot's Activity builds the chip list, which asks about EVERY order in
 * the ledger (`ledgerPlaybooks`) — about 16k at 180 days, each one a whole decision record assembled
 * and parsed, on every `no-store` request. The join's tables are insert-only, so an order's playbook
 * never changes once found: a hit (a playbook, or a decision that named none) is kept for good, and
 * the next read asks only about orders it has not seen.
 *
 * A miss is kept only while `joinMark` holds still. A decision replicated late can name an order the
 * ledger already holds, and that write moves `DecisionDb.orderJoinMark`, which forgets every miss at
 * once. The mark is read once per synchronous pass, as `rememberSpreadLegs` reads its own, since the
 * chip list asks for the whole ledger in one turn. With no `joinMark`, no miss is kept.
 *
 * Holds order ids and playbook names, never decision records.
 */
export function rememberPlaybooks(find: FindOrderIntent, joinMark?: () => string): PlaybookOf {
  const found = new Map<string, string | undefined>();
  const missed = new Set<string>();
  let missedAt: string | undefined;
  let markThisPass: string | undefined;
  const missedNow = (orderId: string, readMark: () => string): boolean => {
    if (markThisPass === undefined) {
      markThisPass = readMark();
      queueMicrotask(() => {
        markThisPass = undefined;
      });
    }
    if (markThisPass !== missedAt) {
      missed.clear();
      missedAt = markThisPass;
    }
    return missed.has(orderId);
  };
  return (orderId) => {
    if (found.has(orderId)) return found.get(orderId);
    if (joinMark && missedNow(orderId, joinMark)) return undefined;
    const hit = find(orderId);
    if (hit) found.set(orderId, hit.intent.playbookId);
    else if (joinMark) missed.add(orderId);
    return hit?.intent.playbookId;
  };
}

export interface ActivityNarrowing {
  readonly underlying?: string | undefined;
  readonly playbook?: string | undefined;
}

/** The rows to keep, or undefined when nothing narrows the list. `playbookOf` answers for an order
 *  id; the caller decides whether the viewer may filter by playbook at all (#885). */
export function activityKeep(
  narrowing: ActivityNarrowing,
  playbookOf: PlaybookOf,
): ((item: ActivityItem) => boolean) | undefined {
  const { underlying, playbook } = narrowing;
  if (underlying === undefined && playbook === undefined) return undefined;
  return (item) =>
    (underlying === undefined || activityUnderlying(item) === underlying) &&
    (playbook === undefined || playbookOf(activityOrderId(item)) === playbook);
}

/** Every playbook the ledger's rows were placed under, sorted — the owner's chip list, so a chip is
 *  never offered for a playbook with no order here. */
export function ledgerPlaybooks(items: readonly ActivityItem[], playbookOf: PlaybookOf): string[] {
  const found = new Set<string>();
  for (const item of items) {
    const playbook = playbookOf(activityOrderId(item));
    if (playbook) found.add(playbook);
  }
  return [...found].sort();
}

/** What `deskActivityView` narrows a page by: the rows to keep, and the playbook lookup — handed
 *  in for the bot's owner alone, and the only thing that makes a page carry the chip list. */
export interface ActivityNarrowOptions {
  readonly keep?: ((item: ActivityItem) => boolean) | undefined;
  readonly playbookOf?: PlaybookOf | undefined;
}

/** A request's `?symbol=` and `?playbook=` as page options. Without `playbookOf` (anyone but the
 *  bot's owner) `?playbook=` is not read at all, so the page is the unfiltered one. */
export function activityNarrowing(
  params: URLSearchParams,
  playbookOf: PlaybookOf | undefined,
): ActivityNarrowOptions {
  const underlying = requestedUnderlying(params.get("symbol"));
  const playbook = playbookOf ? params.get("playbook")?.trim() || undefined : undefined;
  return {
    keep: activityKeep({ underlying, playbook }, playbookOf ?? (() => undefined)),
    playbookOf,
  };
}

/** The folded ledger (newest first) narrowed for paging, and the owner's chip list, read off ALL of
 *  it — never just this page's rows, nor only the filtered ones. */
export function narrowActivity(
  folded: ActivityItem[],
  opts: ActivityNarrowOptions,
): { readonly rows: ActivityItem[]; readonly facets: { readonly playbooks?: string[] } } {
  return {
    rows: opts.keep ? folded.filter(opts.keep) : folded,
    facets: opts.playbookOf ? { playbooks: ledgerPlaybooks(folded, opts.playbookOf) } : {},
  };
}
