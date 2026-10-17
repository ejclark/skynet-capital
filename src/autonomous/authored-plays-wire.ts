import type { AuthoredPlaySpec } from "../playbooks/authored-play.js";
import {
  type AuthoredPlaysState,
  parseAuthoredPlaySpec,
  runnableSpecs,
} from "../playbooks/authored-play-draft.js";
import { isRecord } from "../storage/parse-guards.js";

/**
 * THE PROMOTED-PLAYS WIRE (#5457 slice 3) — the specs of the plays a member PROMOTED, app → bots,
 * folded into every `GET /controls` response as an additive `authoredPlays` field (the
 * `authored-shadow-wire.ts` shape: a pull, no new route or credential, no `fly*.toml` change).
 *
 * It carries SPECS ONLY, never a subscription: whether a bot runs a play is the member's
 * subscription on the normal path (`subscriptions-wire.ts`), and a spec with no subscription trades
 * nothing. The bots compile the specs per account through `authoredRoster`, which skips every spec
 * its account did not author — the own-account rule stays a comparison, not a convention.
 *
 * The set is whole every time and built from `runnableSpecs` alone, so a draft or a play in its
 * shadow test can never appear on it. An app that predates the field omits it and the bots read
 * that as "not reported" and keep what they had; anything off parses to `undefined` rather than to
 * a partial set (a half-known set would silently drop a play whose position is still open).
 */

export const AUTHORED_PLAYS_KIND = "authored-plays.v1";
export const MAX_PROMOTED_PLAYS = 64;

export interface AuthoredPlaysWire {
  readonly kind: typeof AUTHORED_PLAYS_KIND;
  /** Epoch ms the app read its store. */
  readonly at: number;
  readonly plays: readonly AuthoredPlaySpec[];
}

export function buildAuthoredPlaysWire(state: AuthoredPlaysState, at: number): AuthoredPlaysWire {
  return {
    kind: AUTHORED_PLAYS_KIND,
    at,
    plays: runnableSpecs(Object.values(state).flat()),
  };
}

/** Bots side: the promoted specs in a poll body, or `undefined` for anything short of a clean, whole set. */
export function parseAuthoredPlaysWire(value: unknown): AuthoredPlaysWire | undefined {
  if (!isRecord(value) || value.kind !== AUTHORED_PLAYS_KIND) return undefined;
  const { at, plays: raw } = value;
  if (typeof at !== "number" || !Number.isFinite(at)) return undefined;
  if (!Array.isArray(raw) || raw.length > MAX_PROMOTED_PLAYS) return undefined;
  const plays: AuthoredPlaySpec[] = [];
  for (const item of raw) {
    const spec = parseAuthoredPlaySpec(item);
    if (!spec) return undefined;
    plays.push(spec);
  }
  return { kind: AUTHORED_PLAYS_KIND, at, plays };
}
