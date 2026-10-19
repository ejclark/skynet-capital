import type { ConvictionDraftInput } from "./conviction-parse.js";
import type { Conviction } from "./conviction-record.js";
import { resolveSteering, type SteerBounds, type Steering } from "./conviction-steering.js";
import { ConvictionStore, playbookBounds } from "./conviction-store.js";
import { findPair, type Pair, pairName } from "./pair-table.js";

/**
 * A MEMBER'S CONVICTION, DRAFTED (#5482 slice 6a, criteria 1, 3, 8 and 9). The one function that
 * turns what a member wrote into a record and the card that shows it back — the trade form's
 * conviction form (6b) and Moneypenny's chat intake both call it, so the two doors can never judge
 * a view differently.
 *
 * WHAT IT SETS, NOT THE MEMBER: the id (from the title and the month), the owner (the session's
 * name) and the day stated (today, in market time). Each claim is numbered in order, so a narrowing
 * can cite it by number the way the seeded record's do.
 *
 * THE RULES, ONE SET. A draft is judged exactly as the store judges a seeded record — the store is
 * built over it and its refusals are the answer — plus three a member's view adds:
 *  - it steers only pairs one of the member's own bots already subscribes to. A conviction narrows
 *    what a pair does; it never subscribes one (criterion 9).
 *  - a strike ceiling is a price. A ceiling on a claim's floor band needs that claim's study, and
 *    the research pass does not read members' claims yet.
 *  - its id is free: two views with one name in one month would steer as one.
 *
 * THE CARD (criterion 9: "what changes on which pair, with a before → after for each setting").
 * Before is the playbook's own setting; after is the narrowed one, resolved by the same
 * narrow-only rule the bots build with (`resolveSteering`). A setting the view leaves alone is not
 * listed. It says plainly that the playbook keeps the timing, that exits never stop, and, until the
 * slice that hands members' views to the bots ships, that a saved draft steers nothing.
 *
 * Paper only, SIM. Nothing here places, sizes or times an order.
 */

export interface SettingChange {
  readonly setting: string;
  readonly before: string;
  readonly after: string;
}

export interface PairCard {
  readonly pair: string;
  /** "the wheel on CRWV". */
  readonly name: string;
  /** Only what the view changes; empty when it steers the pair for its check date alone. */
  readonly changes: readonly SettingChange[];
}

export interface DraftCard {
  readonly label: "SIM";
  readonly pairs: readonly PairCard[];
  /** What happens on the check date, in one sentence. */
  readonly check: string;
  /** Who picks the timing: always the playbook. */
  readonly timing: string;
}

export type DraftOutcome =
  | { readonly ok: true; readonly conviction: Conviction; readonly card: DraftCard }
  | { readonly ok: false; readonly problems: readonly string[] };

export interface DraftContext {
  /** The member's name as members know them, from the session. */
  readonly owner: string;
  /** `YYYY-MM-DD`, today in market time. */
  readonly statedOn: string;
  /** Every conviction id already held: the seeded records and every member's. */
  readonly takenIds: ReadonlySet<string>;
  /** Pair ids a bot the member owns subscribes to. */
  readonly subscribed: ReadonlySet<string>;
  readonly lookup?: (id: string) => Pair | undefined;
  readonly boundsOf?: (pairId: string) => SteerBounds | undefined;
}

/** A sentence already numbered the way a record cites it ("7. ", "2a. "). */
const NUMBERED = /^\d+[a-z]?\.\s/;

/** Kebab-case from a title, at most 56 characters so the month still fits in an id. */
export function convictionSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56)
    .replace(/-+$/, "");
}

function memberProblems(conviction: Conviction, ctx: DraftContext): string[] {
  const problems: string[] = [];
  if (ctx.takenIds.has(conviction.id)) {
    problems.push(
      `a view named "${conviction.title}" was already stated this month; give this one another name`,
    );
  }
  for (const pair of conviction.steers) {
    if (!ctx.subscribed.has(pair)) {
      problems.push(
        `none of your bots subscribes to ${pair}; a conviction steers pairs you already run and never subscribes one`,
      );
    }
  }
  for (const entry of conviction.narrowings ?? []) {
    if (entry.narrow.some((n) => n.kind === "strike-ceiling" && typeof n.ceiling !== "number")) {
      problems.push(
        `the strike ceiling on ${entry.pair} must be a price: a claim's floor band needs its study, which members' claims do not get yet`,
      );
    }
  }
  return problems;
}

