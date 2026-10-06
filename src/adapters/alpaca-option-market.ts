import type { ContractSnapshot, OptionChainRow } from "../alpaca/alpaca-options-client.js";
import { marketDayKey } from "../domain/market-day.js";
import type {
  ListedExpirations,
  OptionChainRequest,
  OptionContractQuote,
  OptionMarket,
  OptionMarketRequest,
} from "../domain/types.js";
import type { OptionMarketPort } from "../ports/option-market.js";
import { parseOccSymbol } from "../trading/option-symbols.js";

/**
 * ALPACA → the option quotes one bot cycle prices from (#4642 slice 5). The trader asks once per
 * cycle with a PURE demand; this port reads the listed expirations, asks the demand which chains
 * and contracts it needs, and reads only those — through the bot's OWN credentials, read at call
 * time, so a rotated key needs no restart.
 *
 * Cheap by construction, because Alpaca allows 200 requests a minute and a bot cycles every 15s:
 *  - expirations: once per underlying per ET day, cached only on success;
 *  - chains: TTL-cached (60s), at most `MAX_CHAIN_READS_PER_REFRESH` network reads per call;
 *  - held or named contracts: one snapshots call for every one not already in hand, TTL-cached
 *    (30s);
 *  - nothing at all for an underlying in `skip` (cooling down, or an order still working).
 * A cycle with nothing to price — no option play in window, nothing held — costs zero calls.
 *
 * FAIL-SOFT: any read that fails leaves that piece absent and the rest intact; this never throws.
 * A quote that is missing makes the guard refuse `no-quote`, which is loud on the dashboard.
 */

/** The slice of `AlpacaOptionsClient` this port reads — structural, so specs pass a fake. */
export interface OptionMarketReader {
  getExpirations(underlying: string, onOrAfter: string): Promise<string[]>;
  getChain(underlying: string, expiration: string, type: "call" | "put"): Promise<OptionChainRow[]>;
  getContractSnapshots(occSymbols: readonly string[]): Promise<Map<string, ContractSnapshot>>;
}

/** The most chains one cycle may read from the network; cached chains do not count. */
export const MAX_CHAIN_READS_PER_REFRESH = 4;
const DEFAULT_CHAIN_TTL_MS = 60_000;
const DEFAULT_CONTRACT_TTL_MS = 30_000;

export interface AlpacaOptionMarketOptions {
  readonly now?: () => number;
  readonly chainTtlMs?: number;
  readonly contractTtlMs?: number;
  readonly maxChainReads?: number;
  /** A read that failed, for a log line. Never changes what the port answers. */
  readonly onReadError?: (what: string, error: unknown) => void;
}

interface Cached<T> {
  readonly at: number;
  readonly value: T;
}

const chainKey = (c: OptionChainRequest): string => `${c.underlying}|${c.expiration}|${c.type}`;
const quoted = (q: { readonly bid?: number; readonly ask?: number }): boolean =>
  q.bid !== undefined || q.ask !== undefined;

function chainQuote(
  chain: OptionChainRequest,
  row: OptionChainRow,
  fetchedAt: string,
): OptionContractQuote {
  return {
    occSymbol: row.occSymbol,
    underlying: chain.underlying,
    type: chain.type,
    strike: row.strike,
    expiration: chain.expiration,
    ...(row.bid !== undefined ? { bid: row.bid } : {}),
    ...(row.ask !== undefined ? { ask: row.ask } : {}),
    ...(row.delta !== undefined ? { delta: row.delta } : {}),
    ...(row.openInterest !== undefined ? { openInterest: row.openInterest } : {}),
    ...(row.quotedAt !== undefined ? { quotedAt: row.quotedAt } : {}),
    fetchedAt,
  };
}

/** A named contract's snapshot as a quote — strike, type and expiry from its OCC symbol. Shared
 *  with the order flow's fresh band check, so both read a snapshot the same way. */
export function snapshotQuote(
  occSymbol: string,
  snapshot: ContractSnapshot,
  fetchedAt: string,
): OptionContractQuote | undefined {
  const parts = parseOccSymbol(occSymbol);
  if (!parts) return undefined;
  const delta = snapshot.greeks?.delta;
  return {
    occSymbol,
    ...parts,
    ...(snapshot.bid !== undefined ? { bid: snapshot.bid } : {}),
    ...(snapshot.ask !== undefined ? { ask: snapshot.ask } : {}),
    ...(delta !== undefined ? { delta } : {}),
    ...(snapshot.quotedAt !== undefined ? { quotedAt: snapshot.quotedAt } : {}),
    fetchedAt,
  };
}

export class AlpacaOptionMarket implements OptionMarketPort {
  private readonly client: () => OptionMarketReader;
  private readonly now: () => number;
  private readonly chainTtlMs: number;
  private readonly contractTtlMs: number;
  private readonly maxChainReads: number;
  private readonly onReadError: (what: string, error: unknown) => void;
  /** `underlying|ET day` → its listed expirations. */
  private readonly expirations = new Map<string, readonly string[]>();
  private readonly chains = new Map<string, Cached<readonly OptionContractQuote[]>>();
  private readonly contracts = new Map<string, Cached<OptionContractQuote>>();

