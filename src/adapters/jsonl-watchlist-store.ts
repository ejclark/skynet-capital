import { join } from "node:path";
import type { WatchlistPort } from "../ports/watchlist.js";
import { JsonlKeyedStore } from "../storage/jsonl-store.js";
import { foldWatchlistLines, type WatchedSymbol } from "../trading/watchlist.js";

/**
 * THE DURABLE `WatchlistPort` (#3407 P4, #4332) — one append-only JSONL file per member under
 * `dir`, on the mounted volume. Same shape as `jsonl-alert-dismissals.ts` beside it: a line is one
 * decision, `load` folds the file back into the list standing now.
 *
 * APPEND-ONLY, FOR A LIST THAT CHANGES. A remove is a line (`removed: true`), not an edit — so a
 * crash mid-write can tear the newest line and lose at most the last decision, never rewrite the
 * list into something the member never chose. `foldWatchlistLines` in `src/trading/watchlist.ts`
 * owns the fold, so the "last line per symbol wins" rule is one specced function rather than a
 * loop that lives in an adapter.
 *
 * The filename is the member id with everything outside `[A-Za-z0-9_-]` replaced — the history
 * store's own rule, kept, so an id that arrives with a slash or a dot can never address a path
 * outside `dir`.
 */
interface WatchlistLine {
  readonly symbol: string;
  readonly at: string;
  readonly removed?: boolean;
}

export class JsonlWatchlist implements WatchlistPort {
  private readonly store: JsonlKeyedStore<WatchlistLine>;

  constructor(
    dir: string,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.store = new JsonlKeyedStore<WatchlistLine>(dir, (memberId) =>
      join(dir, `${memberId.replace(/[^a-zA-Z0-9_-]/g, "_")}.jsonl`),
    );
  }

  async load(memberId: string): Promise<readonly WatchedSymbol[]> {
    return foldWatchlistLines(await this.store.list(memberId));
  }

  add(memberId: string, symbol: string): Promise<void> {
    return this.store.append(memberId, { symbol, at: this.now().toISOString() });
  }

  remove(memberId: string, symbol: string): Promise<void> {
    return this.store.append(memberId, {
      symbol,
      at: this.now().toISOString(),
      removed: true,
    });
  }
}

/** Build the store from the environment (`SKYNET_WATCHLIST_DIR`, default `data/watchlist`; pinned
 *  under `/data` in fly.toml so a deploy cannot erase a list nothing can re-derive). */
export function createWatchlist(env: NodeJS.ProcessEnv): WatchlistPort {
  return new JsonlWatchlist(env.SKYNET_WATCHLIST_DIR ?? "data/watchlist");
}