/** Before → after for each setting a resolved steering changes. */
function changesOf(steering: Steering, bounds: SteerBounds): SettingChange[] {
  const changes: SettingChange[] = [];
  if (steering.dte) {
    changes.push({
      setting: "Days to expiry",
      before: `${bounds.dte.min}-${bounds.dte.max} days out`,
      after: `${steering.dte.min}-${steering.dte.max} days out`,
    });
  }
  if (steering.expiryFrom) {
    changes.push({
      setting: "Expiry",
      before: "any expiry in that window",
      after: `on or after ${steering.expiryFrom}`,
    });
  }
  if (steering.strikeMax !== undefined) {
    changes.push({
      setting: "Strike",
      before: "the playbook's own pick",
      after: `at or under $${steering.strikeMax.toFixed(2)}`,
    });
  }
  if (steering.quietSessionsAfterPrint !== undefined) {
    changes.push({
      setting: "Around the earnings report",
      before: "the playbook's own report rules",
      after: `no new opens from the blackout until ${steering.quietSessionsAfterPrint} sessions after the report`,
    });
  }
  if (steering.contractsMax !== undefined) {
    changes.push({
      setting: "Contracts",
      before: `up to ${Math.max(...Object.values(bounds.contracts))}`,
      after: `at most ${steering.contractsMax}`,
    });
  }
  return changes;
}

/** The card a record shows: each steered pair's before → after, the check and who keeps the timing. */
export function convictionCard(
  conviction: Conviction,
  lookup: (id: string) => Pair | undefined = findPair,
  boundsOf: (pairId: string) => SteerBounds | undefined = playbookBounds,
): DraftCard {
  const pairs = conviction.steers.map((id) => {
    const pair = lookup(id);
    const bounds = boundsOf(id);
    const narrow = conviction.narrowings?.find((n) => n.pair === id)?.narrow ?? [];
    const resolved = bounds ? resolveSteering(narrow, bounds, conviction.claims, false) : undefined;
    return {
      pair: id,
      name: pair ? pairName(pair) : id,
      changes: bounds && resolved?.ok ? changesOf(resolved.steering, bounds) : [],
    };
  });
  const judged = conviction.acceptsAssignment
    ? "on net P/L alone (being assigned the shares is not counted against it)"
    : "on net P/L and each playbook's own retire test";
  return {
    label: "SIM",
    pairs,
    check: `Checked ${conviction.checkOn}, ${judged}: if it fails, every pair it steers stops opening new positions. Exits keep running.`,
    timing:
      "The playbook still picks when to open and close inside these settings. This view never places an order.",
  };
}

/** The record a member's draft makes, and its card, or every rule it breaks in words. */
export function draftConviction(input: ConvictionDraftInput, ctx: DraftContext): DraftOutcome {
  const lookup = ctx.lookup ?? findPair;
  const boundsOf = ctx.boundsOf ?? playbookBounds;
  const slug = convictionSlug(input.title);
  if (slug.length === 0) return { ok: false, problems: ["the title needs a letter or a digit"] };
  const conviction: Conviction = {
    id: `${slug}-${ctx.statedOn.slice(0, 7)}`,
    owner: ctx.owner,
    statedOn: ctx.statedOn,
    ...input,
    claims: input.claims.map((claim, i) =>
      NUMBERED.test(claim.statement)
        ? claim
        : { ...claim, statement: `${i + 1}. ${claim.statement}` },
    ),
  };
  // The store's own judgement, so a member's view and a seeded one break the same rules in the
  // same words; `takenIds` covers the id clash the store would only see among its own records.
  const refused = new ConvictionStore([conviction], lookup, boundsOf).refused;
  const problems = [...(refused[0]?.problems ?? []), ...memberProblems(conviction, ctx)];
  if (problems.length > 0) return { ok: false, problems };
  return { ok: true, conviction, card: convictionCard(conviction, lookup, boundsOf) };
}
