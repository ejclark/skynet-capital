import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { deriveKey, type Envelope, open, seal } from "../storage/secure-envelope.js";
import type { Participant } from "./participant.js";

/**
 * A self-service-added account, persisted between restarts. Shape mirrors `Participant`
 * (its `credentials` hold the raw Alpaca paper key/secret), so a stored entry drops
 * straight into the dashboard roster.
 */
export type StoredParticipant = Participant;

/** Persistence for participants added at runtime through the dashboard's `/add` form. */
export interface ParticipantStore {
  load(): StoredParticipant[];
  add(participant: StoredParticipant): void;
  has(id: string): boolean;
  /**
   * Remove a self-service account. Returns false when the id isn't in the store (env-declared
   * roster accounts never are — they can't be removed at runtime, only unset from the host).
   * Same shape as `AllowlistStore.remove`: absent is a false, never a throw.
   */
  remove(id: string): boolean;
  /**
   * False when the store has no encryption key and therefore cannot accept credentials.
   * Callers check this to refuse onboarding *before* asking anyone for a key, rather than
   * letting `add()` throw after the fact.
   */
  canStoreSecurely(): boolean;
}

/**
 * File-backed participant store. The on-disk blob is encrypted with AES-256-GCM using
 * `SKYNET_STORE_SECRET` — the secret keys *other people's* credentials, so they are never
 * written in the clear on a shared host.
 *
 * **Fail closed:** without a secret, `add()` throws rather than degrading to plaintext. A
 * missing key is a misconfiguration, and the cost of guessing wrong is someone else's
 * credentials sitting readable on disk — so the write is refused, not warned about. Reads
 * still work unencrypted so an existing local file is never bricked by the upgrade.
 *
 * Reads/writes the whole (small) file per operation; the roster is a handful of accounts,
 * not a database.
 */
export class FileParticipantStore implements ParticipantStore {
  private readonly path: string;
  private readonly key?: Buffer;

  constructor(path: string, secret?: string) {
    this.path = path;
    this.key = deriveKey(secret);
  }

  load(): StoredParticipant[] {
    if (!existsSync(this.path)) {
      return [];
    }
    const envelope = JSON.parse(readFileSync(this.path, "utf8")) as Envelope;
    const json = open(envelope, this.key, "participant store");
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as StoredParticipant[]) : [];
  }

  has(id: string): boolean {
    return this.load().some((p) => p.id === id);
  }

  canStoreSecurely(): boolean {
    return this.key !== undefined;
  }

  add(participant: StoredParticipant): void {
    if (!this.key) {
      throw new Error(
        "refusing to store credentials unencrypted — set SKYNET_STORE_SECRET to enable onboarding",
      );
    }
    this.write([...this.load().filter((p) => p.id !== participant.id), participant]);
  }

  remove(id: string): boolean {
    // Fail closed exactly like add(): a removal rewrites the whole blob, and rewriting the
    // REMAINING members' credentials without a key would mean writing them in the clear.
    if (!this.key) {
      throw new Error(
        "refusing to rewrite the credential store unencrypted — set SKYNET_STORE_SECRET",
      );
    }
    const current = this.load();
    const next = current.filter((p) => p.id !== id);
    if (next.length === current.length) {
      return false;
    }
    this.write(next);
    return true;
  }

  private write(participants: readonly StoredParticipant[]): void {
    if (!this.key) return;
    mkdirSync(dirname(this.path), { recursive: true });
    writeFileSync(this.path, JSON.stringify(seal(JSON.stringify(participants), this.key)));
  }
}

/** Build the store from the environment (path + optional encryption secret). */
export function createParticipantStore(
  env: Readonly<Record<string, string | undefined>>,
): FileParticipantStore {
  const path = env.SKYNET_PARTICIPANT_STORE ?? "data/participants.json";
  return new FileParticipantStore(path, env.SKYNET_STORE_SECRET);
}
