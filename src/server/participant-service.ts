import type { AlpacaCredentials } from "../alpaca/credentials.js";
import type { TradingClientFactory } from "../observatory/dashboard-data.js";
import {
  buildParticipantSnapshot,
  type ParticipantSnapshot,
} from "../observatory/participant-snapshot.js";
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

    const id = kind === "bot" ? (input.personaId as string) : `human-${slugify(displayName)}`;
    if (this.deps.store.has(id)) {
      return { ok: false, error: `An account named "${displayName}" already exists.` };
    }

    const credentials: AlpacaCredentials = {
      apiKey: input.apiKey.trim(),
      apiSecret: input.apiSecret.trim(),
      ...(this.deps.baseUrl ? { baseUrl: this.deps.baseUrl } : {}),
    };
    const participant: Participant = {
      id,
      displayName,
      kind,
      credentials,
      ...(kind === "bot" && input.personaId ? { personaId: input.personaId.trim() } : {}),
      ...(input.timezone?.trim() ? { timezone: input.timezone.trim() } : {}),
    };

    // Prove the key works (and is reachable) before we store anything.
    let snapshot: ParticipantSnapshot;
    try {
      snapshot = await buildParticipantSnapshot(participant, this.deps.clientFactory(participant));
    } catch (error) {
      return { ok: false, error: `Could not reach Alpaca: ${String(error)}` };
    }
    if (snapshot.error) {
      return {
        ok: false,
        error: "That key was rejected by Alpaca. Double-check it's a valid paper key.",
      };
    }

    this.deps.store.add(participant);
    const at = (this.deps.now ?? (() => new Date()))().toISOString();
    this.deps.hub.apply({ type: "participant_added", participant: snapshot, at });
    this.deps.recordSeedSample?.(snapshot, at);
    this.deps.startStream(participant);

    return { ok: true, id, displayName };
  }
}

/** "Uncle Joe" -> "uncle_joe" for a stable, readable participant id. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