  constructor(client: () => OptionMarketReader, options: AlpacaOptionMarketOptions = {}) {
    this.client = client;
    this.now = options.now ?? Date.now;
    this.chainTtlMs = options.chainTtlMs ?? DEFAULT_CHAIN_TTL_MS;
    this.contractTtlMs = options.contractTtlMs ?? DEFAULT_CONTRACT_TTL_MS;
    this.maxChainReads = options.maxChainReads ?? MAX_CHAIN_READS_PER_REFRESH;
    this.onReadError = options.onReadError ?? (() => undefined);
  }

  async readOptionMarket(request: OptionMarketRequest): Promise<OptionMarket | undefined> {
    try {
      const now = this.now();
      const today = marketDayKey(request.asOf);
      this.prune(now, today);
      // One client per cycle, built from the credentials in force right now.
      const client = this.client();
      const listed = await this.readListed(client, request, today);
      const demand = request.demand(listed);
      const contracts: Record<string, OptionContractQuote> = {};
      await this.readChains(client, demand.chains, request.skip, now, contracts);
      await this.readContracts(client, demand.contracts, request.skip, now, contracts);
      return { listed, contracts };
    } catch (error) {
      // A throwing demand or client factory: no quotes this cycle, never a failed cycle.
      this.onReadError("option market", error);
      return undefined;
    }
  }

  private async readListed(
    client: OptionMarketReader,
    request: OptionMarketRequest,
    today: string,
  ): Promise<ListedExpirations> {
    const listed: Record<string, readonly string[]> = {};
    for (const underlying of new Set(request.underlyings)) {
      if (request.skip.has(underlying)) continue;
      const key = `${underlying}|${today}`;
      const cached = this.expirations.get(key);
      if (cached) {
        listed[underlying] = cached;
        continue;
      }
      try {
        const dates = await client.getExpirations(underlying, today);
        // Cached only on success: a failed read is retried next cycle, not believed all day.
        this.expirations.set(key, dates);
        listed[underlying] = dates;
      } catch (error) {
        this.onReadError(`${underlying} expirations`, error);
      }
    }
    return listed;
  }

  private async readChains(
    client: OptionMarketReader,
    wanted: readonly OptionChainRequest[],
    skip: ReadonlySet<string>,
    now: number,
    into: Record<string, OptionContractQuote>,
  ): Promise<void> {
    let reads = 0;
    const seen = new Set<string>();
    for (const chain of wanted) {
      const key = chainKey(chain);
      if (seen.has(key) || skip.has(chain.underlying)) continue;
      seen.add(key);
      const cached = this.chains.get(key);
      if (cached) {
        for (const quote of cached.value) into[quote.occSymbol] = quote;
        continue;
      }
      if (reads >= this.maxChainReads) continue;
      reads += 1;
      try {
        const fetchedAt = new Date(now).toISOString();
        const rows = await client.getChain(chain.underlying, chain.expiration, chain.type);
        const quotes = rows.map((row) => chainQuote(chain, row, fetchedAt));
        // A chain whose quote feed failed (rows but no bid/ask anywhere) is not kept: the next
        // cycle may get the quotes. An empty chain is a real answer and is.
        if (quotes.length === 0 || quotes.some(quoted)) {
          this.chains.set(key, { at: now, value: quotes });
        }
        for (const quote of quotes) into[quote.occSymbol] = quote;
      } catch (error) {
        this.onReadError(`${key} chain`, error);
      }
    }
  }

  private async readContracts(
    client: OptionMarketReader,
    wanted: readonly string[],
    skip: ReadonlySet<string>,
    now: number,
    into: Record<string, OptionContractQuote>,
  ): Promise<void> {
    const missing: string[] = [];
    for (const occSymbol of new Set(wanted)) {
      const underlying = parseOccSymbol(occSymbol)?.underlying;
      if (into[occSymbol] || underlying === undefined || skip.has(underlying)) continue;
      const cached = this.contracts.get(occSymbol);
      if (cached) into[occSymbol] = cached.value;
      else missing.push(occSymbol);
    }
    if (missing.length === 0) return;
    try {
      const fetchedAt = new Date(now).toISOString();
      const snapshots = await client.getContractSnapshots(missing);
      for (const [occSymbol, snapshot] of snapshots) {
        const quote = missing.includes(occSymbol)
          ? snapshotQuote(occSymbol, snapshot, fetchedAt)
          : undefined;
        if (!quote) continue;
        if (quoted(quote)) this.contracts.set(occSymbol, { at: now, value: quote });
        into[occSymbol] = quote;
      }
    } catch (error) {
      this.onReadError("contract snapshots", error);
    }
  }

  /** Drop what has aged out, so a long-running process holds only what a cycle could still use. */
  private prune(now: number, today: string): void {
    for (const key of this.expirations.keys()) {
      if (!key.endsWith(`|${today}`)) this.expirations.delete(key);
    }
    for (const [key, entry] of this.chains) {
      if (now - entry.at >= this.chainTtlMs) this.chains.delete(key);
    }
    for (const [key, entry] of this.contracts) {
      if (now - entry.at >= this.contractTtlMs) this.contracts.delete(key);
    }
  }
}
