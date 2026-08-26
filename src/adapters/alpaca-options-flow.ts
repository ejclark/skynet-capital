import type { OptionChainRow } from "../alpaca/alpaca-options-client.js";
import type { AlpacaTradingTransport } from "../alpaca/trading-transport.js";
import type { ContractFlow } from "../options/unusual-flow.js";
import type { OptionsFlowPort } from "../ports/options-flow.js";
import type { OptionType } from "../trading/option-symbols.js";

/**
 * ALPACA → `ContractFlow`. The read half of the unusual-activity instrument.
 *
 * Alpaca splits the two numbers this signal needs across two hosts, which is why this adapter
 * exists at all:
 *  - OPEN INTEREST comes from the Trading API's contracts endpoint, and
 *    `AlpacaOptionsClient.getChain` already extracts it into `OptionChainRow.openInterest`. This
 *    adapter consumes that PUBLIC OUTPUT through the narrow `OptionChainReader` shape below —
 *    the money-moving options client is read, never edited, and never imported as a value.
 *  - VOLUME comes from the Data API's options snapshot (`dailyBar.v`), which the client does not
 *    read today; it takes quotes and greeks from the same payload and ignores the bar. Rather
 *    than widen a protected file, this adapter reads the field it needs from the same endpoint.
 *
 * FAIL-SOFT, LOUDLY. The data host is an enrichment: when it is down, unwired, or paginating past
 * `MAX_SNAPSHOT_PAGES`, the affected contracts come back with `volume` ABSENT. They then score
 * `indeterminate` and land in the scan's `indeterminate` count — visible as "could not judge",
 * never quietly folded into "nothing unusual here". A screen that hides its blind spot is worse
 * than one that has none.
 *
 * READ-ONLY. Two GETs. Nothing here can place, amend or cancel an order.
 */

/**
 * The slice of `AlpacaOptionsClient` this adapter consumes — structural, so the protected client
 * satisfies it without changing a line and specs can supply a fixture chain.
 */
export interface OptionChainReader {
  getChain(underlying: string, expiration: string, type: OptionType): Promise<OptionChainRow[]>;
}

/** Both sides of the chain; open interest is a per-contract fact, so each is fetched. */
const BOTH_SIDES: readonly OptionType[] = ["call", "put"];

/** Snapshot pages to follow before giving up. A chain past this reports absent volume, honestly. */
const MAX_SNAPSHOT_PAGES = 5;

/**
 * A daily bar's volume field, when the feed reported a usable one. `null`, an absent key and an
 * empty string are UNREPORTED — deliberately not run through `Number()`, which turns all three
 * into a perfectly plausible 0 and would let "the feed said nothing" render as "nothing traded".
 */
function barVolume(value: unknown): number | undefined {
  if (typeof value !== "number" && typeof value !== "string") return undefined;
  if (value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

interface SnapshotPage {
  readonly snapshots?: Record<string, { dailyBar?: { v?: unknown } } | undefined>;
  readonly next_page_token?: string | null;
}

export class AlpacaOptionsFlowSource implements OptionsFlowPort {
  private readonly chains: OptionChainReader;
  private readonly data?: AlpacaTradingTransport;

  constructor(chains: OptionChainReader, data?: AlpacaTradingTransport) {
    this.chains = chains;
    if (data) this.data = data;
  }

  async flows(underlying: string, expiration: string): Promise<ContractFlow[]> {
    const flows: ContractFlow[] = [];
    for (const type of BOTH_SIDES) {
      const volumes = await this.sessionVolumes(underlying, expiration, type);
      for (const row of await this.chains.getChain(underlying, expiration, type)) {
        const volume = volumes.get(row.occSymbol);
        flows.push({
          occSymbol: row.occSymbol,
          underlying,
          expiration,
          strike: row.strike,
          type,
          ...(volume === undefined ? {} : { volume }),
          ...(row.openInterest === undefined ? {} : { openInterest: row.openInterest }),
        });
      }
    }
    return flows;
  }

  /**
   * OCC symbol → session volume, from the options snapshot feed. An empty map is the honest
   * answer whenever the data host is absent or unhappy: every contract then reads as
   * volume-unreported rather than volume-zero.
   */
  private async sessionVolumes(
    underlying: string,
    expiration: string,
    type: OptionType,
  ): Promise<Map<string, number>> {
    const volumes = new Map<string, number>();
    if (!this.data) return volumes;
    let pageToken: string | undefined;
    try {
      for (let page = 0; page < MAX_SNAPSHOT_PAGES; page++) {
        const query = `feed=indicative&type=${type}&expiration_date=${expiration}&limit=1000${
          pageToken === undefined ? "" : `&page_token=${encodeURIComponent(pageToken)}`
        }`;
        const response = await this.data.get(
          `/v1beta1/options/snapshots/${encodeURIComponent(underlying)}?${query}`,
        );
        if (response.status < 200 || response.status >= 300) return volumes;
        const body = response.body as SnapshotPage | null;
        for (const [occSymbol, snapshot] of Object.entries(body?.snapshots ?? {})) {
          const volume = barVolume(snapshot?.dailyBar?.v);
          if (volume !== undefined) volumes.set(occSymbol, volume);
        }
        const next = body?.next_page_token;
        if (!next) return volumes;
        pageToken = next;
      }
      return volumes;
    } catch {
      return volumes;
    }
  }
}
