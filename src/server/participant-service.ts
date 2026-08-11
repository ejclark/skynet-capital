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
}

export type AddResult =
  | { readonly ok: true; readonly id: string; readonly displayName: string }
  | { readonly ok: false; readonly error: string };

/** What a credential-rotation submits — just the new key, against an account that already exists. */
export interface RotateCredentialsInput {
  readonly id: string;
  readonly apiKey: string;
  readonly apiSecret: string;
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
    if (this.deps.store.has(id)) {
      return { ok: false, error: `An account named "${displayName}" already exists.` };
    }

    const participant: Participant = {
      id,
      displayName,
      kind,
      credentials: this.credentialsFrom(input.apiKey, input.apiSecret),
      ...(kind === "bot" && input.personaId ? { personaId: input.personaId.trim() } : {}),
      ...(timezone ? { timezone } : {}),
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
   * Rotates a self-service account's key after Eric (or a teammate) regenerates it in Alpaca.
   * The gap this closes (2026-08-11, docs/LESSONS.md): there was previously NO sanctioned way
   * to update a stored credential — `addParticipant` refuses a duplicate id outright — so a
   * regenerated key had nowhere honest to go and got pasted into an unrelated secret slot
   * instead. This requires the id to ALREADY exist (the inverse of `addParticipant`), verifies
   * the new key against Alpaca before touching anything stored, and preserves everything else
   * about the record (displayName, kind, personaId, timezone) — only the credentials change.
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
    const existing = this.deps.store.load().find((p) => p.id === id);
    if (!existing) {
      return {
        ok: false,
        error: `No existing self-service account named "${id}" — this rotates a key, it doesn't add a new account.`,
      };
    }

    const participant: Participant = {
      ...existing,
      credentials: this.credentialsFrom(input.apiKey, input.apiSecret),
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
