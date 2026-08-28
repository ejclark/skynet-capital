import type { AlpacaCredentials } from "../alpaca/credentials.js";
import type { TradingClientFactory } from "../observatory/dashboard-data.js";
import {
  buildParticipantSnapshot,
  type ParticipantSnapshot,
} from "../observatory/participant-snapshot.js";
import { isAllowedTimezone } from "../participants/allowed-timezones.js";
import type { Participant, ParticipantKind } from "../participants/participant.js";
import type { ParticipantStore } from "../participants/participant-store.js";
import type { ObservatoryHub } from "./observatory-hub.js";

/** What the `/add` form submits. Credentials must be a working Alpaca **paper** key. */
export interface AddParticipantInput {
  readonly displayName: string;
  readonly apiKey: string;
  readonly apiSecret: string;
  readonly kind?: ParticipantKind;
  /** Required when kind is "bot" — the persona driving the account. */
  readonly personaId?: string;
  readonly timezone?: string;
  /** The signed-in member's session email, stamped as owner — from the route wiring, never the form. */
  readonly ownerEmail?: string;
}

export type AddResult =
  | { readonly ok: true; readonly id: string; readonly displayName: string }
  | { readonly ok: false; readonly error: string };

/** What a credential-rotation submits — just the new key, against an account that already exists. */
export interface RotateCredentialsInput {
  readonly id: string;
  readonly apiKey: string;
  readonly apiSecret: string;
  /**
   * Who the caller's own session resolves to (undefined when OAuth isn't configured, or the
   * session isn't linked to any board participant). Authorization rules: `refuseRotation`.
   */
  readonly requesterId?: string;
  /**
   * The signed-in session's email, present exactly when OAuth is configured (the auth gate
   * upstream guarantees no anonymous request reaches /rotate in that mode).
   */
  readonly requesterEmail?: string;
}

export type RotateResult =
  | { readonly ok: true; readonly id: string; readonly displayName: string }
  | { readonly ok: false; readonly error: string };

export interface ParticipantServiceDeps {
  readonly hub: ObservatoryHub;
  readonly store: ParticipantStore;
  readonly clientFactory: TradingClientFactory;
  /** Start this account's live fill stream (data-source specific). */
  readonly startStream: (participant: Participant) => void;
  /**
   * Record the FOUNDING equity sample the moment the account joins — the seed baseline
   * "doubling" is measured against (docs/BACKLOG.md). An unrecorded starting equity can never
   * be reconstructed later, so this fires at onboarding rather than waiting on the sampler's
   * next tick. Optional so offline/test wiring can omit it.
   */
  readonly recordSeedSample?: (snapshot: ParticipantSnapshot, at: string) => void;
  /** Paper base URL to stamp on stored credentials (defaults to Alpaca paper). */
  readonly baseUrl?: string;
  /**
   * Resolve an env-configured (roster) participant by id. Two duties: `/add` refuses any id it
   * resolves (a display name must never collide with — and take over — a roster slug), and
   * `/rotate` FALLS BACK to it, so a regenerated key for a host-configured account has a
   * sanctioned home (the 2026-08-25 dead-key trap: Alpaca revokes the old pair on regeneration,
   * and the env value had no self-service replacement).
   */
  readonly findRosterParticipant?: (id: string) => Participant | undefined;
  /** True when this email is on the env owner allowlist — gates roster rotations under OAuth. */
  readonly isOwnerEmail?: (email: string) => boolean;
  readonly now?: () => Date;
}

/**
 * The write side of self-service onboarding. `addParticipant` validates a submitted Alpaca
 * paper key by actually reading the account, persists it (encrypted), then appends it to the
 * live board and opens its fill stream — so it shows up immediately, no restart. Fully
 * dependency-injected: no HTTP and no sockets here, so it unit-tests with fakes.
 */
export class ParticipantService {
  private readonly deps: ParticipantServiceDeps;

  constructor(deps: ParticipantServiceDeps) {
    this.deps = deps;
  }

