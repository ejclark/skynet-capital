import type { TradingClientFactory } from "../observatory/dashboard-data.js";
import { buildParticipantSnapshot } from "../observatory/participant-snapshot.js";
import { isAllowedTimezone } from "../participants/allowed-timezones.js";
import type { Participant } from "../participants/participant.js";
import type { ParticipantStore } from "../participants/participant-store.js";
import type { ObservatoryHub } from "./observatory-hub.js";

/**
 * DAY-2 ACCOUNT MANAGEMENT — the write side of `/account`: edit a self-service account's
 * profile, or remove it from the board. Day 1 (`/add`) and credential rotation (`/rotate`)
 * live in `participant-service.ts`; this module is deliberately separate so the day-1 flow's
 * verified invariants stay untouched.
 *
 * The authorization posture here is STRICTER than /rotate's, on purpose. docs/LESSONS.md
 * (2026-08-11) is exactly this shape of miss ("checked the target existed, not that the caller
 * had a right to touch it"), so:
 *  - an account's profile may only be edited by that same resolved identity (hard — an
 *    unresolved session is a refusal, matching /trade's posture, not /rotate's) — a HUMAN or a
 *    BOT: a bot could never carry that resolved identity before `/claim` (#546) added
 *    owner-linking for any account kind, so the check was human-only by necessity, not by
 *    design; that necessity is gone, and a bot exempted from it is now editable AND REMOVABLE by
 *    literally any signed-in member with no check at all — worse than the convenience it kept
 *    (2026-08-26: closed alongside the multi-account picker, which is what made an owner-linked
 *    bot a normal, not hypothetical, target);
 *  - the rename-must-match-session-name rule below predates the owner link (#466): the
 *    session→account link is now `Participant.ownerEmail`, immutable here, so a rename can no
 *    longer forge that link — the rule is now a stricter-than-needed legacy guard, kept as-is
 *    pending a follow-up UX pass rather than loosened in this security-sensitive PR;
 *  - bots take timezone edits only; renaming a bot is remove + re-add.
 * When no OAuth is configured there is no session link to protect; the password gate is the
 * boundary and the checks relax, matching every other route's trust level there.
 */

export interface UpdateProfileInput {
  readonly id: string;
  /** New display name; omit to keep. */
  readonly displayName?: string;
  /** New timezone from the allowed list; empty string clears it; omit to keep. */
  readonly timezone?: string;
  /** Who the caller's session resolves to (undefined = unresolved or no OAuth). */
  readonly requesterId?: string;
  /**
   * The caller's candidate identity strings (session name + email local-part, lowercased) —
   * the exact values `resolveCurrentId` matches display names against. A human rename must
   * land on one of these so the member's own session keeps resolving to their account.
   */
  readonly sessionNames?: readonly string[];
  /** OAuth is configured for this deployment (the checks above only bind when it is). */
  readonly authConfigured: boolean;
}

export type UpdateProfileResult =
  | { readonly ok: true; readonly id: string; readonly displayName: string }
  | { readonly ok: false; readonly error: string };

export interface RemoveAccountInput {
  readonly id: string;
  /** The account's display name, typed back — the destructive-action confirmation. */
  readonly confirmName: string;
  readonly requesterId?: string;
  readonly authConfigured: boolean;
}

export type RemoveAccountResult =
  | { readonly ok: true; readonly id: string; readonly displayName: string }
  | { readonly ok: false; readonly error: string };

export interface AccountServiceDeps {
  readonly hub: ObservatoryHub;
  readonly store: ParticipantStore;
  readonly clientFactory: TradingClientFactory;
  /** Close this account's live fill stream (data-source specific). */
  readonly stopStream: (participantId: string) => void;
  /**
   * Resolve an env-configured (roster) participant by id. Host-managed accounts are never
   * editable or removable here — the store's own contract (participant-store.ts) is that env
   * rows "can only be removed by unsetting from the host." This closes the same downgrade
   * `refuseRotation` guards against: since /rotate now leaves a store row under a roster id, a
   * roster BOT would otherwise fall through the human-only ownership guard below and be
   * removable by any member (red-team, 2026-08-25) — deleting an owner's rotated credential and
   * re-bricking the account on next boot. Checked by id provenance, not store presence.
   */
  readonly findRosterParticipant?: (id: string) => Participant | undefined;
  readonly now?: () => Date;
}

const NOT_IN_STORE =
  "That account is configured on the host, not self-service — it can only be changed by the operator (ask Eric).";

/**
 * The preamble both write paths share: the store can be rewritten safely, the id names a
 * SELF-SERVICE account (env-configured ones refuse honestly, whether or not a rotation has left
 * a store row under their id), and — for a human target when OAuth is configured — the caller IS
 * that account. Returns the record, or the refusal.
 */
