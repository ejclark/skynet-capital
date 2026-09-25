import { AlpacaAtmQuotes } from "../adapters/alpaca-atm-quotes.js";
import type { Participant } from "../participants/participant.js";
import type { IvHistoryPort } from "../research/iv-record.js";
import { startIvSampler } from "../research/iv-sampler.js";
import type { DataSource } from "../runtime/data-source.js";

/**
 * Boot the IV clock (`research/iv-sampler.ts`) — or say, once, why it is off. Live mode only: the
 * offline fixtures serve no option quotes, and a series recorded from them would be fiction.
 *
 * The quote reader borrows the FIRST HOST-CONFIGURED account's credentials (the env roster — the
 * same account the live market-data stream reads through), never a member added at runtime: a
 * background job must not keep using a member's key, and must not stop the day that member leaves.
 */
export function startIvClock(
  resolved: { readonly store: IvHistoryPort } | { readonly reason: string },
  dataSource: Pick<DataSource, "mode" | "optionsClientFactory">,
  hostRoster: readonly Participant[],
): (() => void) | undefined {
  const off = (why: string) => {
    console.log(`[iv-clock] off — ${why}`);
    return undefined;
  };
  if (dataSource.mode !== "live") return off("offline data source");
  const host = hostRoster[0];
  if (!host) return off("no host-configured account to read quotes through");
  if ("reason" in resolved) return off(resolved.reason);
  console.log("[iv-clock] on — daily sample in the session's last half hour");
  return startIvSampler({
    quotes: new AlpacaAtmQuotes(dataSource.optionsClientFactory(host)),
    store: resolved.store,
    onTick: (r) =>
      console.log(
        `[iv-clock] ${r.at}: recorded ${r.recorded.length}` +
          (r.unquoted.length ? `; unquoted ${r.unquoted.join(",")}` : "") +
          (r.unsolved.length ? `; unsolved ${r.unsolved.join(",")}` : ""),
      ),
    onError: (e) => console.error("[iv-clock] tick failed:", e instanceof Error ? e.message : e),
  });
}