  async addParticipant(input: AddParticipantInput): Promise<AddResult> {
    // Checked first, before any credential is touched: if we cannot encrypt it, we do not want it.
    if (!this.deps.store.canStoreSecurely()) {
      return {
        ok: false,
        error:
          "Onboarding is disabled: this server has no credential encryption key configured. Ask the host to set SKYNET_STORE_SECRET.",
      };
    }
    const displayName = input.displayName?.trim();
    if (!displayName) {
      return { ok: false, error: "A display name is required." };
    }
    if (!(input.apiKey?.trim() && input.apiSecret?.trim())) {
      return { ok: false, error: "Both an Alpaca key and secret are required." };
    }
    const kind: ParticipantKind = input.kind ?? "human";
    if (kind === "bot" && !input.personaId?.trim()) {
      return { ok: false, error: "A bot account needs a personaId." };
    }
    const timezone = input.timezone?.trim();
    // The /add form only ever submits a value from the controlled list (or none) — this rejects
    // anything else, including a raw POST that bypasses the <select>, rather than storing and
    // silently mis-rendering it later (Intl.DateTimeFormat swallows an invalid zone rather than
    // throwing, so a bad value would never surface on its own).
    if (timezone && !isAllowedTimezone(timezone)) {
      return { ok: false, error: `"${timezone}" isn't one of the offered time zones.` };
    }

    const id = kind === "bot" ? (input.personaId as string) : `human-${slugify(displayName)}`;
    if (this.deps.store.has(id) || this.deps.findRosterParticipant?.(id)) {
      // Says what to do next, not just "no" (#546/#558): a member whose account predates the
      // connect form lands here, and re-adding is the wrong remedy for either a dead key
      // (/rotate) or a missing sign-in link (/claim, owner-gated).
      return {
        ok: false,
        error: `An account named "${displayName}" is already on the board. If it's yours, don't re-add it — a regenerated Alpaca key goes to /rotate, and linking your sign-in to the account is a separate step (a league owner can do it at /claim) that never touches keys. If it isn't yours, pick a different display name.`,
      };
    }

    const participant: Participant = {
      id,
      displayName,
      kind,
      credentials: this.credentialsFrom(input.apiKey, input.apiSecret),
      ...(kind === "bot" && input.personaId ? { personaId: input.personaId.trim() } : {}),
      ...(timezone ? { timezone } : {}),
      ...(kind === "human" && input.ownerEmail ? { ownerEmail: input.ownerEmail } : {}),
    };

    const verified = await this.verify(participant);
    if (!verified.ok) {
      return verified;
    }

    this.deps.store.add(participant);
    const at = (this.deps.now ?? (() => new Date()))().toISOString();
    this.deps.hub.apply({ type: "participant_added", participant: verified.snapshot, at });
    this.deps.recordSeedSample?.(verified.snapshot, at);
    this.deps.startStream(participant);

    return { ok: true, id, displayName };
  }

  /**
   * Rotates an account's key after someone regenerates it in Alpaca — the sanctioned home a
   * regenerated key previously lacked (2026-08-11, docs/LESSONS.md), covering store rows AND,
   * since 2026-08-25, env-roster rows: the rotated pair lands in the store and `mergeRoster`
   * lets it override the dead env credentials while env keeps the identity. Requires the id to
   * ALREADY exist (the inverse of `addParticipant`), verifies the new key against Alpaca before
   * touching anything stored, and changes only the credentials.
   */
  async rotateCredentials(input: RotateCredentialsInput): Promise<RotateResult> {
    if (!this.deps.store.canStoreSecurely()) {
      return {
        ok: false,
        error:
          "Credential rotation is disabled: this server has no credential encryption key configured. Ask the host to set SKYNET_STORE_SECRET.",
      };
    }
    const id = input.id?.trim();
    if (!id) {
      return { ok: false, error: "An account id is required." };
    }
    if (!(input.apiKey?.trim() && input.apiSecret?.trim())) {
      return { ok: false, error: "Both an Alpaca key and secret are required." };
    }
    const existing =
      this.deps.store.load().find((p) => p.id === id) ?? this.deps.findRosterParticipant?.(id);
    if (!existing) {
      return {
        ok: false,
        error: `No account named "${id}" is on the board — this rotates a key, it doesn't add a new account.`,
      };
    }
    const refusal = this.refuseRotation(existing, input);
    if (refusal) {
      return { ok: false, error: refusal };
    }

    // Answers "does rotating a key connect an account?" (Eric, 2026-08-25): yes, for a STORE
    // human account nobody has claimed yet. A successful rotation IS the honest proof of
    // ownership #547 already endorsed for /add — the new key just verified against Alpaca — so
    // requiring a SEPARATE owner-driven /claim afterward would be asking for proof twice.
    // MUST exclude roster ids, not just say so: `mergeRoster` always keeps the ENV row's
    // identity (ownerEmail included) on a collision, so stamping ownerEmail onto a roster id's
    // store row would look like it worked (this returns ok:true) while the live merged roster
    // silently ignores it — worse than not stamping at all. Roster accounts stay owner-gated
    // (refuseRotation above; a real link needs SKYNET_HUMAN_<ID>_EMAIL). An ALREADY-claimed
    // store account is never silently repointed — only a genuinely unclaimed one adopts the
    // rotator.
    const claims =
      existing.kind === "human" &&
      existing.ownerEmail === undefined &&
      input.requesterEmail !== undefined &&
      !this.deps.findRosterParticipant?.(existing.id);

    const participant: Participant = {
      ...existing,
      credentials: this.credentialsFrom(input.apiKey, input.apiSecret),
      ...(claims ? { ownerEmail: input.requesterEmail } : {}),
    };

    // Prove the NEW key works before anything stored or shown changes.
    const verified = await this.verify(participant);
    if (!verified.ok) {
      return verified;
    }

    this.deps.store.add(participant);
    const at = (this.deps.now ?? (() => new Date()))().toISOString();
    this.deps.hub.apply({ type: "participant_updated", participant: verified.snapshot, at });
    this.deps.startStream(participant);

    return { ok: true, id, displayName: existing.displayName };
  }

