import { NO_OPTION_DEMAND, type OptionChainRequest, type OptionDemand } from "../domain/types.js";

/** Several playbooks' option demands as one, each chain and contract once, in first-seen order — so
 *  two plays that need the same chain cost one read. */
export function mergeOptionDemand(demands: readonly OptionDemand[]): OptionDemand {
  const chains = new Map<string, OptionChainRequest>();
  const contracts = new Set<string>();
  for (const demand of demands) {
    for (const chain of demand.chains) {
      const key = `${chain.underlying}|${chain.expiration}|${chain.type}`;
      if (!chains.has(key)) chains.set(key, chain);
    }
    for (const occSymbol of demand.contracts) contracts.add(occSymbol);
  }
  return chains.size === 0 && contracts.size === 0
    ? NO_OPTION_DEMAND
    : { chains: [...chains.values()], contracts: [...contracts] };
}
