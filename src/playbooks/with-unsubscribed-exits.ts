import { heldContracts } from "../domain/option-book.js";
import type {
  MarketContext,
  OrderIntent,
  PlaybookSubscription,
  Portfolio,
} from "../domain/types.js";
import { NO_OPTION_DEMAND } from "../domain/types.js";
import type { Persona } from "../personas/persona.js";
import type { EnabledPlaybook, Playbook } from "./playbook.js";

/**
 * EXITS NEVER STOP (#5609; #4469 criterion 12, #5482 criterion 5). Unsubscribing deletes the
 * subscription record, so the playbook leaves the bot's roster and its take-profit and time exit
 * would never fire while its positions are still open. Pause already has the right shape (an
 * `exitsOnly` entry: opens nothing, exits run), so an unsubscribed playbook that still holds
 * positions simply takes it: it runs exit-only until its book is flat, then drops off the roster
 * again on its own.
 *
 * WHO OWNS A POSITION is the house's own marker: the playbook id stamped on the orders it placed
 * (`intents.playbook_id`). A name the account still holds (a share symbol, or the underlying of a
 * contract) on one of the playbook's `symbols` / option `underlyings`, that the playbook placed an
 * order on, is its book. Names alone would claim the bot's own positions in the same stock, so the
 * stamp is required. A name a roster entry already claims stays that entry's, and of two
 * unsubscribed playbooks on one name the first registered holds it.
 *
 * The roster is fixed at swap time but the book is only known in a cycle, so this wraps the
 * persona: each cycle it picks the persona built for the playbooks currently holding something.
 * With nothing held it is exactly the roster's own persona.
 */

export interface UnsubscribedExitsDeps {
  /** Every playbook the house could have run for this account, in registry order. */
  readonly candidates: readonly Playbook[];
  /** The roster as resolved (running and paused) — what is already managed. */
  readonly enabled: readonly EnabledPlaybook[];
  /** The names this account has placed orders on under a playbook's id — the ownership marker
   *  (`decision-db`'s `symbolsPlacedByPlaybook`). Absent when no decision store is wired: nothing can
   *  then be shown to be a playbook's, so nothing is claimed. */
  readonly placedBy?: (playbookId: string) => ReadonlySet<string>;
  /** Said once when a playbook starts or finishes winding down. */
  readonly log?: (line: string) => void;
}

const namesOf = (playbook: Playbook): readonly string[] => [
  ...playbook.symbols,
  ...(playbook.options?.underlyings ?? []),
];

/** The names a portfolio holds anything on: shares, and the underlying of any contract. */
function heldNames(portfolio: Portfolio): Set<string> {
  const held = new Set<string>();
  for (const position of portfolio.positions) {
    if (position.quantity !== 0) held.add(position.symbol);
  }
  for (const contract of heldContracts(portfolio)) held.add(contract.underlying);
  return held;
}

/** The unsubscribed playbooks that still hold something, as exit-only roster entries. */
export function windDownEntries(
  portfolio: Portfolio,
  {
    candidates,
    enabled,
    placedBy,
  }: Pick<UnsubscribedExitsDeps, "candidates" | "enabled" | "placedBy">,
): EnabledPlaybook[] {
  const held = heldNames(portfolio);
  if (held.size === 0 || !placedBy) return [];
  const known = new Set(enabled.map((e) => e.playbook.id));
  const claimed = new Set(enabled.flatMap((e) => namesOf(e.playbook)));
  const out: EnabledPlaybook[] = [];
  for (const playbook of candidates) {
    if (known.has(playbook.id) || playbook.rulesOf) continue;
    const names = namesOf(playbook);
    if (names.some((n) => claimed.has(n)) || !names.some((n) => held.has(n))) continue;
    const placed = placedBy(playbook.id);
    if (!names.some((n) => held.has(n) && placed.has(n))) continue;
    for (const n of names) claimed.add(n);
    out.push({ playbook, mode: "standard", exitsOnly: true });
  }
  return out;
}

/**
 * The option playbooks the guards must see as PAUSED rather than absent: a covered call that
 * delivers shares an unsubscribed wheel holds is how its assigned shares leave, exactly as for a
 * paused one. A disabled record opens nothing else (`subscriptionAllowsOpen`), and only a playbook
 * winding down is ever stamped on an order, so this grants no new open to anyone else.
 */
export function windDownSubscriptions(
  accountId: string,
  deps: Pick<UnsubscribedExitsDeps, "candidates" | "enabled">,
  subscriptions: readonly PlaybookSubscription[],
): PlaybookSubscription[] {
  const known = new Set([
    ...deps.enabled.map((e) => e.playbook.id),
    ...subscriptions.map((s) => s.playbookId),
  ]);
  return deps.candidates
    .filter((p) => p.options && !known.has(p.id) && !p.rulesOf)
    .map((p) => ({
      accountId,
      playbookId: p.id,
      mode: "standard",
      // The guards refuse an option with no allocation at all; a covered call risks no cash, so a
      // token one never limits it, and no other open reaches here (`subscriptionAllowsOpen`).
      capitalAllocated: 1,
      enabled: false,
      createdAt: "1970-01-01T00:00:00.000Z",
      updatedAt: "1970-01-01T00:00:00.000Z",
    }));
}

/**
 * `build` composes the whole persona chain for a roster. The roster's own persona is built once and
 * reused whenever nothing is winding down, so its memory (said-once lines) survives.
 */
export function withUnsubscribedExits(
  build: (enabled: readonly EnabledPlaybook[]) => Persona,
  deps: UnsubscribedExitsDeps,
): Persona {
  const home = build(deps.enabled);
  const built = new Map<string, Persona>();
  const told = new Set<string>();
  let active = home;

  const personaFor = (portfolio: Portfolio): Persona => {
    const extra = windDownEntries(portfolio, deps);
    const ids = new Set(extra.map((e) => e.playbook.id));
    for (const id of ids) {
      if (!told.has(id)) {
        told.add(id);
        deps.log?.(`${id} is unsubscribed but still holds positions — exits only until flat`);
      }
    }
    for (const id of [...told]) {
      if (!ids.has(id)) {
        told.delete(id);
        deps.log?.(`${id} is flat — off the roster`);
      }
    }
    const key = [...ids].join("|");
    if (key === "") return home;
    let persona = built.get(key);
    if (!persona) {
      persona = build([...deps.enabled, ...extra]);
      built.set(key, persona);
    }
    return persona;
  };

  return {
    id: home.id,
    name: home.name,
    thesis: home.thesis,
    decide(context: MarketContext, portfolio: Portfolio): OrderIntent[] {
      active = personaFor(portfolio);
      return active.decide(context, portfolio);
    },
    ...(home.playbookVerdicts
      ? { playbookVerdicts: (context: MarketContext) => home.playbookVerdicts?.(context) ?? [] }
      : {}),
    ...(home.playbookObservations
      ? {
          playbookObservations: (context: MarketContext) =>
            home.playbookObservations?.(context) ?? [],
        }
      : {}),
    // The expirations to list are read before the cycle's decide, so they follow the last book seen.
    get optionUnderlyings() {
      return active.optionUnderlyings ?? home.optionUnderlyings;
    },
    optionDemand(asOfIso, portfolio, listed) {
      active = personaFor(portfolio);
      return active.optionDemand?.(asOfIso, portfolio, listed) ?? NO_OPTION_DEMAND;
    },
  };
}