  /**
   * The rotation authorization rules, tiered by how the target id came to exist. Returns the
   * refusal string, or undefined when the rotation may proceed.
   *
   * ENV-ROSTER ids (stricter — the tier never downgrades even after a first rotation leaves a
   * store row behind, which is why this checks the ID's provenance, not where the row was
   * found): these are owner-configured accounts, so under OAuth the caller must be an owner, or
   * the member the account itself is linked to (`requesterId === id`, via
   * SKYNET_HUMAN_<ID>_EMAIL for a human, or an OwnerLinkStore link via `/claim` for either kind —
   * claim-form.ts is explicit that a roster row, bot included, is claimable). `self` used to also
   * require `kind === "human"`, which predates that: a claimed roster BOT's linked member could
   * never rotate "their own" bot's key, only an owner could — tightened correctly for a bot with
   * no link, wrong for one that now has one (2026-08-26, alongside the STORE-tier fix below).
   * Anything else could silently redirect a host-configured account — Eric's own, or an unlinked
   * bot's — to credentials of a member's choosing.
   *
   * STORE ids: an ALREADY-CLAIMED account — human OR bot, one with an `ownerEmail` on file —
   * may only be rotated by that same identity: the requester's session resolves to the target
   * id, or their session email matches the stored `ownerEmail` (case-insensitive, like every
   * email comparison here — owner-link-store.ts). The email leg matters twice over
   * (2026-08-28): a signed-in member whose email resolves to NO participant presents
   * `requesterId: undefined` — a real, documented state — and the old id-only check
   * (`requesterId !== undefined && requesterId !== id`) let exactly that member sail past and
   * silently swap a claimed account's credentials; and conversely the stamped owner of SEVERAL
   * accounts can resolve to a different owned id than the target, which the id-only check
   * wrongly refused. This check used to also read `kind === "human"` because a bot could never
   * carry `ownerEmail` before `/claim` (#546) learned to link any account kind; that necessity
   * is gone, and a claimed bot exempted from this check is rotatable — its credentials silently
   * swapped — by any signed-in member, no check at all (2026-08-26, same gap as
   * `requireEditable` in account-service.ts, closed alongside it). An
   * UNCLAIMED one (2026-08-25 — legacy rows added before OAuth, or before `/add` had a session
   * to stamp) has nobody to check against, so any signed-in member may rotate it —
   * `rotateCredentials` then stamps THE HUMAN case as its owner on success ("signed in + a
   * verified new key" is the one claim it takes, same as `/add`); a bot stays unclaimed either
   * way — claiming a bot is deliberately owner-only, via `/claim`, never an implicit side effect
   * of rotating its key. Under PASSWORD mode (no `requesterEmail`), nobody is signed in to
   * become an owner either, so this is unreachable — falls through to the unconditional pass
   * below.
   *
   * BOTH tiers: `requesterEmail`/`requesterId` undefined means OAuth isn't configured — the
   * password gate is the only boundary in that mode, matching every other route's trust level.
   */
  private refuseRotation(existing: Participant, input: RotateCredentialsInput): string | undefined {
    if (this.deps.findRosterParticipant?.(existing.id)) {
      const self = input.requesterId === existing.id;
      const owner =
        input.requesterEmail !== undefined && this.deps.isOwnerEmail?.(input.requesterEmail);
      if (input.requesterEmail !== undefined && !self && !owner) {
        return "This account is configured by the host. Only an owner — or the member whose sign-in is linked to this exact account — can rotate its key.";
      }
      return undefined;
    }
    if (existing.ownerEmail !== undefined) {
      const self =
        input.requesterId === existing.id ||
        (input.requesterEmail !== undefined &&
          input.requesterEmail.toLowerCase() === existing.ownerEmail.toLowerCase());
      if ((input.requesterId !== undefined || input.requesterEmail !== undefined) && !self) {
        return "You can only rotate your own account's credentials.";
      }
    }
    return undefined;
  }

  /** Shared by add and rotate: trim the submitted pair and stamp the configured paper base URL. */
  private credentialsFrom(apiKey: string, apiSecret: string): AlpacaCredentials {
    return {
      apiKey: apiKey.trim(),
      apiSecret: apiSecret.trim(),
      ...(this.deps.baseUrl ? { baseUrl: this.deps.baseUrl } : {}),
    };
  }

  /**
   * Shared by add and rotate: prove a credential pair actually works before either path
   * stores or shows anything. Both a network failure and an Alpaca-side rejection are honest
   * "no" — the caller returns whichever `{ ok: false, error }` it gets, unchanged.
   */
  private async verify(
    participant: Participant,
  ): Promise<{ ok: true; snapshot: ParticipantSnapshot } | { ok: false; error: string }> {
    try {
      const snapshot = await buildParticipantSnapshot(
        participant,
        this.deps.clientFactory(participant),
      );
      if (snapshot.error) {
        return {
          ok: false,
          error: "That key was rejected by Alpaca. Double-check it's a valid paper key.",
        };
      }
      return { ok: true, snapshot };
    } catch (error) {
      return { ok: false, error: `Could not reach Alpaca: ${String(error)}` };
    }
  }
}

/** "Uncle Joe" -> "uncle_joe" for a stable, readable participant id. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
