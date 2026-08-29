/**
 * PLAY CARDS — the Trading Outpost's catalog (#809 slice 1). One card per play, in the same
 * "collectible" family as the persona `ClassPicker`: a name, a thesis, and the attributes you
 * browse by.
 *
 * Two things make this more than a re-skin of the discovery shelves:
 *
 * 1. **`author` is first-class from day one.** Today every card is authored by the house, and says
 *    so — but the field exists so a member-authored play drops in later without reshaping the card,
 *    and so "filter by author" (the member's actual ask) is real on the very first slice rather
 *    than a placeholder that always reads "Skynet Capital".
 * 2. **Every attribute is DERIVED, never hand-typed.** The window, the print behaviour and the date
 *    policy come from walking the play itself (`playbook-probe.ts`), so a card cannot drift from
 *    what the play does. `src/playbooks/**` is envelope-protected — this module only ever reads it.
 *
 * Honesty: a card describes a play's RULES, not a live position. House plays are dark until
 * `SKYNET_PLAYBOOKS` names one, and nothing here implies otherwise.
 */
import type { PlaybookMode } from "../domain/types.js";
import type { Playbook } from "../playbooks/playbook.js";
import {
  evidenceHref,
  housePlaybooks,
  probeWindow,
  spanOf,
  type WindowProbe,
} from "./playbook-probe.js";

/** Who wrote the play. `house` is the vetted roster in the registry; `member` is player-authored. */
type PlayAuthorKind = "house" | "member";

export interface PlayAuthor {
  readonly id: string;
  readonly name: string;
  readonly kind: PlayAuthorKind;
}

/**
 * The house author. Every registry play carries it — the roster is code-reviewed and
 * envelope-protected, which is exactly what "the house wrote this" means here.
 */
export const HOUSE_AUTHOR: PlayAuthor = {
  id: "house",
  name: "Skynet Capital",
  kind: "house",
};

/**
 * What keys the play's window. Derived, not declared: a play that never wants to be long anywhere
 * in a synthetic earnings run is not date-keyed, and is labelled for what it is rather than
 * silently filed under earnings.
 */
type PlayTrigger = "earnings-window" | "event-driven";

/** A short, checkable claim about the play — the card's filterable "abilities". */
export interface PlayTrait {
  readonly id: string;
  readonly label: string;
  /** What the probe actually observed, in words. The receipt behind the label. */
  readonly claim: string;
}

export interface PlayCard {
  readonly id: string;
  readonly symbol: string;
  readonly author: PlayAuthor;
  readonly thesis: string;
  readonly trigger: PlayTrigger;
  /** "D-20 to D-6" — the window read off the play, or an explicit absence. */
  readonly window: string;
  /** Target exposure as a fraction of equity, per mode. Risk guards still clamp on top. */
  readonly size: Readonly<Record<PlaybookMode, number>>;
  readonly traits: readonly PlayTrait[];
  /** The citation the play carries — verbatim from the registry. */
  readonly evidence: string;
  /** That citation as a route on the research shelf, when it names a doc we serve. */
  readonly href?: string;
}

/** One filter facet: a value and how many cards carry it, so an empty option never renders. */
export interface PlayFacet {
  readonly id: string;
  readonly label: string;
  readonly count: number;
}

export interface OutpostCatalog {
  readonly cards: readonly PlayCard[];
  readonly authors: readonly PlayFacet[];
  readonly symbols: readonly PlayFacet[];
  readonly triggers: readonly PlayFacet[];
  readonly traits: readonly PlayFacet[];
}

const TRIGGER_LABELS: Readonly<Record<PlayTrigger, string>> = {
  "earnings-window": "Earnings window",
  "event-driven": "Event-driven",
};

function traitsOf(probe: WindowProbe): PlayTrait[] {
  const traits: PlayTrait[] = [];
  if (probe.longDays.length > 0 && !probe.holdsThePrint) {
    traits.push({
      id: "flat-before-the-release",
      label: "Flat before the release",
      claim: `Long ${spanOf(probe)}, and out of the market by the time the number is public.`,
    });
  }
  if (probe.holdsThePrint) {
    traits.push({
      id: "holds-the-print",
      label: "Holds the print",
      claim: "Still long when the number lands — the release itself is part of the bet.",
    });
  }
  if (probe.longDays.length > 0 && !probe.opensOnAnEstimate) {
    traits.push({
      id: "confirmed-dates-only",
      label: "Confirmed dates only",
      claim: "Re-run with the same date as an estimate rather than confirmed: no position at all.",
    });
  }
  return traits;
}

function cardOf(playbook: Playbook): PlayCard {
  const probe = probeWindow(playbook);
  const href = evidenceHref(playbook);
  return {
    id: playbook.id,
    symbol: playbook.symbol,
    author: HOUSE_AUTHOR,
    thesis: playbook.thesis,
    trigger: probe.longDays.length > 0 ? "earnings-window" : "event-driven",
    window: spanOf(probe),
    size: playbook.size,
    traits: traitsOf(probe),
    evidence: playbook.evidence,
    ...(href ? { href } : {}),
  };
}

/** Count a facet across the cards, dropping anything nothing carries, ordered by the given keys. */
function facets(
  cards: readonly PlayCard[],
  keysOf: (card: PlayCard) => readonly (readonly [string, string])[],
): PlayFacet[] {
  const counts = new Map<string, PlayFacet>();
  for (const card of cards) {
    for (const [id, label] of keysOf(card)) {
      const seen = counts.get(id);
      counts.set(id, { id, label, count: (seen?.count ?? 0) + 1 });
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/**
 * The whole Outpost catalog, derived fresh on each call. Facets are computed from the cards, so a
 * filter option can never exist for a value nothing has.
 */
export function outpostCatalog(): OutpostCatalog {
  const cards = housePlaybooks().map(cardOf);
  return {
    cards,
    authors: facets(cards, (c) => [[c.author.id, c.author.name]]),
    symbols: facets(cards, (c) => [[c.symbol, c.symbol]]),
    triggers: facets(cards, (c) => [[c.trigger, TRIGGER_LABELS[c.trigger]]]),
    traits: facets(cards, (c) => c.traits.map((t) => [t.id, t.label] as const)),
  };
}