function requireEditable(
  store: ParticipantStore,
  input: { id: string; requesterId?: string; authConfigured: boolean },
  verb: string,
  findRosterParticipant?: (id: string) => Participant | undefined,
): { existing: Participant } | { error: string } {
  if (!store.canStoreSecurely()) {
    return {
      error: `Account ${verb} is disabled: this server has no credential encryption key configured. Ask the host to set SKYNET_STORE_SECRET.`,
    };
  }
  const id = input.id?.trim();
  if (!id) {
    return { error: "An account id is required." };
  }
  // Host-managed first, before the store lookup: a roster id is off-limits here even once a
  // rotation has written a store row under it, so the tier can never downgrade to store rules.
  if (findRosterParticipant?.(id)) {
    return { error: NOT_IN_STORE };
  }
  const existing = store.load().find((p) => p.id === id);
  if (!existing) {
    return { error: NOT_IN_STORE };
  }
  if (input.authConfigured && input.requesterId !== id) {
    return {
      error:
        verb === "removal"
          ? "You can only remove your own account."
          : "You can only edit your own account's profile.",
    };
  }
  return { existing };
}

export function createAccountService(deps: AccountServiceDeps): {
  updateProfile: (input: UpdateProfileInput) => Promise<UpdateProfileResult>;
  removeAccount: (input: RemoveAccountInput) => Promise<RemoveAccountResult>;
} {
  const at = (): string => (deps.now ?? (() => new Date()))().toISOString();

  async function updateProfile(input: UpdateProfileInput): Promise<UpdateProfileResult> {
    const target = requireEditable(deps.store, input, "editing", deps.findRosterParticipant);
    if ("error" in target) {
      return { ok: false, error: target.error };
    }
    const { existing } = target;
    const id = existing.id;

    const displayName = input.displayName?.trim();
    const timezone = input.timezone?.trim();
    const refusal = profileEditRefusal(existing, input, displayName, timezone);
    if (refusal) {
      return { ok: false, error: refusal };
    }

    // An explicit empty timezone clears the preference; an omitted field keeps what's stored.
    const { timezone: storedTimezone, ...rest } = existing;
    const nextTimezone = input.timezone === undefined ? storedTimezone : timezone || undefined;
    const updated: Participant = {
      ...rest,
      displayName: displayName ?? existing.displayName,
      ...(nextTimezone ? { timezone: nextTimezone } : {}),
    };

    // Refresh the board row so the new name/zone shows immediately. Credentials are untouched,
    // so an Alpaca-side error is tolerated (the board already renders error rows honestly) —
    // only an unreachable broker refuses, because then there is nothing truthful to show.
    try {
      const snapshot = await buildParticipantSnapshot(updated, deps.clientFactory(updated));
      deps.store.add(updated);
      deps.hub.apply({ type: "participant_updated", participant: snapshot, at: at() });
      return { ok: true, id, displayName: updated.displayName };
    } catch (error) {
      return {
        ok: false,
        error: `Could not reach Alpaca to refresh the account row — nothing was changed. (${String(error)})`,
      };
    }
  }

  function removeAccountSync(input: RemoveAccountInput): RemoveAccountResult {
    const target = requireEditable(deps.store, input, "removal", deps.findRosterParticipant);
    if ("error" in target) {
      return { ok: false, error: target.error };
    }
    const { existing } = target;
    const id = existing.id;
    if (input.confirmName.trim().toLowerCase() !== existing.displayName.trim().toLowerCase()) {
      return {
        ok: false,
        error: `Type the account's display name ("${existing.displayName}") exactly to confirm removal — nothing was removed.`,
      };
    }

    deps.store.remove(id);
    deps.stopStream(id);
    deps.hub.apply({ type: "participant_removed", participantId: id, at: at() });
    return { ok: true, id, displayName: existing.displayName };
  }

  return { updateProfile, removeAccount: (input) => Promise.resolve(removeAccountSync(input)) };
}

/**
 * Everything that can refuse a profile edit, in the order the rules bind: right-to-touch,
 * blank name, the bot-rename ban, the session-link rename guard, the timezone whitelist.
 * Returns the refusal message, or undefined when the edit may proceed.
 */
function profileEditRefusal(
  existing: Participant,
  input: UpdateProfileInput,
  displayName: string | undefined,
  timezone: string | undefined,
): string | undefined {
  if (input.displayName !== undefined && !displayName) {
    return "A display name can't be blank.";
  }
  const renamed = displayName !== undefined && displayName !== existing.displayName;
  if (renamed && existing.kind === "bot") {
    return "Bot accounts can't be renamed in place — remove the bot and re-add it under the new name. (A rename could otherwise collide with a member's sign-in identity.)";
  }
  if (
    renamed &&
    input.authConfigured &&
    !(input.sessionNames ?? []).includes((displayName as string).toLowerCase())
  ) {
    return "Your sign-in is linked to this account by display name, so the name must match your sign-in name or the part of your email before the @. Renaming it to anything else would orphan the account until proper account linking ships.";
  }
  if (timezone && !isAllowedTimezone(timezone)) {
    return `"${timezone}" isn't one of the offered time zones.`;
  }
  return undefined;
}
